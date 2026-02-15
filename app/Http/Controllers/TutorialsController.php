<?php

namespace App\Http\Controllers;

use App\Models\Tutorials;
use App\Models\Students;
use App\Models\Tutors;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Crypt;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;


class TutorialsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        Tutorials::autoCompletePastEndDate('Asia/Manila');

        $tutorials = Tutorials::orderBy('id','desc')->get()->map(function ($t) {
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
                'tutorial_schedule' => $t->tutorial_schedule,
                'start_date' => !empty($t->start_date) ? Carbon::parse($t->start_date)->format('Y-m-d') : null,
                'end_date' => !empty($t->end_date) ? Carbon::parse($t->end_date)->format('Y-m-d') : null,
                'status' => $t->status,
                'student_name' => $student ? trim(($student->firstname ?? '') . ' ' . ($student->lastname ?? '')) : null,
                'tutor_name' => $tutor ? trim(($tutor->firstname ?? '') . ' ' . ($tutor->lastname ?? '')) : null,
                'encrypted_id' => Crypt::encryptString($t->id),
            ];
        });

        return Inertia::render('tutorials', [
            'tutorials' => $tutorials,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        // load tutors with their tutorials so the create page can compute availability
        $tutors = Tutors::with(['tutorials'])->orderBy('lastname')->get()->map(function ($t) {
            // map tutorials to include tutorial_schedule and studentid
            $tutorials = $t->tutorials->map(function ($tr) {
                return [
                    'id' => $tr->id,
                    'studentid' => $tr->studentid,
                    'tutorial_schedule' => $tr->tutorial_schedule ?? null,
                    'start_date' => $tr->start_date,
                    'end_date' => $tr->end_date,
                ];
            });

            return [
                'id' => $t->id,
                'tutorid' => $t->tutorid,
                'firstname' => $t->firstname,
                'lastname' => $t->lastname,
                'tutorials' => $tutorials,
                'encrypted_id' => $t->encrypted_id ?? null,
            ];
        });

        $student = null;
        $studentId = $request->query('student');
        if (!empty($studentId)) {
            // accept numeric id or tuteeid
            if (is_numeric($studentId)) {
                $student = Students::find($studentId);
            } else {
                $student = Students::where('tuteeid', $studentId)->first();
            }
        }

        // provide student suggestions for the create page
        $students = Students::orderBy('lastname')->get()->map(function ($s) {
            return [
                'id' => $s->id,
                'tuteeid' => $s->tuteeid,
                'firstname' => $s->firstname,
                'lastname' => $s->lastname,
                'encrypted_id' => $s->encrypted_id ?? null,
            ];
        });

        // Load default rates from settings for UI display
        $defaultRateSecondary = \App\Models\AppSetting::where('key', 'default_rate_secondary')->value('value');
        $defaultRateGradeSchool = \App\Models\AppSetting::where('key', 'default_rate_grade_school')->value('value');

        return Inertia::render('tutorials/create', [
            'tutors' => $tutors,
            'student' => $student,
            'students' => $students,
            'default_rate_secondary' => $defaultRateSecondary !== null ? (string)$defaultRateSecondary : '',
            'default_rate_grade_school' => $defaultRateGradeSchool !== null ? (string)$defaultRateGradeSchool : '',
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'studentid' => 'required',
            'tutorid' => 'required',
            'education_level' => 'nullable|string|in:JHS,SHS,Elementary',
            'grade_level' => 'nullable|string|max:255',
            'start_date' => 'required_with:schedules|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'nullable|string',
            'tutorialid' => 'nullable|string|unique:tutorials,tutorialid',
            'schedules' => 'nullable|array|max:5',
            'schedules.*.days' => 'required_with:schedules|array|min:1',
            'schedules.*.days.*' => 'string',
            'schedules.*.start_time' => 'required_with:schedules|string',
            'schedules.*.end_time' => 'required_with:schedules|string',
            'billing_type' => 'nullable|string|in:per-session,prepaid-package',
            'prepaid_amount' => 'nullable|numeric|min:0',
            'override_availability' => 'nullable|boolean',
        ]);

        // Map incoming schedules to tutorial_schedule column and normalize times
        if (!empty($validated['schedules'])) {
            $normalized = [];
            foreach ($validated['schedules'] as $s) {
                $entry = [];
                $entry['days'] = $s['days'] ?? [];

                // Normalize start_time
                $entry['start_time'] = null;
                if (!empty($s['start_time'])) {
                    try {
                        $dt = Carbon::parse($s['start_time']);
                        $entry['start_time'] = $dt->format('H:i');
                    } catch (\Throwable $e) {
                        $entry['start_time'] = $s['start_time'];
                    }
                }

                // Normalize end_time
                $entry['end_time'] = null;
                if (!empty($s['end_time'])) {
                    try {
                        $dt = Carbon::parse($s['end_time']);
                        $entry['end_time'] = $dt->format('H:i');
                    } catch (\Throwable $e) {
                        $entry['end_time'] = $s['end_time'];
                    }
                }

                $normalized[] = $entry;
            }

            $validated['tutorial_schedule'] = $normalized;
        } else {
            $validated['tutorial_schedule'] = null;
        }

        // Remove the schedules key so it doesn't try to fill a non-existent column
        unset($validated['schedules']);

        // Validate billing type and prepaid amount
        if (!isset($validated['billing_type']) || !$validated['billing_type']) {
            $validated['billing_type'] = 'per-session';
        }

        if ($validated['billing_type'] === 'prepaid-package') {
            if (empty($validated['prepaid_amount'])) {
                throw ValidationException::withMessages([
                    'prepaid_amount' => 'Prepaid amount is required when billing type is prepaid package.',
                ]);
            }
            $validated['prepaid_amount'] = (float) $validated['prepaid_amount'];
        } else {
            $validated['prepaid_amount'] = null;
        }

        // Only validate tutor availability if override is not enabled
        if (!($validated['override_availability'] ?? false)) {
            $this->assertTutorAvailable(
                $validated['tutorid'],
                $validated['tutorial_schedule'] ?? null,
                $validated['start_date'] ?? null,
                $validated['end_date'] ?? null,
                null
            );
        }

        // Determine rate based on education/grade level using saved defaults
        $secondaryDefault = \App\Models\AppSetting::where('key', 'default_rate_secondary')->value('value');
        $gradeSchoolDefault = \App\Models\AppSetting::where('key', 'default_rate_grade_school')->value('value');

        if (!empty($validated['education_level']) && !empty($validated['grade_level'])) {
            if ($validated['education_level'] === 'JHS' || $validated['education_level'] === 'SHS') {
                $validated['rate_secondary'] = $secondaryDefault !== null ? (float) $secondaryDefault : null;
                $validated['rate_grade_school'] = null;
            } elseif ($validated['education_level'] === 'Elementary') {
                $validated['rate_grade_school'] = $gradeSchoolDefault !== null ? (float) $gradeSchoolDefault : null;
                $validated['rate_secondary'] = null;
            }
        }

        // Remove override_availability flag before saving (not a database column)
        unset($validated['override_availability']);

        // Let the model generate `tutorialid` if not provided.
        $tutorial = Tutorials::create($validated);

        return redirect()->route('tutorials.show', ['tutorials' => Crypt::encryptString($tutorial->id)]);
    }

    /**
     * Display the specified resource.
     */
    public function show($encrypted)
    {
        Tutorials::autoCompletePastEndDate('Asia/Manila');

        try {
            $id = Crypt::decryptString($encrypted);
        } catch (\Throwable $e) {
            abort(404);
        }

        $t = Tutorials::findOrFail($id);

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

        // Load schedules: prefer tutorial_schedule column, fallback to storage file
        $schedules = null;
        if (!empty($t->tutorial_schedule)) {
            $schedules = $t->tutorial_schedule;
        } else {
            try {
                $path = 'tutorial_schedules/' . ($t->tutorialid ?? $t->id) . '.json';
                if (\Illuminate\Support\Facades\Storage::exists($path)) {
                    $content = \Illuminate\Support\Facades\Storage::get($path);
                    $decoded = json_decode($content, true);
                    if (is_array($decoded)) $schedules = $decoded;
                }
            } catch (\Throwable $e) {
                // ignore
            }
        }

        $tutorial = [
            'id' => $t->id,
            'tutorialid' => $t->tutorialid,
            'studentid' => $t->studentid,
            'tutorid' => $t->tutorid,
            'start_date' => $t->start_date,
            'end_date' => $t->end_date,
            'status' => $t->status,
            'education_level' => $t->education_level,
            'grade_level' => $t->grade_level,
            'rate_secondary' => $t->rate_secondary,
            'rate_grade_school' => $t->rate_grade_school,
            'tutorial_schedule' => $schedules,
            'billing_type' => $t->billing_type ?? 'per-session',
            'prepaid_amount' => $t->prepaid_amount,
            'total_prepaid_hours' => $t->getTotalPrepaidHours(),
            'remaining_prepaid_hours' => $t->getRemainingPrepaidHours(),
            'student_name' => $student ? trim(($student->firstname ?? '') . ' ' . ($student->lastname ?? '')) : null,
            'tutor_name' => $tutor ? trim(($tutor->firstname ?? '') . ' ' . ($tutor->lastname ?? '')) : null,
            'encrypted_id' => Crypt::encryptString($t->id),
        ];

        $attendances = Attendance::query()
            ->where('tutorialid', (string) ($t->tutorialid ?? ''))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->get()
            ->map(function (Attendance $a) {
                return [
                    'id' => $a->id,
                    'date' => $a->date,
                    'time_in' => $a->time_in,
                    'time_out' => $a->time_out,
                    'tutorid' => $a->tutorid,
                    'studentid' => $a->studentid,
                ];
            });

        return Inertia::render('tutorials/show', [
            'tutorial' => $tutorial,
            'attendances' => $attendances,
        ]);
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

        $t = Tutorials::findOrFail($id);

        // load tutors with their tutorials so the edit page can compute availability (same shape as create)
        $tutors = Tutors::with(['tutorials'])->orderBy('lastname')->get()->map(function ($tutor) {
            $tutorials = $tutor->tutorials->map(function ($tr) {
                return [
                    'id' => $tr->id,
                    'studentid' => $tr->studentid,
                    'tutorial_schedule' => $tr->tutorial_schedule ?? null,
                    'start_date' => $tr->start_date,
                    'end_date' => $tr->end_date,
                ];
            });

            return [
                'id' => $tutor->id,
                'tutorid' => $tutor->tutorid,
                'firstname' => $tutor->firstname,
                'lastname' => $tutor->lastname,
                'tutorials' => $tutorials,
                'encrypted_id' => $tutor->encrypted_id ?? null,
            ];
        });

        $students = Students::orderBy('lastname')->get()->map(function ($s) {
            return [
                'id' => $s->id,
                'tuteeid' => $s->tuteeid,
                'firstname' => $s->firstname,
                'lastname' => $s->lastname,
                'encrypted_id' => $s->encrypted_id ?? null,
            ];
        });

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

        // Load schedules: prefer tutorial_schedule column, fallback to storage file
        $schedules = null;
        if (!empty($t->tutorial_schedule)) {
            $schedules = $t->tutorial_schedule;
        } else {
            try {
                $path = 'tutorial_schedules/' . ($t->tutorialid ?? $t->id) . '.json';
                if (\Illuminate\Support\Facades\Storage::exists($path)) {
                    $content = \Illuminate\Support\Facades\Storage::get($path);
                    $decoded = json_decode($content, true);
                    if (is_array($decoded)) $schedules = $decoded;
                }
            } catch (\Throwable $e) {
                // ignore
            }
        }

        $tutorial = [
            'id' => $t->id,
            'tutorialid' => $t->tutorialid,
            'studentid' => $t->studentid,
            'tutorid' => $t->tutorid,
            'start_date' => !empty($t->start_date) ? Carbon::parse($t->start_date)->format('Y-m-d') : null,
            'end_date' => !empty($t->end_date) ? Carbon::parse($t->end_date)->format('Y-m-d') : null,
            'status' => $t->status,
            'education_level' => $t->education_level,
            'grade_level' => $t->grade_level,
            'rate_secondary' => $t->rate_secondary,
            'rate_grade_school' => $t->rate_grade_school,
            'tutorial_schedule' => $schedules,
            'billing_type' => $t->billing_type ?? 'per-session',
            'prepaid_amount' => $t->prepaid_amount,
            'student_name' => $student ? trim(($student->firstname ?? '') . ' ' . ($student->lastname ?? '')) : null,
            'tutor_name' => $tutor ? trim(($tutor->firstname ?? '') . ' ' . ($tutor->lastname ?? '')) : null,
            'encrypted_id' => Crypt::encryptString($t->id),
        ];

        return Inertia::render('tutorials/edit', [
            'tutorial' => $tutorial,
            'tutors' => $tutors,
            'students' => $students,
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

        $tutorials = Tutorials::findOrFail($id);

        $validated = $request->validate([
            'studentid' => 'required',
            'tutorid' => 'required',
            'education_level' => 'nullable|string|in:JHS,SHS,Elementary',
            'grade_level' => 'nullable|string|max:255',
            'start_date' => 'required_with:schedules|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'nullable|string',
            'schedules' => 'nullable|array|max:5',
            'schedules.*.days' => 'required_with:schedules|array|min:1',
            'schedules.*.days.*' => 'string',
            'schedules.*.start_time' => 'required_with:schedules|string',
            'schedules.*.end_time' => 'required_with:schedules|string',
            'rate_secondary' => 'nullable|numeric',
            'rate_grade_school' => 'nullable|numeric',
            'billing_type' => 'nullable|string|in:per-session,prepaid-package',
            'prepaid_amount' => 'nullable|numeric|min:0',
            'override_availability' => 'nullable|boolean',
        ]);

        if (!empty($validated['schedules'])) {
            $normalized = [];
            foreach ($validated['schedules'] as $s) {
                $entry = [];
                $entry['days'] = $s['days'] ?? [];

                $entry['start_time'] = null;
                if (!empty($s['start_time'])) {
                    try {
                        $dt = Carbon::parse($s['start_time']);
                        $entry['start_time'] = $dt->format('H:i');
                    } catch (\Throwable $e) {
                        $entry['start_time'] = $s['start_time'];
                    }
                }

                $entry['end_time'] = null;
                if (!empty($s['end_time'])) {
                    try {
                        $dt = Carbon::parse($s['end_time']);
                        $entry['end_time'] = $dt->format('H:i');
                    } catch (\Throwable $e) {
                        $entry['end_time'] = $s['end_time'];
                    }
                }

                $normalized[] = $entry;
            }

            $validated['tutorial_schedule'] = $normalized;
        }
        unset($validated['schedules']);

        // Validate billing type and prepaid amount
        if (!isset($validated['billing_type']) || !$validated['billing_type']) {
            $validated['billing_type'] = $tutorials->billing_type ?? 'per-session';
        }

        if ($validated['billing_type'] === 'prepaid-package') {
            if (empty($validated['prepaid_amount'])) {
                throw ValidationException::withMessages([
                    'prepaid_amount' => 'Prepaid amount is required when billing type is prepaid package.',
                ]);
            }
            $validated['prepaid_amount'] = (float) $validated['prepaid_amount'];
        } else {
            $validated['prepaid_amount'] = null;
        }

        // Only validate tutor availability if override is not enabled
        if (!($validated['override_availability'] ?? false)) {
            $this->assertTutorAvailable(
                $validated['tutorid'],
                $validated['tutorial_schedule'] ?? null,
                $validated['start_date'] ?? null,
                $validated['end_date'] ?? null,
                $tutorials->id
            );
        }

        // Recompute rate when education/grade changes
        // Accept the rate from the form if provided, otherwise fallback to default logic
        if (!empty($validated['education_level']) && !empty($validated['grade_level'])) {
            if ($validated['education_level'] === 'JHS' || $validated['education_level'] === 'SHS') {
                if (!isset($validated['rate_secondary'])) {
                    $secondaryDefault = \App\Models\AppSetting::where('key', 'default_rate_secondary')->value('value');
                    $validated['rate_secondary'] = $secondaryDefault !== null ? (float) $secondaryDefault : null;
                }
                $validated['rate_grade_school'] = null;
            } elseif ($validated['education_level'] === 'Elementary') {
                if (!isset($validated['rate_grade_school'])) {
                    $gradeSchoolDefault = \App\Models\AppSetting::where('key', 'default_rate_grade_school')->value('value');
                    $validated['rate_grade_school'] = $gradeSchoolDefault !== null ? (float) $gradeSchoolDefault : null;
                }
                $validated['rate_secondary'] = null;
            }
        }

        // Remove override_availability flag before saving (not a database column)
        unset($validated['override_availability']);

        $tutorials->update($validated);

        return redirect()->route('tutorials.show', ['tutorials' => Crypt::encryptString($tutorials->id)]);
    }

    protected function assertTutorAvailable($tutorId, $tutorialSchedule, $startDate, $endDate, $ignoreTutorialId = null): void
    {
        if (empty($tutorId)) return;

        $schedules = is_array($tutorialSchedule) ? $tutorialSchedule : [];
        if (empty($schedules)) return;

        $rangeStart = null;
        try {
            $rangeStart = !empty($startDate) ? Carbon::parse($startDate)->startOfDay() : Carbon::today()->startOfDay();
        } catch (\Throwable $e) {
            $rangeStart = Carbon::today()->startOfDay();
        }

        $rangeEnd = null;
        try {
            $rangeEnd = !empty($endDate) ? Carbon::parse($endDate)->endOfDay() : Carbon::create(9999, 12, 31, 23, 59, 59);
        } catch (\Throwable $e) {
            $rangeEnd = Carbon::create(9999, 12, 31, 23, 59, 59);
        }

        if ($rangeEnd->lt($rangeStart)) {
            throw ValidationException::withMessages([
                'end_date' => 'End date must be on or after the start date.',
            ]);
        }

        $existingQuery = Tutorials::query()->where('tutorid', $tutorId);
        if (!empty($ignoreTutorialId)) {
            $existingQuery->where('id', '!=', $ignoreTutorialId);
        }

        // Coarse date-range overlap filter
        $existingQuery
            ->where(function ($q) use ($rangeStart) {
                $q->whereNull('end_date')
                    ->orWhere('end_date', '>=', $rangeStart->toDateString());
            })
            ->where(function ($q) use ($rangeEnd) {
                $q->whereNull('start_date')
                    ->orWhere('start_date', '<=', $rangeEnd->toDateString());
            });

        $existingTutorials = $existingQuery->get();

        foreach ($existingTutorials as $existing) {
            $existingSchedules = is_array($existing->tutorial_schedule) ? $existing->tutorial_schedule : [];
            if (empty($existingSchedules)) continue;

            $existingStart = null;
            try {
                $existingStart = !empty($existing->start_date) ? Carbon::parse($existing->start_date)->startOfDay() : Carbon::today()->startOfDay();
            } catch (\Throwable $e) {
                $existingStart = Carbon::today()->startOfDay();
            }

            $existingEnd = null;
            try {
                $existingEnd = !empty($existing->end_date) ? Carbon::parse($existing->end_date)->endOfDay() : Carbon::create(9999, 12, 31, 23, 59, 59);
            } catch (\Throwable $e) {
                $existingEnd = Carbon::create(9999, 12, 31, 23, 59, 59);
            }

            $overlapStart = $rangeStart->copy();
            if ($existingStart->gt($overlapStart)) {
                $overlapStart = $existingStart->copy();
            }

            $overlapEnd = $rangeEnd->copy();
            if ($existingEnd->lt($overlapEnd)) {
                $overlapEnd = $existingEnd->copy();
            }
            if ($overlapEnd->lt($overlapStart)) continue;

            foreach ($schedules as $s) {
                $newDays = $this->normalizeDays($s['days'] ?? []);
                $newStartMin = $this->timeToMinutes($s['start_time'] ?? null);
                $newEndMin = $this->timeToMinutes($s['end_time'] ?? null);
                if (empty($newDays) || $newStartMin === null || $newEndMin === null) continue;

                foreach ($existingSchedules as $es) {
                    $existingDays = $this->normalizeDays($es['days'] ?? []);
                    $existingStartMin = $this->timeToMinutes($es['start_time'] ?? null);
                    $existingEndMin = $this->timeToMinutes($es['end_time'] ?? null);
                    if (empty($existingDays) || $existingStartMin === null || $existingEndMin === null) continue;

                    $dayIntersection = array_values(array_intersect($newDays, $existingDays));
                    if (empty($dayIntersection)) continue;

                    // time overlap: [a,b) intersects [c,d)
                    if (max($newStartMin, $existingStartMin) >= min($newEndMin, $existingEndMin)) continue;

                    foreach ($dayIntersection as $day) {
                        $dayConst = $this->dayToCarbonConst($day);
                        if ($dayConst === null) continue;

                        // Only consider it a conflict if that day occurs within the overlapping date range.
                        // Older Carbon versions may not have nextOrSame(), so calculate manually.
                        $startDow = (int) $overlapStart->dayOfWeek; // 0 (Sun) .. 6 (Sat)
                        $targetDow = (int) $dayConst;
                        $deltaDays = ($targetDow - $startDow + 7) % 7;
                        $occurrence = $overlapStart->copy()->addDays($deltaDays);
                        if ($occurrence->gt($overlapEnd)) continue;

                        throw ValidationException::withMessages([
                            'tutorid' => 'Tutor is already scheduled on ' . $day . ' at ' . ($s['start_time'] ?? '') . '–' . ($s['end_time'] ?? '') . ' during the selected date range.',
                        ]);
                    }
                }
            }
        }
    }

    protected function timeToMinutes($time): ?int
    {
        if (empty($time) || !is_string($time)) return null;
        try {
            $dt = Carbon::parse($time);
            return ((int)$dt->format('H')) * 60 + (int)$dt->format('i');
        } catch (\Throwable $e) {
            return null;
        }
    }

    protected function normalizeDays($days): array
    {
        if (!is_array($days)) return [];
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

        $out = [];
        foreach ($days as $d) {
            if (!is_string($d)) continue;
            $key = strtolower(trim($d));
            if (isset($map[$key])) $out[] = $map[$key];
        }

        return array_values(array_unique($out));
    }

    protected function dayToCarbonConst(string $day): ?int
    {
        return match ($day) {
            'Monday' => Carbon::MONDAY,
            'Tuesday' => Carbon::TUESDAY,
            'Wednesday' => Carbon::WEDNESDAY,
            'Thursday' => Carbon::THURSDAY,
            'Friday' => Carbon::FRIDAY,
            'Saturday' => Carbon::SATURDAY,
            'Sunday' => Carbon::SUNDAY,
            default => null,
        };
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

        $tutorials = Tutorials::findOrFail($id);
        $tutorials->delete();
        return redirect()->route('tutorials');
    }
}
