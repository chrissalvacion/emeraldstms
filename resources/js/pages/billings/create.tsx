import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { type BreadcrumbItem } from '@/types';
import { useEffect, useMemo, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Billings', href: '/billings' },
    { title: 'Create', href: '/billings/create' },
];

export default function BillingCreate() {
    const { props } = usePage();
    const activeStudents = ((props as any).active_students ?? []) as Array<{
        id: number;
        tuteeid: string | null;
        name: string | null;
        key: string;
    }>;

    const { data, setData, post, processing, errors } = useForm({
        studentid: '',
        billing_startdate: '',
        billing_enddate: '',
        // Computed server-side; not shown/entered on this page.
        total_hours: 0,
        attendance_record: '',
    });

    const [studentQuery, setStudentQuery] = useState('');
    const [studentOpen, setStudentOpen] = useState(false);
    const [studentsByDate, setStudentsByDate] = useState(activeStudents);
    const studentsAbort = useRef<AbortController | null>(null);
    const previewAbort = useRef<AbortController | null>(null);
    const [previewSessions, setPreviewSessions] = useState<any[]>([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [totalAccumulatedHours, setTotalAccumulatedHours] = useState(0);
    const [previewExpanded, setPreviewExpanded] = useState(true);

    const studentSource = studentsByDate;

    const suggestions = useMemo(() => {
        const q = studentQuery.trim().toLowerCase();
        if (!q) return [];
        return studentSource
            .filter((s) => {
                const name = (s.name ?? '').toLowerCase();
                const tutee = (s.tuteeid ?? '').toLowerCase();
                const idStr = String(s.id);
                const key = (s.key ?? '').toLowerCase();
                return name.includes(q) || tutee.includes(q) || idStr.includes(q) || key.includes(q);
            })
            .slice(0, 8);
    }, [studentQuery, studentSource]);

    useEffect(() => {
        // Load students who have tutorial sessions in the selected date range.
        if (!data.billing_startdate || !data.billing_enddate) {
            setStudentsByDate(activeStudents);
            return;
        }

        const url = new URL('/billings/students-by-dates', window.location.origin);
        url.searchParams.set('billing_startdate', String(data.billing_startdate));
        url.searchParams.set('billing_enddate', String(data.billing_enddate));

        const t = window.setTimeout(async () => {
            try {
                studentsAbort.current?.abort();
                const controller = new AbortController();
                studentsAbort.current = controller;

                const res = await fetch(url.toString(), {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    signal: controller.signal,
                });

                if (!res.ok) return;

                const json = await res.json();
                const nextStudents = Array.isArray(json?.students) ? json.students : [];
                setStudentsByDate(nextStudents);

                if (data.studentid && !nextStudents.some((s: any) => s?.key === data.studentid)) {
                    setData('studentid', '');
                    setStudentQuery('');
                    setPreviewSessions([]);
                    setTotalAmount(0);
                    setTotalAccumulatedHours(0);
                }
            } catch {
                // ignore (abort or network)
            }
        }, 250);

        return () => window.clearTimeout(t);
    }, [activeStudents, data.billing_enddate, data.billing_startdate, data.studentid, setData]);

    useEffect(() => {
        // Auto-preview attendance once we have student + date range.
        if (!data.studentid || !data.billing_startdate || !data.billing_enddate) {
            setData('attendance_record', '');
            setData('total_hours', 0);
            setPreviewSessions([]);
            setTotalAmount(0);
            setTotalAccumulatedHours(0);
            return;
        }

        const url = new URL('/billings/preview', window.location.origin);
        url.searchParams.set('studentid', String(data.studentid));
        url.searchParams.set('billing_startdate', String(data.billing_startdate));
        url.searchParams.set('billing_enddate', String(data.billing_enddate));

        const t = window.setTimeout(async () => {
            try {
                previewAbort.current?.abort();
                const controller = new AbortController();
                previewAbort.current = controller;

                const res = await fetch(url.toString(), {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    signal: controller.signal,
                });

                if (!res.ok) return;
                const json = await res.json();
                const attendanceRecord = json?.attendance_record ?? [];
                const totalHours = Number(json?.total_hours ?? 0);

                // Group by tutorial and calculate amounts
                const sessionMap = new Map<string, any>();
                let calculatedTotal = 0;
                let totalHoursAccumulated = 0;

                attendanceRecord.forEach((record: any) => {
                    const tutorialId = record.tutorialid;
                    if (!sessionMap.has(tutorialId)) {
                        sessionMap.set(tutorialId, {
                            tutorialid: tutorialId,
                            tutor_name: record.tutor_name,
                            hourly_rate: Number(record.hourly_rate || 0),
                            sessions: [],
                            total_hours: 0,
                            amount: 0,
                        });
                    }

                    const session = sessionMap.get(tutorialId);
                    const hours = Number(record.hours || 0);
                    session.sessions.push(record);
                    session.total_hours += hours;
                    totalHoursAccumulated += hours;
                });

                // Calculate amount for each tutorial: round(total_hours) × hourly_rate
                const sessions = Array.from(sessionMap.values()).map(session => {
                    const roundedHours = Math.round(session.total_hours);
                    const amount = Math.round(roundedHours * session.hourly_rate * 100) / 100;
                    session.amount = amount;
                    calculatedTotal += amount;
                    return session;
                });

                setPreviewSessions(sessions);
                setTotalAmount(Math.round(calculatedTotal * 100) / 100);
                setTotalAccumulatedHours(totalHoursAccumulated);
                setPreviewExpanded(true); // Auto-expand when preview loads
                setData('attendance_record', JSON.stringify(attendanceRecord));
                setData('total_hours', Number.isFinite(totalHours) ? totalHours : 0);
            } catch {
                // ignore (abort or network)
            }
        }, 300);

        return () => window.clearTimeout(t);
    }, [data.billing_enddate, data.billing_startdate, data.studentid, setData]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Billing" />

            <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                <h1 className="text-2xl font-semibold mb-6">Create Billing</h1>

                <form
                    className="space-y-6"
                    onSubmit={(e) => {
                        e.preventDefault();
                        // Ensure required fields are present
                        if (!data.studentid || !data.billing_startdate || !data.billing_enddate) {
                            return;
                        }
                        post('/billings');
                    }}
                >
                    <section className="rounded-xl border bg-background p-6">
                        <h2 className="text-lg font-medium mb-2">Billing Details</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <Label htmlFor="studentid">Student (name or ID)</Label>
                                <Input
                                    id="studentid"
                                    value={studentQuery}
                                    onChange={(e) => {
                                        setStudentQuery(e.target.value);
                                        setStudentOpen(true);
                                        // Clear selected student when user edits.
                                        if (data.studentid) setData('studentid', '');
                                    }}
                                    onFocus={() => setStudentOpen(true)}
                                    onBlur={() => {
                                        // Delay close so click can register.
                                        window.setTimeout(() => setStudentOpen(false), 150);
                                    }}
                                    placeholder="Type student name or ID..."
                                />

                                {studentOpen && suggestions.length > 0 && (
                                    <div className="relative">
                                        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-md">
                                            {suggestions.map((s) => {
                                                const label = `${s.name ?? '—'} (${s.tuteeid ?? s.id})`;
                                                return (
                                                    <button
                                                        key={s.key}
                                                        type="button"
                                                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                                                        onMouseDown={(e) => e.preventDefault()}
                                                        onClick={() => {
                                                            setData('studentid', s.key);
                                                            setStudentQuery(label);
                                                            setStudentOpen(false);
                                                        }}
                                                    >
                                                        <span className="truncate">{s.name ?? '—'}</span>
                                                        <span className="shrink-0 text-xs text-muted-foreground">{s.tuteeid ?? s.id}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <InputError message={errors.studentid} />
                                {data.billing_startdate && data.billing_enddate && studentSource.length === 0 && (
                                    <div className="mt-1 text-sm text-muted-foreground">
                                        No students have tutorial sessions in the selected date range.
                                    </div>
                                )}
                                {!data.studentid && studentQuery && (
                                    <div className="text-sm text-muted-foreground mt-1">
                                        Please select a student from the suggestions
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="billing_startdate">Start date</Label>
                                <Input
                                    id="billing_startdate"
                                    type="date"
                                    value={data.billing_startdate}
                                    onChange={(e) => setData('billing_startdate', e.target.value)}
                                />
                                <InputError message={errors.billing_startdate} />
                            </div>

                            <div>
                                <Label htmlFor="billing_enddate">End date</Label>
                                <Input
                                    id="billing_enddate"
                                    type="date"
                                    value={data.billing_enddate}
                                    onChange={(e) => setData('billing_enddate', e.target.value)}
                                />
                                <InputError message={errors.billing_enddate} />
                            </div>
                        </div>

                        {previewSessions.length > 0 && (
                            <div className="mt-6 space-y-4">
                                <button
                                    type="button"
                                    onClick={() => setPreviewExpanded(!previewExpanded)}
                                    className="flex items-center justify-between w-full text-left py-2 px-3 rounded-xl hover:bg-accent transition-colors"
                                >
                                    <h3 className="text-base font-medium">Tutorial Sessions Preview</h3>
                                    <span className="text-sm text-muted-foreground">
                                        {previewExpanded ? '▼' : '▶'} {previewSessions.length} session(s) • {Math.round(totalAccumulatedHours).toFixed(1)} hrs • Total: ₱{totalAmount.toFixed(2)}
                                    </span>
                                </button>
                                {previewExpanded && (
                                    <>
                                        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                                            <h4 className="font-semibold text-sm">Billing Summary</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-xs text-muted-foreground">Total Hours</div>
                                                    <div className="text-2xl font-bold">{Math.round(totalAccumulatedHours).toFixed(1)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-muted-foreground">Total Amount</div>
                                                    <div className="text-2xl font-bold text-primary">₱{totalAmount.toFixed(2)}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-4">
                                            <h4 className="font-medium text-sm mb-3">Sessions by Tutorial</h4>
                                        </div>
                                        {previewSessions.map((session, idx) => (
                                    <div key={idx} className="rounded-xl border border-border p-4 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-medium">{session.tutor_name || session.tutorialid}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    Tutorial ID: {session.tutorialid}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-muted-foreground">Hourly Rate</div>
                                                <div className="font-medium">₱{session.hourly_rate.toFixed(2)}</div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-sm pt-2 border-t">
                                            <span>Total Hours: {Math.round(session.total_hours).toFixed(1)}</span>
                                            <span className="font-semibold">Amount: ₱{session.amount.toFixed(2)}</span>
                                        </div>
                                        <details className="text-xs text-muted-foreground">
                                            <summary className="cursor-pointer hover:text-foreground">View {session.sessions.length} session(s)</summary>
                                            <div className="mt-2 space-y-1 pl-4">
                                                {session.sessions.map((s: any, sIdx: number) => (
                                                    <div key={sIdx} className="flex justify-between">
                                                        <span>{s.date} • {s.time_in} - {s.time_out}</span>
                                                        <span>{s.hours.toFixed(2)}h</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </details>
                                    </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}
                    </section>

                    <div className="flex items-center gap-4">
                        <Button 
                            type="submit" 
                            disabled={processing || !data.studentid || !data.billing_startdate || !data.billing_enddate}
                        >
                            {processing ? 'Creating...' : 'Create Billing'}
                        </Button>
                        <Link href="/billings" className="text-sm text-muted-foreground">
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
