<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class Tutorials extends Model
{
    protected $fillable = [
        'tutorialid',
        'studentid',
        'tutorid',
        'tutorial_schedule',
        'start_date',
        'end_date',
        'packageid',
        'level',
        'tutee_fee_amount',
        'tutor_fee_amount',
        'prepaid_amount',
        'prepaid_hours',
        'completed_hours',
        'remaining_hours',
        'status',
    ];

    protected $appends = ['encrypted_id', 'student_name'];


    public function getEncryptedIdAttribute()
    {
        return Crypt::encryptString($this->id);
    }

    /**
     * Resolve the student's full name based on `studentid` which may be
     * either a numeric id or a `tuteeid` string.
     */
    public function getStudentNameAttribute()
    {
        if (empty($this->studentid)) return null;

        $student = null;
        if (is_numeric($this->studentid)) {
            $student = \App\Models\Students::find($this->studentid);
        } else {
            $student = \App\Models\Students::where('tuteeid', $this->studentid)->first();
        }

        if (!$student) return null;

        return trim(($student->firstname ?? '') . ' ' . ($student->lastname ?? '')) ?: null;
    }

    /**
     * Cast tutorial_schedule to array for easy usage.
     */
    protected $casts = [
        'tutorial_schedule' => 'array',
        'start_date' => 'date',
        'end_date' => 'date',
        'packageid' => 'integer',
        'tutee_fee_amount' => 'decimal:2',
        'tutor_fee_amount' => 'decimal:2',
        'prepaid_amount' => 'decimal:2',
        'prepaid_hours' => 'decimal:2',
        'completed_hours' => 'decimal:2',
        'remaining_hours' => 'decimal:2',
    ];

    protected static function booted()
    {
        static::creating(function ($tutorial) {
            if (empty($tutorial->tutorialid)) {
                $tutorial->tutorialid = self::generateUniqueTutorialId();
            }
        });
    }

    public static function autoCompletePastEndDate(?string $timezone = null): int
    {
        if (!Schema::hasTable('tutorials')) {
            return 0;
        }

        $tz = $timezone ?: 'Asia/Manila';
        $today = Carbon::now($tz)->toDateString();

        return self::query()
            ->whereNotNull('end_date')
            ->where('end_date', '<', $today)
            // Prepaid/promotional tutorials are hour-based; don't auto-complete solely due to end_date.
            ->where(function ($q) {
                $q->whereNull('prepaid_hours')
                    ->orWhere('prepaid_hours', '<=', 0);
            })
            ->where(function ($q) {
                $q->whereNull('status')
                    ->orWhereNotIn('status', ['Completed', 'Cancelled']);
            })
            ->update(['status' => 'Completed']);
    }

    public static function generateUniqueTutorialId()
    {
        do {
            try {
                $num = random_int(0, 99999999);
            } catch (Exception $e) {
                $num = mt_rand(0, 99999999);
            }

            $digits = str_pad((string)$num, 8, '0', STR_PAD_LEFT);
            $candidate = $digits . date('Y');
        } while (DB::table('tutorials')->where('tutorialid', $candidate)->exists());

        return $candidate;
    }

    /**
     * Total hours for prepaid-style packages.
     * Source of truth is the stored `prepaid_hours` column.
     */
    public function getTotalPrepaidHours(): ?float
    {
        if ($this->prepaid_hours === null) return null;

        $hours = (float) $this->prepaid_hours;
        return $hours > 0 ? $hours : null;
    }

    /**
     * Calculate remaining prepaid hours from attendance.
     */
    public function getRemainingPrepaidHours(): ?float
    {
        $totalHours = $this->getTotalPrepaidHours();
        if ($totalHours === null) {
            return null;
        }

        $used = $this->calculateCompletedHoursFromAttendance();
        return round(max(0, $totalHours - $used), 2);
    }

    /**
     * Calculate total completed hours for this tutorial based on attendance logs.
     *
     * Uses only rows with both time_in and time_out.
     * Handles overnight sessions where time_out is earlier than time_in.
     */
    public function calculateCompletedHoursFromAttendance(): float
    {
        $tutorialId = (string) ($this->tutorialid ?? '');
        if ($tutorialId === '') return 0.0;

        $totalMinutes = 0;

        $attendances = Attendance::query()
            ->where('tutorialid', $tutorialId)
            ->whereNotNull('time_in')
            ->whereNotNull('time_out')
            ->get(['time_in', 'time_out']);

        foreach ($attendances as $a) {
            $inMinutes = $this->timeToMinutesFlexible($a->time_in);
            $outMinutes = $this->timeToMinutesFlexible($a->time_out);
            if ($inMinutes === null || $outMinutes === null) continue;

            if ($outMinutes < $inMinutes) {
                $outMinutes += 24 * 60;
            }

            $diff = $outMinutes - $inMinutes;
            if ($diff <= 0) continue;
            $totalMinutes += $diff;
        }

        return round($totalMinutes / 60, 2);
    }

    /**
     * Sync stored completed_hours/remaining_hours from attendance logs.
     *
     * - completed_hours is always updated (0.00 if no logs)
     * - remaining_hours is only maintained for prepaid tutorials
     */
    public function syncHourCountersFromAttendance(): void
    {
        $this->syncHourCountersFromAttendanceWithAllowance(null);
    }

    /**
     * Sync stored completed_hours/remaining_hours from attendance logs.
     *
     * If $totalAllowedHours is provided, it is used to compute remaining_hours.
     * Otherwise:
     * - prepaid tutorials use prepaid_hours
     * - non-prepaid tutorials use the linked package duration_hours (if available)
     */
    public function syncHourCountersFromAttendanceWithAllowance(?float $totalAllowedHours): void
    {
        $completed = $this->calculateCompletedHoursFromAttendance();

        $allowed = $totalAllowedHours;
        if ($allowed === null) {
            $prepaid = $this->getTotalPrepaidHours();
            if ($prepaid !== null) {
                $allowed = $prepaid;
            } else {
                $allowed = $this->getPackageDurationHours();
            }
        }

        $remaining = $allowed !== null ? round(max(0, $allowed - $completed), 2) : null;

        $currentCompleted = $this->completed_hours !== null ? (float) $this->completed_hours : null;
        $currentRemaining = $this->remaining_hours !== null ? (float) $this->remaining_hours : null;

        $changed = false;
        if ($currentCompleted === null || abs($currentCompleted - $completed) > 0.009) {
            $this->completed_hours = $completed;
            $changed = true;
        }

        if ($allowed !== null) {
            if ($currentRemaining === null || abs($currentRemaining - (float) $remaining) > 0.009) {
                $this->remaining_hours = $remaining;
                $changed = true;
            }
        } elseif ($this->remaining_hours !== null) {
            $this->remaining_hours = null;
            $changed = true;
        }

        if ($changed) {
            $this->save();
        }
    }

    private function getPackageDurationHours(): ?float
    {
        try {
            $packageId = $this->packageid;
            if (empty($packageId)) return null;
            $p = Packages::query()->find((int) $packageId);
            $hours = $p ? (float) ($p->duration_hours ?? 0) : 0.0;
            return $hours > 0 ? $hours : null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Convert time string (HH:mm) to minutes since midnight.
     */
    private function timeToMinutes(?string $time): ?int
    {
        if (!$time) return null;

        $matches = [];
        if (preg_match('/^(\d{1,2}):(\d{2})(?::\d{2})?$/', $time, $matches)) {
            $hours = (int) $matches[1];
            $minutes = (int) $matches[2];
            return $hours * 60 + $minutes;
        }

        return null;
    }

    /**
     * Accepts "HH:MM", "HH:MM:SS" or "H:MM AM/PM".
     */
    private function timeToMinutesFlexible(?string $time): ?int
    {
        if ($time === null) return null;
        $raw = trim((string) $time);
        if ($raw === '') return null;

        // 24h
        $m = [];
        if (preg_match('/^(\d{1,2}):(\d{2})(?::\d{2})?$/', $raw, $m)) {
            $hh = (int) $m[1];
            $mm = (int) $m[2];
            if ($hh < 0 || $hh > 23 || $mm < 0 || $mm > 59) return null;
            return $hh * 60 + $mm;
        }

        // 12h
        if (preg_match('/^(\d{1,2}):(\d{2})\s*([AP]M)$/i', $raw, $m)) {
            $hh = (int) $m[1];
            $mm = (int) $m[2];
            $ap = strtoupper((string) $m[3]);
            if ($hh < 1 || $hh > 12 || $mm < 0 || $mm > 59) return null;
            if ($ap === 'AM') {
                if ($hh === 12) $hh = 0;
            } else {
                if ($hh !== 12) $hh += 12;
            }
            return $hh * 60 + $mm;
        }

        return null;
    }
}
