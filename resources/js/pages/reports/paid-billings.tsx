import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, DollarSign, Calendar, User, Clock, CheckCircle } from 'lucide-react';
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
    { title: 'Paid Billings', href: '/reports/paid-billings' }
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

export default function PaidBillingsReport({ billings }: PaidBillingsProps) {
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

    const totalAmount = useMemo(() => {
        return filteredBillings.reduce((sum, billing) => sum + (typeof billing.amount === 'number' ? billing.amount : parseFloat(billing.amount)), 0);
    }, [filteredBillings]);

    const totalPaid = useMemo(() => {
        return filteredBillings.reduce((sum, billing) => sum + billing.total_paid, 0);
    }, [filteredBillings]);

    const totalHours = useMemo(() => {
        return filteredBillings.reduce((sum, billing) => sum + billing.total_hours, 0);
    }, [filteredBillings]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Paid Billings Report" />
            
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
                            <h1 className="text-2xl font-bold">Paid Billings Report</h1>
                            <p className="text-sm text-muted-foreground">
                                View all fully paid billing statements
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
                            <CardTitle className="text-sm font-medium">Total Paid Bills</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{filteredBillings.length}</div>
                            <p className="text-xs text-muted-foreground">billing records</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{formatAmount(totalAmount)}</div>
                            <p className="text-xs text-muted-foreground">total collected</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Payments Received</CardTitle>
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">{formatAmount(totalPaid)}</div>
                            <p className="text-xs text-muted-foreground">total paid</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalHours.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">tutorial hours</p>
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
                        <CardTitle>Paid Billings</CardTitle>
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
                                        <th className="pb-3 font-medium text-right">Total Paid</th>
                                        <th className="pb-3 font-medium">Status</th>
                                        <th className="pb-3 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBillings.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-8 text-center text-muted-foreground">
                                                No paid billings found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredBillings.map((billing) => (
                                            <tr key={billing.id} className="border-b hover:bg-muted/50 transition-colors">
                                                <td className="py-3">
                                                    <Link
                                                        href={`/billings/${billing.id}`}
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
                                                <td className="py-3 text-right text-green-600 font-bold">
                                                    {formatAmount(billing.total_paid)}
                                                </td>
                                                <td className="py-3">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-0.5 text-xs font-medium">
                                                        <CheckCircle className="h-3 w-3" />
                                                        {billing.status}
                                                    </span>
                                                </td>
                                                <td className="py-3">
                                                    <Link href={`/billings/${billing.id}`}>
                                                        <Button variant="outline" size="sm">
                                                            View Details
                                                        </Button>
                                                    </Link>
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
