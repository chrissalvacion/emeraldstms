import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ReceiptText,
    User,
    Calendar,
    CalendarClock,
    Clock,
    DollarSign,
    BadgeCheck,
    Info,
} from 'lucide-react';
import { InfoField } from '@/components/ui/info-field';

type Billing = {
    encrypted_id: string;
    billingid: string;
    studentid: string;
    student_name?: string | null;
    billing_startdate: string | null;
    billing_enddate: string | null;
    attendance_record: any;
    total_hours: number;
    amount: string | number;
    status: string;
    created_at?: any;
    updated_at?: any;
};

type AttendanceRow = {
    tutorialid?: string | null;
    tutorid?: string | null;
    tutor_name?: string | null;
    date?: string | null;
    time_in?: string | null;
    time_out?: string | null;
    minutes?: number | null;
    hours?: number | null;
    hourly_rate?: number | null;
    amount?: number | null;
};

type Payment = {
	id: number;
	paymentid: string;
	billingid: string;
	studentname?: string | null;
	payment_date: string | null;
	amount: string | number;
	payment_method: string;
	nature_of_collection?: string | null;
	status: string;
};

export default function BillingShow() {
    const { props } = usePage();
    const billing = (props as any).billing as Billing;
    const payments = ((props as any).payments ?? []) as Payment[];
    const totalPaid = Number((props as any).total_paid ?? 0);
    const balance = Number((props as any).balance ?? 0);

    const attendanceRows: AttendanceRow[] = (() => {
        const v = billing?.attendance_record;
        if (!v) return [];
        if (Array.isArray(v)) return v;
        if (typeof v === 'string') {
            try {
                const parsed = JSON.parse(v);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        }
        return [];
    })();

    // Calculate accumulated hours from attendance records
    const accumulatedHours = attendanceRows.reduce((total, row) => {
        if (typeof row.hours === 'number' && Number.isFinite(row.hours)) {
            return total + row.hours;
        }
        if (typeof row.minutes === 'number' && Number.isFinite(row.minutes)) {
            return total + (row.minutes / 60);
        }
        return total;
    }, 0);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Billings', href: '/billings' },
        { title: billing?.billingid ?? 'Billing', href: `/billings/${billing?.encrypted_id ?? ''}` },
    ];

    const formatDate = (v: any) => {
        if (!v) return '-';
        const d = new Date(v);
        if (isNaN(d.getTime())) return String(v);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
    };

    const formatAmount = (v: any) => {
        if (v === null || v === undefined || v === '') return '-';
        const n = typeof v === 'number' ? v : Number(v);
        if (Number.isFinite(n)) return n.toFixed(2);
        return String(v);
    };

    const formatTime12 = (v: any) => {
        if (!v) return '—';
        const s = String(v).trim();
        if (!s) return '—';

        // Accept "HH:mm" or "HH:mm:ss"
        const parts = s.split(':');
        if (parts.length < 2) return s;

        const h24 = Number(parts[0]);
        const m = Number(parts[1]);

        if (!Number.isFinite(h24) || !Number.isFinite(m)) return s;

        let h12 = h24 % 12;
        if (h12 === 0) h12 = 12;

        const suffix = h24 < 12 ? 'am' : 'pm';

        const hh = String(h12).padStart(2, '0');
        const mm = String(m).padStart(2, '0');

        return `${hh}:${mm} ${suffix.toUpperCase()}`;
    };

    const formatWholeHours = (row: { hours?: number | null; minutes?: number | null }) => {
        const hoursValue = typeof row.hours === 'number' ? row.hours : Number(row.hours);
        if (Number.isFinite(hoursValue)) return String(Math.round(hoursValue));

        const minutesValue = typeof row.minutes === 'number' ? row.minutes : Number(row.minutes);
        if (Number.isFinite(minutesValue)) return String(Math.round(minutesValue / 60));

        return '—';
    };

    const handleGeneratePdf = () => {
        const url = `/billings/${billing.encrypted_id}/pdf`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Billing ${billing.billingid ?? ''}`} />

            <div className="m-5 space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/billings">
                              <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                        </Link>
                        <h1 className="text-2xl font-semibold">Billing - {billing.billingid ?? ''}</h1>
                    </div>

                    <div className="flex items-center gap-2">
						<Link href={`/payments/create?billingid=${encodeURIComponent(billing.billingid ?? '')}`}>
							<Button>New Payment</Button>
						</Link>
                        <Button variant="outline" onClick={handleGeneratePdf}>
                            Print Billing
                        </Button>
                        <Link href={`/billings/${billing.encrypted_id}/edit`}>
                            <Button variant="outline">Edit</Button>
                        </Link>
                    </div>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Info className="h-4 w-4" />
                        Billing Summary
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <InfoField icon={ReceiptText} label="Billing ID" value={billing.billingid ?? '-'} />
                        <InfoField icon={User} label="Student" value={billing.student_name ?? billing.studentid ?? '-'} />
                        <InfoField icon={Calendar} label="Start date" value={formatDate(billing.billing_startdate)} />
                        <InfoField icon={CalendarClock} label="End date" value={formatDate(billing.billing_enddate)} />
                        <InfoField icon={Clock} label="Total hours" value={formatHours(accumulatedHours)} />
                        <InfoField icon={DollarSign} label="Amount" value={formatAmount(billing.amount)} />
                        <InfoField icon={DollarSign} label="Total Paid" value={formatAmount(totalPaid)} />
                        <InfoField icon={DollarSign} label="Balance" value={formatAmount(balance)} />
                        <InfoField icon={BadgeCheck} label="Status" value={(billing.status ?? '').toLowerCase()} />
                    </div>
                </div>

                  {attendanceRows.length === 0 && payments.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                        Note: No attendance records and no payments have been recorded for this billing yet.
                    </div>
                )}
                {attendanceRows.length > 0 && (
                    <div className="rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                        <div className="text-sm text-muted-foreground mb-2">Attendance record</div>

                        <div className="overflow-x-auto rounded-md border border-sidebar-border/70 dark:border-sidebar-border">
                            <table className="w-full table-fixed">
                                <thead>
                                    <tr className="text-left text-sm text-muted-foreground">
                                        <th className="px-3 py-2 w-[140px]">Date</th>
                                        <th className="px-3 py-2 w-[160px]">Tutorial ID</th>
                                        <th className="px-3 py-2 w-[200px]">Tutor</th>
                                        <th className="px-3 py-2 w-[120px]">Time In</th>
                                        <th className="px-3 py-2 w-[120px]">Time Out</th>
                                        <th className="px-3 py-2 w-[100px]">Hours</th>
                                        <th className="px-3 py-2 w-[100px] text-right">Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendanceRows.map((r, idx) => (
                                        <tr key={`${r.tutorialid ?? 'row'}-${r.date ?? idx}-${idx}`} className="border-t">
                                            <td className="px-3 py-2">{formatDate(r.date)}</td>
                                            <td className="px-3 py-2 break-words">{r.tutorialid ?? '—'}</td>
                                            <td className="px-3 py-2 break-words">{r.tutor_name ?? r.tutorid ?? '—'}</td>
                                            <td className="px-3 py-2">{formatTime12(r.time_in)}</td>
                                            <td className="px-3 py-2">{formatTime12(r.time_out)}</td>
                                            <td className="px-3 py-2">{formatWholeHours(r)}</td>
                                            <td className="px-3 py-2 text-right">{formatAmount(r.hourly_rate)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {payments.length > 0 && (
                    <div className="rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                        <div className="text-sm text-muted-foreground mb-2">Payments</div>

                        <div className="overflow-x-auto rounded-md border border-sidebar-border/70 dark:border-sidebar-border">
                            <table className="w-full table-fixed">
                                <thead>
                                    <tr className="text-left text-sm text-muted-foreground">
                                        <th className="px-3 py-2 w-[200px]">Payment ID</th>
                                        <th className="px-3 py-2 w-[140px]">Date</th>
                                        <th className="px-3 py-2 w-[120px]">Amount</th>
                                        <th className="px-3 py-2 w-[160px]">Method</th>
                                        <th className="px-3 py-2 w-[160px]">Nature of Collection</th>
                                        <th className="px-3 py-2 w-[120px]">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((p) => (
                                        <tr key={p.id} className="border-t">
                                            <td className="px-3 py-2 break-words">
                                                <Link href={`/payments/${p.id}`} className="text-primary">
                                                    {p.paymentid ?? '-'}
                                                </Link>
                                            </td>
                                            <td className="px-3 py-2">{formatDate(p.payment_date)}</td>
                                            <td className="px-3 py-2">{formatAmount(p.amount)}</td>
                                            <td className="px-3 py-2 break-words">{p.payment_method ?? '-'}</td>
                                            <td className="px-3 py-2 break-words">{p.nature_of_collection ?? '-'}</td>
                                            <td className="px-3 py-2">{(p.status ?? '').toLowerCase()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

const formatHours = (hours: number) => {
    if (!Number.isFinite(hours)) return '-';
    return hours.toFixed(2);
};
