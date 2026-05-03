import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, DollarSign, Calendar, User, Clock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { type BreadcrumbItem } from '@/types';

type UnpaidBilling = {
    id: number;
    encrypted_id?: string;
    billingid: string;
    studentid: string;
    student_name?: string | null;
    billing_startdate: string | null;
    billing_enddate: string | null;
    total_hours: number;
    amount: string | number;
    total_paid: number;
    balance: number;
    status: string;
};

interface UnpaidBillingsProps {
    billings: UnpaidBilling[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports' },
    { title: 'Unpaid Billings', href: '/reports/unpaid-billings' },
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

export default function UnpaidBillingsReport({ billings }: UnpaidBillingsProps) {
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

    const totalBalance = useMemo(() => filteredBillings.reduce((sum, b) => sum + b.balance, 0), [filteredBillings]);
    const totalAmount = useMemo(() => filteredBillings.reduce((sum, b) => sum + (typeof b.amount === 'number' ? b.amount : parseFloat(b.amount)), 0), [filteredBillings]);
    const totalPaid = useMemo(() => filteredBillings.reduce((sum, b) => sum + b.total_paid, 0), [filteredBillings]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Unpaid Billings Report" />

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
                            <h1 className="text-2xl font-semibold">Unpaid Billings Report</h1>
                            <p className="text-sm text-muted-foreground">View all billings with outstanding balances.</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => window.open('/reports/unpaid-billings/pdf', '_blank', 'noopener,noreferrer')}
                    >
                        <FileText className="mr-2 h-4 w-4" />
                        Generate PDF
                    </Button>
                </div>

                {/* Summary stat cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-xl border bg-background p-4">
                        <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Total Unpaid Bills</span>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-semibold">{filteredBillings.length}</p>
                        <p className="text-xs text-muted-foreground">billing records</p>
                    </div>
                    <div className="rounded-xl border bg-background p-4">
                        <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Total Amount Due</span>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-semibold">{formatAmount(totalAmount)}</p>
                        <p className="text-xs text-muted-foreground">total billed</p>
                    </div>
                    <div className="rounded-xl border bg-background p-4">
                        <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Total Paid</span>
                            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{formatAmount(totalPaid)}</p>
                        <p className="text-xs text-muted-foreground">payments received</p>
                    </div>
                    <div className="rounded-xl border bg-background p-4">
                        <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Outstanding Balance</span>
                            <DollarSign className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                        <p className="text-2xl font-semibold text-red-600 dark:text-red-400">{formatAmount(totalBalance)}</p>
                        <p className="text-xs text-muted-foreground">remaining to collect</p>
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
                                    <th className="px-4 py-3 font-medium text-right">Paid</th>
                                    <th className="px-4 py-3 font-medium text-right">Balance</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBillings.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                                            No unpaid billings found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBillings.map((billing) => (
                                        <tr key={billing.id} className="border-t odd:bg-transparent even:bg-muted/50 transition-colors hover:bg-muted/70">
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/billings/${billing.encrypted_id ?? billing.id}`}
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
                                            <td className="px-4 py-3 text-right text-sm font-medium text-green-600 dark:text-green-400">
                                                {formatAmount(billing.total_paid)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm font-semibold text-red-600 dark:text-red-400">
                                                {formatAmount(billing.balance)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                                                    billing.status === 'unpaid'
                                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                }`}>
                                                    {billing.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <Link href={`/billings/${billing.encrypted_id ?? billing.id}`}>
                                                        <Button variant="outline" size="sm">View</Button>
                                                    </Link>
                                                    <Link href={`/payments/create?billingid=${encodeURIComponent(billing.billingid)}`}>
                                                        <Button size="sm">Add Payment</Button>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
<<<<<<< HEAD
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

=======
                                    ) : (
                                        filteredBillings.map((billing) => (
                                            <tr key={billing.id} className="border-b hover:bg-muted/50 transition-colors">
                                                <td className="py-3">
                                                    <Link
                                                        href={`/billings/${billing.encrypted_id ?? billing.id}`}
                                                        className="font-medium text-primary hover:underline"
                                                    >
                                                        {billing.billingid}
                                                    </Link>
                                                </td>
                                                <td className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <span>{billing.student_name || billing.studentid}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">
                                                            {formatDate(billing.billing_startdate)} - {formatDate(billing.billing_enddate)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                                        <span>{billing.total_hours.toFixed(2)}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 text-right font-medium">
                                                    {formatAmount(billing.amount)}
                                                </td>
                                                <td className="py-3 text-right text-green-600 font-medium">
                                                    {formatAmount(billing.total_paid)}
                                                </td>
                                                <td className="py-3 text-right text-red-600 font-bold">
                                                    {formatAmount(billing.balance)}
                                                </td>
                                                <td className="py-3">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        billing.status === 'unpaid' 
                                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                    }`}>
                                                        {billing.status}
                                                    </span>
                                                </td>
                                                <td className="py-3">
                                                    <div className="flex gap-2">
                                                        <Link href={`/billings/${billing.encrypted_id ?? billing.id}`}>
                                                            <Button variant="outline" size="sm">
                                                                View
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/payments/create?billingid=${encodeURIComponent(billing.billingid)}`}>
                                                            <Button size="sm">
                                                                Add Payment
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
>>>>>>> a7e8c778e9d14e724049fa08653bc0cc8325e51d
            </div>
        </AppLayout>
    );
}
