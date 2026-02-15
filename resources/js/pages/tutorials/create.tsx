import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEffect, useMemo, useState } from 'react';
import { students, tutorials } from '@/routes';
import { ArrowLeft } from 'lucide-react';

type ScheduleEntry = { days: string[]; start_time: string; end_time: string };

function normalizeDay(day: string): string | null {
    const key = day.trim().toLowerCase();
    const map: Record<string, string> = {
        mon: 'Monday',
        monday: 'Monday',
        tue: 'Tuesday',
        tues: 'Tuesday',
        tuesday: 'Tuesday',
        wed: 'Wednesday',
        wednesday: 'Wednesday',
        thu: 'Thursday',
        thur: 'Thursday',
        thurs: 'Thursday',
        thursday: 'Thursday',
        fri: 'Friday',
        friday: 'Friday',
        sat: 'Saturday',
        saturday: 'Saturday',
        sun: 'Sunday',
        sunday: 'Sunday',
    };
    return map[key] ?? null;
}

function timeToMinutes(value: string): number | null {
    if (!value) return null;
    const m = value.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return null;
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    return hh * 60 + mm;
}

function parseDateOrFallback(value: any, fallback: Date): Date {
    if (!value) return fallback;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? fallback : d;
}

function overlapRange(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): { start: Date; end: Date } | null {
    const start = aStart.getTime() > bStart.getTime() ? aStart : bStart;
    const end = aEnd.getTime() < bEnd.getTime() ? aEnd : bEnd;
    return start.getTime() <= end.getTime() ? { start, end } : null;
}

function dayOccursInRange(dayName: string, start: Date, end: Date): boolean {
    const dayToJsIndex: Record<string, number> = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
    };

    const target = dayToJsIndex[dayName];
    if (target === undefined) return false;

    const startDay = start.getDay();
    const delta = (target - startDay + 7) % 7;
    const occurrence = new Date(start);
    occurrence.setDate(occurrence.getDate() + delta);
    return occurrence.getTime() <= end.getTime();
}

function schedulesConflict(
    desired: ScheduleEntry[],
    desiredStart: Date,
    desiredEnd: Date,
    existing: ScheduleEntry[],
    existingStart: Date,
    existingEnd: Date,
): { day: string; start_time: string; end_time: string } | null {
    const overlap = overlapRange(desiredStart, desiredEnd, existingStart, existingEnd);
    if (!overlap) return null;

    for (const s of desired) {
        const newDays = (s.days || []).map(normalizeDay).filter(Boolean) as string[];
        const newStart = timeToMinutes(s.start_time);
        const newEnd = timeToMinutes(s.end_time);
        if (!newDays.length || newStart === null || newEnd === null) continue;

        for (const es of existing) {
            const existingDays = (es.days || []).map(normalizeDay).filter(Boolean) as string[];
            const exStart = timeToMinutes(es.start_time);
            const exEnd = timeToMinutes(es.end_time);
            if (!existingDays.length || exStart === null || exEnd === null) continue;

            const dayIntersection = newDays.filter((d) => existingDays.includes(d));
            if (!dayIntersection.length) continue;

            // time overlap: [a,b) intersects [c,d)
            if (Math.max(newStart, exStart) >= Math.min(newEnd, exEnd)) continue;

            for (const day of dayIntersection) {
                if (!dayOccursInRange(day, overlap.start, overlap.end)) continue;
                return { day, start_time: s.start_time, end_time: s.end_time };
            }
        }
    }

    return null;
}

