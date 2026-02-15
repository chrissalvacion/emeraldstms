import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { tutorials } from '@/routes';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { type BreadcrumbItem } from '@/types';

type ScheduleEntry = { days: string[]; start_time: string; end_time: string };

type TutorOption = {
    id: number;
    tutorid?: string;
    firstname?: string;
    lastname?: string;
};

type StudentOption = {
    id: number;
    tuteeid?: string;
    firstname?: string;
    lastname?: string;
};

function normalizeDay(day: string): string {
    return (
        {
            Mon: 'Monday',
            Tue: 'Tuesday',
            Wed: 'Wednesday',
            Thu: 'Thursday',
            Fri: 'Friday',
            Sat: 'Saturday',
            Sun: 'Sunday',
        } as any
    )[day] || day;
}

function timeToMinutes(t: string): number {
    const [h, m] = (t || '00:00').split(':').map(Number);
    return h * 60 + m;
}

function parseDateOrFallback(dateStr: string, fallback: Date): Date {
    if (!dateStr || typeof dateStr !== 'string') return fallback;
    const d = new Date(`${dateStr}T00:00:00Z`);
    return isNaN(d.getTime()) ? fallback : d;
}

type Tutorial = {
    id: number;
    tutorialid?: string;
    studentid?: string | number;
    tutorid?: string | number;
    start_date?: string | null;
    end_date?: string | null;
    status?: string | null;
    education_level?: string | null;
    grade_level?: string | null;
    rate_secondary?: number | null;
    rate_grade_school?: number | null;
    tutorial_schedule?: ScheduleEntry[] | string | null;
    encrypted_id: string;
    student_name?: string | null;
    tutor_name?: string | null;
};

function safeSchedules(raw: Tutorial['tutorial_schedule']): ScheduleEntry[] {
    if (!raw) return [{ days: [], start_time: '', end_time: '' }];
    if (Array.isArray(raw)) return raw.length ? raw : [{ days: [], start_time: '', end_time: '' }];
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) && parsed.length ? parsed : [{ days: [], start_time: '', end_time: '' }];
        } catch {
            return [{ days: [], start_time: '', end_time: '' }];
        }
    }
    return [{ days: [], start_time: '', end_time: '' }];
}

