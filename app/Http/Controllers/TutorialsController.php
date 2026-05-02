<?php

namespace App\Http\Controllers;

use App\Models\Tutorials;
use App\Models\Students;
use App\Models\Tutors;
use App\Models\Attendance;
use App\Models\Packages;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;


class TutorialsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        if (!Schema::hasTable('tutorials')) {
            return Inertia::render('tutorials', [
                'tutorials' => [],
            ]);
        }

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

        $packages = Packages::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get()
            ->map(function (Packages $p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'type' => $p->type,
                    'level' => $p->level,
                    'duration_hours' => $p->duration_hours,
                    'tutee_fee_amount' => $p->tutee_fee_amount,
                    'tutor_fee_amount' => $p->tutor_fee_amount,
                    'status' => $p->status,
                ];
            });

        return Inertia::render('tutorials/create', [
            'tutors' => $tutors,
            'student' => $student,
            'students' => $students,
            'packages' => $packages,
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
            'packageid' => 'required|integer|exists:package,id',
            'start_date' => 'required_with:schedules|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'nullable|string',
            'tutorialid' => 'nullable|string|unique:tutorials,tutorialid',
            'schedules' => 'nullable|array|max:5',
            'schedules.*.days' => 'required_with:schedules|array|min:1',
            'schedules.*.days.*' => 'string',
            'schedules.*.start_time' => 'required_with:schedules|string',
            'schedules.*.end_time' => 'required_with:schedules|string',
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

        $package = Packages::query()
            ->where('status', 'active')
            ->findOrFail((int) $validated['packageid']);

        $packageType = strtolower((string) ($package->type ?? ''));
        $durationHours = (int) ($package->duration_hours ?? 0);
        $isPromotional = str_contains($packageType, 'promo');
        $isPrepaid = str_contains($packageType, 'prepaid') || str_contains($packageType, 'pre-paid');

        // Always derive these values server-side from the selected package.
        $validated['level'] = $package->level;
        $validated['tutee_fee_amount'] = $package->tutee_fee_amount;
        $validated['tutor_fee_amount'] = $package->tutor_fee_amount;

        if ($isPrepaid || $isPromotional) {
            if (!isset($validated['prepaid_amount']) || $validated['prepaid_amount'] === '' || $validated['prepaid_amount'] === null) {
                throw ValidationException::withMessages([
                    'prepaid_amount' => 'Prepaid amount is required for prepaid/promotional packages.',
                ]);
            }

            $validated['prepaid_amount'] = (float) $validated['prepaid_amount'];
            $validated['prepaid_hours'] = $durationHours > 0 ? (float) $durationHours : null;
            $validated['completed_hours'] = 0;
            $validated['remaining_hours'] = $validated['prepaid_hours'];
        } else {
            $validated['prepaid_amount'] = null;
            $validated['prepaid_hours'] = null;
            $validated['completed_hours'] = 0;
            $validated['remaining_hours'] = $durationHours > 0 ? (float) $durationHours : null;
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

        // Remove override_availability flag before saving (not a database column)
        unset($validated['override_availability']);

        // Let the model generate `tutorialid` if not provided.
        $tutorial = Tutorials::create($validated);
        $tutorial->syncHourCountersFromAttendanceWithAllowance($durationHours > 0 ? (float) $durationHours : null);

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

        $package = null;
        if (!empty($t->packageid)) {
            $package = Packages::query()->find($t->packageid);
        }

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

        $attendanceModels = Attendance::query()
            ->where('tutorialid', (string) ($t->tutorialid ?? ''))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->get();

        // Keep stored hour counters in sync with attendance.
        $durationAllowance = $package && !empty($package->duration_hours) ? (float) $package->duration_hours : null;
        $t->syncHourCountersFromAttendanceWithAllowance($durationAllowance);
        $t->refresh();

        $tutorial = [
            'id' => $t->id,
            'tutorialid' => $t->tutorialid,
            'studentid' => $t->studentid,
            'tutorid' => $t->tutorid,
            'start_date' => $t->start_date,
            'end_date' => $t->end_date,
            'status' => $t->status,
            'packageid' => $t->packageid,
            'package_name' => $package ? $package->name : null,
            'package_type' => $package ? $package->type : null,
            'duration_hours' => $package ? $package->duration_hours : null,
            'level' => $t->level,
            'tutee_fee_amount' => $t->tutee_fee_amount,
            'tutor_fee_amount' => $t->tutor_fee_amount,
            'prepaid_amount' => $t->prepaid_amount,
            'prepaid_hours' => $t->prepaid_hours,
            'completed_hours' => $t->completed_hours,
            'remaining_hours' => $t->remaining_hours,
            'tutorial_schedule' => $schedules,
            'total_prepaid_hours' => $t->getTotalPrepaidHours(),
            'remaining_prepaid_hours' => $t->getRemainingPrepaidHours(),
            'student_name' => $student ? trim(($student->firstname ?? '') . ' ' . ($student->lastname ?? '')) : null,
            'tutor_name' => $tutor ? trim(($tutor->firstname ?? '') . ' ' . ($tutor->lastname ?? '')) : null,
            'encrypted_id' => Crypt::encryptString($t->id),
        ];

        $attendances = $attendanceModels->map(function (Attendance $a) {
            return [
                'id' => $a->id,
                'date' => $a->date,
                'time_in' => $a->time_in,
                'time_out' => $a->time_out,
                'remarks' => $a->remarks,
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
                $packages = Packages::query()
                    ->where('status', 'active')
                    ->orderBy('name')
                    ->get()
                    ->map(function (Packages $p) {
                        return [
                            'id' => $p->id,
                            'name' => $p->name,
                            'type' => $p->type,
                            'level' => $p->level,
                            'duration_hours' => $p->duration_hours,
                            'tutee_fee_amount' => $p->tutee_fee_amount,
                            'tutor_fee_amount' => $p->tutor_fee_amount,
                            'status' => $p->status,
                        ];
                    });

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
            'packageid' => $t->packageid,
            'level' => $t->level,
            'tutee_fee_amount' => $t->tutee_fee_amount,
            'tutor_fee_amount' => $t->tutor_fee_amount,
            'prepaid_amount' => $t->prepaid_amount,
            'prepaid_hours' => $t->prepaid_hours,
            'completed_hours' => $t->completed_hours,
            'remaining_hours' => $t->remaining_hours,
            'tutorial_schedule' => $schedules,
            'student_name' => $student ? trim(($student->firstname ?? '') . ' ' . ($student->lastname ?? '')) : null,
            'tutor_name' => $tutor ? trim(($tutor->firstname ?? '') . ' ' . ($tutor->lastname ?? '')) : null,
            'encrypted_id' => Crypt::encryptString($t->id),
        ];

        return Inertia::render('tutorials/edit', [
            'tutorial' => $tutorial,
            'tutors' => $tutors,
            'students' => $students,
            'packages' => $packages,
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
            'packageid' => 'required|integer|exists:package,id',
            'start_date' => 'required_with:schedules|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'nullable|string',
            'schedules' => 'nullable|array|max:5',
            'schedules.*.days' => 'required_with:schedules|array|min:1',
            'schedules.*.days.*' => 'string',
            'schedules.*.start_time' => 'required_with:schedules|string',
            'schedules.*.end_time' => 'required_with:schedules|string',
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

        $package = Packages::query()
            ->where('status', 'active')
            ->findOrFail((int) $validated['packageid']);

        $packageType = strtolower((string) ($package->type ?? ''));
        $durationHours = (int) ($package->duration_hours ?? 0);
        $isPromotional = str_contains($packageType, 'promo');
        $isPrepaid = str_contains($packageType, 'prepaid') || str_contains($packageType, 'pre-paid');

        $validated['level'] = $package->level;
        $validated['tutee_fee_amount'] = $package->tutee_fee_amount;
        $validated['tutor_fee_amount'] = $package->tutor_fee_amount;

        if ($isPrepaid || $isPromotional) {
            if (!isset($validated['prepaid_amount']) || $validated['prepaid_amount'] === '' || $validated['prepaid_amount'] === null) {
                throw ValidationException::withMessages([
                    'prepaid_amount' => 'Prepaid amount is required for prepaid/promotional packages.',
                ]);
            }

            $validated['prepaid_amount'] = (float) $validated['prepaid_amount'];
            $validated['prepaid_hours'] = $durationHours > 0 ? (float) $durationHours : null;

            // Reset counters when switching package/hours.
            if ($tutorials->prepaid_hours != $validated['prepaid_hours']) {
                $validated['completed_hours'] = 0;
                $validated['remaining_hours'] = $validated['prepaid_hours'];
            }
        } else {
            $validated['prepaid_amount'] = null;
            $validated['prepaid_hours'] = null;
            $validated['completed_hours'] = 0;
            $validated['remaining_hours'] = $durationHours > 0 ? (float) $durationHours : null;
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

        // Remove override_availability flag before saving (not a database column)
        unset($validated['override_availability']);

        $tutorials->update($validated);

        $tutorials->syncHourCountersFromAttendanceWithAllowance($durationHours > 0 ? (float) $durationHours : null);

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
    public function markComplete($encrypted)
    {
        try {
            $id = Crypt::decryptString($encrypted);
        } catch (\Throwable $e) {
            abort(404);
        }

        $tutorial = Tutorials::findOrFail($id);
        $tutorial->status = 'Complete';
        $tutorial->save();

        return redirect()->back()->with('success', 'Tutorial marked as complete.');
    }

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
