<?php

namespace App\Http\Controllers;

use App\Models\Payments;
use App\Models\Students;
use App\Models\Tutorials;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
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
        if (!Schema::hasTable('payments')) {
            return Inertia::render('payments/index', [
                'payments' => [],
            ]);
        }

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
        if (!Schema::hasTable('tutorials')) {
            return Inertia::render('payments/create', [
                'prefill' => null,
                'tutorials' => [],
                'today' => Carbon::now($this->localTimezone())->toDateString(),
            ]);
        }

        $tutorialId = (string) $request->query('tutorialid', '');

        $prefill = null;
        if (!empty($tutorialId)) {
            $tutorial = Tutorials::where('tutorialid', $tutorialId)->first();
            if ($tutorial) {
                $prefill = [
                    'tutorialid' => $tutorial->tutorialid,
                    'studentname' => $this->resolveStudentName($tutorial->studentid),
                ];
            }
        }

        $tutorials = Tutorials::query()
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($t) {
                $rate = (float) ($t->tutee_fee_amount ?? 0);
                $completedHours = (float) ($t->completed_hours ?? 0);
                $estimatedAmount = round(max(0, $completedHours) * max(0, $rate), 2);

                return [
                    'tutorialid' => $t->tutorialid,
                    'studentid' => $t->studentid,
                    'studentname' => $this->resolveStudentName($t->studentid),
                    'status' => $t->status,
                    'start_date' => $t->start_date ? Carbon::parse($t->start_date)->toDateString() : null,
                    'end_date' => $t->end_date ? Carbon::parse($t->end_date)->toDateString() : null,
                    'tutee_fee_amount' => round($rate, 2),
                    'completed_hours' => round($completedHours, 2),
                    'estimated_amount' => $estimatedAmount,
                ];
            })
            ->values();

        return Inertia::render('payments/create', [
            'prefill' => $prefill,
            'tutorials' => $tutorials,
            'today' => Carbon::now($this->localTimezone())->toDateString(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'tutorialid' => 'required|string|max:255|exists:tutorials,tutorialid',
            'payment_date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|string|max:255',
            'transaction_reference' => 'nullable|string|max:255',
            'payer_name' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:255',
            'remarks' => 'nullable|string',
            'nature_of_collection' => 'nullable|string|max:255',
        ]);

        $tutorial = Tutorials::where('tutorialid', (string) $validated['tutorialid'])->firstOrFail();

        $validated['billingid'] = null;
        $validated['studentname'] = $this->resolveStudentName($tutorial->studentid) ?? '';
        if (empty($validated['status'])) {
            $validated['status'] = 'Recorded';
        }

        Payments::create($validated);

        return redirect()->to(route('billings') . '?tab=payments')->with('success', 'Payment created.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Payments $payments)
    {
        $tutorial = Tutorials::where('tutorialid', (string) $payments->tutorialid)->first();

        return Inertia::render('payments/show', [
            'payment' => $payments,
            'tutorial_student_name' => $tutorial ? $this->resolveStudentName($tutorial->studentid) : null,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Payments $payments)
    {
        $tutorial = Tutorials::where('tutorialid', (string) $payments->tutorialid)->first();

        return Inertia::render('payments/edit', [
            'payment' => $payments,
            'tutorial_student_name' => $tutorial ? $this->resolveStudentName($tutorial->studentid) : null,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Payments $payments)
    {
        $validated = $request->validate([
            'tutorialid' => 'required|string|max:255|exists:tutorials,tutorialid',
            'payment_date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|string|max:255',
            'transaction_reference' => 'nullable|string|max:255',
            'payer_name' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:255',
            'remarks' => 'nullable|string',
            'nature_of_collection' => 'nullable|string|max:255',
        ]);

        $tutorial = Tutorials::where('tutorialid', (string) $validated['tutorialid'])->firstOrFail();

        $validated['billingid'] = null;
        $validated['studentname'] = $this->resolveStudentName($tutorial->studentid) ?? '';

        $payments->update($validated);

        return redirect()->to(route('billings') . '?tab=payments')
            ->with('success', 'Payment updated.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Payments $payments)
    {
        $payments->delete();

        return redirect()->to(route('billings') . '?tab=payments')->with('success', 'Payment deleted.');
    }
}