export default function TutorialEdit() {
    const { props } = usePage();
    const tutorial: Tutorial | null = (props as any).tutorial ?? null;
    const tutors: TutorOption[] = (props as any).tutors ?? [];
    const studentsList: StudentOption[] = (props as any).students ?? [];
    const errors = (props as any).errors ?? {};
    // Use the saved rates from the tutorial record for auto-filling
    const savedRateSecondary = Number((tutorial?.rate_secondary ?? 0)) || 0;
    const savedRateGradeSchool = Number((tutorial?.rate_grade_school ?? 0)) || 0;

    if (!tutorial) {
        return (
            <AppLayout>
                <Head title="Edit Tutorial" />
                <div className="p-4">Tutorial not found.</div>
            </AppLayout>
        );
    }

    const initialTutor =
        tutors.find((t) => String(t.id) === String(tutorial.tutorid)) ??
        tutors.find((t) => String(t.tutorid) === String(tutorial.tutorid)) ??
        null;

    const initialStudent =
        studentsList.find((s) => String(s.id) === String(tutorial.studentid)) ??
        studentsList.find((s) => String(s.tuteeid) === String(tutorial.studentid)) ??
        null;

    const [selectedTutor, setSelectedTutor] = useState<number | null>(initialTutor ? initialTutor.id : null);
    const [tutorQuery, setTutorQuery] = useState<string>(
        initialTutor ? `${initialTutor.firstname ?? ''} ${initialTutor.lastname ?? ''}`.trim() : '',
    );
    const [tutorOpen, setTutorOpen] = useState(false);

    const [selectedStudent, setSelectedStudent] = useState<number | null>(initialStudent ? initialStudent.id : null);
    const [studentQuery, setStudentQuery] = useState<string>(
        initialStudent ? `${initialStudent.firstname ?? ''} ${initialStudent.lastname ?? ''}`.trim() : '',
    );
    const [studentOpen, setStudentOpen] = useState(false);

    const [startDate, setStartDate] = useState<string>(tutorial.start_date ?? '');
    const [endDate, setEndDate] = useState<string>(tutorial.end_date ?? '');
    const [status, setStatus] = useState<string>(tutorial.status ?? 'Scheduled');

    const [educationLevel, setEducationLevel] = useState<'JHS' | 'SHS' | 'Elementary' | ''>(
        (tutorial.education_level || '') as 'JHS' | 'SHS' | 'Elementary' | ''
    );
    const [gradeLevel, setGradeLevel] = useState<string>(tutorial.grade_level || '');
    const [computedRate, setComputedRate] = useState<number | null>(null);
    const [billingType, setBillingType] = useState<'per-session' | 'prepaid-package'>(
        (tutorial.billing_type as any) || 'per-session'
    );
    const [prepaidAmount, setPrepaidAmount] = useState<string>(tutorial.prepaid_amount ? String(tutorial.prepaid_amount) : '');

    const [schedules, setSchedules] = useState<Array<ScheduleEntry>>(safeSchedules(tutorial.tutorial_schedule));

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

    useEffect(() => {
        // Auto-fill rate from saved record when education level is selected
        if (!educationLevel) {
            setComputedRate(null);
            return;
        }
        if (educationLevel === 'JHS' || educationLevel === 'SHS') {
            setComputedRate(savedRateSecondary > 0 ? savedRateSecondary : null);
        } else if (educationLevel === 'Elementary') {
            setComputedRate(savedRateGradeSchool > 0 ? savedRateGradeSchool : null);
        } else {
            setComputedRate(null);
        }
    }, [educationLevel, savedRateSecondary, savedRateGradeSchool]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Tutorials', href: tutorials().url },
        { title: tutorial.tutorialid ?? '—', href: `/tutorials/${tutorial.encrypted_id}` },
        { title: 'Edit', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Tutorial ${tutorial.tutorialid ?? ''}`} />

            <div className="p-4">
                <div className="mb-4 flex items-center gap-4">
                    <Link href={`/tutorials/${tutorial.encrypted_id}`}>
                        <Button variant="ghost">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-semibold">Edit Tutorial {tutorial.tutorialid ?? ''}</h1>
                </div>

                <div className="rounded-md border bg-background p-4 max-w-6xl">
                    <div className="grid gap-6">
                        <div>
                            <label className="block text-sm text-muted-foreground mb-1">Student</label>
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
                                <Input
                                    value={computedRate !== null ? String(computedRate) : ''}
                                    onChange={e => {
                                        const val = e.target.value.replace(/[^\d.]/g, '');
                                        setComputedRate(val ? Number(val) : null);
                                    }}
                                    placeholder="Auto"
                                />
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

                        <div className="flex justify-end gap-2">
                            <Link href={`/tutorials/${tutorial.encrypted_id}`} className="btn w-32">
                                Cancel
                            </Link>
                            <Button
                                onClick={() => {
                                    router.put(
                                        `/tutorials/${tutorial.encrypted_id}`,
                                        {
                                            studentid: selectedStudent,
                                            tutorid: selectedTutor,
                                            education_level: educationLevel || null,
                                            grade_level: gradeLevel || null,
                                            start_date: startDate || null,
                                            end_date: endDate || null,
                                            status: status || null,
                                            schedules: cleanedSchedules,
                                            billing_type: billingType,
                                            prepaid_amount: billingType === 'prepaid-package' ? (prepaidAmount ? parseFloat(prepaidAmount) : null) : null,
                                        },
                                        {
                                            onSuccess: () => {
                                                router.visit(`/tutorials/${tutorial.encrypted_id}`);
                                            },
                                        },
                                    );
                                }}
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
