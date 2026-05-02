import { Head, router, usePage } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Clock, LogIn, LogOut } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type Tutor = {
    id: number;
    tutorid: string;
    firstname: string;
    lastname: string;
    tutorials?: Tutorial[];
};

type Student = {
    id: number;
    tuteeid: string;
    firstname: string;
    lastname: string;
};

type Tutorial = {
    id: number;
    tutorialid: string;
    studentid?: string | null;
    student_ref?: string | null;
    student_tuteeid?: string | null;
    tutorid?: string | null;
    student_name?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    status?: string | null;
    tutorial_schedule?: any;
};

function getTodayYmd(now: Date, timeZone?: string | null) {
    try {
        const dtf = new Intl.DateTimeFormat('en-CA', {
            timeZone: timeZone ?? undefined,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        return dtf.format(now);
    } catch {
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
}

function isDateWithinRange(startDate: string | null | undefined, endDate: string | null | undefined, dateYmd: string): boolean {
    if (!dateYmd) return false;
    if (startDate && dateYmd < startDate) return false;
    if (endDate && dateYmd > endDate) return false;
    return true;
}

function tutorialStatusRank(status: string | null | undefined): number {
    if (status === 'Ongoing') return 0;
    if (status === 'Scheduled') return 1;
    return 2;
}

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

function normalizeDays(days: any): string[] {
    if (typeof days === 'string') {
        return normalizeDays(days.split(/[,/]/g).map((s) => s.trim()).filter(Boolean));
    }
    if (!Array.isArray(days)) return [];
    const out: string[] = [];
    for (const d of days) {
        if (typeof d !== 'string') continue;
        const n = normalizeDay(d);
        if (n) out.push(n);
    }
    return Array.from(new Set(out));
}

function safeSchedules(raw: any): Array<{ days?: any; start_time?: any; end_time?: any }> {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'object') return [raw];
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
            if (parsed && typeof parsed === 'object') return [parsed];
            return [];
        } catch {
            return [];
        }
    }
    return [];
}

function timeToInputValue(value: any): string {
    if (!value || typeof value !== 'string') return '';
    const raw = value.trim();
    if (!raw) return '';

    const h24 = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (h24) {
        const hh = Number(h24[1]);
        const mm = Number(h24[2]);
        if (!Number.isFinite(hh) || !Number.isFinite(mm)) return '';
        if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return '';
        return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    }

    const h12 = raw.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
    if (h12) {
        let hh = Number(h12[1]);
        const mm = Number(h12[2]);
        const ap = String(h12[3]).toUpperCase();
        if (!Number.isFinite(hh) || !Number.isFinite(mm)) return '';
        if (hh < 1 || hh > 12 || mm < 0 || mm > 59) return '';
        if (ap === 'AM') {
            if (hh === 12) hh = 0;
        } else if (hh !== 12) {
            hh += 12;
        }
        return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    }

    return '';
}

