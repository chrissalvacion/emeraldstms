<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;
use Exception;
use Illuminate\Support\Facades\DB;

class Tutorials extends Model
{
    protected $fillable = [
        'tutorialid',
        'studentid',
        'tutorid',
        'education_level',
        'grade_level',
        'tutorial_date',
        'tutorial_time',
        'tutorial_schedule',
        'start_date',
        'end_date',
        'status',
        'rate_grade_school',
        'rate_secondary',
        'billing_type',
        'prepaid_amount',
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
        'prepaid_amount' => 'decimal:2',
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
        $tz = $timezone ?: 'Asia/Manila';
        $today = Carbon::now($tz)->toDateString();

        return self::query()
            ->whereNotNull('end_date')
            ->where('end_date', '<', $today)
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
     * Calculate total hours from prepaid package.
     * Formula: total_hours = prepaid_amount / hourly_rate
     */
    public function getTotalPrepaidHours(): ?float
    {
        if ($this->billing_type !== 'prepaid-package' || !$this->prepaid_amount) {
            return null;
        }

        $hourlyRate = $this->education_level === 'Elementary'
            ? $this->rate_grade_school
            : $this->rate_secondary;

        if (!$hourlyRate || $hourlyRate <= 0) {
            return null;
        }

        return (float) ($this->prepaid_amount / $hourlyRate);
    }

    /**
     * Calculate remaining hours from prepaid package.
     * Formula: remaining_hours = total_hours - hours_used_in_attendance (rounded to whole number)
     */
    public function getRemainingPrepaidHours(): ?int
    {
        if ($this->billing_type !== 'prepaid-package') {
            return null;
        }

        $totalHours = $this->getTotalPrepaidHours();
        if ($totalHours === null) {
            return null;
        }

        // Get total hours from attendance records for this tutorial
        $attendances = Attendance::where('tutorialid', (string) ($this->tutorialid ?? ''))
            ->get();

        $totalHoursUsed = 0;
        foreach ($attendances as $attendance) {
            $timeIn = $this->timeToMinutes($attendance->time_in);
            $timeOut = $this->timeToMinutes($attendance->time_out);

            if ($timeIn !== null && $timeOut !== null) {
                $durationMinutes = $timeOut - $timeIn;
                if ($durationMinutes > 0) {
                    $totalHoursUsed += $durationMinutes / 60;
                }
            }
        }

        $remainingHours = $totalHours - $totalHoursUsed;
        return (int) round($remainingHours);
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
}
