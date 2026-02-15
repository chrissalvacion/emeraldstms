import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, ClockArrowUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Attendance', href: '/attendance' },
    { title: 'Time Clock', href: '/attendance/clock' },
];

type Tutor = {
    id: number;
    tutorid: string;
    firstname: string;
    lastname: string;
    tutorials?: Array<{
        id: number;
        tutorialid: string;
        student_name?: string | null;
        start_date?: string | null;
        end_date?: string | null;
        status?: string | null;
        tutorial_schedule?: any;
    }>;
};

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

function timeToMinutes(value: any): number | null {
    if (!value || typeof value !== 'string') return null;

    const raw = value.trim();
    if (!raw) return null;

    // Handles "HH:MM", "HH:MM:SS".
    const h24 = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (h24) {
        const hh = Number(h24[1]);
        const mm = Number(h24[2]);
        if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
        if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
        return hh * 60 + mm;
    }

    // Handles "h:mm AM" / "h:mm PM" (with optional spaces).
    const h12 = raw.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
    if (h12) {
        let hh = Number(h12[1]);
        const mm = Number(h12[2]);
        const ap = String(h12[3]).toUpperCase();
        if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
        if (hh < 1 || hh > 12 || mm < 0 || mm > 59) return null;
        if (ap === 'AM') {
            if (hh === 12) hh = 0;
        } else {
            if (hh !== 12) hh += 12;
        }
        return hh * 60 + mm;
    }

    return null;
}

function safeSchedules(raw: any): ScheduleEntry[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'object') return [raw as ScheduleEntry];
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
            if (parsed && typeof parsed === 'object') return [parsed as ScheduleEntry];
            return [];
        } catch {
            return [];
        }
    }
    return [];
}

function isDayWithinRange(startDate: any, endDate: any, dayYmd: string): boolean {
    if (!dayYmd) return false;
    if (startDate && String(dayYmd) < String(startDate)) return false;
    if (endDate && String(dayYmd) > String(endDate)) return false;
    return true;
}

