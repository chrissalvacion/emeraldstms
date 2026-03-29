<?php

namespace App\Http\Controllers;

use App\Models\Billing;
use App\Models\Payments;
use App\Models\Students;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentsController extends Controller
{
    protected function localTimezone(): string
    {
        return 'Asia/Manila';
    }

    protected function resolveStudentName(?string $studentId): ?string
    {
        if (empty($studentId)) return null;

        $student = null;
        if (is_numeric($studentId)) {
            $student = Students::find($studentId);
        }
        if (!$student) {
            $student = Students::where('tuteeid', (string) $studentId)->first();
        }
        if (!$student) return null;

        return trim(($student->firstname ?? '') . ' ' . ($student->lastname ?? '')) ?: null;
    }

    protected function normalizeAttendanceRows($value): array
    {
        if (is_array($value)) return $value;

        if (is_string($value) && trim($value) !== '') {
            try {
                $decoded = json_decode($value, true, 512, JSON_THROW_ON_ERROR);
                return is_array($decoded) ? $decoded : [];
            } catch (\Throwable $e) {
                return [];
            }
        }

        return [];
    }

    protected function computeBillingAmountFromAttendance(Billing $billing): float
    {
        $rows = $this->normalizeAttendanceRows($billing->attendance_record);
        $byTutorial = [];

        foreach ($rows as $row) {
            if (!is_array($row)) continue;

            $tutorialId = (string) ($row['tutorialid'] ?? '');
            if ($tutorialId === '') continue;

            $hours = (float) ($row['hours'] ?? 0);
            if (!is_finite($hours) || $hours <= 0) continue;

            $rate = (float) ($row['hourly_rate'] ?? 0);
            if (!is_finite($rate) || $rate < 0) $rate = 0;

            if (!array_key_exists($tutorialId, $byTutorial)) {
                $byTutorial[$tutorialId] = [
                    'hours' => 0.0,
                    'rate' => $rate,
                ];
            }

            $byTutorial[$tutorialId]['hours'] += $hours;

            // Keep the latest positive rate if available.
            if ($rate > 0) {
                $byTutorial[$tutorialId]['rate'] = $rate;
            }
        }

        $total = 0.0;
        foreach ($byTutorial as $entry) {
            $roundedHours = (int) round((float) ($entry['hours'] ?? 0));
            $rate = (float) ($entry['rate'] ?? 0);
            $total += round($roundedHours * $rate, 2);
        }

        return round($total, 2);
    }

    protected function billingPaidAmount(string $billingId, ?int $excludePaymentId = null): float
    {
        $query = Payments::query()->where('billingid', $billingId);
        if ($excludePaymentId) {
            $query->where('id', '!=', $excludePaymentId);
        }

        return round((float) $query->sum('amount'), 2);
    }

    protected function syncBillingFinancials(Billing $billing): void
    {
        $computedAmount = $this->computeBillingAmountFromAttendance($billing);
        $paid = $this->billingPaidAmount((string) $billing->billingid);
        $balance = round($computedAmount - $paid, 2);

        $status = 'unpaid';
        if ($computedAmount <= 0 && $paid > 0) {
            $status = 'paid';
        } elseif ($balance <= 0 && $computedAmount > 0) {
            $status = 'paid';
        } elseif ($paid > 0 && $balance > 0) {
            $status = 'partial';
        }

        $billing->update([
            'amount' => $computedAmount,
            'status' => $status,
        ]);
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $payments = Payments::orderBy('id', 'desc')->get();

        return Inertia::render('payments/index', [
            'payments' => $payments,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        $billingId = (string) $request->query('billingid', '');

        $prefill = null;
        if (!empty($billingId)) {
            $billing = Billing::where('billingid', $billingId)->first();
            if ($billing) {
                $prefill = [
                    'billingid' => $billing->billingid,
                    'studentname' => $this->resolveStudentName($billing->studentid),
                ];
            }
        }

        $billings = Billing::whereIn('status', ['unpaid', 'partial'])
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($b) {
                if (!$b instanceof Billing) {
                    return null;
                }

                $rows = $this->normalizeAttendanceRows($b->attendance_record);
                $sessions = collect($rows)
                    ->filter(fn ($r) => is_array($r) && !empty($r['tutorialid']))
                    ->groupBy(fn ($r) => (string) ($r['tutorialid'] ?? ''))
                    ->map(function ($group, $tutorialId) {
                        $hours = (float) $group->sum(fn ($r) => (float) ($r['hours'] ?? 0));
                        $rate = (float) ($group->first()['hourly_rate'] ?? 0);
                        $roundedHours = (int) round($hours);
                        $amount = round($roundedHours * $rate, 2);

                        return [
                            'tutorialid' => (string) $tutorialId,
                            'hours' => round($hours, 2),
                            'rounded_hours' => $roundedHours,
                            'hourly_rate' => round($rate, 2),
                            'amount' => $amount,
                        ];
                    })
                    ->values()
                    ->all();

                $computedAmount = $this->computeBillingAmountFromAttendance($b);
                $totalPaid = $this->billingPaidAmount((string) $b->billingid);
                $balanceDue = round($computedAmount - $totalPaid, 2);

                return [
                    'billingid' => $b->billingid,
                    'studentname' => $this->resolveStudentName($b->studentid),
                    'status' => $b->status,
                    'total_hours' => (float) ($b->total_hours ?? 0),
                    'total_amount' => $computedAmount,
                    'total_paid' => $totalPaid,
                    'balance_due' => $balanceDue,
                    'tutorial_sessions' => $sessions,
                ];
            })
            ->filter(fn ($row) => is_array($row))
            ->values();

        return Inertia::render('payments/create', [
            'prefill' => $prefill,
            'billings' => $billings,
            'today' => Carbon::now($this->localTimezone())->toDateString(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'billingid' => 'required|string|max:255|exists:billings,billingid',
            'payment_date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|string|max:255',
            'transaction_reference' => 'nullable|string|max:255',
            'payer_name' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:255',
            'remarks' => 'nullable|string',
            'nature_of_collection' => 'nullable|string|max:255',
        ]);

        $billing = Billing::where('billingid', $validated['billingid'])->firstOrFail();

        $computedAmount = $this->computeBillingAmountFromAttendance($billing);
        $totalPaidBefore = $this->billingPaidAmount((string) $billing->billingid);
        $remainingBalance = round($computedAmount - $totalPaidBefore, 2);

        if ($remainingBalance <= 0) {
            return back()->withErrors([
                'amount' => 'This billing has no remaining balance.',
            ])->withInput();
        }

        if ((float) $validated['amount'] > $remainingBalance) {
            return back()->withErrors([
                'amount' => 'Amount exceeds remaining balance for this billing.',
            ])->withInput();
        }

        $validated['studentname'] = $this->resolveStudentName($billing->studentid) ?? '';
        if (empty($validated['status'])) {
            $validated['status'] = 'Recorded';
        }

        Payments::create($validated);

        $this->syncBillingFinancials($billing);

        return redirect()->to(route('billings') . '?tab=payments')->with('success', 'Payment created.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Payments $payments)
    {
        $billing = Billing::where('billingid', $payments->billingid)->first();

        return Inertia::render('payments/show', [
            'payment' => $payments,
            'billing_encrypted_id' => $billing?->encrypted_id,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Payments $payments)
    {
        $billing = Billing::where('billingid', $payments->billingid)->first();

        return Inertia::render('payments/edit', [
            'payment' => $payments,
            'billing_encrypted_id' => $billing?->encrypted_id,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Payments $payments)
    {
        $validated = $request->validate([
            'payment_date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|string|max:255',
            'transaction_reference' => 'nullable|string|max:255',
            'payer_name' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:255',
            'remarks' => 'nullable|string',
            'nature_of_collection' => 'nullable|string|max:255',
        ]);

        $billing = Billing::where('billingid', (string) $payments->billingid)->first();
        if ($billing) {
            $computedAmount = $this->computeBillingAmountFromAttendance($billing);
            $totalPaidBefore = $this->billingPaidAmount((string) $billing->billingid, (int) $payments->id);
            $remainingBalance = round($computedAmount - $totalPaidBefore, 2);

            if ((float) $validated['amount'] > $remainingBalance) {
                return back()->withErrors([
                    'amount' => 'Amount exceeds remaining balance for this billing.',
                ])->withInput();
            }
        }

        $payments->update($validated);

        if ($billing) {
            $this->syncBillingFinancials($billing);
        }

        return redirect()->to(route('billings') . '?tab=payments')
            ->with('success', 'Payment updated.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Payments $payments)
    {
        $billingId = $payments->billingid;
        $payments->delete();

        $billing = Billing::where('billingid', $billingId)->first();
        if ($billing) {
            $this->syncBillingFinancials($billing);
        }

        return redirect()->to(route('billings') . '?tab=payments')->with('success', 'Payment deleted.');
    }
}
