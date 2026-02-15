<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Payroll;
use App\Models\PayrollEntry;
use App\Models\Tutorials;
use App\Models\Tutors;
use App\Models\AppSetting;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Inertia\Inertia;

class PayrollController extends Controller
{
    protected function localTimezone(): string
    {
        return 'Asia/Manila';
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

    /**
     * Display a listing of the payroll records
     */
    public function index()
    {
        $payroll = Payroll::with('entries')->orderBy('id', 'desc')->get()->map(function ($p) {
            $totalAmount = $p->entries->sum('total_amount');
            $totalReceived = $p->entries->sum('amount_received') ?? 0;

            return [
                'id' => $p->id,
                'payrollid' => $p->payrollid,
                'period_start' => $p->period_start ? $p->period_start->format('Y-m-d') : null,
                'period_end' => $p->period_end ? $p->period_end->format('Y-m-d') : null,
                'tutor_count' => $p->entries->count(),
                'total_hours' => (int) round($p->entries->sum('total_hours')),
                'total_amount' => (float) $totalAmount,
                'total_received' => (float) $totalReceived,
                'status' => $p->status,
                'encrypted_id' => Crypt::encryptString($p->id),
            ];
        });

        $tutorIdsElementary = Tutorials::where('education_level', 'Elementary')
            ->distinct()
            ->pluck('tutorid')
            ->filter()
            ->values();

        $tutorIdsSecondary = Tutorials::whereIn('education_level', ['JHS', 'SHS'])
            ->distinct()
            ->pluck('tutorid')
            ->filter()
            ->values();

        $buildTutorList = function ($tutorIds) {
            return collect($tutorIds)->map(function ($tutorid) {
                return [
                    'tutorid' => (string) $tutorid,
                    'name' => $this->resolveTutorName((string) $tutorid) ?? (string) $tutorid,
                ];
            })->values();
        };

        return Inertia::render('payroll', [
            'payroll' => $payroll,
            'tutors_by_level' => [
                'elementary' => $buildTutorList($tutorIdsElementary),
                'secondary' => $buildTutorList($tutorIdsSecondary),
            ],
        ]);
    }

    /**
     * Generate payroll for one or multiple tutors in a period
     */
    public function generate(Request $request)
    {
        $request->validate([
            'education_level' => 'required|string|in:elementary,secondary',
            'tutorids' => 'required|array|min:1',
            'tutorids.*' => 'string',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after:period_start',
        ]);

        $tutorids = $request->input('tutorids');
        $periodStart = Carbon::parse($request->input('period_start'))->toDateString();
        $periodEnd = Carbon::parse($request->input('period_end'))->toDateString();
        $educationLevel = $request->input('education_level');

        $levelFilters = $educationLevel === 'secondary' ? ['JHS', 'SHS'] : ['Elementary'];
        
        // Get tutor fees from app settings (these are what we pay tutors, not what students pay)
        $tutorFeeElementary = AppSetting::where('key', 'tutor_fee_elementary')->value('value');
        $tutorFeeJhs = AppSetting::where('key', 'tutor_fee_jhs')->value('value');
        $tutorFeeShs = AppSetting::where('key', 'tutor_fee_shs')->value('value');

        // Create tutor fee map based on education level
        $tutorFeeMap = [
            'Elementary' => (float) ($tutorFeeElementary ?? 0),
            'JHS' => (float) ($tutorFeeJhs ?? 0),
            'SHS' => (float) ($tutorFeeShs ?? 0),
        ];

        // Create a single payroll record for all tutors
        $payroll = Payroll::create([
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'status' => 'pending',
        ]);

        $successCount = 0;
        $failedTutors = [];

        foreach ($tutorids as $tutorid) {
            try {
                // Get tutor
                $tutor = null;
                if (is_numeric($tutorid)) {
                    $tutor = Tutors::find($tutorid);
                }
                if (!$tutor) {
                    $tutor = Tutors::where('tutorid', $tutorid)->first();
                }

                if (!$tutor) {
                    $failedTutors[] = $tutorid;
                    continue;
                }

                $tutorials = Tutorials::where('tutorid', $tutorid)
                    ->whereIn('education_level', $levelFilters)
                    ->get()
                    ->keyBy('tutorialid');

                if ($tutorials->isEmpty()) {
                    $failedTutors[] = $tutorid . ' (no tutorials for level)';
                    continue;
                }

                $tutorialIds = $tutorials->keys()->all();

                // Get attendance records for this tutor and level in the period
                $attendances = Attendance::where('tutorid', $tutorid)
                    ->whereBetween('date', [$periodStart, $periodEnd])
                    ->whereIn('tutorialid', $tutorialIds)
                    ->get();

                // Group hours by education level (using tutor fees from app settings)
                $hoursByLevel = []; // ['Elementary' => totalHours, 'JHS' => totalHours, etc.]
                $attendanceRecords = [];

                foreach ($attendances as $a) {
                    // Get the specific tutorial to determine its education level
                    $tutorial = $tutorials->get($a->tutorialid);
                    if (!$tutorial) continue;

                    $tutorialEducationLevel = $tutorial->education_level;
                    
                    // Use tutor fee from app settings based on education level (not student billing rate)
                    $tutorFee = $tutorFeeMap[$tutorialEducationLevel] ?? 0;

                    $timeIn = Carbon::createFromFormat('H:i:s', $a->time_in, $this->localTimezone());
                    $timeOut = Carbon::createFromFormat('H:i:s', $a->time_out, $this->localTimezone());
                    $hours = abs($timeOut->diffInMinutes($timeIn)) / 60; // hours as decimal

                    // Accumulate hours by education level
                    if (!isset($hoursByLevel[$tutorialEducationLevel])) {
                        $hoursByLevel[$tutorialEducationLevel] = 0;
                    }
                    $hoursByLevel[$tutorialEducationLevel] += $hours;

                    // Store attendance record with individual hours (for display)
                    $attendanceRecords[] = [
                        'date' => $a->date->format('Y-m-d'),
                        'time_in' => $a->time_in,
                        'time_out' => $a->time_out,
                        'hours' => round($hours, 2),
                        'tutorial_id' => $a->tutorialid,
                        'education_level' => $tutorialEducationLevel,
                        'hourly_rate' => round($tutorFee, 2),
                        'amount' => 0, // Will be recalculated after rounding
                    ];
                }

                if (empty($attendanceRecords)) {
                    $failedTutors[] = $tutorid . ' (no attendance records)';
                    continue;
                }

                // Calculate total amount by: rounding hours per level, then multiplying by tutor fee
                $totalAmount = 0;
                $totalHoursRounded = 0;
                $levelBreakdown = []; // For tracking calculation details

                foreach ($hoursByLevel as $level => $hoursDecimal) {
                    $roundedHours = round($hoursDecimal);
                    $rate = $tutorFeeMap[$level] ?? 0;
                    $amount = $roundedHours * $rate;
                    
                    $totalHoursRounded += $roundedHours;
                    $totalAmount += $amount;
                    
                    $levelBreakdown[$level] = [
                        'hours' => $roundedHours,
                        'rate' => $rate,
                        'amount' => $amount,
                    ];
                }

                // Update attendance records with proportional amounts based on final calculation
                // This ensures the sum of individual amounts equals the total amount
                foreach ($attendanceRecords as &$record) {
                    $level = $record['education_level'];
                    $levelTotal = $hoursByLevel[$level] ?? 0;
                    if ($levelTotal > 0 && isset($levelBreakdown[$level])) {
                        // Proportional amount based on this record's hours vs total for this level
                        $proportion = $record['hours'] / $levelTotal;
                        $record['amount'] = round($proportion * $levelBreakdown[$level]['amount'], 2);
                    }
                }
                unset($record); // Break reference

                // Calculate weighted average hourly rate for display based on tutor fees
                $displayRate = $totalHoursRounded > 0 ? ($totalAmount / $totalHoursRounded) : 0;

                // Create payroll entry for this tutor
                PayrollEntry::create([
                    'payroll_id' => $payroll->id,
                    'tutorid' => $tutorid,
                    'hourly_rate' => round($displayRate, 2),
                    'total_hours' => $totalHoursRounded,
                    'total_amount' => round($totalAmount, 2),
                    'attendance_records' => $attendanceRecords,
                ]);

                $successCount++;
            } catch (\Throwable $e) {
                $failedTutors[] = $tutorid . ' (' . $e->getMessage() . ')';
            }
        }

        $message = "Payroll {$payroll->payrollid} generated for {$successCount} tutor(s).";
        if (!empty($failedTutors)) {
            $message .= " Failed: " . implode(', ', $failedTutors);
        }

        return back()->with('success', $message);
    }

    /**
     * Show payroll details
     */
    public function show($id)
    {
        try {
            $decryptedId = Crypt::decryptString($id);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Invalid payroll ID']);
        }

        $payroll = Payroll::with('entries')->find($decryptedId);

        if (!$payroll) {
            return back()->withErrors(['error' => 'Payroll not found']);
        }

        $entries = $payroll->entries->map(function ($entry) {
            return [
                'id' => $entry->id,
                'tutorid' => $entry->tutorid,
                'tutor_name' => $this->resolveTutorName($entry->tutorid),
                'hourly_rate' => (float) $entry->hourly_rate,
                'total_hours' => (int) round($entry->total_hours),
                'total_amount' => (float) $entry->total_amount,
                'amount_received' => $entry->amount_received ? (float) $entry->amount_received : null,
                'signature' => $entry->signature,
                'attendance_records' => $entry->attendance_records ?? [],
            ];
        });

        $totalAmount = $payroll->entries->sum('total_amount');
        $totalReceived = $payroll->entries->sum('amount_received') ?? 0;

        return Inertia::render('payroll/show', [
            'payroll' => [
                'id' => $payroll->id,
                'payrollid' => $payroll->payrollid,
                'period_start' => $payroll->period_start->format('Y-m-d'),
                'period_end' => $payroll->period_end->format('Y-m-d'),
                'status' => $payroll->status,
                'total_amount' => (float) $totalAmount,
                'total_received' => (float) $totalReceived,
                'entries' => $entries,
                'encrypted_id' => $id,
            ],
        ]);
    }

    /**
     * Update payroll entry (mark as received, add signature, etc)
     */
    public function updateEntry(Request $request, $payrollId, $entryId)
    {
        try {
            $decryptedPayrollId = Crypt::decryptString($payrollId);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Invalid payroll ID']);
        }

        $payroll = Payroll::find($decryptedPayrollId);

        if (!$payroll) {
            return back()->withErrors(['error' => 'Payroll not found']);
        }

        $entry = PayrollEntry::where('payroll_id', $decryptedPayrollId)
            ->where('id', $entryId)
            ->first();

        if (!$entry) {
            return back()->withErrors(['error' => 'Entry not found']);
        }

        $request->validate([
            'amount_received' => [
                'nullable',
                'numeric',
                'min:0',
                function ($attribute, $value, $fail) use ($entry) {
                    if ($value !== null && (float) $value > (float) $entry->total_amount) {
                        $fail('The amount received must not exceed the total amount.');
                    }
                },
            ],
            'signature' => 'nullable|string|max:255',
        ]);

        $entry->update($request->only(['amount_received', 'signature']));

        return back()->with('success', 'Entry updated successfully');
    }

    /**
     * Update payroll status
     */
    public function update(Request $request, $id)
    {
        try {
            $decryptedId = Crypt::decryptString($id);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Invalid payroll ID']);
        }

        $payroll = Payroll::find($decryptedId);

        if (!$payroll) {
            return back()->withErrors(['error' => 'Payroll not found']);
        }

        $request->validate([
            'status' => 'nullable|in:pending,approved,paid',
        ]);

        $payroll->update($request->only(['status']));

        return back()->with('success', 'Payroll updated successfully');
    }

    /**
     * Delete payroll record
     */
    public function destroy($id)
    {
        try {
            $decryptedId = Crypt::decryptString($id);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Invalid payroll ID']);
        }

        $payroll = Payroll::find($decryptedId);

        if (!$payroll) {
            return back()->withErrors(['error' => 'Payroll not found']);
        }

        $payroll->delete();

        return back()->with('success', 'Payroll deleted successfully');
    }

    /**
     * Export payroll to PDF (opens in new tab)
     */
    public function exportPdf($id)
    {
        try {
            $decryptedId = Crypt::decryptString($id);
        } catch (\Exception $e) {
            abort(404);
        }

        $payroll = Payroll::with('entries')->find($decryptedId);

        if (!$payroll) {
            abort(404);
        }

        $entries = $payroll->entries->map(function ($entry) {
            return [
                'tutorid' => $entry->tutorid,
                'tutor_name' => $this->resolveTutorName($entry->tutorid),
                'hourly_rate' => $entry->hourly_rate,
                'total_hours' => $entry->total_hours,
                'total_amount' => $entry->total_amount,
                'amount_received' => $entry->amount_received,
                'signature' => $entry->signature,
                'attendance_records' => $entry->attendance_records ?? [],
            ];
        });

        $data = [
            'payroll' => $payroll,
            'entries' => $entries,
            'total_amount' => $payroll->entries->sum('total_amount'),
            'total_received' => $payroll->entries->sum('amount_received') ?? 0,
        ];

        $pdf = Pdf::loadView('payroll.pdf', $data);

        return $pdf->stream('payroll-' . $payroll->payrollid . '.pdf');
    }

    /**
     * Export payroll to Excel
     */
    public function exportExcel($id)
    {
        try {
            $decryptedId = Crypt::decryptString($id);
        } catch (\Exception $e) {
            abort(404);
        }

        $payroll = Payroll::with('entries')->find($decryptedId);

        if (!$payroll) {
            abort(404);
        }

        $filename = 'payroll-' . $payroll->payrollid . '.csv';

        $callback = function () use ($payroll) {
            $file = fopen('php://output', 'w');

            // Headers
            fputcsv($file, ['Payroll ID', $payroll->payrollid]);
            fputcsv($file, ['Period', $payroll->period_start->format('Y-m-d') . ' to ' . $payroll->period_end->format('Y-m-d')]);
            fputcsv($file, ['']);

            // Payroll entries
            foreach ($payroll->entries as $entry) {
                fputcsv($file, ['']);
                fputcsv($file, ['Tutor', $this->resolveTutorName($entry->tutorid)]);
                fputcsv($file, ['Tutor ID', $entry->tutorid]);

                // Table headers
                fputcsv($file, ['Date', 'Time In', 'Time Out', 'Hours', 'Tutorial ID']);

                // Attendance records
                if (is_array($entry->attendance_records)) {
                    foreach ($entry->attendance_records as $record) {
                        fputcsv($file, [
                            $record['date'] ?? '',
                            $record['time_in'] ?? '',
                            $record['time_out'] ?? '',
                            $record['hours'] ?? 0,
                            $record['tutorial_id'] ?? '',
                        ]);
                    }
                }

                fputcsv($file, ['']);
                fputcsv($file, ['Rate per Hour', '₱ ' . number_format($entry->hourly_rate, 2)]);
                fputcsv($file, ['Total Hours', $entry->total_hours]);
                fputcsv($file, ['Total Amount', '₱ ' . number_format($entry->total_amount, 2)]);
                fputcsv($file, ['Amount Received', $entry->amount_received ? '₱ ' . number_format($entry->amount_received, 2) : 'N/A']);
                fputcsv($file, ['Signature', $entry->signature ?? '']);
            }

            fputcsv($file, ['']);
            fputcsv($file, ['SUMMARY']);
            fputcsv($file, ['Total Payable', '₱ ' . number_format($payroll->entries->sum('total_amount'), 2)]);
            fputcsv($file, ['Total Received', '₱ ' . number_format($payroll->entries->sum('amount_received') ?? 0, 2)]);
            fputcsv($file, ['Status', $payroll->status]);

            fclose($file);
        };

        return response()->streamDownload($callback, $filename, [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }
}
