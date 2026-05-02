import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Fragment, useState } from 'react';
import { ArrowLeft, FileText, Download, Save } from 'lucide-react';

interface AttendanceRecord {
    date: string;
    time_in: string;
    time_out: string;
    hours: number;
    tutorial_id: string;
    student_name?: string | null;
    education_level?: string;
    hourly_rate?: number;
    amount?: number;
}

interface PayrollEntry {
    id: number;
    tutorid: string;
    tutor_name: string;
    hourly_rate: number;
    total_hours: number;
    total_amount: number;
    amount_received: number | null;
    signature: string | null;
    attendance_records: AttendanceRecord[];
}

interface PayrollData {
    id: number;
    payrollid: string;
    period_start: string;
    period_end: string;
    status: string;
    total_amount: number;
    total_received: number;
    entries: PayrollEntry[];
    encrypted_id: string;
}

export default function PayrollShow({ payroll: payrollData }: { payroll: PayrollData }) {
    const [entries, setEntries] = useState<PayrollEntry[]>(payrollData.entries);
    const [entryEdits, setEntryEdits] = useState<Record<number, { amount_received: string; signature: string }>>(
        () =>
            payrollData.entries.reduce(
                (acc, entry) => {
                    acc[entry.id] = {
                        amount_received: entry.amount_received?.toString() ?? '',
                        signature: entry.signature ?? '',
                    };
                    return acc;
                },
                {} as Record<number, { amount_received: string; signature: string }>
            )
    );
    const [status, setStatus] = useState(payrollData.status);
    const [isSaving, setIsSaving] = useState<number | null>(null);
    const [overallSaving, setOverallSaving] = useState(false);
    const [expandedEntry, setExpandedEntry] = useState<number | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Payroll',
            href: '/payroll',
        },
        {
            title: payrollData.payrollid,
            href: `/payroll/${payrollData.encrypted_id}`,
        },
    ];

    const handleUpdateEntry = (entryId: number) => {
        const edits = entryEdits[entryId] ?? { amount_received: '', signature: '' };
        setIsSaving(entryId);
        router.put(
            `/payroll/${payrollData.encrypted_id}/entry/${entryId}`,
            {
                amount_received: edits.amount_received ? parseFloat(edits.amount_received) : null,
                signature: edits.signature,
            },
            {
                onSuccess: () => {
                    setIsSaving(null);
                    // Update local state
                    setEntries(entries.map(e =>
                        e.id === entryId
                            ? {
                                ...e,
                                amount_received: edits.amount_received ? parseFloat(edits.amount_received) : null,
                                signature: edits.signature,
                            }
                            : e
                    ));
                },
                onError: () => {
                    setIsSaving(null);
                },
            }
        );
    };

    const updateEntryEdit = (entryId: number, field: 'amount_received' | 'signature', value: string) => {
        setEntryEdits((prev) => ({
            ...prev,
            [entryId]: {
                amount_received: prev[entryId]?.amount_received ?? '',
                signature: prev[entryId]?.signature ?? '',
                [field]: value,
            },
        }));
    };

    const handleUpdateStatus = () => {
        setOverallSaving(true);
        router.put(
            `/payroll/${payrollData.encrypted_id}`,
            { status },
            {
                onSuccess: () => {
                    setOverallSaving(false);
                },
                onError: () => {
                    setOverallSaving(false);
                },
            }
        );
    };

    const formatCurrency = (value: number | null) => {
        if (value === null || value === 0) return '₱0.00';
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(value);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-PH');
    };

    const formatTime = (time: string) => {
        const [hours, minutes, seconds] = time.split(':');
        const h = parseInt(hours);
        const m = minutes;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayHours = h % 12 || 12;
        return `${displayHours}:${m} ${ampm}`;
    };

    const getEntryRate = (entry: PayrollEntry) => entry.hourly_rate;

    const totalReceived = entries.reduce((sum, e) => sum + (e.amount_received || 0), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Payroll - ${payrollData.payrollid}`} />

            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <Link href="/payroll">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Payroll
                        </Button>
                    </Link>
                </div>

                {/* Header Info */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <CardTitle className="text-xl">{payrollData.payrollid}</CardTitle>
                                <CardDescription>
                                    {formatDate(payrollData.period_start)} to {formatDate(payrollData.period_end)}
                                </CardDescription>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Total Payable</p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(payrollData.total_amount)}
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Summary and Status */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="rounded-lg border bg-muted/40 p-4">
                                <p className="text-sm text-muted-foreground">
                                    Total Payable
                                </p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(payrollData.total_amount)}
                                </p>
                            </div>
                            <div className="rounded-lg border bg-muted/40 p-4">
                                <p className="text-sm text-muted-foreground">
                                    Total Received
                                </p>
                                <p className="text-2xl font-bold text-primary">
                                    {formatCurrency(totalReceived)}
                                </p>
                            </div>
                            <div className="rounded-lg border bg-muted/40 p-4">
                                <p className="text-sm text-muted-foreground">
                                    Remaining
                                </p>
                                <p className="text-2xl font-bold text-foreground">
                                    {formatCurrency(payrollData.total_amount - totalReceived)}
                                </p>
                            </div>
                        </div>

                        <div className="pt-4">
                            <label htmlFor="status" className="text-sm font-medium">
                                Payroll Status
                            </label>
                            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                <select
                                    id="status"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="h-10 flex-1 rounded-md border bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="paid">Paid</option>
                                </select>
                                <Button
                                    onClick={handleUpdateStatus}
                                    disabled={overallSaving}
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    {overallSaving ? 'Saving...' : 'Save Status'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payroll Entries */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payroll Entries</CardTitle>
                        <CardDescription>All payees included in this payroll run</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-lg border bg-background">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        <th className="px-3 py-2 text-left w-[60px]">#</th>
                                        <th className="px-3 py-2 text-left">Tutor</th>
                                        <th className="px-3 py-2 text-left">Avg Rate</th>
                                        <th className="px-3 py-2 text-left">Hours</th>
                                        <th className="px-3 py-2 text-left">Total</th>
                                        <th className="px-3 py-2 text-left">Attendance</th>
                                        <th className="px-3 py-2 text-left">Amount Received</th>
                                        <th className="px-3 py-2 text-left">Signature</th>
                                        <th className="px-3 py-2 text-left">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={9}
                                                className="px-3 py-3 text-center text-muted-foreground"
                                            >
                                                No payroll entries found.
                                            </td>
                                        </tr>
                                    ) : (
                                        entries.map((entry, index) => (
                                            <Fragment key={entry.id}>
                                            <tr className="border-t odd:bg-transparent even:bg-muted/30">
                                                <td className="px-3 py-2 text-muted-foreground">
                                                    {index + 1}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {entry.tutor_name}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {formatCurrency(getEntryRate(entry))}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {Math.round(entry.total_hours)}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {formatCurrency(entry.total_amount)}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                                                        className="h-8 px-2"
                                                    >
                                                        {entry.attendance_records.length} records
                                                        {expandedEntry === entry.id ? ' ▲' : ' ▼'}
                                                    </Button>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={entryEdits[entry.id]?.amount_received ?? ''}
                                                        onChange={(e) =>
                                                            updateEntryEdit(entry.id, 'amount_received', e.target.value)
                                                        }
                                                        className="h-8 min-w-[120px]"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <Input
                                                        type="text"
                                                        value={entryEdits[entry.id]?.signature ?? ''}
                                                        onChange={(e) =>
                                                            updateEntryEdit(entry.id, 'signature', e.target.value)
                                                        }
                                                        className="h-8 min-w-[160px]"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleUpdateEntry(entry.id)}
                                                        disabled={isSaving === entry.id}
                                                    >
                                                        <Save className="mr-2 h-4 w-4" />
                                                        {isSaving === entry.id ? 'Saving...' : 'Save'}
                                                    </Button>
                                                </td>
                                            </tr>
                                            {expandedEntry === entry.id && (
                                                <tr>
                                                    <td colSpan={9} className="bg-muted/40 px-3 py-4">
                                                        <div className="text-sm font-medium mb-3">Attendance Details</div>
                                                        <div className="overflow-x-auto rounded-md border bg-background">
                                                            <table className="w-full text-xs">
                                                                <thead>
                                                                    <tr className="bg-muted/50 text-muted-foreground">
                                                                        <th className="px-2 py-1 text-left">Date</th>
                                                                        <th className="px-2 py-1 text-left">Student Name</th>
                                                                        <th className="px-2 py-1 text-left">Level</th>
                                                                        <th className="px-2 py-1 text-left">Time In</th>
                                                                        <th className="px-2 py-1 text-left">Time Out</th>
                                                                        <th className="px-2 py-1 text-left">Hours</th>
                                                                        <th className="px-2 py-1 text-left">Rate</th>
                                                                        <th className="px-2 py-1 text-left">Amount</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {entry.attendance_records.map((record, idx) => (
                                                                        <tr key={idx} className="border-t">
                                                                            <td className="px-2 py-1">{formatDate(record.date)}</td>
                                                                            <td className="px-2 py-1">{record.student_name || '—'}</td>
                                                                            <td className="px-2 py-1">
                                                                                <span className="rounded bg-muted px-2 py-0.5 text-xs text-foreground">
                                                                                    {record.education_level || '—'}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-2 py-1">{formatTime(record.time_in)}</td>
                                                                            <td className="px-2 py-1">{formatTime(record.time_out)}</td>
                                                                            <td className="px-2 py-1">{record.hours.toFixed(2)}</td>
                                                                            <td className="px-2 py-1">{formatCurrency(record.hourly_rate || 0)}</td>
                                                                            <td className="px-2 py-1">{formatCurrency(record.amount || 0)}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                            </Fragment>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Export Actions */}
                <div className="mt-6 flex flex-col gap-3 rounded-xl border bg-background p-4 sm:flex-row">
                    <Button
                        variant="outline"
                        onClick={() => {
                            window.open(`/payroll/${payrollData.encrypted_id}/pdf`, '_blank');
                        }}
                    >
                        <FileText className="mr-2 h-4 w-4" /> Export PDF
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() =>
                            (window.location.href = `/payroll/${payrollData.encrypted_id}/excel`)
                        }
                    >
                        <Download className="mr-2 h-4 w-4" /> Export Excel
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
