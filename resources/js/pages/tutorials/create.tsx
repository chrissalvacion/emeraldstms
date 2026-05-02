import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { tutorials } from '@/routes';
import { ArrowLeft, ChevronDown, X } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

type ScheduleEntry = { days: string[]; start_time: string; end_time: string };

type PackageRecord = {
    id: number;
    name: string;
    description?: string | null;
    type?: string | null;
    level?: string | null;
    duration_hours?: number | null;
    tutee_fee_amount?: number | string | null;
    tutor_fee_amount?: number | string | null;
    status?: string | null;
};

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
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
    const { props } = usePage();
    const tutors = (props as any).tutors ?? [];
    const studentsList = (props as any).students ?? [];
    const student = (props as any).student ?? null;
    const packages = ((props as any).packages ?? []) as PackageRecord[];
    const errors = (props as any).errors ?? {};

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

    const [selectedPackageId, setSelectedPackageId] = useState<number | ''>('');
    const [packageMode, setPackageMode] = useState<'per-session' | 'prepaid' | 'promotional' | ''>('');
    const [level, setLevel] = useState<string>('');
    const [tuteeFeeAmount, setTuteeFeeAmount] = useState<string>('');
    const [tutorFeeAmount, setTutorFeeAmount] = useState<string>('');
    const [prepaidHours, setPrepaidHours] = useState<string>('');
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
        if (!packages.length || selectedPackageId === '') return;
        const pkg = packages.find((p) => p.id === selectedPackageId);
        if (!pkg) return;

        const type = String(pkg.type ?? '').toLowerCase();
        const hours = Number(pkg.duration_hours ?? 0) || 0;
        const isPromotional = type.includes('promo');
        const isPrepaid = type.includes('prepaid') || type.includes('pre-paid');

        setPackageMode(isPromotional ? 'promotional' : isPrepaid ? 'prepaid' : 'per-session');
        setLevel(String(pkg.level ?? '') || '');
        setTuteeFeeAmount(pkg.tutee_fee_amount !== null && pkg.tutee_fee_amount !== undefined ? String(pkg.tutee_fee_amount) : '');
        setTutorFeeAmount(pkg.tutor_fee_amount !== null && pkg.tutor_fee_amount !== undefined ? String(pkg.tutor_fee_amount) : '');
        setPrepaidHours(hours > 0 ? String(hours) : '');

        if (!isPrepaid && !isPromotional) {
            setPrepaidAmount('');
        }
    }, [packages, selectedPackageId]);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (!selectedTutor) return;

        const postStudentId = student ? student.id : selectedStudent;

        router.post(
            '/tutorials',
            {
                studentid: postStudentId,
                tutorid: selectedTutor,
                packageid: selectedPackageId === '' ? null : selectedPackageId,
                prepaid_amount: prepaidAmount ? parseFloat(prepaidAmount) : null,
                start_date: startDate || null,
                end_date: endDate || null,
                schedules: cleanedSchedules,
                override_availability: overrideAvailability,
            },
            {
                onSuccess: () => {
                    if (student) {
                        router.visit(`/students/${student.encrypted_id}`);
                    } else {
                        router.visit('/tutorials');
                    }
                },
            },
        );
    };

    return (
        <AppLayout>
            <Head title="Create Tutorial" />

            <div className="mx-auto max-w-5xl px-4 py-8">
                <div className="mb-8 flex items-center gap-2">
                    <Link href={tutorials().url}>
                        <Button variant="ghost">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Create Tutorial{student ? ` for ${student.firstname} ${student.lastname}` : ''}
                    </h1>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    <form onSubmit={submit} className="space-y-8 lg:col-span-2">
                        <fieldset>
                            <legend className="text-base font-semibold leading-7">Student & Dates</legend>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                Select the tutee and the active date range.
                            </p>

                            <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <Label className="block text-sm font-medium leading-6">Student</Label>
                                    <div className="mt-2">
                                        {student ? (
                                            <Input value={`${student.firstname} ${student.lastname}`} readOnly />
                                        ) : (
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
                                                            return (
                                                                name === val ||
                                                                String(s.tuteeid ?? '') === val ||
                                                                String(s.id ?? '') === val
                                                            );
                                                        });
                                                        setSelectedStudent(found ? found.id : null);
                                                    }}
                                                    onFocus={() => setStudentOpen(true)}
                                                    onBlur={() => {
                                                        setTimeout(() => setStudentOpen(false), 150);
                                                    }}
                                                />

                                                {studentOpen && (
                                                    <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                                                        <div className="max-h-64 overflow-auto p-1">
                                                            {studentSuggestions.length === 0 ? (
                                                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                                    No matches
                                                                </div>
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
                                                                                <span className="truncate font-medium">
                                                                                    {name}
                                                                                </span>
                                                                                <span className="shrink-0 text-xs text-muted-foreground">
                                                                                    {rightId ?? ''}
                                                                                </span>
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <InputError message={errors.studentid} />
                                </div>

                                <div>
                                    <Label className="block text-sm font-medium leading-6">Start Date</Label>
                                    <Input
                                        className="mt-2"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                    <InputError message={errors.start_date} />
                                </div>

                                <div>
                                    <Label className="block text-sm font-medium leading-6">End Date</Label>
                                    <Input
                                        className="mt-2"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                    <InputError message={errors.end_date} />
                                </div>
                            </div>
                        </fieldset>

                        <fieldset>
                            <legend className="text-base font-semibold leading-7">Schedule</legend>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                Add up to 5 schedule entries with days and time range.
                            </p>

                            <div className="mt-6 space-y-3">
                                {schedules.map((sch, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="h-auto min-h-9 w-full justify-between px-3 py-2 font-normal sm:flex-1"
                                                    >
                                                        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
                                                            {sch.days.length ? (
                                                                <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-1 overflow-hidden">
                                                                    {sch.days.map((day) => (
                                                                        <Badge
                                                                            key={day}
                                                                            variant="secondary"
                                                                            className="shrink-0 rounded-full"
                                                                        >
                                                                            {day.slice(0, 3)}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground">Select days</span>
                                                            )}
                                                        </div>
                                                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-56">
                                                    {daysOfWeek.map((day) => (
                                                        <DropdownMenuCheckboxItem
                                                            key={day}
                                                            checked={sch.days.includes(day)}
                                                            onSelect={(e) => e.preventDefault()}
                                                            onCheckedChange={(checked) => {
                                                                const next = [...schedules];
                                                                const days = new Set(next[idx].days);
                                                                if (checked) days.add(day);
                                                                else days.delete(day);
                                                                next[idx] = {
                                                                    ...next[idx],
                                                                    days: Array.from(days),
                                                                };
                                                                setSchedules(next);
                                                            }}
                                                        >
                                                            {day}
                                                        </DropdownMenuCheckboxItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                            <Input
                                                type="time"
                                                value={sch.start_time}
                                                onChange={(e) => {
                                                    const next = [...schedules];
                                                    next[idx] = { ...next[idx], start_time: e.target.value };
                                                    setSchedules(next);
                                                }}
                                                className="w-full sm:w-40"
                                                placeholder="Start"
                                            />
                                            <Input
                                                type="time"
                                                value={sch.end_time}
                                                onChange={(e) => {
                                                    const next = [...schedules];
                                                    next[idx] = { ...next[idx], end_time: e.target.value };
                                                    setSchedules(next);
                                                }}
                                                className="w-full sm:w-40"
                                                placeholder="End"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="shrink-0"
                                                aria-label="Remove schedule"
                                                onClick={() => {
                                                    const next = schedules.filter((_, i) => i !== idx);
                                                    setSchedules(
                                                        next.length
                                                            ? next
                                                            : [{ days: [], start_time: '', end_time: '' }],
                                                    );
                                                }}
                                            >
                                                <X className="h-4 w-4" />
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
                        </fieldset>

                        <fieldset>
                            <legend className="text-base font-semibold leading-7">Package & Billing</legend>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                Select a package to auto-fill level, fees, and (if applicable) prepaid hours.
                            </p>

                            <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <Label className="block text-sm font-medium leading-6">Package</Label>
                                    <select
                                        value={selectedPackageId === '' ? '' : String(selectedPackageId)}
                                        onChange={(e) => {
                                            const raw = e.target.value;
                                            setSelectedPackageId(raw ? Number(raw) : '');
                                        }}
                                        className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="">Select a package</option>
                                        {packages.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}{p.type ? ` (${p.type})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={(errors as any).packageid} />
                                </div>

                                <div>
                                    <Label className="block text-sm font-medium leading-6">Level</Label>
                                    <Input className="mt-2" value={level} readOnly placeholder="Auto" />
                                </div>

                                <div>
                                    <Label className="block text-sm font-medium leading-6">Tutee Fee (₱)</Label>
                                    <Input className="mt-2" value={tuteeFeeAmount} readOnly placeholder="Auto" />
                                </div>

                                <div>
                                    <Label className="block text-sm font-medium leading-6">Tutor Fee (₱)</Label>
                                    <Input className="mt-2" value={tutorFeeAmount} readOnly placeholder="Auto" />
                                </div>

                                {(packageMode === 'prepaid' || packageMode === 'promotional') && (
                                    <>
                                        <div>
                                            <Label className="block text-sm font-medium leading-6">
                                                {packageMode === 'promotional' ? 'Number of Hours' : 'Prepaid Hours'}
                                            </Label>
                                            <Input className="mt-2" value={prepaidHours} readOnly placeholder="Auto" />
                                        </div>

                                        <div>
                                            <Label className="block text-sm font-medium leading-6">Prepaid Amount (₱)</Label>
                                            <Input
                                                className="mt-2"
                                                type="number"
                                                value={prepaidAmount}
                                                onChange={(e) => setPrepaidAmount(e.target.value)}
                                                placeholder="Enter total amount paid"
                                                step="0.01"
                                                min="0"
                                            />
                                            <InputError message={(errors as any).prepaid_amount} />
                                        </div>
                                    </>
                                )}
                            </div>
                        </fieldset>

                        <fieldset>
                            <legend className="text-base font-semibold leading-7">Tutor</legend>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                Choose a tutor. Availability is checked against existing schedules.
                            </p>

                            <div className="mt-6">
                                <Label className="block text-sm font-medium leading-6">Tutor</Label>
                                <div className="relative mt-2">
                                    <Input
                                        value={tutorQuery}
                                        placeholder="Search tutor"
                                        onChange={(e) => {
                                            const val = (e.target as HTMLInputElement).value;
                                            setTutorQuery(val);
                                            setTutorOpen(true);

                                            const found = (tutors as any[]).find((t: any) => {
                                                const name = `${t.firstname ?? ''} ${t.lastname ?? ''}`.trim();
                                                return (
                                                    name === val ||
                                                    String(t.tutorid ?? '') === val ||
                                                    String(t.id ?? '') === val
                                                );
                                            });
                                            setSelectedTutor(found ? found.id : null);
                                        }}
                                        onFocus={() => setTutorOpen(true)}
                                        onBlur={() => {
                                            setTimeout(() => setTutorOpen(false), 150);
                                        }}
                                    />

                                    {tutorOpen && (
                                        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                                            <div className="max-h-64 overflow-auto p-1">
                                                {tutorSuggestions.length === 0 ? (
                                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                        No matches
                                                    </div>
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
                                                                    <span className="truncate font-medium">
                                                                        {name}
                                                                    </span>
                                                                    <span className="shrink-0 text-xs text-muted-foreground">
                                                                        {rightId ?? ''}
                                                                    </span>
                                                                </div>
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <InputError message={errors.tutorid} />

                                {!errors.tutorid && selectedTutor && availability.get(selectedTutor)?.available === false ? (
                                    <div className="mt-4 space-y-3">
                                        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                                            <div className="text-sm font-medium text-destructive">Schedule Conflict</div>
                                            <div className="mt-1 text-sm text-destructive">
                                                {availability.get(selectedTutor)?.conflict}
                                            </div>
                                        </div>
                                        <label className="flex cursor-pointer items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={overrideAvailability}
                                                onChange={(e) => setOverrideAvailability(e.target.checked)}
                                                className="h-4 w-4 accent-primary"
                                            />
                                            <span className="text-sm font-medium text-foreground">
                                                Override availability restriction (Special case: tutor absence)
                                            </span>
                                        </label>
                                    </div>
                                ) : null}

                                {!cleanedSchedules.length || !startDate ? null : availableTutorSuggestions.length ? (
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        Suggested: {availableTutorSuggestions[0]?.firstname}{' '}
                                        {availableTutorSuggestions[0]?.lastname}
                                    </div>
                                ) : (
                                    <div className="mt-2 text-xs text-destructive">
                                        No available tutor matches the selected schedule.
                                    </div>
                                )}
                            </div>
                        </fieldset>

                        <div className="flex items-center justify-end gap-x-6 border-t border-border pt-8">
                            <Link
                                href={tutorials().url}
                                className="text-sm font-semibold leading-6 text-muted-foreground hover:text-foreground"
                            >
                                Cancel
                            </Link>
                            <Button type="submit">Create</Button>
                        </div>
                    </form>

                    <div className="lg:col-span-1">
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
                                                className={
                                                    `w-full rounded-md border px-2 py-2 text-left text-sm hover:bg-accent ` +
                                                    (isSelected ? 'bg-accent' : '')
                                                }
                                                onClick={() => {
                                                    setSelectedTutor(t.id);
                                                    setTutorQuery(name);
                                                }}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="truncate font-medium">{name}</span>
                                                    <span className="shrink-0 text-xs text-muted-foreground">
                                                        {rightId ?? ''}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-sm text-destructive">
                                    No available tutor matches the selected schedule.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
