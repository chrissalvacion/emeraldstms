import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CreditCard,
    User,
    Calendar,
    DollarSign,
    Landmark,
    BadgeCheck,
    Hash,
    UserRound,
    StickyNote,
    Tag,
    Info,
} from 'lucide-react';
import { InfoField } from '@/components/ui/info-field';
import { useState } from 'react';

type Payment = {
    id: number;
    paymentid: string;
    billingid?: string | null;
    tutorialid?: string | null;
    studentname: string;
    payment_date: string;
    amount: string | number;
    payment_method: string;
    transaction_reference?: string | null;
    payer_name?: string | null;
    status?: string | null;
    remarks?: string | null;
    nature_of_collection?: string | null;
    created_at?: string;
    updated_at?: string;
};

export default function PaymentShow() {
    const { props } = usePage();
    const payment = (props as any).payment as Payment;

    const [confirmOpen, setConfirmOpen] = useState(false);
    const { delete: destroy, processing } = useForm({});

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Billings', href: '/billings' },
        { title: 'Payments', href: '/billings' },
        { title: payment?.paymentid ?? 'Payment', href: `/payments/${payment?.id ?? ''}` },
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Payment ${payment?.paymentid ?? ''}`} />

            <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link href="/billings">
                            <Button variant="ghost">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back
                            </Button>
                        </Link>

                        <div>
                            <h1 className="text-2xl font-semibold">Payment - {payment?.paymentid ?? ''}</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href={`/payments/${payment.id}/edit`}>
                            <Button variant="outline">Edit</Button>
                        </Link>

                        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                            <DialogTrigger asChild>
                                <Button variant="destructive">Delete</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>Delete payment</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete payment {payment?.paymentid ?? ''}? This action cannot be undone.
                                </DialogDescription>
                                <DialogFooter className="gap-2">
                                    <DialogClose asChild>
                                        <Button variant="secondary" disabled={processing}>
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button
                                        variant="destructive"
                                        disabled={processing}
                                        onClick={() => {
                                            destroy(`/payments/${payment.id}`, {
                                                preserveScroll: true,
                                                onSuccess: () => setConfirmOpen(false),
                                            });
                                        }}
                                    >
                                        {processing ? 'Deleting...' : 'Delete'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="rounded-xl border bg-background p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Info className="h-4 w-4" />
                        Payment Details
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <InfoField icon={CreditCard} label="Payment ID" value={payment?.paymentid ?? '-'} />
                        <InfoField icon={Hash} label="Tutorial ID" value={payment?.tutorialid ?? '-'} />

                        <InfoField icon={User} label="Student" value={payment?.studentname ?? '-'} />
                        <InfoField icon={Calendar} label="Payment date" value={formatDate(payment?.payment_date)} />
                        <InfoField icon={DollarSign} label="Amount" value={formatAmount(payment?.amount)} />
                        <InfoField icon={Landmark} label="Method" value={payment?.payment_method ?? '-'} />
                        <InfoField icon={BadgeCheck} label="Status" value={(payment?.status ?? '').toLowerCase() || '-'} />
                        <InfoField icon={UserRound} label="Payer name" value={payment?.payer_name ?? '-'} />

                        <InfoField
                            className="sm:col-span-2"
                            icon={StickyNote}
                            label="Remarks"
                            value={payment?.remarks ?? '-'}
                        />

                        <InfoField
                            icon={Tag}
                            label="Nature of Collection"
                            value={payment?.nature_of_collection ?? '-'}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
