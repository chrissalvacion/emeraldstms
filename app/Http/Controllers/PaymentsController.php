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

        $billings = Billing::where('status', 'unpaid')
            ->orderBy('id', 'desc')
            ->get()
            ->map(fn($b) => [
                'billingid' => $b->billingid,
                'studentname' => $this->resolveStudentName($b->studentid),
                'status' => $b->status,
            ])
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

        $validated['studentname'] = $this->resolveStudentName($billing->studentid) ?? '';
        if (empty($validated['status'])) {
            $validated['status'] = 'Paid';
        }

        Payments::create($validated);

        $billing->update([
            'status' => 'paid',
        ]);

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

        $payments->update($validated);

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
            $hasOtherPayments = Payments::where('billingid', $billingId)->exists();
            if (!$hasOtherPayments) {
                $billing->update(['status' => 'unpaid']);
            }
        }

        return redirect()->to(route('billings') . '?tab=payments')->with('success', 'Payment deleted.');
    }
}
