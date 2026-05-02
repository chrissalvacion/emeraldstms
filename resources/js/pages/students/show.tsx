import AppLayout from '@/layouts/app-layout';
import { students } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    ArrowLeft,
    UserPlus,
    Edit,
    Trash2,
    IdCard,
    User,
    Cake,
    GraduationCap,
    School,
    Users,
    Phone,
    CalendarPlus,
    Info,
    Calendar,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { InfoField } from '@/components/ui/info-field';
import { useState, useMemo } from 'react';

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function formatYmd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function parseYmdToLocalDate(ymd: string): Date | null {
    if (!ymd) return null;
    const d = new Date(`${ymd}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
}

function timeToMinutes(value: any): number | null {
    if (!value || typeof value !== 'string') return null;
    const raw = value.trim();
    if (!raw) return null;

    const h24 = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (h24) {
        const hh = Number(h24[1]);
        const mm = Number(h24[2]);
        if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
        if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
        return hh * 60 + mm;
    }

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

export default function StudentShow() {
    const { props } = usePage();
    const student = (props as any).student ?? {
        id: 0,
        tuteeid: '',
        firstname: '',
        middlename: '',
        lastname: '',
        date_of_birth: null,
        grade_level: null,
        school: null,
        parent_name: null,
        parent_contact: null,
        created_at: null,
        updated_at: null,
    };

    const tutorials = ((props as any).tutorials ?? []) as any[];
    const billings = ((props as any).billings ?? []) as any[];
    const attendances = tutorials.flatMap((t: any) => (t.attendances ?? []).map((a: any) => ({ ...a, tutorial: t })));

    const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tutees', href: students().url },
    { title: `${student.firstname ?? ''} ${student.middlename ?? ''} ${student.lastname ?? ''}`.trim() || '—', href:'#'},
    ];

    const fullName = `${student.firstname ?? ''} ${student.middlename ?? ''} ${student.lastname ?? ''}`.trim() || 'Tutee';

    const scheduleDisplay = (() => {
        const val = student.schedule_days;
        if (Array.isArray(val)) return val.join(', ');
        if (typeof val === 'string') {
            try {
                const parsed = JSON.parse(val);
                if (Array.isArray(parsed)) return parsed.join(', ');
                return val;
            } catch (e) {
                return val;
            }
        }
        return '—';
    })();

    const [confirmOpen, setConfirmOpen] = useState(false);
    const today = useMemo(() => new Date(), []);
    const [visibleYear, setVisibleYear] = useState(() => today.getFullYear());
    const [visibleMonth, setVisibleMonth] = useState(() => today.getMonth());
    const [selectedYmd, setSelectedYmd] = useState<string | null>(() => formatYmd(today));
    const [rangeStartYmd, setRangeStartYmd] = useState<string | null>(null);
    const [rangeEndYmd, setRangeEndYmd] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'student' | 'calendar'>('student');

    const formatTime12 = (timeStr: string) => {
        if (!timeStr) return '';
        // Expecting 'HH:mm' or similar
        const parts = String(timeStr).split(':');
        if (parts.length < 2) return timeStr;
        let hh = parseInt(parts[0], 10);
        const mm = parts[1];
        if (Number.isNaN(hh)) return timeStr;
        const ampm = hh >= 12 ? 'PM' : 'AM';
        hh = hh % 12;
        if (hh === 0) hh = 12;
        return `${hh}:${mm} ${ampm}`;
    };

    const formatCurrency = (value: any) => {
        const n = Number(value ?? 0);
        if (!Number.isFinite(n)) return '0.00';
        return n.toFixed(2);
    };

    const formatShortDate = (value: any) => {
        if (!value) return '—';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return String(value);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const computeRowHours = (timeIn: any, timeOut: any): number | null => {
        const inMin = timeToMinutes(timeIn);
        const outMin = timeToMinutes(timeOut);
        if (inMin === null || outMin === null) return null;

        let diff = outMin - inMin;
        if (diff < 0) diff += 24 * 60;
        if (diff <= 0) return null;
        return diff / 60;
    };

    const hoursByYmd = useMemo(() => {
        const map = new Map<string, number>();

        for (const a of attendances) {
            const hours = computeRowHours(a?.time_in, a?.time_out);
            if (hours === null) continue;

            const rawDate = a?.date ? String(a.date) : '';
            if (!rawDate) continue;

            let ymd: string | null = null;
            const m = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (m) {
                ymd = rawDate;
            } else {
                const d = new Date(rawDate);
                if (!Number.isNaN(d.getTime())) ymd = formatYmd(d);
            }

            if (!ymd) continue;
            map.set(ymd, (map.get(ymd) ?? 0) + hours);
        }

        return map;
    }, [attendances]);

    const setVisibleMonthAndMaybeSelectFirstDay = (year: number, month: number) => {
        setVisibleYear(year);
        setVisibleMonth(month);
        setSelectedYmd(formatYmd(new Date(year, month, 1)));
    };

    const goPrevMonth = () => {
        if (visibleMonth === 0) {
            setVisibleMonthAndMaybeSelectFirstDay(visibleYear - 1, 11);
            return;
        }
        setVisibleMonthAndMaybeSelectFirstDay(visibleYear, visibleMonth - 1);
    };

    const goNextMonth = () => {
        if (visibleMonth === 11) {
            setVisibleMonthAndMaybeSelectFirstDay(visibleYear + 1, 0);
            return;
        }
        setVisibleMonthAndMaybeSelectFirstDay(visibleYear, visibleMonth + 1);
    };

    const monthStart = useMemo(() => new Date(visibleYear, visibleMonth, 1), [visibleYear, visibleMonth]);
    const monthEnd = useMemo(() => new Date(visibleYear, visibleMonth + 1, 0), [visibleYear, visibleMonth]);
    const gridStart = useMemo(() => {
        const d = new Date(monthStart);
        d.setDate(d.getDate() - d.getDay());
        return d;
    }, [monthStart]);
    const gridEnd = useMemo(() => {
        const d = new Date(monthEnd);
        d.setDate(d.getDate() + (6 - d.getDay()));
        return d;
    }, [monthEnd]);

    const dates = useMemo(() => {
        const out: Date[] = [];
        const cur = new Date(gridStart);
        while (cur.getTime() <= gridEnd.getTime()) {
            out.push(new Date(cur));
            cur.setDate(cur.getDate() + 1);
        }
        return out;
    }, [gridStart, gridEnd]);

    const monthLabel = useMemo(() => {
        return monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }, [monthStart]);

    const selectedDateLabel = useMemo(() => {
        if (!selectedYmd) return '';
        const d = parseYmdToLocalDate(selectedYmd);
        if (!d) return selectedYmd;
        return d.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }, [selectedYmd]);

    const selectedDayHours = useMemo(() => {
        if (!selectedYmd) return 0;
        return hoursByYmd.get(selectedYmd) ?? 0;
    }, [hoursByYmd, selectedYmd]);

    const rangeBounds = useMemo(() => {
        if (!rangeStartYmd) return null;
        if (!rangeEndYmd) {
            return { start: rangeStartYmd, end: rangeStartYmd };
        }

        return rangeStartYmd <= rangeEndYmd
            ? { start: rangeStartYmd, end: rangeEndYmd }
            : { start: rangeEndYmd, end: rangeStartYmd };
    }, [rangeStartYmd, rangeEndYmd]);

    const selectedRangeLabel = useMemo(() => {
        if (!rangeBounds) return 'Select start and end dates from calendar';

        const start = parseYmdToLocalDate(rangeBounds.start);
        const end = parseYmdToLocalDate(rangeBounds.end);

        if (!start || !end) return `${rangeBounds.start} to ${rangeBounds.end}`;

        const startText = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const endText = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        return `${startText} to ${endText}`;
    }, [rangeBounds]);

    const selectedRangeHours = useMemo(() => {
        if (!rangeBounds) return 0;

        let total = 0;
        for (const [ymd, hours] of hoursByYmd.entries()) {
            if (ymd >= rangeBounds.start && ymd <= rangeBounds.end) {
                total += hours;
            }
        }

        return total;
    }, [hoursByYmd, rangeBounds]);

    const handleCalendarDateClick = (ymd: string) => {
        setSelectedYmd(ymd);

        if (!rangeStartYmd || (rangeStartYmd && rangeEndYmd)) {
            setRangeStartYmd(ymd);
            setRangeEndYmd(null);
            return;
        }

        if (ymd < rangeStartYmd) {
            setRangeEndYmd(rangeStartYmd);
            setRangeStartYmd(ymd);
            return;
        }

        setRangeEndYmd(ymd);
    };

    const selectedDayAttendances = useMemo(() => {
        if (!selectedYmd) return [];
        return attendances.filter((a: any) => {
            const rawDate = a?.date ? String(a.date) : '';
            if (!rawDate) return false;
            const m = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            const ymd = m ? rawDate : formatYmd(new Date(rawDate));
            return ymd === selectedYmd;
        });
    }, [attendances, selectedYmd]);

    const tutorialCompletedHours = useMemo(() => {
        const map = new Map<string, number>();

        for (const attendance of attendances) {
            const tutorialKey = String(attendance?.tutorial?.tutorialid ?? attendance?.tutorial?.id ?? '');
            if (!tutorialKey) continue;

            const hours = computeRowHours(attendance?.time_in, attendance?.time_out);
            if (hours === null) continue;

            map.set(tutorialKey, (map.get(tutorialKey) ?? 0) + hours);
        }

        return map;
    }, [attendances]);

    const selectedTutorialSummaries = useMemo(() => {
        const seen = new Set<string>();

        return selectedDayAttendances.reduce(
            (summaries, attendance: any) => {
                const tutorialKey = String(attendance?.tutorial?.tutorialid ?? attendance?.tutorial?.id ?? '');
                if (!tutorialKey || seen.has(tutorialKey)) return summaries;

                seen.add(tutorialKey);
                summaries.push({
                    tutorialKey,
                    tutorialName: attendance?.tutorial?.tutorialid ?? 'N/A',
                    tutorName: attendance?.tutorial?.tutor_name ?? '—',
                    completedHours: tutorialCompletedHours.get(tutorialKey) ?? 0,
                });

                return summaries;
            },
            [] as Array<{
                tutorialKey: string;
                tutorialName: string;
                tutorName: string;
                completedHours: number;
            }>,
        );
    }, [selectedDayAttendances, tutorialCompletedHours]);

    const totalAttendanceHours = useMemo(() => {
        let total = 0;
        for (const hours of hoursByYmd.values()) {
            total += hours;
        }
        return total;
    }, [hoursByYmd]);

    const selectedDateBillings = useMemo(() => {
        if (!selectedYmd) return billings;

        return billings.filter((billing) => {
            const start = String(billing?.billing_startdate ?? '').trim();
            const end = String(billing?.billing_enddate ?? '').trim();

            if (start && end) {
                return selectedYmd >= start && selectedYmd <= end;
            }
            if (start) {
                return selectedYmd >= start;
            }
            if (end) {
                return selectedYmd <= end;
            }

            return false;
        });
    }, [billings, selectedYmd]);

    const selectedDateBillingTotals = useMemo(() => {
        return selectedDateBillings.reduce(
            (acc, billing) => {
                acc.actualAmount += Number(billing?.actual_amount ?? 0);
                acc.amountPaid += Number(billing?.amount_paid ?? 0);
                acc.balance += Number(billing?.balance ?? 0);
                return acc;
            },
            { actualAmount: 0, amountPaid: 0, balance: 0 },
        );
    }, [selectedDateBillings]);

    const allBillingTotals = useMemo(() => {
        return billings.reduce(
            (acc, billing) => {
                acc.actualAmount += Number(billing?.actual_amount ?? 0);
                acc.amountPaid += Number(billing?.amount_paid ?? 0);
                acc.balance += Number(billing?.balance ?? 0);
                return acc;
            },
            { actualAmount: 0, amountPaid: 0, balance: 0 },
        );
    }, [billings]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={'Tutee ' + fullName} />

            <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-4 mb-6 mt-4">
                    {/* <Link href={students().url}>
                        <Button variant="ghost">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                    </Link> */}
                    <h1 className="text-2xl font-semibold">{`${student.firstname ?? ''} ${student.middlename ?? ''} ${student.lastname ?? ''}`.trim() || '—'}</h1>
                    
                    <div className="ml-auto flex items-center gap-2">
                        <Link href={`/tutorials/create?student=${student.id}`}>
                            <Button variant="outline" size="sm" aria-label="Assign Tutor">
                                <UserPlus className="h-4 w-4 mr-2" /> Assign Tutor
                            </Button>
                        </Link>

                        <Link href={`${students().url}/${student.encrypted_id}/edit`}>
                            <Button variant="outline" size="sm" aria-label="Edit Student">
                                <Edit className="h-4 w-4" />
                            </Button>
                        </Link>

                        <button
                            type="button"
                            onClick={() => setConfirmOpen(true)}
                            className="inline-flex items-center justify-center rounded-md p-2 hover:bg-muted"
                            aria-label="Delete Student"
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                    </div>
                </div>

                <div className="mb-6 rounded-xl border bg-background p-2">
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab('student')}
                            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                                activeTab === 'student' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'
                            }`}
                        >
                            Student Info & Tutorials
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('calendar')}
                            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                                activeTab === 'calendar' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'
                            }`}
                        >
                            Calendar
                        </button>
                    </div>
                </div>

                {activeTab === 'student' && (
                    <div className="space-y-6">
                        <div className="rounded-xl border bg-background p-4">
                            <h2 className="mb-3 flex items-center gap-2 text-lg font-medium">
                                <Info className="h-5 w-5 text-muted-foreground" />
                                Tutee Information
                            </h2>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <InfoField icon={IdCard} label="Tutee ID" value={student.tuteeid ?? '—'} />
                        <br/>
                        <InfoField
                            icon={User}
                            label="Full Name"
                            value={
                                `${student.firstname ?? ''} ${student.middlename ?? ''} ${student.lastname ?? ''}`.trim() || '—'
                            }
                        />

                        <InfoField icon={School} label="School" value={student.school ?? '—'} />

                        {/* <InfoField icon={GraduationCap} label="Grade Level" value={student.grade_level ?? '—'} /> */}
                        <InfoField
                            icon={Cake}
                            label="Date of Birth"
                            value={
                                student.date_of_birth
                                    ? (() => {
                                          const d = new Date(student.date_of_birth);
                                          if (isNaN(d.getTime())) return '—';
                                          const mm = String(d.getMonth() + 1).padStart(2, '0');
                                          const dd = String(d.getDate()).padStart(2, '0');
                                          const yyyy = d.getFullYear();
                                          return `${mm}/${dd}/${yyyy}`;
                                      })()
                                    : '—'
                            }
                        />
                    
                        <br/>
                        <InfoField icon={Users} label="Parent / Guardian" value={student.parent_name ?? '—'} />
                        <InfoField icon={Phone} label="Parent's Contact" value={student.parent_contact ?? '—'} />

                        <InfoField
                            icon={CalendarPlus}
                            label="Registered At"
                            value={
                                student.created_at
                                    ? (() => {
                                          const d = new Date(student.created_at);
                                          if (isNaN(d.getTime())) return '—';
                                          const mm = String(d.getMonth() + 1).padStart(2, '0');
                                          const dd = String(d.getDate()).padStart(2, '0');
                                          const yyyy = d.getFullYear();
                                          return `${mm}/${dd}/${yyyy}`;
                                      })()
                                    : '—'
                            }
                        />
                            </div>
                        </div>

                         <div className="rounded-xl border bg-background p-4">
                            <h2 className="text-lg font-medium mb-3">Enrolled Tutorials</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full table-fixed">
                                    <thead>
                                        <tr className="text-left text-sm text-muted-foreground">
                                            <th className="w-[140px] px-3 py-2">Tutorial ID</th>
                                            <th className="w-[160px] px-3 py-2">Date Enrolled</th>
                                            <th className="w-[220px] px-3 py-2">Tutor</th>
                                            {/* <th className="w-[280px] px-3 py-2">Schedule</th>
                                            <th className="w-[200px] px-3 py-2">Time</th> */}
                                            <th className="w-[120px] px-3 py-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {((props as any).tutorials ?? []).length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="p-4 text-center text-sm text-muted-foreground">No enrolled sessions.</td>
                                            </tr>
                                        )}

                                        {((props as any).tutorials ?? []).map((t: any) => (
                                            <tr key={t.id} className="border-t">
                                                <td className="px-3 py-2">
                                                    <Link href={`/tutorials/${t.encrypted_id ?? t.id}`} className="text-primary">{t.tutorialid ?? t.id}</Link>
                                                </td>
                                                <td className="px-3 py-2">{t.created_at ? (() => {
                                                    const d = new Date(t.created_at);
                                                    if (isNaN(d.getTime())) return '—';
                                                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                                                    const dd = String(d.getDate()).padStart(2, '0');
                                                    const yyyy = d.getFullYear();
                                                    return `${mm}/${dd}/${yyyy}`;
                                                })() : '—'}</td>
                                                 <td className="px-3 py-2 break-words">{t.tutor_name ?? '-'}</td>
                                                {/*<td className="px-3 py-2 break-words">
                                                    {(() => {
                                                        const sched = t.tutorial_schedule ?? [];
                                                        const schedules = Array.isArray(sched) ? sched : (() => {
                                                            try { return JSON.parse(sched); } catch (e) { return []; }
                                                        })();
                                                        if (!schedules.length) return '-';
                                                        return schedules.map((s: any) => (Array.isArray(s.days) ? s.days.join(', ') : (s.days ?? ''))).join('; ');
                                                    })()}
                                                </td>
                                                <td className="px-3 py-2 break-words">
                                                    {(() => {
                                                        const sched = t.tutorial_schedule ?? [];
                                                        const schedules = Array.isArray(sched) ? sched : (() => {
                                                            try { return JSON.parse(sched); } catch (e) { return []; }
                                                        })();
                                                        if (!schedules.length) return '-';
                                                        return schedules.map((s: any) => {
                                                            const start = s.start_time ?? '';
                                                            const end = s.end_time ?? '';
                                                            const fs = start ? formatTime12(start) : '';
                                                            const fe = end ? formatTime12(end) : '';
                                                            return fs ? (fe ? `${fs} — ${fe}` : fs) : (fe || '-');
                                                        }).join('; ');
                                                    })()}
                                                </td> */}
                                                <td className="px-3 py-2">{t.status ?? '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'calendar' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            <div className="lg:col-span-2 rounded-xl border bg-background p-5">
                                <h2 className="text-lg font-semibold mb-4">Attendance Calendar</h2>

                                <div className="flex items-center justify-between gap-2 mb-4">
                                    <h3 className="font-semibold text-base">{monthLabel}</h3>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={goPrevMonth}
                                            aria-label="Previous month"
                                            title="Previous month"
                                            className="h-8 w-8"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={goNextMonth}
                                            aria-label="Next month"
                                            title="Next month"
                                            className="h-8 w-8"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-7 gap-2 mb-3">
                                    {dayLabels.map((d) => (
                                        <div
                                            key={d}
                                            className="text-center text-sm font-medium text-muted-foreground p-2"
                                        >
                                            {d}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-2">
                                    {dates.map((d) => {
                                        const ymd = formatYmd(d);
                                        const inMonth = d.getMonth() === visibleMonth;
                                        const isToday = formatYmd(d) === formatYmd(today);
                                        const isSelected = selectedYmd === ymd;
                                        const isRangeStart = rangeBounds?.start === ymd;
                                        const isRangeEnd = rangeBounds?.end === ymd;
                                        const isInRange = !!rangeBounds && ymd >= rangeBounds.start && ymd <= rangeBounds.end;
                                        const hours = hoursByYmd.get(ymd) ?? 0;

                                        return (
                                            <div
                                                key={ymd}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => handleCalendarDateClick(ymd)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        handleCalendarDateClick(ymd);
                                                    }
                                                }}
                                                className={
                                                    'aspect-square min-h-16 flex flex-col items-center justify-center rounded-md border text-xs cursor-pointer transition-all ' +
                                                    (inMonth ? '' : 'opacity-40 ') +
                                                    (isRangeStart || isRangeEnd
                                                        ? 'bg-primary/20 border-primary '
                                                        : isInRange
                                                          ? 'bg-muted/60 '
                                                          : isToday
                                                            ? 'bg-muted '
                                                            : 'bg-background ') +
                                                    (isSelected || isRangeStart || isRangeEnd
                                                        ? 'ring-2 ring-ring ring-offset-1'
                                                        : 'hover:bg-muted/50 ')
                                                }
                                            >
                                                <div className="font-medium text-center text-sm">{d.getDate()}</div>
                                                {hours > 0 ? (
                                                    <div className="text-[15px] text-muted-foreground leading-tight">
                                                        {hours.toFixed(1)}h
                                                    </div>
                                                ) : null}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="lg:col-span-1 rounded-xl border bg-background p-4">
                                <div className="rounded-xl border bg-muted/30 p-3 text-sm">
                                    <div className="text-xs font-medium text-foreground mb-1">Selected Range</div>
                                    <div className="text-xs text-muted-foreground mb-2">{selectedRangeLabel}</div>
                                    <div className="text-lg font-semibold text-primary mb-3">{selectedRangeHours.toFixed(2)} hrs completed</div>

                                    <div className="text-xs text-muted-foreground mb-2">
                                        {selectedDateLabel || 'Select a day'}
                                    </div>
                                    <div className="text-2xl font-semibold text-primary">
                                        {selectedDayHours.toFixed(2)} hrs
                                    </div>
                                    {selectedTutorialSummaries.length > 0 && (
                                        <div className="mt-3 pt-3 border-t">
                                            <div className="text-xs font-medium text-foreground mb-2">Tutorial Session Totals</div>
                                            <div className="space-y-2">
                                                {selectedTutorialSummaries.map((summary: {
                                                    tutorialKey: string;
                                                    tutorialName: string;
                                                    tutorName: string;
                                                    completedHours: number;
                                                }) => (
                                                    <div key={summary.tutorialKey} className="flex items-start justify-between gap-3 text-xs">
                                                        <div className="min-w-0">
                                                            <div className="font-medium text-foreground">{summary.tutorialName}</div>
                                                            <div className="text-muted-foreground truncate">{summary.tutorName}</div>
                                                        </div>
                                                        <div className="font-semibold text-foreground whitespace-nowrap">
                                                            {summary.completedHours.toFixed(2)} hrs
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div> 
                                    )}

                                    <div className="mt-3 pt-3 border-t space-y-3">
                                        <div className="text-xs font-medium text-foreground">Billing Summary (Selected Date)</div>
                                        <div className="rounded-md border bg-background/70 p-3">
                                            <div className="text-xs text-muted-foreground">Selected Date</div>
                                            <div className="text-sm font-semibold">{selectedDateLabel || '—'}</div>
                                        </div>
                                        <div className="rounded-md border bg-background/70 p-3">
                                            <div className="text-xs text-muted-foreground">Total Amount</div>
                                            <div className="text-lg font-semibold">{formatCurrency(selectedDateBillingTotals.actualAmount)}</div>
                                        </div>
                                        <div className="rounded-md border bg-background/70 p-3">
                                            <div className="text-xs text-muted-foreground">Amount Paid</div>
                                            <div className="text-lg font-semibold">{formatCurrency(selectedDateBillingTotals.amountPaid)}</div>
                                        </div>
                                        <div className="rounded-md border bg-background/70 p-3">
                                            <div className="text-xs text-muted-foreground">Balance</div>
                                            <div className="text-lg font-semibold">{formatCurrency(selectedDateBillingTotals.balance)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border bg-background p-4">
                            <h2 className="text-lg font-medium mb-3">Related Billings</h2>
                            <div className="overflow-x-auto">
                                    <table className="w-full table-fixed">
                                    <thead>
                                        <tr className="text-left text-sm text-muted-foreground">
                                            <th className="w-[180px] px-3 py-2">Billing ID</th>
                                            <th className="w-[220px] px-3 py-2">Billing Date</th>
                                            <th className="w-[180px] px-3 py-2">Tutor</th>
                                            <th className="w-[120px] px-3 py-2 text-right">Actual Amount</th>
                                            <th className="w-[110px] px-3 py-2 text-right">Total Hours</th>
                                            <th className="w-[120px] px-3 py-2 text-right">Total Amount Paid</th>
                                            <th className="w-[120px] px-3 py-2 text-right">Balance</th>
                                            <th className="w-[120px] px-3 py-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {billings.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="p-4 text-center text-sm text-muted-foreground">
                                                    No related billings found.
                                                </td>
                                            </tr>
                                        )}

                                        {billings.map((b: any) => (
                                            <tr key={b.id} className="border-t odd:bg-transparent even:bg-muted/50">
                                                <td className="px-3 py-2 break-words">
                                                    <Link href={`/billings/${b.encrypted_id ?? b.id}`} className="text-primary">
                                                        {b.billingid ?? '—'}
                                                    </Link>
                                                </td>
                                                <td className="px-3 py-2">
                                                    {(b.billing_startdate || b.billing_enddate)
                                                        ? `${formatShortDate(b.billing_startdate)} - ${formatShortDate(b.billing_enddate)}`
                                                        : '—'}
                                                </td>
                                                <td className="px-3 py-2 break-words">
                                                    {Array.isArray(b.tutor_names) && b.tutor_names.length > 0
                                                        ? b.tutor_names.join(', ')
                                                        : '—'}
                                                </td>
                                                <td className="px-3 py-2 text-right">{formatCurrency(b.actual_amount)}</td>
                                                <td className="px-3 py-2 text-right">{formatCurrency(b.total_hours)}</td>
                                                <td className="px-3 py-2 text-right align-top">
                                                    <div>{formatCurrency(b.amount_paid)}</div>
                                                    {/* {Array.isArray(b.tutorial_paid_breakdown) && b.tutorial_paid_breakdown.length > 0 && (
                                                        <div className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                                                            {b.tutorial_paid_breakdown.map((item: any) => (
                                                                <div key={`${b.id}-${item.tutorialid}`}>
                                                                    {item.tutor_name ?? item.tutorialid}: {formatCurrency(item.amount_paid)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )} */}
                                                </td>
                                                <td className="px-3 py-2 text-right">{formatCurrency(b.balance)}</td>
                                                <td className="px-3 py-2">{(b.status ?? '—').toLowerCase()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    </table>
                            </div>
                        </div>

                    </div>
                )}
            </div>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete student</DialogTitle>
                        <DialogDescription>Are you sure you want to delete this student? This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <button type="button" className="btn" onClick={() => setConfirmOpen(false)}>Cancel</button>
                        <button
                            type="button"
                            className="btn btn-destructive ml-2"
                            onClick={() => {
                                router.delete(`${students().url}/${student.encrypted_id}`);
                                setConfirmOpen(false);
                            }}
                        >
                            Delete
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
