import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
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
} from 'lucide-react';
import { InfoField } from '@/components/ui/info-field';

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

export default function TutorialShow() {
    const { props } = usePage();
    const tutorial = (props as any).tutorial ?? null;
    const attendances = ((props as any).attendances ?? []) as any[];

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Tutorial ${tutorial.tutorialid ?? ''}`} />

            <div className="p-4">
                <div className="mb-4 flex items-center gap-4">
                    <Link href={tutorials().url}>
                        <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                    </Link>
                    <h1 className="text-2xl font-semibold">Tutorial - {tutorial.tutorialid ?? '—'}</h1>
                    <div className="ml-auto">
                        <Link href={`/tutorials/${tutorial.encrypted_id}/edit`}>
                            <Button variant="outline">Edit</Button>
                        </Link>
                    </div>
                </div>

                <div className="rounded-md border bg-background p-4 max-w-1xl">
                    <h2 className="mb-3 flex items-center gap-2 text-lg font-medium">
                        <Info className="h-5 w-5 text-muted-foreground" />
                        Tutorial Details
                    </h2>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <InfoField icon={Hash} label="Tutorial ID" value={tutorial.tutorialid ?? '—'} />
                        <br/>
                        <InfoField icon={User} label="Student" value={tutorial.student_name ?? tutorial.studentid ?? '—'} />
                        <InfoField icon={UserCog} label="Tutor" value={tutorial.tutor_name ?? tutorial.tutorid ?? '—'} />
                        <InfoField
                            icon={Calendar}
                            label="Start Date"
                            value={tutorial.start_date ? new Date(tutorial.start_date).toLocaleDateString('en-US') : '—'}
                        />
                        <InfoField
                            icon={CalendarClock}
                            label="End Date"
                            value={tutorial.end_date ? new Date(tutorial.end_date).toLocaleDateString('en-US') : '—'}
                        />
                        <InfoField icon={BadgeCheck} label="Status" value={tutorial.status ?? '—'} />
                        <InfoField
                            icon={Info}
                            label="Hourly Rate"
                            value={
                                tutorial.education_level === 'Elementary'
                                    ? (tutorial.rate_grade_school ? `₱${tutorial.rate_grade_school}` : '—')
                                    : (tutorial.rate_secondary ? `₱${tutorial.rate_secondary}` : '—')
                            }
                        />
                    </div>

                    <div className="mt-6">
                        <h2 className="text-lg font-medium mb-2">Schedules</h2>
                        {Array.isArray(schedules) && schedules.length ? (
                            <div className="space-y-3">
                                {schedules.map((s: any, i: number) => (
                                    <div key={i} className="rounded border p-3">
                                        <div className="font-medium">{(s.days || []).join(', ')}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {new Date(`2000-01-01 ${s.start_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} — {new Date(`2000-01-01 ${s.end_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground">No schedules defined.</div>
                        )}
                    </div>

                    {tutorial.billing_type === 'prepaid-package' && (
                        <div className="mt-6">
                            <h2 className="text-lg font-medium mb-2">Prepaid Package Details</h2>
                            <div className="bg-accent/20 rounded-md border border-accent p-4 space-y-3">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div>
                                        <div className="text-sm text-muted-foreground">Prepaid Amount</div>
                                        <div className="text-lg font-semibold">₱{tutorial.prepaid_amount ? parseFloat(tutorial.prepaid_amount).toFixed(2) : '0.00'}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Hourly Rate</div>
                                        <div className="text-lg font-semibold">
                                            ₱{tutorial.education_level === 'Elementary'
                                                ? (tutorial.rate_grade_school ? tutorial.rate_grade_school : '—')
                                                : (tutorial.rate_secondary ? tutorial.rate_secondary : '—')}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Total Hours</div>
                                        <div className="text-lg font-semibold">
                                            {tutorial.total_prepaid_hours !== null ? `${tutorial.total_prepaid_hours.toFixed(2)} hrs` : '—'}
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t border-accent pt-3">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Hours Used</div>
                                            <div className="text-lg font-semibold">
                                                {tutorial.total_prepaid_hours !== null && tutorial.remaining_prepaid_hours !== null
                                                    ? `${(tutorial.total_prepaid_hours - tutorial.remaining_prepaid_hours).toFixed(2)} hrs`
                                                    : '—'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Remaining Hours</div>
                                            <div className="text-lg font-semibold text-primary">
                                                {tutorial.remaining_prepaid_hours !== null
                                                    ? `${tutorial.remaining_prepaid_hours} hrs`
                                                    : '—'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {tutorial.billing_type === 'per-session' && (
                        <div className="mt-6">
                            <h2 className="text-lg font-medium mb-2">Session Billing</h2>
                            <div className="bg-blue-50 rounded-md border border-blue-200 p-4">
                                <div>
                                    <div className="text-sm text-muted-foreground">Total Accumulated Hours</div>
                                    <div className="text-2xl font-semibold text-primary">
                                        {(() => {
                                            let totalHours = 0;
                                            attendances.forEach((a: any) => {
                                                const timeIn = timeToMinutes(a.time_in);
                                                const timeOut = timeToMinutes(a.time_out);
                                                if (timeIn !== null && timeOut !== null && timeOut > timeIn) {
                                                    totalHours += (timeOut - timeIn) / 60;
                                                }
                                            });
                                            return `${totalHours.toFixed(2)} hrs`;
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* <div className="mt-6 flex gap-2">
                        <Link href={`/tutorials/${tutorial.encrypted_id}/edit`} className="btn">Edit</Link>
                        <form method="post" action={`/tutorials/${tutorial.encrypted_id}`}> 
                            <input type="hidden" name="_method" value="delete" />
                            <button type="submit" className="btn btn-destructive">Delete</button>
                        </form>
                    </div> */}
                </div>

                <div className="rounded-md border bg-background p-4 mt-6 max-w-1xl">
                     <div>
                        <h2 className="text-lg font-medium mb-2">Attendance</h2>
                        {Array.isArray(attendances) && attendances.length ? (
                            <div className="overflow-x-auto">
                                <table className="w-full table-fixed">
                                    <thead>
                                        <tr className="text-left text-sm text-muted-foreground">
                                            <th className="px-3 py-2 w-[160px]">Date</th>
                                            <th className="px-3 py-2 w-[160px]">Time In</th>
                                            <th className="px-3 py-2 w-[160px]">Time Out</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendances.map((a: any) => (
                                            <tr key={a.id} className="border-t">
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
                                                <td className="px-3 py-2">{formatTime24h(a.time_in)}</td>
                                                <td className="px-3 py-2">{formatTime24h(a.time_out)}</td>
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
            </div>
        </AppLayout>
    );
}
