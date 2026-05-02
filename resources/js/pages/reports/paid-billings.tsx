import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { type BreadcrumbItem } from '@/types';

type PaidBilling = {
    id: number;
    billingid: string;
    studentid: string;
    student_name?: string | null;
    billing_startdate: string | null;
    billing_enddate: string | null;
    total_hours: number;
    amount: string | number;
    total_paid: number;
    status: string;
};

interface PaidBillingsProps {
    billings: PaidBilling[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports' },
    { title: 'Paid Billings', href: '/reports/paid-billings' },
];

const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
        return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return dateStr;
    }
};

const formatAmount = (amount: string | number) => {
    const num = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(num)) return '-';
    return `₱${num.toFixed(2)}`;
};

export default function PaidBillingsReport({ billings }: PaidBillingsProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredBillings = useMemo(() => {
        if (!searchQuery.trim()) return billings;
        const query = searchQuery.toLowerCase();
        return billings.filter(b =>
            b.billingid?.toLowerCase().includes(query) ||
            b.studentid?.toLowerCase().includes(query) ||
            b.student_name?.toLowerCase().includes(query) ||
            b.status?.toLowerCase().includes(query)
        );
    }, [billings, searchQuery]);

    const totalAmount = useMemo(() => filteredBillings.reduce((sum, b) => sum + (typeof b.amount === 'number' ? b.amount : parseFloat(b.amount)), 0), [filteredBillings]);
    const totalPaid = useMemo(() => filteredBillings.reduce((sum, b) => sum + b.total_paid, 0), [filteredBillings]);
    const totalHours = useMemo(() => filteredBillings.reduce((sum, b) => sum + b.total_hours, 0), [filteredBillings]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Paid Billings Report" />

            <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/reports">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-semibold">Paid Billings Report</h1>
                            <p className="text-sm text-muted-foreground">View all fully paid billing statements.</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => window.open('/reports/paid-billings/pdf', '_blank', 'noopener,noreferrer')}
                    >
                        <FileText className="mr-2 h-4 w-4" />
                        Generate PDF
                    </Button>
                </div>

                {/* Summary stat cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-xl border bg-background p-4">
                        <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Total Paid Bills</span>
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{filteredBillings.length}</p>
                        <p className="text-xs text-muted-foreground">billing records</p>
                    </div>
                    <div className="rounded-xl border bg-background p-4">
                        <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Total Revenue</span>
                            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{formatAmount(totalAmount)}</p>
                        <p className="text-xs text-muted-foreground">total collected</p>
                    </div>
                    <div className="rounded-xl border bg-background p-4">
                        <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Payments Received</span>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-semibold">{formatAmount(totalPaid)}</p>
                        <p className="text-xs text-muted-foreground">total paid</p>
                    </div>
                    <div className="rounded-xl border bg-background p-4">
                        <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Total Hours</span>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-semibold">{totalHours.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">tutorial hours</p>
                    </div>
                </div>

                {/* Search */}
                <div className="flex items-center gap-4">
                    <Input
                        type="search"
                        placeholder="Search by billing ID, student name, or student ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-md"
                    />
                    <span className="text-sm text-muted-foreground">
                        {filteredBillings.length} {filteredBillings.length === 1 ? 'billing' : 'billings'} found
                    </span>
                </div>

                {/* Table */}
                <div className="rounded-xl border bg-background">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-left text-sm text-muted-foreground">
                                    <th className="px-4 py-3 font-medium">Billing ID</th>
                                    <th className="px-4 py-3 font-medium">Student</th>
                                    <th className="px-4 py-3 font-medium">Billing Date</th>
                                    <th className="px-4 py-3 font-medium text-center">Hours</th>
                                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                                    <th className="px-4 py-3 font-medium text-right">Total Paid</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBillings.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                                            No paid billings found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBillings.map((billing) => (
                                        <tr key={billing.id} className="border-t odd:bg-transparent even:bg-muted/50 transition-colors hover:bg-muted/70">
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/billings/${billing.id}`}
                                                    className="font-medium text-primary hover:underline"
                                                >
                                                    {billing.billingid}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {billing.student_name || billing.studentid}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {formatDate(billing.billing_startdate)} – {formatDate(billing.billing_enddate)}
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm">
                                                {billing.total_hours.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm font-medium">
                                                {formatAmount(billing.amount)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm font-semibold text-green-600 dark:text-green-400">
                                                {formatAmount(billing.total_paid)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                    <CheckCircle className="h-3 w-3" />
                                                    {billing.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link href={`/billings/${billing.id}`}>
                                                    <Button variant="outline" size="sm">View</Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
