<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\StudentsController;
use App\Http\Controllers\TutorsController;
use App\Http\Controllers\TutorialsController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\PaymentsController;
use App\Http\Controllers\RatesController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\ReportsController;
use App\Models\Tutorials;
use App\Models\Students;
use App\Models\Tutors;
use Illuminate\Support\Facades\Crypt;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

// Public clock-in/out page (no authentication required)
Route::get('/public-clock', [AttendanceController::class, 'publicClock'])->name('public.clock');
Route::post('/attendance/time-in', [AttendanceController::class, 'timeIn'])->name('attendance.timeIn');
Route::post('/attendance/time-out', [AttendanceController::class, 'timeOut'])->name('attendance.timeOut');

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard stats API endpoint
    Route::get('dashboard/stats', [\App\Http\Controllers\DashboardController::class, 'stats'])->name('dashboard.stats');
    Route::get('dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');

    Route::get('calendar', function () {
        Tutorials::autoCompletePastEndDate('Asia/Manila');

        $tutorials = Tutorials::orderBy('id', 'desc')->get()->map(function ($t) {
            // Resolve student
            $student = null;
            if (is_numeric($t->studentid)) {
                $student = Students::find($t->studentid);
            } else {
                $student = Students::where('tuteeid', $t->studentid)->first();
            }

            // Resolve tutor
            $tutor = null;
            if (is_numeric($t->tutorid)) {
                $tutor = Tutors::find($t->tutorid);
            } else {
                $tutor = Tutors::where('tutorid', $t->tutorid)->first();
            }

            return [
                'id' => $t->id,
                'tutorialid' => $t->tutorialid,
                'studentid' => $t->studentid,
                'tutorid' => $t->tutorid,
                'start_date' => $t->start_date ? $t->start_date->toDateString() : null,
                'end_date' => $t->end_date ? $t->end_date->toDateString() : null,
                'status' => $t->status,
                'tutorial_schedule' => $t->tutorial_schedule,
                'student_name' => $student ? trim(($student->firstname ?? '') . ' ' . ($student->lastname ?? '')) : null,
                'tutor_name' => $tutor ? trim(($tutor->firstname ?? '') . ' ' . ($tutor->lastname ?? '')) : null,
                'encrypted_id' => Crypt::encryptString($t->id),
            ];
        });

        return Inertia::render('calendar', [
            'tutorials' => $tutorials,
        ]);
    })->name('calendar');

    //Students
    Route::get('students', [StudentsController::class, 'index'])->name('students');
    Route::get('students/create', [StudentsController::class, 'create'])->name('students.create');
    Route::post('students', [StudentsController::class, 'store'])->name('students.store');
    Route::get('students/{students}', [StudentsController::class, 'show'])->name('students.show');
    Route::get('students/{students}/edit', [StudentsController::class, 'edit'])->name('students.edit');
    Route::put('students/{students}', [StudentsController::class, 'update'])->name('students.update');
    Route::delete('students/{students}', [StudentsController::class, 'destroy'])->name('students.destroy');
    
    // Tutors
    Route::get('tutors', [TutorsController::class, 'index'])->name('tutors');
    Route::get('tutors/create', [TutorsController::class, 'create'])->name('tutors.create');
    Route::post('tutors', [TutorsController::class, 'store'])->name('tutors.store');
    Route::get('tutors/{tutors}', [TutorsController::class, 'show'])->name('tutors.show');
    Route::get('tutors/{tutors}/edit', [TutorsController::class, 'edit'])->name('tutors.edit');
    Route::put('tutors/{tutors}', [TutorsController::class, 'update'])->name('tutors.update');
    Route::delete('tutors/{tutors}', [TutorsController::class, 'destroy'])->name('tutors.destroy');
    
    // Tutorials
    Route::get('tutorials', [TutorialsController::class, 'index'])->name('tutorials');
    Route::get('tutorials/create', [TutorialsController::class, 'create'])->name('tutorials.create');
    Route::post('tutorials', [TutorialsController::class, 'store'])->name('tutorials.store');
    Route::get('tutorials/{tutorials}', [TutorialsController::class, 'show'])->name('tutorials.show');
    Route::get('tutorials/{tutorials}/edit', [TutorialsController::class, 'edit'])->name('tutorials.edit');
    Route::put('tutorials/{tutorials}', [TutorialsController::class, 'update'])->name('tutorials.update');
    Route::delete('tutorials/{tutorials}', [TutorialsController::class, 'destroy'])->name('tutorials.destroy');

    // Attendance
    Route::get('attendance', [AttendanceController::class, 'index'])->name('attendance');
    Route::get('attendance/logs', [AttendanceController::class, 'logs'])->name('attendance.logs');
    Route::get('attendance/daily-time-records', [AttendanceController::class, 'dailyTimeRecords'])->name('attendance.daily-time-records');
    Route::get('attendance/dtr-pdf', [AttendanceController::class, 'dtrPdf'])->name('attendance.dtr-pdf');
    Route::get('attendance/clock', [AttendanceController::class, 'clock'])->name('attendance.clock');

    // Billings
    Route::get('billings', [BillingController::class, 'index'])->name('billings');
    Route::get('billings/preview', [BillingController::class, 'preview'])->name('billings.preview');
    Route::get('billings/student-rates', [BillingController::class, 'studentRates'])->name('billings.student-rates');
    Route::get('billings/create', [BillingController::class, 'create'])->name('billings.create');
    Route::post('billings', [BillingController::class, 'store'])->name('billings.store');
    Route::get('billings/{billing}', [BillingController::class, 'show'])->name('billings.show');
    Route::get('billings/{billing}/pdf', [BillingController::class, 'pdf'])->name('billings.pdf');
    Route::get('billings/{billing}/edit', [BillingController::class, 'edit'])->name('billings.edit');
    Route::put('billings/{billing}', [BillingController::class, 'update'])->name('billings.update');
    Route::delete('billings/{billing}', [BillingController::class, 'destroy'])->name('billings.destroy');

    // Payments
    Route::get('payments', [PaymentsController::class, 'index'])->name('payments');
    Route::get('payments/create', [PaymentsController::class, 'create'])->name('payments.create');
    Route::post('payments', [PaymentsController::class, 'store'])->name('payments.store');
    Route::get('payments/{payments}', [PaymentsController::class, 'show'])->name('payments.show');
    Route::get('payments/{payments}/edit', [PaymentsController::class, 'edit'])->name('payments.edit');
    Route::put('payments/{payments}', [PaymentsController::class, 'update'])->name('payments.update');
    Route::delete('payments/{payments}', [PaymentsController::class, 'destroy'])->name('payments.destroy');

    // Rates
    Route::get('rates', [RatesController::class, 'edit'])->name('rates.edit');
    Route::put('rates', [RatesController::class, 'update'])->name('rates.update');

    // Payroll
    Route::get('payroll', [PayrollController::class, 'index'])->name('payroll');
    Route::post('payroll/generate', [PayrollController::class, 'generate'])->name('payroll.generate');
    Route::get('payroll/{id}', [PayrollController::class, 'show'])->name('payroll.show');
    Route::put('payroll/{id}', [PayrollController::class, 'update'])->name('payroll.update');
    Route::put('payroll/{payrollId}/entry/{entryId}', [PayrollController::class, 'updateEntry'])->name('payroll.updateEntry');
    Route::delete('payroll/{id}', [PayrollController::class, 'destroy'])->name('payroll.destroy');
    Route::get('payroll/{id}/pdf', [PayrollController::class, 'exportPdf'])->name('payroll.pdf');
    Route::get('payroll/{id}/excel', [PayrollController::class, 'exportExcel'])->name('payroll.excel');

    // Reports
    Route::get('reports', [ReportsController::class, 'index'])->name('reports');
    Route::get('reports/unpaid-billings', [ReportsController::class, 'unpaidBillings'])->name('reports.unpaid-billings');
    Route::get('reports/paid-billings', [ReportsController::class, 'paidBillings'])->name('reports.paid-billings');
    Route::get('reports/tutorials', [ReportsController::class, 'tutorials'])->name('reports.tutorials');
    Route::get('reports/absent-tutors', [ReportsController::class, 'absentTutors'])->name('reports.absent-tutors');
    Route::get('reports/absent-students', [ReportsController::class, 'absentStudents'])->name('reports.absent-students');
});

require __DIR__.'/settings.php';