function formatTime24h(value: any) {
    if (!value) return '-';

    const minutes = timeToMinutes(value);
    if (minutes === null) return String(value);

    const hh24 = Math.floor(minutes / 60) % 24;
    const mm = minutes % 60;
    return `${String(hh24).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function formatTime12h(value: any) {
    if (!value) return '-';

    const minutes = timeToMinutes(value);
    if (minutes === null) return String(value);

    const hh24 = Math.floor(minutes / 60) % 24;
    const mm = minutes % 60;
    const suffix = hh24 >= 12 ? 'PM' : 'AM';
    const hh12 = hh24 % 12 || 12;
    return `${hh12}:${String(mm).padStart(2, '0')} ${suffix}`;
}

function formatNowTime24hWithSeconds(now: Date, timeZone?: string | null) {
    try {
        if (timeZone) {
            const dtf = new Intl.DateTimeFormat('en-US', {
                timeZone,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            });
            // In en-US, this is typically "HH:MM:SS" (we're only displaying).
            return dtf.format(now);
        }
    } catch {
        // fall through
    }

    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
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
        // fall through
    }

    const minutes = now.getHours() * 60 + now.getMinutes();
    const hh24 = Math.floor(minutes / 60) % 24;
    const mm = minutes % 60;
    const ss = String(now.getSeconds()).padStart(2, '0');
    const suffix = hh24 >= 12 ? 'PM' : 'AM';
    const hh12 = hh24 % 12 || 12;
    return `${hh12}:${String(mm).padStart(2, '0')}:${ss} ${suffix}`;
}

function getNowContext(now: Date, timeZone?: string | null) {
    if (timeZone) {
        const dtf = new Intl.DateTimeFormat('en-US', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'long',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });

        const parts = dtf.formatToParts(now);
        const map: Record<string, string> = {};
        for (const p of parts) {
            if (p.type === 'literal') continue;
            map[p.type] = p.value;
        }

        const ymd = `${map.year}-${map.month}-${map.day}`;
        const dayName = map.weekday;
        const hh = Number(map.hour);
        const mm = Number(map.minute);
        const nowMinutes = (Number.isFinite(hh) ? hh : 0) * 60 + (Number.isFinite(mm) ? mm : 0);

        return { todayYmd: ymd, dayName, nowMinutes };
    }

    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayYmd = `${y}-${m}-${d}`;
    const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
    const dayName = names[now.getDay()];
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    return { todayYmd, dayName, nowMinutes };
}

export default function AttendanceClock() {
    const { props } = usePage();
    const tutors: Tutor[] = (props as any).tutors ?? [];
    const errors = (props as any).errors ?? {};
    const graceMinutes: number = Number((props as any).clock_in_grace_minutes ?? 10);

    const appTimezone: string | null = ((props as any).app_timezone as string | undefined) ?? null;

    // Use a ticking clock so schedule eligibility stays current.
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const id = window.setInterval(() => setNow(new Date()), 15_000);
        return () => window.clearInterval(id);
    }, []);

    // Consistent "local" schedule verification: use app timezone when provided.
    const nowContext = useMemo(() => getNowContext(now, appTimezone), [appTimezone, now]);

    const [tutorQuery, setTutorQuery] = useState('');
    const [selectedTutorId, setSelectedTutorId] = useState<number | null>(null);

    const [tutorOpen, setTutorOpen] = useState(false);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmTitle, setConfirmTitle] = useState('');
    const [confirmDescription, setConfirmDescription] = useState('');

    const tutorOptions = useMemo(() => {
        return tutors.map((t) => {
            const name = `${t.firstname ?? ''} ${t.lastname ?? ''}`.trim();
            const label = `${name}${t.tutorid ? ` (${t.tutorid})` : ''}`.trim();
            return { ...t, name, label };
        });
    }, [tutors]);

    const tutorSuggestions = useMemo(() => {
        const q = String(tutorQuery ?? '').toLowerCase().trim();
        const filtered = tutorOptions.filter((t) => {
            const name = String(t.name ?? '').toLowerCase();
            const tutorId = String((t as any).tutorid ?? '').toLowerCase();
            const id = String((t as any).id ?? '').toLowerCase();

            if (!q) return true;
            return name.includes(q) || tutorId.includes(q) || id.includes(q);
        });
        return filtered.slice(0, 20);
    }, [tutorOptions, tutorQuery]);

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

    const resolvedTutor = useMemo(() => {
        if (selectedTutorId !== null) {
            return tutorOptions.find((t) => t.id === selectedTutorId) ?? null;
        }
        return resolveTutorFromInput(tutorQuery);
    }, [resolveTutorFromInput, selectedTutorId, tutorOptions, tutorQuery]);

    const resolveTutorPayload = () => {
        if (resolvedTutor) return String(resolvedTutor.id);
        return (tutorQuery ?? '').trim();
    };

    const resetForm = () => {
        setTutorQuery('');
        setSelectedTutorId(null);
    };

    const scheduleStatus = useMemo(() => {
        if (!resolvedTutor) {
            return { canTimeIn: false, message: 'Select a tutor to verify schedule.' };
        }

        const tutor = resolvedTutor;

        const dayName = nowContext.dayName;
        const nowMinutes = nowContext.nowMinutes;

        const tutorials = Array.isArray((tutor as any).tutorials) ? ((tutor as any).tutorials as any[]) : [];
        const candidates = tutorials
            .filter((tr) => tr && tr.status !== 'Cancelled' && tr.status !== 'Completed')
            .filter((tr) => isDayWithinRange(tr.start_date, tr.end_date, nowContext.todayYmd));

        let best: any | null = null;
        let bestSchedule: ScheduleEntry | null = null;
        let bestRank: number | null = null;

        for (const tr of candidates) {
            const schedules = safeSchedules(tr.tutorial_schedule);
            for (const sc of schedules) {
                const days = normalizeDays(sc.days);
                if (!days.includes(dayName)) continue;

                const startMin = timeToMinutes(sc.start_time);
                const endMin = timeToMinutes(sc.end_time);
                if (startMin === null || endMin === null) continue;

                const grace = Math.max(0, graceMinutes);
                // Do not allow if the scheduled time has already passed (end time).
                // This intentionally allows clock-in earlier than the start time as long as
                // the session for today has not yet ended.
                if (nowMinutes >= endMin) continue;

                const rank = nowMinutes >= startMin ? endMin : startMin;
                if (bestRank === null || rank < bestRank) {
                    best = tr;
                    bestSchedule = sc;
                    bestRank = rank;
                }
            }
        }

        if (!best || !bestSchedule) {
            return {
                canTimeIn: false,
                message: 'No schedule in the current time window for this tutor.',
            };
        }

        const startMin = timeToMinutes(bestSchedule.start_time) ?? 0;
        const isEarly = nowMinutes < startMin;
        const studentName = best.student_name ? ` — ${best.student_name}` : '';

        return {
            canTimeIn: true,
            message: `${isEarly ? 'Upcoming. ' : 'Ongoing. '}Matched ${best.tutorialid}${studentName} (${formatTime12h(bestSchedule.start_time)}–${formatTime12h(bestSchedule.end_time)}).`,
        };
    }, [graceMinutes, nowContext, resolvedTutor, tutorOptions]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Time Clock" />

            <div className="p-4">
                <div className="mb-4 flex items-center gap-2">
                    <Link href="/attendance">
                        <Button variant="ghost">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-semibold">Time Clock</h1>
                </div>

                <div className="rounded-md border bg-background p-4 max-w-2xl">
                    <div className="grid gap-4">
                        <div>
                            <label className="block text-sm text-muted-foreground mb-1">Tutor</label>
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
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {errors.tutorid && <div className="mt-1 text-sm text-destructive">{errors.tutorid}</div>}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                disabled={!scheduleStatus.canTimeIn}
                                onClick={() => {
                                    const payload = resolveTutorPayload();
                                    const at = formatNowTime12hWithSeconds(new Date(), appTimezone);
                                    router.post(
                                        '/attendance/time-in',
                                        { tutorid: payload },
                                        {
                                            onSuccess: () => {
                                                setConfirmTitle('Time In recorded');
                                                setConfirmDescription(`Recorded at ${at}.`);
                                                setConfirmOpen(true);
                                                resetForm();
                                            },
                                        }
                                    );
                                }}
                            >
                                <ClockArrowUp className="mr-2 h-4 w-4" /> Time In
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => {
                                    const payload = resolveTutorPayload();
                                    const at = formatNowTime12hWithSeconds(new Date(), appTimezone);
                                    router.post(
                                        '/attendance/time-out',
                                        { tutorid: payload },
                                        {
                                            onSuccess: () => {
                                                setConfirmTitle('Time Out recorded');
                                                setConfirmDescription(`Recorded at ${at}.`);
                                                setConfirmOpen(true);
                                                resetForm();
                                            },
                                        }
                                    );
                                }}
                            >
                                Time Out
                            </Button>
                        </div>

                        <div className="text-sm text-muted-foreground">{scheduleStatus.message}</div>
                    </div>
                </div>
            </div>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{confirmTitle}</DialogTitle>
                        <DialogDescription>{confirmDescription}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            onClick={() => {
                                setConfirmOpen(false);
                            }}
                        >
                            OK
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
