<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Billing;
use App\Models\Payments;
use App\Models\Students;
use App\Models\Tutorials;
use App\Models\Tutors;
use App\Models\AppSetting;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class BillingController extends Controller
{
    protected function defaultStudentHourlyRate(): float
    {
        $raw = AppSetting::where('key', 'default_student_hourly_rate')->value('value');
        if ($raw === null) return 0.0;

        $rate = (float) $raw;
        if (!is_finite($rate) || $rate < 0) return 0.0;

        return $rate;
    }

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

    protected function resolveTutorName(?string $tutorId): ?string
    {
        if (empty($tutorId)) return null;

        $tutor = null;
        if (is_numeric($tutorId)) {
            $tutor = Tutors::find($tutorId);
        }
        if (!$tutor) {
            $tutor = Tutors::where('tutorid', (string) $tutorId)->first();
        }
        if (!$tutor) return null;

        return trim(($tutor->firstname ?? '') . ' ' . ($tutor->lastname ?? '')) ?: null;
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

    protected function extractTutorialIdsFromAttendance($attendanceRecord): array
    {
        $rows = $this->normalizeAttendanceRows($attendanceRecord);

        return collect($rows)
            ->map(fn ($row) => is_array($row) ? ($row['tutorialid'] ?? null) : null)
            ->filter(fn ($value) => !empty($value))
            ->map(fn ($value) => (string) $value)
            ->unique()
            ->values()
            ->all();
    }

    protected function paymentsForBilling(Billing $billing)
    {
        $tutorialIds = $this->extractTutorialIdsFromAttendance($billing->attendance_record);
        $paymentsByTutorial = collect();
        if (count($tutorialIds) > 0) {
            $paymentsByTutorial = Payments::query()
                ->whereIn('tutorialid', $tutorialIds)
                ->get();
        }

        $paymentsByBillingId = collect();
        if (!empty($billing->billingid)) {
            $paymentsByBillingId = Payments::query()
                ->where('billingid', (string) $billing->billingid)
                ->get();
        }

        return $paymentsByTutorial
            ->concat($paymentsByBillingId)
            ->unique(fn ($payment) => (int) ($payment->id ?? 0))
            ->sortByDesc('id')
            ->values();
    }

    protected function computeBillingStatus(float $amount, float $totalPaid): string
    {
        $balance = round($amount - $totalPaid, 2);

        // Any fully-settled billing should be paid, including zero-amount bills.
        if ($balance <= 0) {
            return 'paid';
        }
        if ($totalPaid > 0 && $balance > 0) {
            return 'partial';
        }

        return 'unpaid';
    }

    protected function formatTimeTo12Hour(?string $time, string $tz): ?string
    {
        if ($time === null) return null;

        $time = trim((string) $time);
        if ($time === '') return null;

        foreach (['H:i:s', 'H:i'] as $fmt) {
            try {
                return Carbon::createFromFormat($fmt, $time, $tz)->format('h:i a');
            } catch (\Throwable $e) {
                // try next format
            }
        }

        return $time;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
<<<<<<< HEAD
        if (!Schema::hasTable('billings') || !Schema::hasTable('payments')) {
            return Inertia::render('billing', [
                'billings' => [],
                'payments' => [],
            ]);
        }

        $billings = Billing::orderBy('id', 'desc')->get()->map(function (Billing $b) {
            $paymentsForBilling = $this->paymentsForBilling($b);
            $totalPaid = round((float) $paymentsForBilling->sum('amount'), 2);
            $amount = (float) ($b->amount ?? 0);
            $balance = round($amount - $totalPaid, 2);
            $computedStatus = $this->computeBillingStatus($amount, $totalPaid);
            $currentStatus = strtolower((string) ($b->status ?? ''));
            $finalStatus = $currentStatus === 'cancelled' ? 'cancelled' : $computedStatus;

            // Keep persisted billing status in sync with computed balance/payment state.
            if (($b->status ?? '') !== $finalStatus) {
                $b->status = $finalStatus;
                $b->save();
            }

            $tutorialIds = $this->extractTutorialIdsFromAttendance($b->attendance_record);
=======
        $billings = Billing::orderBy('id', 'desc')->get()->map(function ($b) {
            $totalPaid = (float) Payments::where('billingid', (string) $b->billingid)->sum('amount');
            $amount = (float) ($b->amount ?? 0);
            $balance = round($amount - $totalPaid, 2);
>>>>>>> a7e8c778e9d14e724049fa08653bc0cc8325e51d

            return [
                'id' => $b->id,
                'encrypted_id' => $b->encrypted_id,
                'billingid' => $b->billingid,
                'studentid' => $b->studentid,
                'student_name' => $this->resolveStudentName($b->studentid),
                'tutorial_ids' => implode(', ', $tutorialIds),
                'billing_startdate' => $b->billing_startdate ?: null,
                'billing_enddate' => $b->billing_enddate ?: null,
                'total_hours' => $b->total_hours,
                'amount' => $b->amount,
<<<<<<< HEAD
                'total_paid' => $totalPaid,
                'balance' => $balance,
                'status' => $finalStatus,
=======
                'total_paid' => round($totalPaid, 2),
                'balance' => $balance,
                'status' => $b->status,
>>>>>>> a7e8c778e9d14e724049fa08653bc0cc8325e51d
                'created_at' => $b->created_at,
            ];
        });

        $payments = Payments::orderBy('id', 'desc')->get()->map(function ($p) {
            return [
                'id' => $p->id,
                'paymentid' => $p->paymentid,
                'billingid' => $p->billingid,
                'tutorialid' => $p->tutorialid,
                'billing_encrypted_id' => null,
                'studentname' => $p->studentname,
                'payment_date' => $p->payment_date ?: null,
                'amount' => $p->amount,
                'payment_method' => $p->payment_method,
                'status' => $p->status,
            ];
        });

        return Inertia::render('billing', [
            'billings' => $billings,
            'payments' => $payments,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        if (!Schema::hasTable('tutorials') || !Schema::hasTable('students')) {
            return Inertia::render('billings/create', [
                'active_students' => [],
                'all_students' => [],
                'default_student_hourly_rate' => '0',
            ]);
        }

        Tutorials::autoCompletePastEndDate($this->localTimezone());

        // Suggest students who have tutorials that are billable regardless of
        // session phase (Scheduled, Ongoing, or Completed).
        $candidateIds = Tutorials::query()
            ->whereIn('status', ['Scheduled', 'Ongoing', 'Completed'])
            ->pluck('studentid')
            ->filter(fn ($v) => !empty($v))
            ->map(fn ($v) => (string) $v)
            ->unique()
            ->values();

        $numericIds = $candidateIds->filter(fn ($v) => is_numeric($v))->values()->all();
        $tuteeIds = $candidateIds->filter(fn ($v) => !is_numeric($v))->values()->all();

        $students = Students::query()
            ->when(count($numericIds) > 0, fn ($q) => $q->orWhereIn('id', $numericIds))
            ->when(count($tuteeIds) > 0, fn ($q) => $q->orWhereIn('tuteeid', $tuteeIds))
            ->orderBy('lastname')
            ->get()
            ->map(function ($s) {
                $name = trim(($s->firstname ?? '') . ' ' . ($s->lastname ?? ''));
                return [
                    'id' => $s->id,
                    'tuteeid' => $s->tuteeid,
                    'name' => $name,
                    // Use tuteeid if present, otherwise numeric id.
                    'key' => !empty($s->tuteeid) ? (string) $s->tuteeid : (string) $s->id,
                ];
            })
            ->values();

        $allStudents = Students::query()
            ->orderBy('lastname')
            ->get()
            ->map(function ($s) {
                $name = trim(($s->firstname ?? '') . ' ' . ($s->lastname ?? ''));
                return [
                    'id' => $s->id,
                    'tuteeid' => $s->tuteeid,
                    'name' => $name,
                    // Use tuteeid if present, otherwise numeric id.
                    'key' => !empty($s->tuteeid) ? (string) $s->tuteeid : (string) $s->id,
                ];
            })
            ->values();

        return Inertia::render('billings/create', [
            'active_students' => $students,
            'all_students' => $allStudents,
            'default_student_hourly_rate' => (string) $this->defaultStudentHourlyRate(),
        ]);
    }

    /**
     * Preview computed attendance within a billing range.
     */
    public function preview(Request $request)
    {
        $validated = $request->validate([
            'studentid' => 'required|string|max:255',
            'billing_startdate' => 'required|date',
            'billing_enddate' => 'required|date|after_or_equal:billing_startdate',
        ]);

        [$attendanceRecord, $totalHours, $totalAmount] = $this->computeAttendanceForBilling(
            (string) $validated['studentid'],
            (string) $validated['billing_startdate'],
            (string) $validated['billing_enddate'],
        );

        return response()->json([
            'attendance_record' => $attendanceRecord,
            'total_hours' => $totalHours,
            'total_amount' => $totalAmount,
        ]);
    }

    /**
     * Return students who have tutorial sessions (attendance logs) in a date range.
     * This is intentionally tutor-agnostic.
     */
    public function studentsByDates(Request $request)
    {
        $validated = $request->validate([
            'billing_startdate' => 'required|date',
            'billing_enddate' => 'required|date|after_or_equal:billing_startdate',
        ]);

        $startYmd = (string) $validated['billing_startdate'];
        $endYmd = (string) $validated['billing_enddate'];

        // Tutorial-based date overlap so students are included even if no
        // attendance logs exist yet (e.g., Scheduled sessions).
        $candidateIds = Tutorials::query()
            ->whereIn('status', ['Scheduled', 'Ongoing', 'Completed'])
            ->where(function ($q) use ($startYmd, $endYmd) {
                $q->whereNull('start_date')
                    ->orWhere('start_date', '<=', $endYmd);
            })
            ->where(function ($q) use ($startYmd) {
                $q->whereNull('end_date')
                    ->orWhere('end_date', '>=', $startYmd);
            })
            ->pluck('studentid')
            ->filter(fn ($value) => !empty($value))
            ->map(fn ($value) => (string) $value)
            ->unique()
            ->values();

        if ($candidateIds->isEmpty()) {
            return response()->json([
                'students' => [],
            ]);
        }

        $numericIds = $candidateIds->filter(fn ($value) => is_numeric($value))->values()->all();
        $tuteeIds = $candidateIds->filter(fn ($value) => !is_numeric($value))->values()->all();

        $students = Students::query()
            ->where(function ($q) use ($numericIds, $tuteeIds) {
                if (count($numericIds) > 0) {
                    $q->orWhereIn('id', $numericIds);
                }
                if (count($tuteeIds) > 0) {
                    $q->orWhereIn('tuteeid', $tuteeIds);
                }
            })
            ->orderBy('lastname')
            ->orderBy('firstname')
            ->get()
            ->map(function ($s) {
                $name = trim(($s->firstname ?? '') . ' ' . ($s->lastname ?? ''));
                return [
                    'id' => $s->id,
                    'tuteeid' => $s->tuteeid,
                    'name' => $name,
                    'key' => !empty($s->tuteeid) ? (string) $s->tuteeid : (string) $s->id,
                ];
            })
            ->values();

        return response()->json([
            'students' => $students,
        ]);
    }

    /**
     * Get tutorial rates for a student.
     */
    public function studentRates(Request $request)
    {
        $validated = $request->validate([
            'studentid' => 'required|string|max:255',
        ]);

        $studentInput = (string) $validated['studentid'];
        
        $student = null;
        if (is_numeric($studentInput)) {
            $student = Students::find($studentInput);
        }
        if (!$student) {
            $student = Students::where('tuteeid', $studentInput)->first();
        }

        $studentIds = array_values(array_unique(array_filter([
            $studentInput,
            $student ? (string) $student->id : null,
            $student ? (string) $student->tuteeid : null,
        ])));

        // Get active or recent tutorials for this student
        $tutorial = Tutorials::query()
            ->whereIn('studentid', $studentIds)
            ->whereIn('status', ['Scheduled', 'Ongoing', 'Completed'])
            ->orderByDesc('created_at')
            ->first();

        if (!$tutorial) {
            return response()->json([
                'education_level' => null,
                'rate_grade_school' => $this->defaultStudentHourlyRate(),
                'rate_secondary' => $this->defaultStudentHourlyRate(),
            ]);
        }

        return response()->json([
            'education_level' => $tutorial->education_level,
            'rate_grade_school' => (float) ($tutorial->rate_grade_school ?? $this->defaultStudentHourlyRate()),
            'rate_secondary' => (float) ($tutorial->rate_secondary ?? $this->defaultStudentHourlyRate()),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'billingid' => 'nullable|string|max:255|unique:billings,billingid',
            'studentid' => 'required|string|max:255',
            'billing_startdate' => 'required|date',
            'billing_enddate' => 'required|date|after_or_equal:billing_startdate',
            'advanced' => 'nullable|boolean',
            // Computed from attendance.
            'attendance_record' => 'nullable',
            'total_hours' => 'nullable|numeric|min:0',
            // Not entered on the form (can be computed later); default to 0.
            'amount' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|in:unpaid,partial,paid,cancelled',
        ]);

        $isAdvanced = (bool) ($validated['advanced'] ?? false);

        if ($isAdvanced) {
            // Advanced billing allows creating a billing without attendance logs.
            // total_hours is taken from user input (default to 0 if omitted).
            $validated['attendance_record'] = [];
            $validated['total_hours'] = (int) ($validated['total_hours'] ?? 0);
        } else {
            [$attendanceRecord, $totalHours, $totalAmount] = $this->computeAttendanceForBilling(
                (string) $validated['studentid'],
                (string) $validated['billing_startdate'],
                (string) $validated['billing_enddate'],
            );

            $validated['attendance_record'] = $attendanceRecord;
            $validated['total_hours'] = $totalHours;
            $validated['amount'] = $totalAmount;
        }

        if (!array_key_exists('amount', $validated) || $validated['amount'] === null || $validated['amount'] === '') {
            $rate = $this->defaultStudentHourlyRate();
            $roundedHours = (int) round((float) $validated['total_hours']);
            $validated['amount'] = round($roundedHours * $rate, 2);
        }

        if (empty($validated['status'])) {
            $validated['status'] = 'unpaid';
        }

        $billing = Billing::create($validated);

        return redirect()->route('billings.show', ['billing' => $billing->encrypted_id])->with('success', 'Billing created.');
    }

    protected function computeAttendanceForBilling(string $studentInput, string $startYmd, string $endYmd): array
    {
        $tz = $this->localTimezone();

        $student = null;
        if (is_numeric($studentInput)) {
            $student = Students::find($studentInput);
        }
        if (!$student) {
            $student = Students::where('tuteeid', $studentInput)->first();
        }

        $studentIds = array_values(array_unique(array_filter([
            (string) $studentInput,
            $student ? (string) $student->id : null,
            $student ? (string) $student->tuteeid : null,
        ])));

        $attendances = Attendance::query()
            ->whereBetween('date', [$startYmd, $endYmd])
            ->whereIn('studentid', $studentIds)
            ->whereNotNull('time_in')
            ->whereNotNull('time_out')
            ->orderBy('date')
            ->orderBy('time_in')
            ->get();

        $tutorials = Tutorials::query()
            ->whereIn('tutorialid', $attendances->pluck('tutorialid')->filter()->unique())
            ->get()
            ->keyBy('tutorialid');

        $defaultRate = $this->defaultStudentHourlyRate();

        $totalMinutes = 0;
        $rows = [];
        $tutorialHours = []; // Track total hours per tutorial

        foreach ($attendances as $a) {
            $minutes = $this->attendanceDurationMinutes(
                (string) $this->formatDateYmd($a->date),
                (string) $a->time_in,
                (string) $a->time_out,
                $tz
            );

            $totalMinutes += $minutes;

            $tutorial = $tutorials->get($a->tutorialid);
            $rate = $tutorial?->tutee_fee_amount;
            $rateValue = $rate !== null ? (float) $rate : $defaultRate;
            $hours = round($minutes / 60, 2);
            
            // Track total hours per tutorial
            if (!isset($tutorialHours[$a->tutorialid])) {
                $tutorialHours[$a->tutorialid] = [
                    'hours' => 0,
                    'rate' => $rateValue,
                ];
            }
            $tutorialHours[$a->tutorialid]['hours'] += $hours;

            $rows[] = [
                'tutorialid' => $a->tutorialid,
                'tutorid' => $a->tutorid,
                'tutor_name' => $this->resolveTutorName($a->tutorid),
                'date' => $this->formatDateYmd($a->date),
                'time_in' => $a->time_in,
                'time_out' => $a->time_out,
                'minutes' => $minutes,
                'hours' => $hours,
                'hourly_rate' => round($rateValue, 2),
                'amount' => 0, // Will be calculated per tutorial
            ];
        }

        // Calculate total amount by grouping by tutorial and rounding hours
        $totalAmount = 0;
        foreach ($tutorialHours as $tutorialData) {
            $roundedHours = (int) round($tutorialData['hours']);
            $tutorialAmount = round($roundedHours * $tutorialData['rate'], 2);
            $totalAmount += $tutorialAmount;
        }

        $totalHours = round($totalMinutes / 60, 2);

        return [$rows, $totalHours, round($totalAmount, 2)];
    }

    protected function attendanceDurationMinutes(string $dateYmd, string $timeIn, string $timeOut, string $tz): int
    {
        $in = $this->parseLocalDateTime($dateYmd, $timeIn, $tz);
        $out = $this->parseLocalDateTime($dateYmd, $timeOut, $tz);

        if (!$in || !$out) return 0;
        if ($out->lessThanOrEqualTo($in)) return 0;

        return (int) $in->diffInMinutes($out);
    }

    protected function parseLocalDateTime(string $dateYmd, string $time, string $tz): ?Carbon
    {
        $time = trim($time);
        $formats = ['H:i:s', 'H:i'];

        foreach ($formats as $fmt) {
            try {
                return Carbon::createFromFormat('Y-m-d ' . $fmt, $dateYmd . ' ' . $time, $tz);
            } catch (\Throwable $e) {
                // try next
            }
        }

        return null;
    }

    protected function formatDateYmd($value): ?string
    {
        if (empty($value)) return null;
        try {
            return Carbon::parse($value)->format('Y-m-d');
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($encrypted)
    {
        try {
            $id = Crypt::decryptString($encrypted);
        } catch (\Throwable $e) {
            abort(404);
        }

        $billing = Billing::findOrFail($id);

        $payments = $this->paymentsForBilling($billing)
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'paymentid' => $p->paymentid,
                    'billingid' => $p->billingid,
                    'tutorialid' => $p->tutorialid,
                    'studentname' => $p->studentname,
                    'payment_date' => $p->payment_date ?: null,
                    'amount' => $p->amount,
                    'payment_method' => $p->payment_method,
                    'nature_of_collection' => $p->nature_of_collection,
                    'status' => $p->status,
                ];
            })
            ->values();

        $tutorialIds = $this->extractTutorialIdsFromAttendance($billing->attendance_record);
        $studentTotalPaid = 0.0;
        if (count($tutorialIds) > 0) {
            $studentTotalPaid = round((float) Payments::query()
                ->whereIn('tutorialid', $tutorialIds)
                ->sum('amount'), 2);
        }

        // Calculate total paid and balance
        $totalPaid = round((float) $payments->sum(function ($p) {
            return (float) $p['amount'];
        }), 2);
        $billingAmount = (float) ($billing->amount ?? 0);
        $sessionBalance = round($billingAmount - $studentTotalPaid, 2);

        if ($sessionBalance <= 0 && (string) $billing->status !== 'paid') {
            $billing->status = 'paid';
            $billing->save();
        }

        $computedStatus = $sessionBalance <= 0
            ? 'paid'
            : $this->computeBillingStatus($billingAmount, $totalPaid);

        return Inertia::render('billings/show', [
            'billing' => [
                'id' => $billing->id,
                'encrypted_id' => $billing->encrypted_id,
                'billingid' => $billing->billingid,
                'studentid' => $billing->studentid,
                'student_name' => $this->resolveStudentName($billing->studentid),
                'billing_startdate' => $billing->billing_startdate ?: null,
                'billing_enddate' => $billing->billing_enddate ?: null,
                'attendance_record' => $billing->attendance_record,
                'total_hours' => $billing->total_hours,
                'amount' => $billing->amount,
                'status' => $computedStatus,
                'created_at' => $billing->created_at,
                'updated_at' => $billing->updated_at,
            ],
            'payments' => $payments,
            'total_paid' => $totalPaid,
            'student_total_paid' => $studentTotalPaid,
            'balance' => $sessionBalance,
        ]);
    }

    public function pdf($encrypted)
    {
        try {
            $id = Crypt::decryptString($encrypted);
        } catch (\Throwable $e) {
            abort(404);
        }

        $billing = Billing::findOrFail($id);

        $tz = $this->localTimezone();

        $qrContent = trim((string) ($billing->billingid ?? ''));

        // Generate a QR code (prefer SVG for crisp output).
        $qrDataUri = null;
        try {
            if ($qrContent === '') {
                throw new \RuntimeException('Missing billing id for QR');
            }
            $renderer = new ImageRenderer(
                new RendererStyle(140),
                new SvgImageBackEnd()
            );
            $writer = new Writer($renderer);
            $qrSvg = $writer->writeString($qrContent);
            $qrDataUri = 'data:image/svg+xml;base64,' . base64_encode($qrSvg);
        } catch (\Throwable $e) {
            $qrDataUri = null;
        }

        $data = [
            'billing' => $billing,
            'student_name' => $this->resolveStudentName($billing->studentid),
            'attendance_rows' => collect($this->normalizeAttendanceRows($billing->attendance_record))
                ->map(function ($row) use ($tz) {
                    if (!is_array($row)) return $row;

                    if (array_key_exists('time_in', $row)) {
                        $row['time_in'] = $this->formatTimeTo12Hour($row['time_in'], $tz);
                    }
                    if (array_key_exists('time_out', $row)) {
                        $row['time_out'] = $this->formatTimeTo12Hour($row['time_out'], $tz);
                    }

                    return $row;
                })
                ->values()
                ->all(),
            'qr_data_uri' => $qrDataUri,
            'generated_at' => Carbon::now($tz),
        ];

        $pdf = Pdf::loadView('pdf.billing', $data)
            ->setPaper('a4')
            ->setOptions([
                // Improve text rendering consistency.
                'defaultFont' => 'DejaVu Sans',
                'isHtml5ParserEnabled' => true,
                // Higher dpi improves image assets; text remains vector.
                'dpi' => 150,
                'fontHeightRatio' => 1.1,
            ]);

        $safeBillingId = preg_replace('/[^A-Za-z0-9_-]/', '_', (string) ($billing->billingid ?? 'billing'));
        $fileName = 'billing_' . $safeBillingId . '.pdf';
        $path = 'billing_pdfs/' . $fileName;

        try {
            Storage::disk(config('filesystems.billing_disk'))->put($path, $pdf->output());
        } catch (\Throwable $e) {
            // Saving is best-effort; still stream the PDF.
        }

        return $pdf->stream($fileName);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($encrypted)
    {
        try {
            $id = Crypt::decryptString($encrypted);
        } catch (\Throwable $e) {
            abort(404);
        }

        $billing = Billing::findOrFail($id);

        return Inertia::render('billings/edit', [
            'billing' => [
                'id' => $billing->id,
                'encrypted_id' => $billing->encrypted_id,
                'billingid' => $billing->billingid,
                'studentid' => $billing->studentid,
                'student_name' => $this->resolveStudentName($billing->studentid),
                'billing_startdate' => $billing->billing_startdate ?: null,
                'billing_enddate' => $billing->billing_enddate ?: null,
                'attendance_record' => $billing->attendance_record,
                'total_hours' => $billing->total_hours,
                'amount' => $billing->amount,
                'status' => $billing->status,
            ],
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $encrypted)
    {
        try {
            $id = Crypt::decryptString($encrypted);
        } catch (\Throwable $e) {
            abort(404);
        }

        $billing = Billing::findOrFail($id);

        $validated = $request->validate([
            // Billing ID is generated/immutable; not edited via the form.
            'studentid' => 'required|string|max:255',
            'billing_startdate' => 'required|date',
            'billing_enddate' => 'required|date|after_or_equal:billing_startdate',
            // These are computed from attendance and not user-editable.
            'attendance_record' => 'nullable',
            'total_hours' => 'nullable|integer|min:0',
            // Amount is not edited on the form; keep existing when omitted.
            'amount' => 'nullable|numeric|min:0',
            'status' => 'required|string|in:unpaid,partial,paid,cancelled',
        ]);

        [$attendanceRecord, $totalHours, $totalAmount] = $this->computeAttendanceForBilling(
            (string) $validated['studentid'],
            (string) $validated['billing_startdate'],
            (string) $validated['billing_enddate'],
        );

        $validated['attendance_record'] = $attendanceRecord;
        $validated['total_hours'] = $totalHours;
        $validated['amount'] = $totalAmount;

        if (!array_key_exists('amount', $validated) || $validated['amount'] === null || $validated['amount'] === '') {
            $validated['amount'] = 0;
        }

        $billing->update($validated);

        return redirect()->route('billings.show', ['billing' => $billing->encrypted_id])->with('success', 'Billing updated.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($encrypted)
    {
        try {
            $id = Crypt::decryptString($encrypted);
        } catch (\Throwable $e) {
            abort(404);
        }

        $billing = Billing::findOrFail($id);
        $billing->delete();

        return redirect()->to(route('billings') . '?tab=billings')->with('success', 'Billing deleted.');
    }
}