function formatNowTime12hWithSeconds(now: Date, timeZone?: string | null) {
    try {
        const dtf = new Intl.DateTimeFormat('en-US', {
            timeZone: timeZone ?? undefined,
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
        return dtf.format(now);
    } catch {
        const minutes = now.getHours() * 60 + now.getMinutes();
        const hh24 = Math.floor(minutes / 60) % 24;
        const mm = minutes % 60;
        const ss = String(now.getSeconds()).padStart(2, '0');
        const suffix = hh24 >= 12 ? 'PM' : 'AM';
        const hh12 = hh24 % 12 || 12;
        return `${hh12}:${String(mm).padStart(2, '0')}:${ss} ${suffix}`;
    }
}

export default function PublicClock() {
    const { props } = usePage();
    const appTimezone: string | null = ((props as any).app_timezone as string | undefined) ?? null;

    const tutors: Tutor[] = (props as any).tutors ?? [];
    const students: Student[] = (props as any).students ?? [];
    const errors = (props as any).errors ?? {};

    const [now, setNow] = useState(() => new Date());

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [tutorQuery, setTutorQuery] = useState('');
    const [selectedTutorId, setSelectedTutorId] = useState<number | null>(null);
    const [tutorOpen, setTutorOpen] = useState(false);

    const [studentQuery, setStudentQuery] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [studentOpen, setStudentOpen] = useState(false);

    const [selectedTutorialId, setSelectedTutorialId] = useState('');
    const [tutorialQuery, setTutorialQuery] = useState('');
    const [tutorialOpen, setTutorialOpen] = useState(false);

    const [attendanceDate, setAttendanceDate] = useState(() => getTodayYmd(now, appTimezone));
    const [timeIn, setTimeIn] = useState(() => timeToInputValue(formatNowTime12hWithSeconds(now, appTimezone)));
    const [timeOut, setTimeOut] = useState(() => timeToInputValue(formatNowTime12hWithSeconds(now, appTimezone)));
    const [remarks, setRemarks] = useState('');

    const [resultOpen, setResultOpen] = useState(false);
    const [resultTitle, setResultTitle] = useState('');
    const [resultDescription, setResultDescription] = useState('');

    useEffect(() => {
        const id = window.setInterval(() => setNow(new Date()), 1000);
        return () => window.clearInterval(id);
    }, []);

    useEffect(() => {
        if (resultOpen) {
            const timeout = window.setTimeout(() => {
                setResultOpen(false);
            }, 3000);
            return () => window.clearTimeout(timeout);
        }
    }, [resultOpen]);

    const currentTime = useMemo(
        () => formatNowTime12hWithSeconds(now, appTimezone),
        [now, appTimezone]
    );

    const currentDate = useMemo(() => {
        try {
            const dtf = new Intl.DateTimeFormat('en-US', {
                timeZone: appTimezone ?? undefined,
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            return dtf.format(now);
        } catch {
            return now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        }
    }, [now, appTimezone]);

    const tutorOptions = useMemo(() => {
        return tutors.map((t) => {
            const name = `${t.firstname ?? ''} ${t.lastname ?? ''}`.trim();
            const label = `${name}${t.tutorid ? ` (${t.tutorid})` : ''}`.trim();
            return { ...t, name, label };
        });
    }, [tutors]);

    const studentOptions = useMemo(() => {
        return students.map((s) => {
            const name = `${s.firstname ?? ''} ${s.lastname ?? ''}`.trim();
            const label = `${name}${s.tuteeid ? ` (${s.tuteeid})` : ''}`.trim();
            return { ...s, name, label };
        });
    }, [students]);

    const resolveTutorFromInput = useMemo(() => {
        return (raw: string): (Tutor & { name: string; label: string }) | null => {
            const val = (raw ?? '').trim();
            if (!val) return null;

            const exact = tutorOptions.find((t) => {
                return (
                    t.label === val ||
                    t.name === val ||
                    String(t.tutorid) === val ||
                    String(t.id) === val
                );
            });
            return exact ?? null;
        };
    }, [tutorOptions]);

    const resolveStudentFromInput = useMemo(() => {
        return (raw: string): (Student & { name: string; label: string }) | null => {
            const val = (raw ?? '').trim();
            if (!val) return null;

            const exact = studentOptions.find((s) => {
                return (
                    s.label === val ||
                    s.name === val ||
                    String(s.tuteeid) === val ||
                    String(s.id) === val
                );
            });
            return exact ?? null;
        };
    }, [studentOptions]);

    const resolvedTutor = useMemo(() => {
        if (selectedTutorId !== null) {
            return tutorOptions.find((t) => t.id === selectedTutorId) ?? null;
        }
        return resolveTutorFromInput(tutorQuery);
    }, [resolveTutorFromInput, selectedTutorId, tutorOptions, tutorQuery]);

    const resolvedStudent = useMemo(() => {
        if (selectedStudentId !== null) {
            return studentOptions.find((s) => s.id === selectedStudentId) ?? null;
        }
        return resolveStudentFromInput(studentQuery);
    }, [resolveStudentFromInput, selectedStudentId, studentOptions, studentQuery]);

    const tutorSuggestions = useMemo(() => {
        const q = String(tutorQuery ?? '').toLowerCase().trim();
        const filtered = tutorOptions.filter((t) => {
            if (!q) return true;
            return (
                String(t.name ?? '').toLowerCase().includes(q) ||
                String(t.tutorid ?? '').toLowerCase().includes(q) ||
                String(t.id ?? '').toLowerCase().includes(q)
            );
        });
        return filtered.slice(0, 20);
    }, [tutorOptions, tutorQuery]);

    const tutorStudentIds = useMemo(() => {
        if (!resolvedTutor) return new Set<string>();

        const tutorials = Array.isArray(resolvedTutor.tutorials) ? resolvedTutor.tutorials : [];
        const ids = new Set<string>();
        for (const tr of tutorials) {
            if (!tr) continue;
            if (tr.studentid) ids.add(String(tr.studentid));
            if (tr.student_ref) ids.add(String(tr.student_ref));
            if (tr.student_tuteeid) ids.add(String(tr.student_tuteeid));
        }
        return ids;
    }, [resolvedTutor]);

    const studentSuggestions = useMemo(() => {
        const q = String(studentQuery ?? '').toLowerCase().trim();
        const filtered = studentOptions.filter((s) => {
            const inTutorList =
                tutorStudentIds.size === 0 ||
                tutorStudentIds.has(String(s.id)) ||
                tutorStudentIds.has(String(s.tuteeid));
            if (!inTutorList) return false;

            if (!q) return true;
            return (
                String(s.name ?? '').toLowerCase().includes(q) ||
                String(s.tuteeid ?? '').toLowerCase().includes(q) ||
                String(s.id ?? '').toLowerCase().includes(q)
            );
        });
        return filtered.slice(0, 20);
    }, [studentOptions, studentQuery, tutorStudentIds]);

    const matchingTutorials = useMemo(() => {
        if (!resolvedTutor || !resolvedStudent) return [] as Tutorial[];

        const dateForMatch = /^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)
            ? attendanceDate
            : getTodayYmd(new Date(), appTimezone);

        const studentKeys = new Set<string>([String(resolvedStudent.id), String(resolvedStudent.tuteeid)]);
        const tutorials = Array.isArray(resolvedTutor.tutorials) ? resolvedTutor.tutorials : [];

        const filtered = tutorials
            .filter((tr) => tr && tr.status !== 'Cancelled' && tr.status !== 'Completed')
            .filter((tr) => {
                const studentId = String(tr.studentid ?? '');
                const studentRef = String(tr.student_ref ?? '');
                const studentTuteeid = String(tr.student_tuteeid ?? '');
                return studentKeys.has(studentId) || studentKeys.has(studentRef) || studentKeys.has(studentTuteeid);
            })
            .filter((tr) => isDateWithinRange(tr.start_date, tr.end_date, dateForMatch));

        filtered.sort((a, b) => {
            const statusDiff = tutorialStatusRank(a.status) - tutorialStatusRank(b.status);
            if (statusDiff !== 0) return statusDiff;
            return Number(b.id ?? 0) - Number(a.id ?? 0);
        });

        return filtered;
    }, [appTimezone, attendanceDate, resolvedStudent, resolvedTutor]);

    const autoTutorial = useMemo(() => {
        return matchingTutorials.length > 0 ? matchingTutorials[0] : null;
    }, [matchingTutorials]);

    const selectedTutorial = useMemo(() => {
        return matchingTutorials.find((tr) => String(tr.tutorialid) === String(selectedTutorialId)) ?? null;
    }, [matchingTutorials, selectedTutorialId]);

    const tutorialOptions = useMemo(() => {
        return matchingTutorials.map((tr) => {
            const status = tr.status ? ` - ${tr.status}` : '';
            const student = tr.student_name ? ` - ${tr.student_name}` : '';
            const label = `${tr.tutorialid}${status}${student}`;
            return { ...tr, label };
        });
    }, [matchingTutorials]);

    const tutorialSuggestions = useMemo(() => {
        const q = String(tutorialQuery ?? '').toLowerCase().trim();
        const filtered = tutorialOptions.filter((tr: any) => {
            if (!q) return true;
            return (
                String(tr.tutorialid ?? '').toLowerCase().includes(q) ||
                String(tr.status ?? '').toLowerCase().includes(q) ||
                String(tr.student_name ?? '').toLowerCase().includes(q)
            );
        });
        return filtered.slice(0, 20);
    }, [tutorialOptions, tutorialQuery]);

    useEffect(() => {
        if (matchingTutorials.length === 0) {
            setSelectedTutorialId('');
            setTutorialQuery('');
            return;
        }

        const hasExisting = matchingTutorials.some((tr) => String(tr.tutorialid) === String(selectedTutorialId));
        if (!hasExisting) {
            setSelectedTutorialId(String(autoTutorial?.tutorialid ?? ''));
        }
    }, [autoTutorial, matchingTutorials, selectedTutorialId]);

    useEffect(() => {
        if (!selectedTutorial) {
            setTutorialQuery('');
            return;
        }

        const status = selectedTutorial.status ? ` - ${selectedTutorial.status}` : '';
        const student = selectedTutorial.student_name ? ` - ${selectedTutorial.student_name}` : '';
        setTutorialQuery(`${selectedTutorial.tutorialid}${status}${student}`);
    }, [selectedTutorial]);

    useEffect(() => {
        const tutorialForSchedule = selectedTutorial ?? autoTutorial;
        if (!tutorialForSchedule || !attendanceDate) return;

        const date = new Date(`${attendanceDate}T00:00:00`);
        if (Number.isNaN(date.getTime())) return;
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

        const schedules = safeSchedules(tutorialForSchedule.tutorial_schedule);
        if (schedules.length === 0) return;

        let matched = schedules.find((s) => normalizeDays(s.days).includes(dayName));
        if (!matched) matched = schedules[0];
        if (!matched) return;

        const start = timeToInputValue(matched.start_time);
        const end = timeToInputValue(matched.end_time);
        if (start) setTimeIn(start);
        if (end) setTimeOut(end);
    }, [attendanceDate, autoTutorial, selectedTutorial]);

    const canSubmit = Boolean(resolvedTutor && resolvedStudent && matchingTutorials.length > 0);

    const handleSaveAttendance = () => {
        if (!canSubmit || isSubmitting) return;

        setIsSubmitting(true);

        const payload: Record<string, any> = {
            tutorid: String(resolvedTutor?.id ?? ''),
            studentid: String(resolvedStudent?.id ?? ''),
        };

        const tutorialIdToSubmit = selectedTutorialId || String(autoTutorial?.tutorialid ?? '');
        if (tutorialIdToSubmit) payload.tutorialid = tutorialIdToSubmit;
        if (/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)) payload.date = attendanceDate;
        if (/^\d{2}:\d{2}$/.test(timeIn)) payload.time_in = timeIn;
        if (/^\d{2}:\d{2}$/.test(timeOut)) payload.time_out = timeOut;
        if (remarks.trim()) payload.remarks = remarks.trim();

        router.post('/attendance/record-manual-public', payload, {
            preserveScroll: true,
            onSuccess: (page) => {
                const success = (page.props as any).success;
                setResultTitle('Success');
                setResultDescription(success || 'Attendance recorded successfully');
                setResultOpen(true);
                setTutorQuery('');
                setSelectedTutorId(null);
                setTutorOpen(false);
                setStudentQuery('');
                setSelectedStudentId(null);
                setStudentOpen(false);
                setSelectedTutorialId('');
                setTutorialQuery('');
                setTutorialOpen(false);
                setRemarks('');
            },
            onError: (errors) => {
                const message =
                    (errors as any).tutorialid ||
                    (errors as any).tutorid ||
                    (errors as any).studentid ||
                    (errors as any).date ||
                    (errors as any).time_in ||
                    (errors as any).time_out ||
                    (errors as any).remarks ||
                    'An error occurred while saving attendance.';
                setResultTitle('Error');
                setResultDescription(message);
                setResultOpen(true);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <>
            <Head title="Tutor Clock In/Out" />

            <div className="min-h-screen bg-primary/10 px-4 py-8">
                <div className="mx-auto w-full max-w-xl space-y-6">
                    <div className="rounded-xl border bg-background p-6">
                        <div className="flex justify-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center">
                                <AppLogoIcon className="size-10" />
                            </div>
                            <br/>
                            <div className="min-w-0">
                                <h1 className="text-2xl font-semibold">Tutor Attendance Form</h1>
                                <p className="mt-1 text-sm text-muted-foreground">Complete the form to record your attendance.</p>
                            </div>
                        </div>

                        <div className="mt-6 rounded-md border bg-muted/30 p-4 text-center">
                            <div className="text-3xl font-semibold text-primary">{currentTime}</div>
                            <div className="mt-1 text-sm text-muted-foreground">{currentDate}</div>
                        </div>

                        <div className="mt-6 grid gap-4">
                            <div>
                                <label className="mb-1 block text-sm text-muted-foreground">Tutor</label>
                                <div className="relative">
                                    <Input
                                        placeholder="Search tutor"
                                        value={tutorQuery}
                                        onChange={(e) => {
                                            const val = (e.target as HTMLInputElement).value;
                                            setTutorQuery(val);
                                            setTutorOpen(true);

                                            const found = resolveTutorFromInput(val);
                                            setSelectedTutorId(found ? found.id : null);
                                        }}
                                        onFocus={() => setTutorOpen(true)}
                                        onBlur={() => {
                                            setTimeout(() => setTutorOpen(false), 150);
                                        }}
                                        autoFocus
                                    />

                                    {tutorOpen && tutorSuggestions.length > 0 && (
                                        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                                            <div className="max-h-64 overflow-auto p-1">
                                                {tutorSuggestions.map((t: any) => {
                                                    const rightId = t.tutorid ?? t.id;
                                                    return (
                                                        <button
                                                            key={t.id}
                                                            type="button"
                                                            className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                                                            onMouseDown={(e) => e.preventDefault()}
                                                            onClick={() => {
                                                                setTutorQuery(t.name);
                                                                setSelectedTutorId(t.id);
                                                                setTutorOpen(false);
                                                            }}
                                                        >
                                                            <div className="flex items-center justify-between gap-3">
                                                                <span className="truncate font-medium">{t.name}</span>
                                                                <span className="shrink-0 text-xs text-muted-foreground">{rightId ?? ''}</span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {errors.tutorid && <div className="mt-1 text-sm text-destructive">{errors.tutorid}</div>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm text-muted-foreground">Student</label>
                                <div className="relative">
                                    <Input
                                        placeholder="Search student"
                                        value={studentQuery}
                                        onChange={(e) => {
                                            const val = (e.target as HTMLInputElement).value;
                                            setStudentQuery(val);
                                            setStudentOpen(true);

                                            const found = resolveStudentFromInput(val);
                                            setSelectedStudentId(found ? found.id : null);
                                        }}
                                        onFocus={() => setStudentOpen(true)}
                                        onBlur={() => {
                                            setTimeout(() => setStudentOpen(false), 150);
                                        }}
                                    />

                                    {studentOpen && studentSuggestions.length > 0 && (
                                        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                                            <div className="max-h-64 overflow-auto p-1">
                                                {studentSuggestions.map((s: any) => {
                                                    const rightId = s.tuteeid ?? s.id;
                                                    return (
                                                        <button
                                                            key={s.id}
                                                            type="button"
                                                            className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                                                            onMouseDown={(e) => e.preventDefault()}
                                                            onClick={() => {
                                                                setStudentQuery(s.name);
                                                                setSelectedStudentId(s.id);
                                                                setStudentOpen(false);
                                                            }}
                                                        >
                                                            <div className="flex items-center justify-between gap-3">
                                                                <span className="truncate font-medium">{s.name}</span>
                                                                <span className="shrink-0 text-xs text-muted-foreground">{rightId ?? ''}</span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {errors.studentid && <div className="mt-1 text-sm text-destructive">{errors.studentid}</div>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm text-muted-foreground">Tutorial Session</label>
                                <div className="relative">
                                    <Input
                                        placeholder="Search tutorial session"
                                        value={tutorialQuery}
                                        onChange={(e) => {
                                            const val = (e.target as HTMLInputElement).value;
                                            setTutorialQuery(val);
                                            setTutorialOpen(true);

                                            const found = tutorialOptions.find((tr: any) => tr.label === val || tr.tutorialid === val);
                                            setSelectedTutorialId(found ? String(found.tutorialid) : '');
                                        }}
                                        onFocus={() => setTutorialOpen(true)}
                                        onBlur={() => {
                                            setTimeout(() => setTutorialOpen(false), 150);
                                        }}
                                    />

                                    {tutorialOpen && (
                                        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                                            <div className="max-h-64 overflow-auto p-1">
                                                {tutorialSuggestions.length === 0 ? (
                                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No matches</div>
                                                ) : (
                                                    tutorialSuggestions.map((tr: any) => (
                                                        <button
                                                            key={tr.id}
                                                            type="button"
                                                            className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                                                            onMouseDown={(e) => e.preventDefault()}
                                                            onClick={() => {
                                                                setSelectedTutorialId(String(tr.tutorialid));
                                                                setTutorialQuery(tr.label);
                                                                setTutorialOpen(false);
                                                            }}
                                                        >
                                                            <div className="truncate font-medium">{tr.label}</div>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {autoTutorial && (
                                    <div className="mt-1 text-sm text-muted-foreground">
                                        Auto-matched: {autoTutorial.tutorialid} {autoTutorial.student_name ? `- ${autoTutorial.student_name}` : ''}
                                    </div>
                                )}
                                {!autoTutorial && resolvedTutor && resolvedStudent && (
                                    <div className="mt-1 text-sm text-muted-foreground">No active tutorial found for the selected date.</div>
                                )}
                                {errors.tutorialid && <div className="mt-1 text-sm text-destructive">{errors.tutorialid}</div>}
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div>
                                    <label className="mb-1 block text-sm text-muted-foreground">Date</label>
                                    <Input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate((e.target as HTMLInputElement).value)} />
                                    {errors.date && <div className="mt-1 text-sm text-destructive">{errors.date}</div>}
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm text-muted-foreground">Time In</label>
                                    <Input type="time" step={60} value={timeIn} onChange={(e) => setTimeIn((e.target as HTMLInputElement).value)} />
                                    {errors.time_in && <div className="mt-1 text-sm text-destructive">{errors.time_in}</div>}
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm text-muted-foreground">Time Out</label>
                                    <Input type="time" step={60} value={timeOut} onChange={(e) => setTimeOut((e.target as HTMLInputElement).value)} />
                                    {errors.time_out && <div className="mt-1 text-sm text-destructive">{errors.time_out}</div>}
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm text-muted-foreground">Remarks (optional)</label>
                                <Input placeholder="Remarks" value={remarks} onChange={(e) => setRemarks((e.target as HTMLInputElement).value)} />
                                {errors.remarks && <div className="mt-1 text-sm text-destructive">{errors.remarks}</div>}
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={handleSaveAttendance} disabled={!canSubmit || isSubmitting}>
                                    {isSubmitting ? 'Saving…' : 'Save Attendance'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Result Dialog */}
            <Dialog open={resultOpen} onOpenChange={setResultOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{resultTitle}</DialogTitle>
                        <DialogDescription>{resultDescription}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => setResultOpen(false)}>OK</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
