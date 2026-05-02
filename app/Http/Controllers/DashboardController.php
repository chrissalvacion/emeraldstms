<?php

namespace App\Http\Controllers;

use App\Models\Tutorials;
use App\Models\Tutors;
use App\Models\Students;
use App\Models\Attendance;
use App\Models\Billing;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;

class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('dashboard', [
            'stats' => $this->getStats(),
        ]);
    }

    public function stats()
    {
        return response()->json($this->getStats());
    }

    private function getStats()
    {
        // During fresh setup (before migrations), avoid querying missing tables.
        if (! $this->requiredTablesExist()) {
            return [
                'activeSessions' => 0,
                'activeTutees' => 0,
                'totalAttendance' => 0,
                'activeTutors' => 0,
                'unpaidBillings' => 0,
                'paidBillings' => 0,
                'topTutors' => [],
                'recentTutorials' => [],
                'recentAttendance' => [],
            ];
        }

        // Total active tutorial sessions
        $activeSessions = Tutorials::where('status', 'Ongoing')->count();

        // Total active tutees (students with at least one ongoing tutorial)
        $activeTutees = Tutorials::where('status', 'Ongoing')->distinct('studentid')->count('studentid');

        // Total attendance records
        $totalAttendance = Attendance::count();

        // Total active tutors (tutors with at least one ongoing tutorial)
        $activeTutors = Tutorials::where('status', 'Ongoing')->distinct('tutorid')->count('tutorid');

        // Top 5 tutors by attendance count
        $topTutors = Attendance::selectRaw('tutorid, COUNT(*) as attendance_count')
            ->groupBy('tutorid')
            ->orderByDesc('attendance_count')
            ->limit(5)
            ->get()
            ->map(function ($row) {
                $tutor = Tutors::where('tutorid', $row->tutorid)->orWhere('id', $row->tutorid)->first();
                return [
                    'tutorid' => $row->tutorid,
                    'attendance_count' => $row->attendance_count,
                    'name' => $tutor ? trim(($tutor->firstname ?? '') . ' ' . ($tutor->lastname ?? '')) : $row->tutorid,
                ];
            });

        // Most recently created tutorial sessions (limit 5)
        $recentTutorials = Tutorials::orderByDesc('created_at')->limit(5)->get()->map(function ($t) {
            $student = is_numeric($t->studentid)
                ? Students::find($t->studentid)
                : Students::where('tuteeid', $t->studentid)->first();
            $tutor = is_numeric($t->tutorid)
                ? Tutors::find($t->tutorid)
                : Tutors::where('tutorid', $t->tutorid)->first();
            return [
                'id' => $t->id,
                'tutorialid' => $t->tutorialid,
                'student_name' => $student ? trim(($student->firstname ?? '') . ' ' . ($student->lastname ?? '')) : null,
                'tutor_name' => $tutor ? trim(($tutor->firstname ?? '') . ' ' . ($tutor->lastname ?? '')) : null,
                'start_date' => $t->start_date,
                'status' => $t->status,
            ];
        });

        // Most recently clocked-in and out tutors (limit 5, by latest activity)
        $recentAttendance = Attendance::where(function($q) {
                $q->whereNotNull('time_in')->orWhereNotNull('time_out');
            })
            ->orderByDesc('date')
            ->orderByDesc('time_in')
            ->orderByDesc('time_out')
            ->limit(5)
            ->get()
            ->map(function ($a) {
                $tutor = is_numeric($a->tutorid)
                    ? Tutors::find($a->tutorid)
                    : Tutors::where('tutorid', $a->tutorid)->first();
                $name = $tutor ? trim(($tutor->firstname ?? '') . ' ' . ($tutor->lastname ?? '')) : $a->tutorid;
                $initials = strtoupper(substr(($tutor->firstname ?? '')[0] ?? '', 0, 1) . substr(($tutor->lastname ?? '')[0] ?? '', 0, 1));
                
                return [
                    'tutorid' => $a->tutorid,
                    'name' => $name,
                    'initials' => $initials ?: 'N/A',
                    'date' => $a->date,
                    'time_in' => $a->time_in,
                    'time_out' => $a->time_out,
                    'status' => $a->time_out ? 'out' : 'in',
                ];
            });

        // Billing statistics
        $unpaidBillings = Billing::where('status', '!=', 'paid')->count();
        $paidBillings = Billing::where('status', 'paid')->count();

        return [
            'activeSessions' => $activeSessions,
            'activeTutees' => $activeTutees,
            'totalAttendance' => $totalAttendance,
            'activeTutors' => $activeTutors,
            'unpaidBillings' => $unpaidBillings,
            'paidBillings' => $paidBillings,
            'topTutors' => $topTutors,
            'recentTutorials' => $recentTutorials,
            'recentAttendance' => $recentAttendance,
        ];
    }

    private function requiredTablesExist(): bool
    {
        return Schema::hasTable('tutorials')
            && Schema::hasTable('attendance')
            && Schema::hasTable('billings')
            && Schema::hasTable('students')
            && Schema::hasTable('tutors');
    }
}
