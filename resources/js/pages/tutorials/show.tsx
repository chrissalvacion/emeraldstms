import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { tutorials } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Hash,
    User,
    UserCog,
    Calendar,
    CalendarClock,
    BadgeCheck,
    Info,
    Pen,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { InfoField } from '@/components/ui/info-field';
import { useEffect, useMemo, useState } from 'react';

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function parseYmdToLocalDate(ymd: string): Date | null {
    if (!ymd) return null;
    // Use noon to avoid timezone shift for date-only strings.
    const d = new Date(`${ymd}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
}

function formatYmd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
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

function formatTime24h(value: any) {
    if (!value) return '—';
    const minutes = timeToMinutes(value);
    if (minutes === null) return String(value);
    const hh24 = Math.floor(minutes / 60) % 24;
    const mm = minutes % 60;
    return `${String(hh24).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function formatTime12h(value: any) {
    if (!value) return '—';
    const minutes = timeToMinutes(value);
    if (minutes === null) return String(value);

    const hh24 = Math.floor(minutes / 60) % 24;
    const mm = minutes % 60;
    const suffix = hh24 >= 12 ? 'PM' : 'AM';
    const hh12 = ((hh24 + 11) % 12) + 1;
    return `${hh12}:${String(mm).padStart(2, '0')} ${suffix}`;
}

function formatDate(value: any) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('en-US');
}

function formatCurrencyPHP(value: any): string {
    const n = Number(value);
    if (!Number.isFinite(n)) return '—';
    return `₱${n.toFixed(2)}`;
}

export default function TutorialShow() {
    const { props } = usePage();
    const tutorial = (props as any).tutorial ?? null;
    const attendances = ((props as any).attendances ?? []) as any[];

    const { patch, processing } = useForm();

    const today = useMemo(() => new Date(), []);
    const [visibleYear, setVisibleYear] = useState(() => today.getFullYear());
    const [visibleMonth, setVisibleMonth] = useState(() => today.getMonth());
    const [selectedYmd, setSelectedYmd] = useState<string | null>(() => formatYmd(today));

    if (!tutorial) {
        return (
            <AppLayout>
                <Head title="Tutorial" />
                <div className="p-4">Tutorial not found.</div>
            </AppLayout>
        );
    }

    let schedules: any = tutorial.tutorial_schedule ?? [];
    if (typeof schedules === 'string') {
        try {
            const parsed = JSON.parse(schedules);
            if (Array.isArray(parsed)) schedules = parsed;
        } catch (e) {
            // leave as-is if not valid JSON
        }
    }

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Tutorials', href: tutorials().url },
        { title: tutorial.tutorialid ?? '—', href: '#' },
    ];

    const isPrepaid = Number(tutorial.prepaid_hours ?? 0) > 0;

    const computedCompletedHours = (() => {
        let totalHours = 0;
        attendances.forEach((a: any) => {
            const timeIn = timeToMinutes(a.time_in);
            const timeOut = timeToMinutes(a.time_out);
            if (timeIn === null || timeOut === null) return;

            let diff = timeOut - timeIn;
            if (diff < 0) diff += 24 * 60;
            if (diff <= 0) return;
            totalHours += diff / 60;
        });
        return totalHours;
    })();

    const completedHoursValue =
        tutorial.completed_hours !== null && tutorial.completed_hours !== undefined
            ? Number(tutorial.completed_hours)
            : computedCompletedHours;

    const prepaidHoursValue =
        tutorial.prepaid_hours !== null && tutorial.prepaid_hours !== undefined
            ? Number(tutorial.prepaid_hours)
            : null;

    const packageDurationHoursValue =
        tutorial.duration_hours !== null && tutorial.duration_hours !== undefined
            ? Number(tutorial.duration_hours)
            : null;

    const allowedHoursValue = isPrepaid ? prepaidHoursValue : packageDurationHoursValue;

    const remainingHoursValue =
        tutorial.remaining_hours !== null && tutorial.remaining_hours !== undefined
            ? Number(tutorial.remaining_hours)
            : allowedHoursValue !== null
              ? Math.max(0, allowedHoursValue - computedCompletedHours)
              : null;

    function computeRowHours(timeIn: any, timeOut: any): number | null {
        const inMin = timeToMinutes(timeIn);
        const outMin = timeToMinutes(timeOut);
        if (inMin === null || outMin === null) return null;

        let diff = outMin - inMin;
        if (diff < 0) diff += 24 * 60;
        if (diff <= 0) return null;
        return diff / 60;
    }

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

    const hourlyRate =
        tutorial.tutee_fee_amount !== null && tutorial.tutee_fee_amount !== undefined
            ? Number(tutorial.tutee_fee_amount)
            : null;

    const amountDue =
        hourlyRate !== null && Number.isFinite(hourlyRate)
            ? Math.max(0, completedHoursValue * hourlyRate)
            : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Tutorial ${tutorial.tutorialid ?? ''}`} />

            <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-4 mb-6 mt-4">
                    {/* <Link href={tutorials().url}>
                        <Button variant="ghost">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                    </Link> */}
                    <h1 className="text-2xl font-semibold">Tutorial - {tutorial.student_name ?? '—'} ({tutorial.tutorialid ?? '—'}) </h1>
                    <div className="ml-auto flex items-center gap-2">
                        {tutorial.status !== 'Complete' && (
                            <Button
                                variant="default"
                                disabled={processing}
                                onClick={() => patch(`/tutorials/${tutorial.encrypted_id}/complete`)}
                            >
                                <CheckCircle className="h-4 w-4" /> Mark as Complete
                            </Button>
                        )}
                        <Button asChild variant="outline">
                            <Link href={`/tutorials/${tutorial.encrypted_id}/edit`}>
                                <Pen className="h-4 w-4" /> Edit
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="rounded-lg border bg-background p-4">
                            <h2 className="mb-3 flex items-center gap-2 text-lg font-medium">
                                <Info className="h-5 w-5 text-muted-foreground" />
                                Tutorial Details
                            </h2>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <InfoField icon={Hash} label="Tutorial ID" value={tutorial.tutorialid ?? '—'} />
                                <InfoField icon={BadgeCheck} label="Status" value={tutorial.status ?? '—'} />
                                <InfoField icon={User} label="Student" value={tutorial.student_name ?? tutorial.studentid ?? '—'} />
                                <InfoField icon={UserCog} label="Tutor" value={tutorial.tutor_name ?? tutorial.tutorid ?? '—'} />
                                <InfoField icon={Calendar} label="Start Date" value={formatDate(tutorial.start_date)} />
                                <InfoField icon={CalendarClock} label="End Date" value={formatDate(tutorial.end_date)} />
                                <InfoField
                                    icon={Info}
                                    label="Package"
                                    value={
                                        tutorial.package_name
                                            ? `${tutorial.package_name}${tutorial.package_type ? ` (${tutorial.package_type})` : ''}`
                                            : tutorial.packageid
                                              ? `Package #${tutorial.packageid}`
                                              : '—'
                                    }
                                />
                                <InfoField icon={Info} label="Level" value={tutorial.level ?? '—'} />
                                <InfoField
                                    icon={Info}
                                    label="Tutee Fee"
                                    value={
                                        tutorial.tutee_fee_amount !== null && tutorial.tutee_fee_amount !== undefined
                                            ? `₱${Number(tutorial.tutee_fee_amount).toFixed(2)}`
                                            : '—'
                                    }
                                />
                            </div>

                            <div className="mt-6 border-t pt-4">
                                <h3 className="mb-3 text-lg font-medium">Schedules</h3>
                                {Array.isArray(schedules) && schedules.length ? (
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {schedules.map((s: any, i: number) => (
                                            <div key={i} className="rounded-md border bg-muted/30 p-4">
                                                <div className="text-sm text-muted-foreground">
                                                    Days:{' '}
                                                    <span className="font-normal text-foreground">
                                                        {(Array.isArray(s.days)
                                                            ? s.days
                                                            : typeof s.days === 'string'
                                                              ? [s.days]
                                                              : []
                                                        ).join(', ') || '—'}
                                                    </span>
                                                </div>
                                                <div className="mt-2 text-sm text-muted-foreground">
                                                    Time:{' '}
                                                    <span className="font-normal text-foreground">
                                                        {s.start_time && s.end_time
                                                            ? `${formatTime12h(s.start_time)} — ${formatTime12h(s.end_time)}`
                                                            : '—'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground">No schedules defined.</div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-md border bg-background p-4">
                            <h2 className="mb-3 text-lg font-medium">
                                {isPrepaid ? 'Prepaid Package Details' : 'Session Billing'}
                            </h2>
                            {isPrepaid ? (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    <div className="rounded-md border bg-muted/30 p-4">
                                        <div className="text-sm text-muted-foreground">Prepaid Amount</div>
                                        <div className="mt-1 text-lg font-semibold">
                                            ₱{tutorial.prepaid_amount ? Number(tutorial.prepaid_amount).toFixed(2) : '0.00'}
                                        </div>
                                    </div>
                                    <div className="rounded-md border bg-muted/30 p-4">
                                        <div className="text-sm text-muted-foreground">Prepaid Hours</div>
                                        <div className="mt-1 text-lg font-semibold">{tutorial.prepaid_hours ?? '—'} hrs</div>
                                    </div>
                                    <div className="rounded-md border bg-muted/30 p-4">
                                        <div className="text-sm text-muted-foreground">Completed Hours</div>
                                        <div className="mt-1 text-lg font-semibold">{completedHoursValue.toFixed(2)} hrs</div>
                                    </div>
                                    <div className="rounded-md border bg-muted/30 p-4">
                                        <div className="text-sm text-muted-foreground">Remaining Hours</div>
                                        <div className="mt-1 text-lg font-semibold">
                                            {remainingHoursValue !== null && remainingHoursValue !== undefined
                                                ? `${Number(remainingHoursValue).toFixed(2)} hrs`
                                                : tutorial.remaining_prepaid_hours !== null &&
                                                    tutorial.remaining_prepaid_hours !== undefined
                                                  ? `${Number(tutorial.remaining_prepaid_hours).toFixed(2)} hrs`
                                                  : '—'}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="rounded-md border bg-muted/30 p-4">
                                        <div className="text-sm text-muted-foreground">Amount Due</div>
                                        <div className="mt-1 text-2xl font-semibold text-primary">
                                            {amountDue !== null ? formatCurrencyPHP(amountDue) : '—'}
                                        </div>
                                    </div>
                                    <div className="rounded-md border bg-muted/30 p-4">
                                        <div className="text-sm text-muted-foreground">Hours Completed</div>
                                        <div className="mt-1 text-2xl font-semibold text-primary">
                                            {completedHoursValue.toFixed(2)} hrs
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="rounded-md border bg-background p-4">
                            <h2 className="mb-3 text-lg font-medium">Attendance</h2>
                            {Array.isArray(attendances) && attendances.length ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full table-fixed text-sm">
                                        <thead>
                                            <tr className="text-left text-muted-foreground">
                                                <th className="w-[160px] px-3 py-2">Date</th>
                                                <th className="w-[160px] px-3 py-2">Time In</th>
                                                <th className="w-[160px] px-3 py-2">Time Out</th>
                                                <th className="w-[120px] px-3 py-2">Hours</th>
                                                <th className="px-3 py-2">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attendances.map((a: any, i: number) => (
                                                <tr key={a.id ?? i} className="border-t odd:bg-transparent even:bg-muted/50">
                                                    <td className="px-3 py-2">
                                                        {a.date
                                                            ? (() => {
                                                                  const raw = String(a.date);
                                                                  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                                                                  const d = m
                                                                      ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
                                                                      : new Date(raw);

                                                                  return Number.isNaN(d.getTime())
                                                                      ? raw
                                                                      : d.toLocaleDateString('en-US', {
                                                                            month: '2-digit',
                                                                            day: '2-digit',
                                                                            year: 'numeric',
                                                                        });
                                                              })()
                                                            : '—'}
                                                    </td>
                                                    <td className="px-3 py-2">{formatTime12h(a.time_in)}</td>
                                                    <td className="px-3 py-2">{formatTime12h(a.time_out)}</td>
                                                    <td className="px-3 py-2">
                                                        {(() => {
                                                            const hours = computeRowHours(a.time_in, a.time_out);
                                                            return hours === null ? '—' : `${hours.toFixed(2)}`;
                                                        })()}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="truncate">{a.remarks ? String(a.remarks) : '—'}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground">No attendance recorded for this tutorial.</div>
                            )}
                        </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="sticky top-4 rounded-md border bg-background p-4">
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

                        <div className="grid grid-cols-7 gap-1 mb-3">
                            {dayLabels.map((d) => (
                                <div
                                    key={d}
                                    className="text-center text-xs font-medium text-muted-foreground p-1"
                                >
                                    {d}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-4">
                            {dates.map((d) => {
                                const ymd = formatYmd(d);
                                const inMonth = d.getMonth() === visibleMonth;
                                const isToday = formatYmd(d) === formatYmd(today);
                                const isSelected = selectedYmd === ymd;
                                const hours = hoursByYmd.get(ymd) ?? 0;

                                return (
                                    <div
                                        key={ymd}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setSelectedYmd(ymd)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                setSelectedYmd(ymd);
                                            }
                                        }}
                                        className={
                                            'aspect-square flex flex-col items-center justify-center rounded-sm border text-xs cursor-pointer transition-all ' +
                                            (inMonth ? '' : 'opacity-40 ') +
                                            (isToday ? 'bg-muted ' : 'bg-background ') +
                                            (isSelected
                                                ? 'ring-2 ring-ring ring-offset-1'
                                                : 'hover:bg-muted/50 ')
                                        }
                                    >
                                        <div className="font-medium text-center">{d.getDate()}</div>
                                        {hours > 0 ? (
                                            <div className="text-[9px] text-muted-foreground leading-tight">
                                                {hours.toFixed(1)}h
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="rounded-md border bg-muted/30 p-3 text-sm">
                            <div className="font-medium mb-2">Selected Date</div>
                            <div className="text-xs text-muted-foreground mb-2">
                                {selectedDateLabel || 'Select a day'}
                            </div>
                            <div className="text-2xl font-semibold text-primary">
                                {selectedDayHours.toFixed(2)} hrs
                            </div>
                            <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                                Total hours: <span className="font-semibold text-foreground">{computedCompletedHours.toFixed(2)} hrs</span>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            </div>
        </AppLayout>
    );
}
