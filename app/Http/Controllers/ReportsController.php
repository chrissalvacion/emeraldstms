<?php

namespace App\Http\Controllers;

use App\Models\Billing;
use App\Models\Tutorials;
use App\Models\Attendance;
use App\Models\Students;
use App\Models\Tutors;
use App\Models\Payments;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class ReportsController extends Controller
{
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
        $billings = Billing::where('status', '!=', 'paid')
            ->orderBy('billing_startdate', 'desc')
            ->get()
            ->map(function ($billing) {
                $totalPaid = Payments::where('billingid', $billing->billingid)->sum('amount');
                $balance = (float)$billing->amount - $totalPaid;
                
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
                    'amount' => $billing->amount,
                    'total_paid' => $totalPaid,
                    'balance' => $balance,
                    'status' => $billing->status,
                ];
            });

        return Inertia::render('reports/unpaid-billings', [
            'billings' => $billings,
        ]);
    }

    /**
     * Display paid billings report
     */
    public function paidBillings()
    {
        $billings = Billing::where('status', 'paid')
            ->orderBy('billing_startdate', 'desc')
            ->get()
            ->map(function ($billing) {
                $totalPaid = Payments::where('billingid', $billing->billingid)->sum('amount');
                
                $student = null;
                if (is_numeric($billing->studentid)) {
                    $student = Students::find($billing->studentid);
                } else {
                    $student = Students::where('tuteeid', $billing->studentid)->first();
                }
                $studentName = $student ? trim(($student->firstname ?? '') . ' ' . ($student->lastname ?? '')) : null;

                return [
                    'id' => $billing->id,
                    'billingid' => $billing->billingid,
                    'studentid' => $billing->studentid,
                    'student_name' => $studentName,
                    'billing_startdate' => $billing->billing_startdate,
                    'billing_enddate' => $billing->billing_enddate,
                    'total_hours' => $billing->total_hours,
                    'amount' => $billing->amount,
                    'total_paid' => $totalPaid,
                    'status' => $billing->status,
                ];
            });

        return Inertia::render('reports/paid-billings', [
            'billings' => $billings,
        ]);
    }

    /**
     * Display all tutorials report
     */
    public function tutorials()
    {
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
}
