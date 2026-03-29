import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    { title: 'Unpaid Billings', href: '/reports/unpaid-billings' }
];

const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
        return billings.filter(billing => 
            billing.billingid?.toLowerCase().includes(query) ||
            billing.studentid?.toLowerCase().includes(query) ||
            billing.student_name?.toLowerCase().includes(query) ||
            billing.status?.toLowerCase().includes(query)
        );
    }, [billings, searchQuery]);

    const totalBalance = useMemo(() => {
        return filteredBillings.reduce((sum, billing) => sum + billing.balance, 0);
    }, [filteredBillings]);

    const totalAmount = useMemo(() => {
        return filteredBillings.reduce((sum, billing) => sum + (typeof billing.amount === 'number' ? billing.amount : parseFloat(billing.amount)), 0);
    }, [filteredBillings]);

    const totalPaid = useMemo(() => {
        return filteredBillings.reduce((sum, billing) => sum + billing.total_paid, 0);
    }, [filteredBillings]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Unpaid Billings Report" />
            
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/reports">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">Unpaid Billings Report</h1>
                            <p className="text-sm text-muted-foreground">
                                View all billings with outstanding balances
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={() => window.print()}>
                        <FileText className="mr-2 h-4 w-4" />
                        Print Report
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Unpaid Bills</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{filteredBillings.length}</div>
                            <p className="text-xs text-muted-foreground">billing records</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Amount Due</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatAmount(totalAmount)}</div>
                            <p className="text-xs text-muted-foreground">total billed</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                            <DollarSign className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{formatAmount(totalPaid)}</div>
                            <p className="text-xs text-muted-foreground">payments received</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                            <DollarSign className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{formatAmount(totalBalance)}</div>
                            <p className="text-xs text-muted-foreground">remaining to collect</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filters */}
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <Input
                            type="search"
                            placeholder="Search by billing ID, student name, or student ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="max-w-md"
                        />
                    </div>
                </div>

                {/* Billings Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Unpaid Billings</CardTitle>
                        <CardDescription>
                            {filteredBillings.length} {filteredBillings.length === 1 ? 'billing' : 'billings'} found
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b text-left text-sm text-muted-foreground">
                                        <th className="pb-3 font-medium">Billing ID</th>
                                        <th className="pb-3 font-medium">Student</th>
                                        <th className="pb-3 font-medium">Period</th>
                                        <th className="pb-3 font-medium text-center">Hours</th>
                                        <th className="pb-3 font-medium text-right">Amount</th>
                                        <th className="pb-3 font-medium text-right">Paid</th>
                                        <th className="pb-3 font-medium text-right">Balance</th>
                                        <th className="pb-3 font-medium">Status</th>
                                        <th className="pb-3 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBillings.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="py-8 text-center text-muted-foreground">
                                                No unpaid billings found
                                            </td>
                                        </tr>
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
            </div>
        </AppLayout>
    );
}
