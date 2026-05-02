<?php

namespace App\Http\Controllers;

use App\Models\Billing;
use App\Models\Tutorials;
use App\Models\Attendance;
use App\Models\Students;
use App\Models\Tutors;
use App\Models\Payments;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Carbon\Carbon;

class ReportsController extends Controller
{
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

    protected function paymentsForBilling($billing)
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
            ->values();
    }

    /**
     * Build unpaid billing rows with computed paid and balance values.
     */
    protected function buildUnpaidBillingRows()
    {
        if (!Schema::hasTable('billings')) {
            return collect();
        }

        return Billing::orderBy('billing_startdate', 'desc')
            ->get()
            ->map(function ($billing) {
                $amountDue = round((float) ($billing->amount ?? 0), 2);
                $totalPaid = round((float) $this->paymentsForBilling($billing)->sum('amount'), 2);
                $balance = round($amountDue - $totalPaid, 2);

                $student = null;
                if (is_numeric($billing->studentid)) {
                    $student = Students::find($billing->studentid);
                } else {
                    $student = Students::where('tuteeid', $billing->studentid)->first();
                }
                $studentName = $student ? trim(($student->firstname ?? '') . ' ' . ($student->lastname ?? '')) : null;

                return [
                    'id' => $billing->id,
                    'encrypted_id' => $billing->encrypted_id,
                    'billingid' => $billing->billingid,
                    'studentid' => $billing->studentid,
                    'student_name' => $studentName,
                    'billing_startdate' => $billing->billing_startdate,
                    'billing_enddate' => $billing->billing_enddate,
                    'total_hours' => $billing->total_hours,
                    'amount' => $amountDue,
                    'total_paid' => $totalPaid,
                    'balance' => $balance,
                    'status' => $billing->status,
                ];
            })
            ->filter(function (array $row) {
                return (float) ($row['balance'] ?? 0) > 0;
            })
            ->values();
    }

    /**
     * Build paid billing rows with computed paid and balance values.
     */
    protected function buildPaidBillingRows()
    {
        if (!Schema::hasTable('billings')) {
            return collect();
        }

        return Billing::orderBy('billing_startdate', 'desc')
            ->get()
            ->map(function ($billing) {
                $amount = round((float) ($billing->amount ?? 0), 2);
                $totalPaid = round((float) $this->paymentsForBilling($billing)->sum('amount'), 2);
                $balance = round($amount - $totalPaid, 2);

                $student = null;
                if (is_numeric($billing->studentid)) {
                    $student = Students::find($billing->studentid);
                } else {
                    $student = Students::where('tuteeid', $billing->studentid)->first();
                }
                $studentName = $student ? trim(($student->firstname ?? '') . ' ' . ($student->lastname ?? '')) : null;

                return [
                    'id' => $billing->id,
                    'encrypted_id' => $billing->encrypted_id,
                    'billingid' => $billing->billingid,
                    'studentid' => $billing->studentid,
                    'student_name' => $studentName,
                    'billing_startdate' => $billing->billing_startdate,
                    'billing_enddate' => $billing->billing_enddate,
                    'total_hours' => $billing->total_hours,
                    'amount' => $amount,
                    'total_paid' => $totalPaid,
                    'balance' => $balance,
                    'status' => $billing->status,
                ];
            })
            ->filter(function (array $row) {
                return (float) ($row['balance'] ?? 0) <= 0;
            })
            ->values();
    }

    /**
     * Display the main reports page
     */
    public function index()
    {
        return Inertia::render('reports');
    }

    /**
     * Display unpaid billings report
     */
    public function unpaidBillings()
    {
        $billings = $this->buildUnpaidBillingRows();

        return Inertia::render('reports/unpaid-billings', [
            'billings' => $billings,
        ]);
    }

    /**
     * Generate unpaid billings report in PDF format.
     */
    public function unpaidBillingsPdf()
    {
        $billings = $this->buildUnpaidBillingRows();

        $totalAmountDue = round((float) $billings->sum('amount'), 2);
        $totalAmountPaid = round((float) $billings->sum('total_paid'), 2);
        $totalBalance = round((float) $billings->sum('balance'), 2);

        $pdf = Pdf::loadView('reports.unpaid-billings-pdf', [
            'billings' => $billings,
            'generatedAt' => Carbon::now('Asia/Manila'),
            'totalAmountDue' => $totalAmountDue,
            'totalAmountPaid' => $totalAmountPaid,
            'totalBalance' => $totalBalance,
        ])->setPaper('a4', 'landscape');

        $fileName = 'unpaid_billings_' . Carbon::now('Asia/Manila')->format('Ymd_His') . '.pdf';
        return $pdf->stream($fileName);
    }

    /**
     * Display paid billings report
     */
    public function paidBillings()
    {
        $billings = $this->buildPaidBillingRows();

        return Inertia::render('reports/paid-billings', [
            'billings' => $billings,
        ]);
    }

    /**
     * Generate paid billings report in PDF format.
     */
    public function paidBillingsPdf()
    {
        $billings = $this->buildPaidBillingRows();

        $totalAmount = round((float) $billings->sum('amount'), 2);
        $totalAmountPaid = round((float) $billings->sum('total_paid'), 2);
        $totalHours = round((float) $billings->sum('total_hours'), 2);

        $pdf = Pdf::loadView('reports.paid-billings-pdf', [
            'billings' => $billings,
            'generatedAt' => Carbon::now('Asia/Manila'),
            'totalAmount' => $totalAmount,
            'totalAmountPaid' => $totalAmountPaid,
            'totalHours' => $totalHours,
        ])->setPaper('a4', 'landscape');

        $fileName = 'paid_billings_' . Carbon::now('Asia/Manila')->format('Ymd_His') . '.pdf';
        return $pdf->stream($fileName);
    }

    /**
     * Display all tutorials report
     */
    public function tutorials()
    {
        if (!Schema::hasTable('tutorials')) {
            return Inertia::render('reports/tutorials', [
                'tutorials' => [],
            ]);
        }

        $tutorials = Tutorials::orderBy('start_date', 'desc')
            ->get()
            ->map(function ($tutorial) {
                $student = null;
                if (is_numeric($tutorial->studentid)) {
                    $student = Students::find($tutorial->studentid);
                } else {
                    $student = Students::where('tuteeid', $tutorial->studentid)->first();
                }
                $studentName = $student ? trim(($student->firstname ?? '') . ' ' . ($student->lastname ?? '')) : null;

                $tutor = null;
                if (is_numeric($tutorial->tutorid)) {
                    $tutor = Tutors::find($tutorial->tutorid);
                } else {
                    $tutor = Tutors::where('tutorid', $tutorial->tutorid)->first();
                }
                $tutorName = $tutor ? trim(($tutor->firstname ?? '') . ' ' . ($tutor->lastname ?? '')) : null;

                return [
                    'id' => $tutorial->id,
                    'tutorialid' => $tutorial->tutorialid,
                    'studentid' => $tutorial->studentid,
                    'student_name' => $studentName,
                    'tutorid' => $tutorial->tutorid,
                    'tutor_name' => $tutorName,
                    'education_level' => $tutorial->education_level,
                    'start_date' => $tutorial->start_date,
                    'end_date' => $tutorial->end_date,
                    'status' => $tutorial->status,
                    'rate_grade_school' => $tutorial->rate_grade_school,
                    'rate_secondary' => $tutorial->rate_secondary,
                ];
            });

        return Inertia::render('reports/tutorials', [
            'tutorials' => $tutorials,
        ]);
    }

    /**
     * Display absent tutors report
     */
    public function absentTutors()
    {
        if (!Schema::hasTable('tutorials') || !Schema::hasTable('attendance')) {
            return Inertia::render('reports/absent-tutors', [
                'tutors' => [],
            ]);
        }

        // Get all active tutorials
        $activeTutorials = Tutorials::whereIn('status', ['Scheduled', 'Ongoing'])
            ->get();

        // Get attendance records for the last 30 days
        $thirtyDaysAgo = Carbon::now()->subDays(30);
        $attendanceByTutor = Attendance::where('date', '>=', $thirtyDaysAgo)
            ->get()
            ->groupBy('tutorid');

        // Calculate expected sessions and absences
        $absentTutors = [];
        $tutorIds = $activeTutorials->pluck('tutorid')->unique();

        foreach ($tutorIds as $tutorId) {
            $tutor = null;
            if (is_numeric($tutorId)) {
                $tutor = Tutors::find($tutorId);
            } else {
                $tutor = Tutors::where('tutorid', $tutorId)->first();
            }

            if (!$tutor) continue;

            $tutorName = trim(($tutor->firstname ?? '') . ' ' . ($tutor->lastname ?? ''));
            $attendanceCount = $attendanceByTutor->get($tutorId)?->count() ?? 0;
            $tutorialCount = $activeTutorials->where('tutorid', $tutorId)->count();

            $absentTutors[] = [
                'tutorid' => $tutorId,
                'tutor_name' => $tutorName,
                'active_tutorials' => $tutorialCount,
                'attendance_count' => $attendanceCount,
                'last_attendance' => $attendanceByTutor->get($tutorId)?->sortByDesc('date')->first()?->date,
            ];
        }

        return Inertia::render('reports/absent-tutors', [
            'tutors' => $absentTutors,
        ]);
    }

    /**
     * Display absent students report
     */
    public function absentStudents()
    {
        if (!Schema::hasTable('tutorials') || !Schema::hasTable('attendance')) {
            return Inertia::render('reports/absent-students', [
                'students' => [],
            ]);
        }

        // Get all active tutorials
        $activeTutorials = Tutorials::whereIn('status', ['Scheduled', 'Ongoing'])
            ->get();

        // Get attendance records for the last 30 days
        $thirtyDaysAgo = Carbon::now()->subDays(30);
        $attendanceByStudent = Attendance::where('date', '>=', $thirtyDaysAgo)
            ->get()
            ->groupBy('studentid');

        // Calculate expected sessions and absences
        $absentStudents = [];
        $studentIds = $activeTutorials->pluck('studentid')->unique();

        foreach ($studentIds as $studentId) {
            $student = null;
            if (is_numeric($studentId)) {
                $student = Students::find($studentId);
            } else {
                $student = Students::where('tuteeid', $studentId)->first();
            }

            if (!$student) continue;

            $studentName = trim(($student->firstname ?? '') . ' ' . ($student->lastname ?? ''));
            $attendanceCount = $attendanceByStudent->get($studentId)?->count() ?? 0;
            $tutorialCount = $activeTutorials->where('studentid', $studentId)->count();

            $absentStudents[] = [
                'studentid' => $studentId,
                'student_name' => $studentName,
                'active_tutorials' => $tutorialCount,
                'attendance_count' => $attendanceCount,
                'last_attendance' => $attendanceByStudent->get($studentId)?->sortByDesc('date')->first()?->date,
            ];
        }

        return Inertia::render('reports/absent-students', [
            'students' => $absentStudents,
        ]);
    }

    /**
     * Display unbilled active tutees report
     */
    public function unbilledActiveTutees(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate   = $request->query('end_date');

        if (!Schema::hasTable('tutorials')) {
            return Inertia::render('reports/unbilled-active-tutees', [
                'tutees'     => [],
                'start_date' => $startDate,
                'end_date'   => $endDate,
            ]);
        }

        // Active tutorials
        $activeTutorials = Tutorials::whereIn('status', ['Scheduled', 'Ongoing'])->get();

        // Billing IDs that overlap the date range (if provided)
        $billedStudentIds = collect();
        if ($startDate && $endDate && Schema::hasTable('billings')) {
            $billedStudentIds = Billing::query()
                ->where(function ($q) use ($startDate, $endDate) {
                    $q->where('billing_startdate', '<=', $endDate)
                      ->where('billing_enddate', '>=', $startDate);
                })
                ->pluck('studentid')
                ->map(fn ($v) => (string) $v)
                ->unique();
        }

        $tutees = $activeTutorials
            ->filter(function ($tutorial) use ($billedStudentIds, $startDate, $endDate) {
                if (!$startDate || !$endDate) {
                    return true;
                }
                return !$billedStudentIds->contains((string) $tutorial->studentid);
            })
            ->map(function ($tutorial) {
                $student = null;
                if (is_numeric($tutorial->studentid)) {
                    $student = Students::find($tutorial->studentid);
                } else {
                    $student = Students::where('tuteeid', $tutorial->studentid)->first();
                }
                $studentName = $student
                    ? trim(($student->firstname ?? '') . ' ' . ($student->lastname ?? ''))
                    : null;

                $tutor = null;
                if (is_numeric($tutorial->tutorid)) {
                    $tutor = Tutors::find($tutorial->tutorid);
                } else {
                    $tutor = Tutors::where('tutorid', $tutorial->tutorid)->first();
                }
                $tutorName = $tutor
                    ? trim(($tutor->firstname ?? '') . ' ' . ($tutor->lastname ?? ''))
                    : null;

                return [
                    'tutorialid'   => $tutorial->tutorialid,
                    'studentid'    => $tutorial->studentid,
                    'student_name' => $studentName,
                    'tutorid'      => $tutorial->tutorid,
                    'tutor_name'   => $tutorName,
                    'start_date'   => $tutorial->start_date ? $tutorial->start_date->toDateString() : null,
                    'end_date'     => $tutorial->end_date   ? $tutorial->end_date->toDateString()   : null,
                    'status'       => $tutorial->status,
                ];
            })
            ->values();

        return Inertia::render('reports/unbilled-active-tutees', [
            'tutees'     => $tutees,
            'start_date' => $startDate,
            'end_date'   => $endDate,
        ]);
    }

    /**
     * Generate unbilled active tutees report as PDF.
     */
    public function unbilledActiveTuteesPdf(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate   = $request->query('end_date');

        $activeTutorials = Schema::hasTable('tutorials')
            ? Tutorials::whereIn('status', ['Scheduled', 'Ongoing'])->get()
            : collect();

        $billedStudentIds = collect();
        if ($startDate && $endDate && Schema::hasTable('billings')) {
            $billedStudentIds = Billing::query()
                ->where(function ($q) use ($startDate, $endDate) {
                    $q->where('billing_startdate', '<=', $endDate)
                      ->where('billing_enddate', '>=', $startDate);
                })
                ->pluck('studentid')
                ->map(fn ($v) => (string) $v)
                ->unique();
        }

        $tutees = $activeTutorials
            ->filter(function ($tutorial) use ($billedStudentIds, $startDate, $endDate) {
                if (!$startDate || !$endDate) {
                    return true;
                }
                return !$billedStudentIds->contains((string) $tutorial->studentid);
            })
            ->map(function ($tutorial) {
                $student = null;
                if (is_numeric($tutorial->studentid)) {
                    $student = Students::find($tutorial->studentid);
                } else {
                    $student = Students::where('tuteeid', $tutorial->studentid)->first();
                }
                $studentName = $student
                    ? trim(($student->firstname ?? '') . ' ' . ($student->lastname ?? ''))
                    : null;

                $tutor = null;
                if (is_numeric($tutorial->tutorid)) {
                    $tutor = Tutors::find($tutorial->tutorid);
                } else {
                    $tutor = Tutors::where('tutorid', $tutorial->tutorid)->first();
                }
                $tutorName = $tutor
                    ? trim(($tutor->firstname ?? '') . ' ' . ($tutor->lastname ?? ''))
                    : null;

                return [
                    'tutorialid'   => $tutorial->tutorialid,
                    'studentid'    => $tutorial->studentid,
                    'student_name' => $studentName,
                    'tutorid'      => $tutorial->tutorid,
                    'tutor_name'   => $tutorName,
                    'start_date'   => $tutorial->start_date ? $tutorial->start_date->toDateString() : null,
                    'end_date'     => $tutorial->end_date   ? $tutorial->end_date->toDateString()   : null,
                    'status'       => $tutorial->status,
                ];
            })
            ->values();

        $pdf = Pdf::loadView('reports.unbilled-active-tutees-pdf', [
            'tutees'      => $tutees,
            'start_date'  => $startDate,
            'end_date'    => $endDate,
            'generatedAt' => Carbon::now('Asia/Manila'),
        ])->setPaper('a4', 'portrait');

        $fileName = 'unbilled_active_tutees_' . Carbon::now('Asia/Manila')->format('Ymd_His') . '.pdf';
        return $pdf->stream($fileName);
    }
}
