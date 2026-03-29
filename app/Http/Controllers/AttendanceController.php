<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\AppSetting;
use App\Models\Students;
use App\Models\Tutorials;
use App\Models\Tutors;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class AttendanceController extends Controller
{
    protected function localTimezone(): string
    {
        // Attendance time stamps are stored in local Manila time.
        return 'Asia/Manila';
    }

    protected function clockInGraceMinutes(): int
    {
        // Allow tutors to time in 30 minutes before the scheduled start time.
        return 30;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        Tutorials::autoCompletePastEndDate($this->localTimezone());

        $attendances = Attendance::orderBy('id', 'desc')->get()->map(function ($a) {
            $student = null;
            if (!empty($a->studentid)) {
                // `studentid` may be either a numeric id or a (possibly numeric-looking) `tuteeid`.
                if (is_numeric($a->studentid)) {
                    $student = Students::find($a->studentid);
                }
                if (!$student) {
                    $student = Students::where('tuteeid', (string) $a->studentid)->first();
                }
            }

            $tutor = null;
            if (!empty($a->tutorid)) {
                // `tutorid` may be either a numeric id or a (possibly numeric-looking) `tutorid`.
                if (is_numeric($a->tutorid)) {
                    $tutor = Tutors::find($a->tutorid);
                }
                if (!$tutor) {
                    $tutor = Tutors::where('tutorid', (string) $a->tutorid)->first();
                }
            }

            return [
                'id' => $a->id,
                'tutorialid' => $a->tutorialid,
                'date' => $this->formatDateYmd($a->date),
                'time_in' => $a->time_in,
                'time_out' => $a->time_out,
                'studentid' => $a->studentid,
                'tutorid' => $a->tutorid,
                'student_name' => $student ? trim(($student->firstname ?? '') . ' ' . ($student->lastname ?? '')) : null,
                'tutor_name' => $tutor ? trim(($tutor->firstname ?? '') . ' ' . ($tutor->lastname ?? '')) : null,
            ];
        });

        return Inertia::render('attendance', [
            'attendances' => $attendances,
            'tutors' => Tutors::orderBy('firstname')->orderBy('lastname')->get()->map(function ($t) {
                return [
                    'id' => $t->id,
                    'tutorid' => $t->tutorid,
                    'name' => trim(($t->firstname ?? '') . ' ' . ($t->lastname ?? '')),
                ];
            }),
        ]);
    }

    /**
     * Time clock page.
     */
    public function clock()
    {
        Tutorials::autoCompletePastEndDate($this->localTimezone());

        $now = Carbon::now($this->localTimezone());

        $tutors = Tutors::orderBy('lastname')->get()->map(function ($t) {
            $tutorials = Tutorials::query()
                ->whereIn('tutorid', array_values(array_unique([(string) $t->id, (string) $t->tutorid])))
                ->orderBy('id', 'desc')
                ->get()
                ->map(function ($tr) {
                    $student = null;
                    if (is_numeric($tr->studentid)) {
                        $student = Students::find($tr->studentid);
                    } else {
                        $student = Students::where('tuteeid', $tr->studentid)->first();
                    }

                    return [
                        'id' => $tr->id,
                        'tutorialid' => $tr->tutorialid,
                        'studentid' => $tr->studentid,
                        'student_ref' => $student ? (string) $student->id : (string) $tr->studentid,
                        'student_tuteeid' => $student ? (string) $student->tuteeid : null,
                        'tutorid' => $tr->tutorid,
                        'start_date' => $this->formatDateYmd($tr->start_date),
                        'end_date' => $this->formatDateYmd($tr->end_date),
                        'status' => $tr->status,
                        'tutorial_schedule' => $tr->tutorial_schedule,
                        'student_name' => $student ? trim(($student->firstname ?? '') . ' ' . ($student->lastname ?? '')) : null,
                    ];
                });

            return [
                'id' => $t->id,
                'tutorid' => $t->tutorid,
                'firstname' => $t->firstname,
                'lastname' => $t->lastname,
                'tutorials' => $tutorials,
            ];
        });

        return Inertia::render('attendance/clock', [
            'tutors' => $tutors,
            'students' => Students::orderBy('lastname')->orderBy('firstname')->get()->map(function ($s) {
                return [
                    'id' => $s->id,
                    'tuteeid' => $s->tuteeid,
                    'firstname' => $s->firstname,
                    'lastname' => $s->lastname,
                ];
            }),
            'clock_in_grace_minutes' => $this->clockInGraceMinutes(),
            'app_timezone' => $this->localTimezone(),
            // Provide server-time context so the UI's schedule matching aligns with backend validation.
            'server_today' => $now->toDateString(),
            'server_day_name' => $now->format('l'),
            'server_now_minutes' => ((int) $now->format('H')) * 60 + (int) $now->format('i'),
        ]);
    }

    /**
     * Public clock-in/out page for tutors (no authentication required).
     */
    public function publicClock()
    {
        $now = Carbon::now($this->localTimezone());

        return Inertia::render('public-clock', [
            'app_timezone' => $this->localTimezone(),
        ]);
    }

    /**
     * Time in.
     */
    public function timeIn(Request $request)
    {
        Tutorials::autoCompletePastEndDate($this->localTimezone());

        $validated = $request->validate([
            'tutorid' => 'required',
        ]);

        $now = Carbon::now($this->localTimezone());
        $today = $now->toDateString();

        $tutorInput = $validated['tutorid'];
        $tutor = $this->resolveTutor($tutorInput);

        [$tutorial, $schedule] = $this->findActiveTutorialForTutor($tutorInput, $tutor, $now, $this->clockInGraceMinutes());

        if (!$tutorial) {
            throw ValidationException::withMessages([
                'tutorid' => 'No active tutorial schedule in the current time window. Time-in is not allowed.',
            ]);
        }

        // If an attendance record already exists for this tutorial today but has no time_in yet,
        // update it instead of blocking the tutor.
        $matched = Attendance::query()
            ->where('date', $today)
            ->where('tutorialid', (string) $tutorial->tutorialid)
            ->whereIn('tutorid', $this->tutorIdentifiersForQuery($tutorInput, $tutor))
            ->orderByDesc('id')
            ->first();

        if ($matched) {
            if (empty($matched->time_in) && empty($matched->time_out)) {
                $matched->update([
                    'tutorid' => (string) $tutorial->tutorid,
                    'studentid' => (string) $tutorial->studentid,
                    'tutorialid' => (string) $tutorial->tutorialid,
                    'date' => $today,
                    'time_in' => $now->format('H:i:s'),
                ]);

                Tutorials::query()
                    ->where('tutorialid', (string) $tutorial->tutorialid)
                    ->where('status', 'Scheduled')
                    ->update(['status' => 'Ongoing']);

                return back()->with('success', 'Time-in recorded successfully');
            }

            throw ValidationException::withMessages([
                'tutorid' => 'Time-in has already been recorded for this tutorial today.',
            ]);
        }

        // No matched tutorial record yet: ensure there isn't another open time-in for this tutor today.
        $open = Attendance::query()
            ->where('date', $today)
            ->whereIn('tutorid', $this->tutorIdentifiersForQuery($tutorInput, $tutor))
            ->whereNull('time_out')
            ->first();

        if ($open) {
            throw ValidationException::withMessages([
                'tutorid' => 'This tutor already has an active time-in for today.',
            ]);
        }

        Attendance::create([
            'tutorid' => $tutorial->tutorid,
            'studentid' => $tutorial->studentid,
            'tutorialid' => $tutorial->tutorialid,
            'date' => $today,
            'time_in' => $now->format('H:i:s'),
            'time_out' => null,
        ]);

        // First attendance marks the tutorial as started.
        Tutorials::query()
            ->where('tutorialid', (string) $tutorial->tutorialid)
            ->where('status', 'Scheduled')
            ->update(['status' => 'Ongoing']);

        return back()->with('success', 'Time-in recorded successfully');
    }

    /**
     * Time out (updates the open record).
     */
    public function timeOut(Request $request)
    {
        Tutorials::autoCompletePastEndDate($this->localTimezone());

        $validated = $request->validate([
            'tutorid' => 'required',
        ]);

        $now = Carbon::now($this->localTimezone());
        $today = $now->toDateString();

        $tutorInput = $validated['tutorid'];
        $tutor = $this->resolveTutor($tutorInput);

        $open = Attendance::query()
            ->where('date', $today)
            ->whereIn('tutorid', $this->tutorIdentifiersForQuery($tutorInput, $tutor))
            ->whereNull('time_out')
            ->orderByDesc('id')
            ->first();

        if (!$open) {
            throw ValidationException::withMessages([
                'tutorid' => 'No active time-in found for today. Time-out is not allowed.',
            ]);
        }

        $open->update([
            'time_out' => $now->format('H:i:s'),
        ]);

        return back()->with('success', 'Time-out recorded successfully');
    }

    /**
     * Manual attendance record (date + time in + time out),
     * without schedule-window enforcement.
     */
    public function recordManual(Request $request)
    {
        Tutorials::autoCompletePastEndDate($this->localTimezone());

        $validated = $request->validate([
            'tutorid' => 'required',
            'studentid' => 'required',
            'tutorialid' => 'nullable|string',
            'date' => 'required|date_format:Y-m-d',
            'time_in' => ['required', 'regex:/^(?:(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?|(?:0?[1-9]|1[0-2]):[0-5]\d\s*[APap][Mm])$/'],
            'time_out' => ['required', 'regex:/^(?:(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?|(?:0?[1-9]|1[0-2]):[0-5]\d\s*[APap][Mm])$/'],
        ]);

        $date = Carbon::createFromFormat('Y-m-d', (string) $validated['date'], $this->localTimezone())->toDateString();
        $timeIn = $this->normalizeTimeValue((string) $validated['time_in']);
        $timeOut = $this->normalizeTimeValue((string) $validated['time_out']);

        if ($timeIn === null || $timeOut === null) {
            throw ValidationException::withMessages([
                'time_in' => 'Invalid time format.',
            ]);
        }

        $timeInMinutes = $this->timeStringToMinutes($timeIn);
        $timeOutMinutes = $this->timeStringToMinutes($timeOut);
        if ($timeInMinutes === null || $timeOutMinutes === null) {
            throw ValidationException::withMessages([
                'time_in' => 'Invalid time values.',
            ]);
        }
        if ($timeOutMinutes < $timeInMinutes) {
            throw ValidationException::withMessages([
                'time_out' => 'Time out cannot be earlier than time in.',
            ]);
        }

        $tutorInput = $validated['tutorid'];
        $studentInput = $validated['studentid'];
        $tutor = $this->resolveTutor($tutorInput);
        $student = $this->resolveStudent($studentInput);

        if (!$tutor) {
            throw ValidationException::withMessages([
                'tutorid' => 'Tutor not found.',
            ]);
        }

        if (!$student) {
            throw ValidationException::withMessages([
                'studentid' => 'Student not found.',
            ]);
        }

        $tutorial = null;

        if (!empty($validated['tutorialid'])) {
            $tutorial = Tutorials::query()->where('tutorialid', (string) $validated['tutorialid'])->first();
        }

        if (!$tutorial) {
            $tutorial = $this->findPreferredTutorialForAttendance($tutorInput, $tutor, $studentInput, $student, $date);
        }

        if (!$tutorial) {
            throw ValidationException::withMessages([
                'tutorialid' => 'No active tutorial session found for the selected tutor and student on this date.',
            ]);
        }

        if (!in_array((string) $tutorial->tutorid, $this->tutorIdentifiersForQuery($tutorInput, $tutor), true)) {
            throw ValidationException::withMessages([
                'tutorialid' => 'Selected tutorial does not belong to the selected tutor.',
            ]);
        }

        if (!in_array((string) $tutorial->studentid, $this->studentIdentifiersForQuery($studentInput, $student), true)) {
            throw ValidationException::withMessages([
                'tutorialid' => 'Selected tutorial does not belong to the selected student.',
            ]);
        }

        $recordFingerprint = hash('sha256', implode('|', [
            (string) $tutorial->tutorid,
            (string) $tutorial->studentid,
            (string) $tutorial->tutorialid,
            (string) $date,
            (string) $timeIn,
            (string) $timeOut,
        ]));

        $lastSubmission = $request->session()->get('attendance_manual_submission');
        if (is_array($lastSubmission)) {
            $samePayload = (($lastSubmission['fingerprint'] ?? '') === $recordFingerprint);
            $submittedAt = (int) ($lastSubmission['submitted_at'] ?? 0);
            $submittedRecently = $submittedAt > 0 && (time() - $submittedAt) <= 5;

            if ($samePayload && $submittedRecently) {
                return back()->with('success', 'Attendance already recorded.');
            }
        }

        $alreadyExists = Attendance::query()
            ->where('tutorid', (string) $tutorial->tutorid)
            ->where('studentid', (string) $tutorial->studentid)
            ->where('tutorialid', (string) $tutorial->tutorialid)
            ->where('date', (string) $date)
            ->where('time_in', (string) $timeIn)
            ->where('time_out', (string) $timeOut)
            ->exists();

        if ($alreadyExists) {
            $request->session()->put('attendance_manual_submission', [
                'fingerprint' => $recordFingerprint,
                'submitted_at' => time(),
            ]);

            return back()->with('success', 'Attendance already recorded.');
        }

        Attendance::create([
            'tutorid' => (string) $tutorial->tutorid,
            'studentid' => (string) $tutorial->studentid,
            'tutorialid' => (string) $tutorial->tutorialid,
            'date' => $date,
            'time_in' => $timeIn,
            'time_out' => $timeOut,
        ]);

        $request->session()->put('attendance_manual_submission', [
            'fingerprint' => $recordFingerprint,
            'submitted_at' => time(),
        ]);

        Tutorials::query()
            ->where('tutorialid', (string) $tutorial->tutorialid)
            ->where('status', 'Scheduled')
            ->update(['status' => 'Ongoing']);

        return back()->with('success', 'Attendance recorded successfully');
    }

    /**
     * Update an attendance log record.
     */
    public function updateLog(Request $request, Attendance $attendance)
    {
        $validated = $request->validate([
            'date' => 'required|date_format:Y-m-d',
            'time_in' => ['nullable', 'regex:/^(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/'],
            'time_out' => ['nullable', 'regex:/^(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/'],
            'password' => 'required|string|current_password',
        ]);

        $timeIn = $validated['time_in'] ?? null;
        $timeOut = $validated['time_out'] ?? null;

        if (!empty($timeIn) && !empty($timeOut)) {
            $inMinutes = $this->timeStringToMinutes((string) $timeIn);
            $outMinutes = $this->timeStringToMinutes((string) $timeOut);
            if ($inMinutes !== null && $outMinutes !== null && $outMinutes < $inMinutes) {
                throw ValidationException::withMessages([
                    'time_out' => 'Time out cannot be earlier than time in.',
                ]);
            }
        }

        $attendance->update([
            'date' => (string) $validated['date'],
            'time_in' => $this->normalizeTimeValue((string) ($timeIn ?? '')),
            'time_out' => $this->normalizeTimeValue((string) ($timeOut ?? '')),
        ]);

        return back()->with('success', 'Attendance log updated successfully');
    }

    /**
     * Delete an attendance log record.
     */
    public function destroyLog(Request $request, Attendance $attendance)
    {
        $request->validate([
            'password' => 'required|string|current_password',
        ]);

        $attendance->delete();

        return back()->with('success', 'Attendance log deleted successfully');
    }

    protected function resolveTutor($tutorInput): ?Tutors
    {
        if (empty($tutorInput)) return null;

        // Note: `tutorid` can be numeric-looking; attempt both id and tutorid.
        $tutor = null;
        if (is_numeric($tutorInput)) {
            $tutor = Tutors::find($tutorInput);
        }
        if (!$tutor) {
            $tutor = Tutors::where('tutorid', (string) $tutorInput)->first();
        }

        return $tutor;
    }

    protected function tutorIdentifiersForQuery($tutorInput, ?Tutors $tutor): array
    {
        $ids = [];
        if (!empty($tutorInput)) $ids[] = (string) $tutorInput;
        if ($tutor) {
            // Include both identifiers so a UI "match" can't disagree with server lookup.
            $ids[] = (string) $tutor->id;
            if (!empty($tutor->tutorid)) $ids[] = (string) $tutor->tutorid;
        }
        return array_values(array_unique($ids));
    }

    protected function resolveStudent($studentInput): ?Students
    {
        if (empty($studentInput)) return null;

        $student = null;
        if (is_numeric($studentInput)) {
            $student = Students::find($studentInput);
        }
        if (!$student) {
            $student = Students::where('tuteeid', (string) $studentInput)->first();
        }

        return $student;
    }

    protected function studentIdentifiersForQuery($studentInput, ?Students $student): array
    {
        $ids = [];
        if (!empty($studentInput)) $ids[] = (string) $studentInput;
        if ($student) {
            $ids[] = (string) $student->id;
            if (!empty($student->tuteeid)) $ids[] = (string) $student->tuteeid;
        }
        return array_values(array_unique($ids));
    }

    protected function findPreferredTutorialForAttendance($tutorInput, ?Tutors $tutor, $studentInput, ?Students $student, string $date): ?Tutorials
    {
        $tutorIds = $this->tutorIdentifiersForQuery($tutorInput, $tutor);
        $studentIds = $this->studentIdentifiersForQuery($studentInput, $student);
        if (empty($studentIds)) return null;

        $base = Tutorials::query()
            ->whereNotIn('status', ['Cancelled', 'Completed'])
            ->whereIn('studentid', $studentIds)
            ->where(function ($q) use ($date) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', $date);
            })
            ->where(function ($q) use ($date) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', $date);
            });

        $withTutor = null;
        if (!empty($tutorIds)) {
            $withTutor = (clone $base)
                ->whereIn('tutorid', $tutorIds)
                ->orderByRaw("CASE WHEN status = 'Ongoing' THEN 0 WHEN status = 'Scheduled' THEN 1 ELSE 2 END")
                ->orderByDesc('id')
                ->first();
        }

        if ($withTutor instanceof Tutorials) return $withTutor;

        $fallback = $base
            ->orderByRaw("CASE WHEN status = 'Ongoing' THEN 0 WHEN status = 'Scheduled' THEN 1 ELSE 2 END")
            ->orderByDesc('id')
            ->first();

        return $fallback instanceof Tutorials ? $fallback : null;
    }

    protected function normalizeTimeValue(string $value): ?string
    {
        $value = trim($value);
        if ($value === '') return null;

        $h24 = '/^(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/';
        $h12 = '/^(0?[1-9]|1[0-2]):([0-5]\d)\s*([APap][Mm])$/';

        if (preg_match($h24, $value)) {
            try {
                $dt = Carbon::parse($value, $this->localTimezone());
                return $dt->format('H:i:s');
            } catch (\Throwable $e) {
                return null;
            }
        }

        if (preg_match($h12, $value, $m)) {
            $hour = (int) $m[1];
            $minute = (int) $m[2];
            $meridiem = strtoupper($m[3]);

            if ($meridiem === 'AM') {
                if ($hour === 12) $hour = 0;
            } else {
                if ($hour !== 12) $hour += 12;
            }

            return sprintf('%02d:%02d:00', $hour, $minute);
        }

        return null;
    }

    protected function findActiveTutorialForTutor($tutorInput, ?Tutors $tutor, Carbon $now, int $graceMinutes = 0): array
    {
        return $this->findActiveTutorialForTutorWithGrace($tutorInput, $tutor, $now, $graceMinutes);
    }

    protected function findActiveTutorialForTutorWithGrace($tutorInput, ?Tutors $tutor, Carbon $now, int $graceMinutes): array
    {
        $tutorIds = $this->tutorIdentifiersForQuery($tutorInput, $tutor);
        if (empty($tutorIds)) return [null, null];

        $today = $now->toDateString();
        $dayName = $now->format('l'); // Monday...
        $nowMinutes = ((int) $now->format('H')) * 60 + (int) $now->format('i');

        $candidates = Tutorials::query()
            ->whereIn('tutorid', $tutorIds)
            ->whereNotIn('status', ['Cancelled', 'Completed'])
            ->where(function ($q) use ($today) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', $today);
            })
            ->where(function ($q) use ($today) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', $today);
            })
            ->get();

        $best = null;
        $bestSchedule = null;
        $bestRank = null;

        foreach ($candidates as $tutorial) {
            $schedules = $this->safeSchedules($tutorial->tutorial_schedule);
            if (empty($schedules)) continue;

            foreach ($schedules as $s) {
                if (!is_array($s)) {
                    if (is_object($s)) {
                        $s = (array) $s;
                    } else {
                        continue;
                    }
                }
                $daysRaw = $s['days'] ?? null;
                if (is_string($daysRaw)) {
                    $daysRaw = preg_split('/[,\/]/', $daysRaw) ?: [];
                }
                $daysRaw = is_array($daysRaw) ? $daysRaw : [];
                $days = $this->normalizeDays($daysRaw);
                if (!in_array($dayName, $days, true)) continue;

                $startMin = $this->timeToMinutes($s['start_time'] ?? null);
                $endMin = $this->timeToMinutes($s['end_time'] ?? null);
                if ($startMin === null || $endMin === null) continue;

                // If the scheduled time has already passed (end time), do not allow time-in.
                // This intentionally allows clock-in earlier than the start time as long as
                // the session for today has not yet ended.
                if ($nowMinutes >= $endMin) continue;

                // Prefer the most relevant schedule:
                // - If currently in-session, pick the one ending soonest.
                // - If before start, pick the one starting soonest.
                $rank = ($nowMinutes >= $startMin) ? $endMin : $startMin;

                if ($bestRank === null || $rank < $bestRank) {
                    $best = $tutorial;
                    $bestSchedule = $s;
                    $bestRank = $rank;
                }
            }
        }

        return [$best, $bestSchedule];
    }

    protected function safeSchedules($raw): array
    {
        if (empty($raw)) return [];

        if (is_object($raw)) {
            $raw = (array) $raw;
        }

        if (is_string($raw)) {
            try {
                $decoded = json_decode($raw, true, flags: JSON_THROW_ON_ERROR);
                $raw = $decoded;
            } catch (\Throwable $e) {
                return [];
            }
        }

        if (!is_array($raw)) return [];

        // Accept either a list of schedules OR a single schedule object.
        if (array_is_list($raw)) return $raw;
        if (isset($raw['days']) || isset($raw['start_time']) || isset($raw['end_time'])) return [$raw];

        return [];
    }

    protected function normalizeDays(array $days): array
    {
        $out = [];
        foreach ($days as $d) {
            if (!is_string($d)) continue;
            $n = $this->normalizeDay($d);
            if ($n) $out[] = $n;
        }
        return array_values(array_unique($out));
    }

    protected function normalizeDay(string $day): ?string
    {
        $key = strtolower(trim($day));
        $map = [
            'mon' => 'Monday',
            'monday' => 'Monday',
            'tue' => 'Tuesday',
            'tues' => 'Tuesday',
            'tuesday' => 'Tuesday',
            'wed' => 'Wednesday',
            'wednesday' => 'Wednesday',
            'thu' => 'Thursday',
            'thur' => 'Thursday',
            'thurs' => 'Thursday',
            'thursday' => 'Thursday',
            'fri' => 'Friday',
            'friday' => 'Friday',
            'sat' => 'Saturday',
            'saturday' => 'Saturday',
            'sun' => 'Sunday',
            'sunday' => 'Sunday',
        ];

        return $map[$key] ?? null;
    }

    protected function timeToMinutes($time): ?int
    {
        if (empty($time) || !is_string($time)) return null;
        try {
            $dt = Carbon::parse($time);
            return ((int) $dt->format('H')) * 60 + (int) $dt->format('i');
        } catch (\Throwable $e) {
            return null;
        }
    }

    protected function formatDateYmd($value): ?string
    {
        try {
            $date = null;

            if ($value instanceof \DateTimeInterface) {
                $date = Carbon::instance($value);
            } elseif (is_string($value) && $value !== '') {
                $date = Carbon::parse($value);
            }

            return $date?->format('Y-m-d');
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Display attendance logs (same as index but with separate route).
     */
    public function logs()
    {
        Tutorials::autoCompletePastEndDate($this->localTimezone());

        $attendances = Attendance::orderBy('id', 'desc')->get()->map(function ($a) {
            $student = null;
            if (!empty($a->studentid)) {
                if (is_numeric($a->studentid)) {
                    $student = Students::find($a->studentid);
                }
                if (!$student) {
                    $student = Students::where('tuteeid', (string) $a->studentid)->first();
                }
            }

            $tutor = null;
            if (!empty($a->tutorid)) {
                if (is_numeric($a->tutorid)) {
                    $tutor = Tutors::find($a->tutorid);
                }
                if (!$tutor) {
                    $tutor = Tutors::where('tutorid', (string) $a->tutorid)->first();
                }
            }

            return [
                'id' => $a->id,
                'tutorialid' => $a->tutorialid,
                'date' => $this->formatDateYmd($a->date),
                'time_in' => $a->time_in,
                'time_out' => $a->time_out,
                'studentid' => $a->studentid,
                'tutorid' => $a->tutorid,
                'student_name' => $student ? trim(($student->firstname ?? '') . ' ' . ($student->lastname ?? '')) : null,
                'tutor_name' => $tutor ? trim(($tutor->firstname ?? '') . ' ' . ($tutor->lastname ?? '')) : null,
            ];
        });

        return Inertia::render('attendance/logs', [
            'attendances' => $attendances,
        ]);
    }

    /**
     * Display daily time records with filters.
     */
    public function dailyTimeRecords()
    {
        Tutorials::autoCompletePastEndDate($this->localTimezone());

        $attendances = Attendance::orderBy('date', 'desc')->orderBy('id', 'desc')->get()->map(function ($a) {
            $student = null;
            if (!empty($a->studentid)) {
                if (is_numeric($a->studentid)) {
                    $student = Students::find($a->studentid);
                }
                if (!$student) {
                    $student = Students::where('tuteeid', (string) $a->studentid)->first();
                }
            }

            $tutor = null;
            if (!empty($a->tutorid)) {
                if (is_numeric($a->tutorid)) {
                    $tutor = Tutors::find($a->tutorid);
                }
                if (!$tutor) {
                    $tutor = Tutors::where('tutorid', (string) $a->tutorid)->first();
                }
            }

            return [
                'id' => $a->id,
                'tutorialid' => $a->tutorialid,
                'date' => $this->formatDateYmd($a->date),
                'time_in' => $a->time_in,
                'time_out' => $a->time_out,
                'studentid' => $a->studentid,
                'tutorid' => $a->tutorid,
                'tutor_id' => is_numeric($a->tutorid) ? (int) $a->tutorid : null,
                'student_name' => $student ? trim(($student->firstname ?? '') . ' ' . ($student->lastname ?? '')) : null,
                'tutor_name' => $tutor ? trim(($tutor->firstname ?? '') . ' ' . ($tutor->lastname ?? '')) : null,
            ];
        });

        $tutors = Tutors::orderBy('lastname')->get()->map(function ($t) {
            return [
                'id' => $t->id,
                'name' => trim(($t->firstname ?? '') . ' ' . ($t->lastname ?? '')),
            ];
        });

        return Inertia::render('attendance/daily-time-records', [
            'attendances' => $attendances,
            'tutors' => $tutors,
        ]);
    }

    /**
     * Generate DTR PDF report with optional filters.
     */
    public function dtrPdf(Request $request)
    {
        Tutorials::autoCompletePastEndDate($this->localTimezone());

        $tutor = $request->query('tutor');
        $startDate = $request->query('startDate');
        $endDate = $request->query('endDate');

        $attendances = Attendance::orderBy('date', 'asc')->orderBy('id', 'asc')->get()->map(function ($a) {
            $student = null;
            if (!empty($a->studentid)) {
                if (is_numeric($a->studentid)) {
                    $student = Students::find($a->studentid);
                }
                if (!$student) {
                    $student = Students::where('tuteeid', (string) $a->studentid)->first();
                }
            }

            $tutorObj = null;
            if (!empty($a->tutorid)) {
                if (is_numeric($a->tutorid)) {
                    $tutorObj = Tutors::find($a->tutorid);
                }
                if (!$tutorObj) {
                    $tutorObj = Tutors::where('tutorid', (string) $a->tutorid)->first();
                }
            }

            // Get tutorial and tutor fee
            $tutorial = null;
            $tutorFee = 0;
            if (!empty($a->tutorialid)) {
                $tutorial = Tutorials::where('tutorialid', $a->tutorialid)->first();
                if ($tutorial && !empty($tutorial->education_level)) {
                    // Get tutor fee based on education level
                    $feeKey = match ($tutorial->education_level) {
                        'Elementary' => 'tutor_fee_elementary',
                        'JHS' => 'tutor_fee_jhs',
                        'SHS' => 'tutor_fee_shs',
                        default => null,
                    };
                    
                    if ($feeKey) {
                        $tutorFee = floatval(AppSetting::where('key', $feeKey)->value('value') ?? 0);
                    }
                }
            }

            // Calculate hours worked
            $hours = $this->calculateHours($a->time_in, $a->time_out);

            return [
                'id' => $a->id,
                'tutorialid' => $a->tutorialid,
                'date' => $a->date ? $a->date->format('Y-m-d') : null,
                'time_in' => $a->time_in,
                'time_out' => $a->time_out,
                'hours' => $hours,
                'tutor_fee' => $tutorFee,
                'amount' => $hours * $tutorFee,
                'studentid' => $a->studentid,
                'tutorid' => $a->tutorid,
                'tutor_id' => is_numeric($a->tutorid) ? (int) $a->tutorid : null,
                'student_name' => $student ? trim(($student->firstname ?? '') . ' ' . ($student->lastname ?? '')) : null,
                'tutor_name' => $tutorObj ? trim(($tutorObj->firstname ?? '') . ' ' . ($tutorObj->lastname ?? '')) : null,
            ];
        });

        // Apply filters
        if ($tutor) {
            $attendances = $attendances->filter(function ($a) use ($tutor) {
                return $a['tutor_name'] === $tutor;
            });
        }

        if ($startDate) {
            $attendances = $attendances->filter(function ($a) use ($startDate) {
                return $a['date'] >= $startDate;
            });
        }

        if ($endDate) {
            $attendances = $attendances->filter(function ($a) use ($endDate) {
                return $a['date'] <= $endDate;
            });
        }

        $attendances = $attendances->values();

        // Calculate summary
        $totalHours = $attendances->sum('hours');
        $totalAmount = $attendances->sum('amount');
        $averageTutorFee = $attendances->count() > 0 
            ? $attendances->where('tutor_fee', '>', 0)->avg('tutor_fee') 
            : 0;

        $html = view('attendance.dtr-pdf', [
            'attendances' => $attendances,
            'tutor' => $tutor,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'totalHours' => $totalHours,
            'totalAmount' => $totalAmount,
            'averageTutorFee' => $averageTutorFee,
        ])->render();

        $pdf = Pdf::loadHTML($html);
        $filename = 'DTR_' . ($tutor ? str_replace(' ', '_', $tutor) . '_' : '') . date('Y-m-d_His') . '.pdf';

        return $pdf->stream($filename);
    }

    /**
     * Calculate hours between two time strings (HH:MM format)
     */
    private function calculateHours(?string $timeIn, ?string $timeOut): float
    {
        if (!$timeIn || !$timeOut) {
            return 0;
        }

        // Parse time strings to total minutes
        $inMinutes = $this->timeStringToMinutes($timeIn);
        $outMinutes = $this->timeStringToMinutes($timeOut);

        if ($inMinutes === null || $outMinutes === null) {
            return 0;
        }

        // Handle case where time_out is on the next day (time_out < time_in)
        if ($outMinutes < $inMinutes) {
            $outMinutes += 24 * 60; // Add 24 hours
        }

        $diffMinutes = $outMinutes - $inMinutes;
        return round($diffMinutes / 60); // Convert to hours and round to whole number
    }

    /**
     * Convert HH:MM or HH:MM:SS time string to total minutes
     */
    private function timeStringToMinutes(?string $time): ?int
    {
        if (!$time) {
            return null;
        }

        $time = trim($time);
        if (!$time) {
            return null;
        }

        // Match HH:MM or HH:MM:SS format
        if (preg_match('/^(\d{1,2}):(\d{2})(?::\d{2})?$/', $time, $matches)) {
            $hh = intval($matches[1]);
            $mm = intval($matches[2]);

            if ($hh < 0 || $hh > 23 || $mm < 0 || $mm > 59) {
                return null;
            }

            return $hh * 60 + $mm;
        }

        return null;
    }

}