export default function TutorialCreate() {
    const { props } = usePage();
    const tutors = (props as any).tutors ?? [];
    const studentsList = (props as any).students ?? [];
    const student = (props as any).student ?? null;
    const errors = (props as any).errors ?? {};
    const defaultRateSecondary = Number((props as any).default_rate_secondary ?? 0) || 0;
    const defaultRateGradeSchool = Number((props as any).default_rate_grade_school ?? 0) || 0;

    const [selectedTutor, setSelectedTutor] = useState<number | null>(tutors.length ? tutors[0].id : null);
    const [tutorQuery, setTutorQuery] = useState<string>(tutors.length ? `${tutors[0].firstname} ${tutors[0].lastname}` : '');
    const [selectedStudent, setSelectedStudent] = useState<number | null>(student ? student.id : null);
    const [studentQuery, setStudentQuery] = useState<string>(student ? `${student.firstname} ${student.lastname}` : '');
    const [studentOpen, setStudentOpen] = useState(false);
    const [tutorOpen, setTutorOpen] = useState(false);
    
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [schedules, setSchedules] = useState<Array<ScheduleEntry>>([
        { days: [], start_time: '', end_time: '' },
    ]);

    const [educationLevel, setEducationLevel] = useState<'JHS' | 'SHS' | 'Elementary' | ''>('');
    const [gradeLevel, setGradeLevel] = useState<string>('');
    const [computedRate, setComputedRate] = useState<number | null>(null);
    const [billingType, setBillingType] = useState<'per-session' | 'prepaid-package'>('per-session');
    const [prepaidAmount, setPrepaidAmount] = useState<string>('');
    const [overrideAvailability, setOverrideAvailability] = useState(false);

    const cleanedSchedules = useMemo(() => {
        return schedules
            .map((s) => ({ days: (s.days || []).filter(Boolean), start_time: s.start_time, end_time: s.end_time }))
            .filter((s) => Array.isArray(s.days) && s.days.length > 0 && s.start_time && s.end_time)
            .slice(0, 5);
    }, [schedules]);

    const studentSuggestions = useMemo(() => {
        const q = String(studentQuery ?? '').toLowerCase().trim();
        const filtered = (studentsList as any[]).filter((s) => {
            const name = `${s.firstname ?? ''} ${s.lastname ?? ''}`.trim().toLowerCase();
            const tuteeId = String(s.tuteeid ?? '').toLowerCase();
            const id = String(s.id ?? '').toLowerCase();

            if (!q) return true;
            return name.includes(q) || tuteeId.includes(q) || id.includes(q);
        });
        return filtered.slice(0, 20);
    }, [studentsList, studentQuery]);

    const tutorSuggestions = useMemo(() => {
        const q = String(tutorQuery ?? '').toLowerCase().trim();
        const filtered = (tutors as any[]).filter((t) => {
            const name = `${t.firstname ?? ''} ${t.lastname ?? ''}`.trim().toLowerCase();
            const tutorId = String(t.tutorid ?? '').toLowerCase();
            const id = String(t.id ?? '').toLowerCase();

            if (!q) return true;
            return name.includes(q) || tutorId.includes(q) || id.includes(q);
        });
        return filtered.slice(0, 20);
    }, [tutors, tutorQuery]);

    const availability = useMemo(() => {
        const today = new Date();
        const desiredStart = parseDateOrFallback(startDate, today);
        let desiredEnd = endDate
            ? parseDateOrFallback(endDate, new Date('9999-12-31T23:59:59'))
            : new Date('9999-12-31T23:59:59');

        if (desiredEnd.getTime() < desiredStart.getTime()) {
            desiredEnd = desiredStart;
        }

        const byId = new Map<number, { available: boolean; conflict?: string }>();
        for (const t of tutors as any[]) {
            const tutorialsForTutor = Array.isArray(t.tutorials) ? t.tutorials : [];

            // If we don't have enough info yet, don't block/auto-switch.
            if (!cleanedSchedules.length || !startDate) {
                byId.set(t.id, { available: true });
                continue;
            }

            let conflictMessage: string | undefined;
            let isAvailable = true;

            for (const tr of tutorialsForTutor) {
                const existingScheduleRaw = tr?.tutorial_schedule;
                const existingSchedules: ScheduleEntry[] = Array.isArray(existingScheduleRaw) ? existingScheduleRaw : [];
                if (!existingSchedules.length) continue;

                const existingStart = parseDateOrFallback(tr?.start_date, today);
                const existingEnd = tr?.end_date ? parseDateOrFallback(tr?.end_date, new Date('9999-12-31T23:59:59')) : new Date('9999-12-31T23:59:59');

                const conflict = schedulesConflict(
                    cleanedSchedules,
                    desiredStart,
                    desiredEnd,
                    existingSchedules,
                    existingStart,
                    existingEnd,
                );

                if (conflict) {
                    isAvailable = false;
                    conflictMessage = `Tutor is already scheduled on ${conflict.day} at ${conflict.start_time}–${conflict.end_time}.`;
                    break;
                }
            }

            byId.set(t.id, { available: isAvailable, conflict: conflictMessage });
        }

        return byId;
    }, [tutors, cleanedSchedules, startDate, endDate]);

    const availableTutors = useMemo(() => {
        return (tutors as any[]).filter((t) => availability.get(t.id)?.available !== false);
    }, [tutors, availability]);

    const availableTutorSuggestions = useMemo(() => {
        const sorted = [...availableTutors].sort((a: any, b: any) => {
            const aName = `${a?.firstname ?? ''} ${a?.lastname ?? ''}`.trim().toLowerCase();
            const bName = `${b?.firstname ?? ''} ${b?.lastname ?? ''}`.trim().toLowerCase();
            return aName.localeCompare(bName);
        });
        return sorted.slice(0, 10);
    }, [availableTutors]);

    useEffect(() => {
        if (!cleanedSchedules.length || !startDate) return;
        if (!selectedTutor) return;

        const status = availability.get(selectedTutor);
        if (!status || status.available) return;

        const next = availableTutors[0];
        if (!next) return;

        setSelectedTutor(next.id);
        setTutorQuery(`${next.firstname ?? ''} ${next.lastname ?? ''}`.trim());
    }, [availability, availableTutors, cleanedSchedules.length, selectedTutor, startDate]);

    useEffect(() => {
        // Apply rate automatically when education level is selected
        if (!educationLevel) {
            setComputedRate(null);
            return;
        }

        if (educationLevel === 'JHS' || educationLevel === 'SHS') {
            setComputedRate(defaultRateSecondary > 0 ? defaultRateSecondary : null);
        } else if (educationLevel === 'Elementary') {
            setComputedRate(defaultRateGradeSchool > 0 ? defaultRateGradeSchool : null);
        } else {
            setComputedRate(null);
        }
    }, [educationLevel, defaultRateSecondary, defaultRateGradeSchool]);

    return (
        <AppLayout>
            <Head title="Create Tutorial" />

            <div className="p-4">
                <div className="mb-4 flex items-center gap-">
                    <Link href={tutorials().url}>
                        <Button variant="ghost">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-semibold">Create Tutorial{student ? ` for ${student.firstname} ${student.lastname}` : ''}</h1>
                </div>

                <div className="grid w-full gap-6 md:grid-cols-3">
                    <div className="w-full rounded-md border bg-background p-4 md:col-span-2">
                        <div className="grid gap-6">
                            <div>
                            <label className="block text-sm text-muted-foreground mb-1">Student</label>
                            {student ? (
                                <Input value={`${student.firstname} ${student.lastname}`} readOnly />
                            ) : (
                                <>
                                    <div className="relative">
                                        <Input
                                            value={studentQuery}
                                            placeholder="Search student"
                                            onChange={(e) => {
                                                const val = (e.target as HTMLInputElement).value;
                                                setStudentQuery(val);
                                                setStudentOpen(true);

                                                const found = (studentsList as any[]).find((s: any) => {
                                                    const name = `${s.firstname ?? ''} ${s.lastname ?? ''}`.trim();
                                                    return name === val || String(s.tuteeid ?? '') === val || String(s.id ?? '') === val;
                                                });
                                                setSelectedStudent(found ? found.id : null);
                                            }}
                                            onFocus={() => setStudentOpen(true)}
                                            onBlur={() => {
                                                // allow click selection before closing
                                                setTimeout(() => setStudentOpen(false), 150);
                                            }}
                                        />

                                        {studentOpen && (
                                            <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                                                <div className="max-h-64 overflow-auto p-1">
                                                    {studentSuggestions.length === 0 ? (
                                                        <div className="px-2 py-1.5 text-sm text-muted-foreground">No matches</div>
                                                    ) : (
                                                        studentSuggestions.map((s: any) => {
                                                            const name = `${s.firstname ?? ''} ${s.lastname ?? ''}`.trim();
                                                            const rightId = s.tuteeid ?? s.id;
                                                            return (
                                                                <button
                                                                    key={s.id}
                                                                    type="button"
                                                                    className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                                                                    onMouseDown={(e) => e.preventDefault()}
                                                                    onClick={() => {
                                                                        setStudentQuery(name);
                                                                        setSelectedStudent(s.id);
                                                                        setStudentOpen(false);
                                                                    }}
                                                                >
                                                                    <div className="flex items-center justify-between gap-3">
                                                                        <span className="truncate font-medium">{name}</span>
                                                                        <span className="shrink-0 text-xs text-muted-foreground">{rightId ?? ''}</span>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {errors.studentid ? (
                                        <div className="mt-1 text-sm text-destructive">{errors.studentid}</div>
                                    ) : null}
                                </>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <div>
                                <label className="block text-sm text-muted-foreground mb-1">Start Date</label>
                                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                {errors.start_date ? (
                                    <div className="mt-1 text-sm text-destructive">{errors.start_date}</div>
                                ) : null}
                            </div>

                            <div>
                                <label className="block text-sm text-muted-foreground mb-1">End Date</label>
                                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                {errors.end_date ? (
                                    <div className="mt-1 text-sm text-destructive">{errors.end_date}</div>
                                ) : null}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-muted-foreground mb-1">Schedules (up to 5)</label>
                            <div className="space-y-2">
                                {schedules.map((sch, idx) => (
                                    <div key={idx} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <div className="flex flex-wrap gap-2">
                                            {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((day) => {
                                                const active = sch.days.includes(day);
                                                return (
                                                    <button
                                                        key={day}
                                                        type="button"
                                                        onClick={() => {
                                                            const next = [...schedules];
                                                            const days = new Set(next[idx].days);
                                                            if (days.has(day)) days.delete(day); else days.add(day);
                                                            next[idx] = { ...next[idx], days: Array.from(days) };
                                                            setSchedules(next);
                                                        }}
                                                        className={`px-3 py-1 rounded-full border ${active ? 'bg-primary text-white' : 'bg-transparent'}`}>
                                                        {day.slice(0,3)}
                                                    </button>
                                                )
                                            })}
                                        </div>

                                        <div className="flex gap-2 items-center">
                                            <Input type="time" value={sch.start_time} onChange={(e) => {
                                                const next = [...schedules];
                                                next[idx] = { ...next[idx], start_time: e.target.value };
                                                setSchedules(next);
                                            }} className="w-32" placeholder="Start" />
                                            <Input type="time" value={sch.end_time} onChange={(e) => {
                                                const next = [...schedules];
                                                next[idx] = { ...next[idx], end_time: e.target.value };
                                                setSchedules(next);
                                            }} className="w-32" placeholder="End" />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-32"
                                                onClick={() => {
                                                    const next = schedules.filter((_, i) => i !== idx);
                                                    setSchedules(next.length ? next : [{ days: [], start_time: '', end_time: '' }]);
                                                }}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                <div>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            if (schedules.length >= 5) return;
                                            setSchedules([...schedules, { days: [], start_time: '', end_time: '' }]);
                                        }}
                                    >
                                        Add schedule
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <div>
                                <label className="block text-sm text-muted-foreground mb-1">Education Level</label>
                                <select
                                    value={educationLevel}
                                    onChange={(e) => setEducationLevel(e.target.value as 'JHS' | 'SHS' | 'Elementary' | '')}
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                >
                                    <option value="">Select education level</option>
                                    <option value="Elementary">Elementary</option>
                                    <option value="JHS">Junior High School</option>
                                    <option value="SHS">Senior High School</option>
                                </select>
                                {(errors as any).education_level ? (
                                    <div className="mt-1 text-sm text-destructive">{(errors as any).education_level}</div>
                                ) : null}
                            </div>

                            <div>
                                <label className="block text-sm text-muted-foreground mb-1">Grade Level</label>
                                <Input value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} placeholder={educationLevel === 'Elementary' ? '1-6' : educationLevel === 'JHS' ? '7-10' : educationLevel === 'SHS' ? '11-12' : ''} />
                                {(errors as any).grade_level ? (
                                    <div className="mt-1 text-sm text-destructive">{(errors as any).grade_level}</div>
                                ) : null}
                            </div>

                            <div>
                                <label className="block text-sm text-muted-foreground mb-1">Rate (₱/hour)</label>
                                <Input value={computedRate !== null ? String(computedRate) : ''} readOnly placeholder="Auto" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm text-muted-foreground mb-1">Billing Type</label>
                                <select
                                    value={billingType}
                                    onChange={(e) => setBillingType(e.target.value as 'per-session' | 'prepaid-package')}
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                >
                                    <option value="per-session">Per-Session</option>
                                    <option value="prepaid-package">Prepaid Package</option>
                                </select>
                            </div>

                            {billingType === 'prepaid-package' && (
                                <div>
                                    <label className="block text-sm text-muted-foreground mb-1">Prepaid Amount (₱)</label>
                                    <Input 
                                        type="number" 
                                        value={prepaidAmount} 
                                        onChange={(e) => setPrepaidAmount(e.target.value)} 
                                        placeholder="Enter total amount paid"
                                        step="0.01"
                                        min="0"
                                    />
                                    {(errors as any).prepaid_amount ? (
                                        <div className="mt-1 text-sm text-destructive">{(errors as any).prepaid_amount}</div>
                                    ) : null}
                                </div>
                            )}
                        </div>

                         <div>
                            <label className="block text-sm text-muted-foreground mb-1">Tutor</label>
                            <div className="relative">
                                <Input
                                    value={tutorQuery}
                                    placeholder="Search tutor"
                                    onChange={(e) => {
                                        const val = (e.target as HTMLInputElement).value;
                                        setTutorQuery(val);
                                        setTutorOpen(true);

                                        const found = (tutors as any[]).find((t: any) => {
                                            const name = `${t.firstname ?? ''} ${t.lastname ?? ''}`.trim();
                                            return name === val || String(t.tutorid ?? '') === val || String(t.id ?? '') === val;
                                        });
                                        setSelectedTutor(found ? found.id : null);
                                    }}
                                    onFocus={() => setTutorOpen(true)}
                                    onBlur={() => {
                                        // allow click selection before closing
                                        setTimeout(() => setTutorOpen(false), 150);
                                    }}
                                />

                                {tutorOpen && (
                                    <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                                        <div className="max-h-64 overflow-auto p-1">
                                            {tutorSuggestions.length === 0 ? (
                                                <div className="px-2 py-1.5 text-sm text-muted-foreground">No matches</div>
                                            ) : (
                                                tutorSuggestions.map((t: any) => {
                                                    const name = `${t.firstname ?? ''} ${t.lastname ?? ''}`.trim();
                                                    const rightId = t.tutorid ?? t.id;
                                                    return (
                                                        <button
                                                            key={t.id}
                                                            type="button"
                                                            className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                                                            onMouseDown={(e) => e.preventDefault()}
                                                            onClick={() => {
                                                                setTutorQuery(name);
                                                                setSelectedTutor(t.id);
                                                                setTutorOpen(false);
                                                            }}
                                                        >
                                                            <div className="flex items-center justify-between gap-3">
                                                                <span className="truncate font-medium">{name}</span>
                                                                <span className="shrink-0 text-xs text-muted-foreground">{rightId ?? ''}</span>
                                                            </div>
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {errors.tutorid ? (
                                <div className="mt-1 text-sm text-destructive">{errors.tutorid}</div>
                            ) : null}

                            {!errors.tutorid && selectedTutor && availability.get(selectedTutor)?.available === false ? (
                                <div className="mt-4 space-y-3">
                                    <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                                        <div className="text-sm font-medium text-destructive">
                                            Schedule Conflict
                                        </div>
                                        <div className="mt-1 text-sm text-destructive">{availability.get(selectedTutor)?.conflict}</div>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={overrideAvailability}
                                            onChange={(e) => setOverrideAvailability(e.target.checked)}
                                            className="h-4 w-4 accent-primary"
                                        />
                                        <span className="text-sm text-foreground font-medium">
                                            Override availability restriction (Special case: tutor absence)
                                        </span>
                                    </label>
                                </div>
                            ) : null}

                            {!cleanedSchedules.length || !startDate ? null : availableTutorSuggestions.length ? (
                                <div className="mt-1 text-xs text-muted-foreground">Suggested: {availableTutorSuggestions[0]?.firstname} {availableTutorSuggestions[0]?.lastname}</div>
                            ) : (
                                <div className="mt-1 text-xs text-destructive">No available tutor matches the selected schedule.</div>
                            )}

                            </div>

                            <div className="flex justify-end gap-2">
                                <Link href={tutorials().url} className="btn w-32">Cancel</Link>
                                <Button onClick={() => {
                                if (!selectedTutor) return;

                                const postStudentId = student ? student.id : selectedStudent;

                                router.post('/tutorials', {
                                    studentid: postStudentId,
                                    tutorid: selectedTutor,
                                    education_level: educationLevel || null,
                                    grade_level: gradeLevel || null,
                                    start_date: startDate || null,
                                    end_date: endDate || null,
                                    schedules: cleanedSchedules,
                                    billing_type: billingType,
                                    prepaid_amount: billingType === 'prepaid-package' ? (prepaidAmount ? parseFloat(prepaidAmount) : null) : null,
                                    override_availability: overrideAvailability,
                                }, {
                                    onSuccess: () => {
                                        // navigate back to student page if available
                                        if (student) {
                                            router.visit(`/students/${student.encrypted_id}`);
                                        } else {
                                            router.visit('/tutorials');
                                        }
                                    }
                                });

                                }} className="btn btn-primary">Create</Button>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-1">
                        <div className="rounded-md border bg-background p-4">
                            <div className="mb-2 text-sm font-medium">Available tutors</div>

                            {!cleanedSchedules.length || !startDate ? (
                                <div className="text-sm text-muted-foreground">
                                    Select a start date and schedule to see suggestions.
                                </div>
                            ) : availableTutorSuggestions.length ? (
                                <div className="space-y-2">
                                    {availableTutorSuggestions.map((t: any) => {
                                        const name = `${t?.firstname ?? ''} ${t?.lastname ?? ''}`.trim();
                                        const rightId = t?.tutorid ?? t?.id;
                                        const isSelected = selectedTutor === t?.id;

                                        return (
                                            <button
                                                key={t.id}
                                                type="button"
                                                className={`w-full rounded-md border px-2 py-2 text-left text-sm hover:bg-accent ${isSelected ? 'bg-accent' : ''}`}
                                                onClick={() => {
                                                    setSelectedTutor(t.id);
                                                    setTutorQuery(name);
                                                }}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="truncate font-medium">{name}</span>
                                                    <span className="shrink-0 text-xs text-muted-foreground">{rightId ?? ''}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-sm text-destructive">No available tutor matches the selected schedule.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
