import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

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
};

export default function PaymentEdit() {
    const { props } = usePage();
    const payment = (props as any).payment as Payment;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Billings', href: '/billings' },
        { title: 'Payments', href: '/billings' },
        { title: payment?.paymentid ?? 'Payment', href: `/payments/${payment?.id ?? ''}` },
        { title: 'Edit', href: `/payments/${payment?.id ?? ''}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        tutorialid: payment?.tutorialid ?? '',
        payment_date: payment?.payment_date ?? '',
        amount: payment?.amount ?? '',
        payment_method: payment?.payment_method ?? '',
        transaction_reference: payment?.transaction_reference ?? '',
        payer_name: payment?.payer_name ?? '',
        remarks: payment?.remarks ?? '',
        nature_of_collection: (payment as any)?.nature_of_collection ?? '',
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Payment ${payment?.paymentid ?? ''}`} />

            <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                <h1 className="mb-6 text-2xl font-semibold">Edit Payment</h1>

                <form
                    className="max-w-5xl space-y-6"
                    onSubmit={(e) => {
                        e.preventDefault();
                        put(`/payments/${payment.id}`);
                    }}
                >
                    <section className="rounded-xl border bg-background p-6">
                        <h2 className="mb-2 text-lg font-medium">Payment Details</h2>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            <div className="lg:col-span-3">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div>
                                        <Label htmlFor="tutorialid">Tutorial Session</Label>
                                        <Input id="tutorialid" value={String(data.tutorialid ?? '')} onChange={(e) => setData('tutorialid', e.target.value)} required />
                                        <InputError message={errors.tutorialid} />
                                    </div>

                                    <div>
                                        <Label htmlFor="payment_date">Payment date</Label>
                                        <Input
                                            id="payment_date"
                                            type="date"
                                            value={String(data.payment_date ?? '')}
                                            onChange={(e) => setData('payment_date', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.payment_date} />
                                    </div>

                                    <div>
                                        <Label htmlFor="amount">Amount</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            min={0}
                                            value={String(data.amount ?? '')}
                                            onChange={(e) => setData('amount', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.amount} />
                                    </div>

                                    <div>
                                        <Label htmlFor="transaction_reference">Transaction reference</Label>
                                        <Input
                                            id="transaction_reference"
                                            value={String(data.transaction_reference ?? '')}
                                            onChange={(e) => setData('transaction_reference', e.target.value)}
                                        />
                                        <InputError message={errors.transaction_reference} />
                                    </div>

                                    <div>
                                        <Label htmlFor="payer_name">Payer name</Label>
                                        <Input id="payer_name" value={String(data.payer_name ?? '')} onChange={(e) => setData('payer_name', e.target.value)} />
                                        <InputError message={errors.payer_name} />
                                    </div>

                                    <div>
                                        <Label htmlFor="nature_of_collection">Nature of Collection</Label>
                                        <datalist id="collectionOptions">
                                            <option value="Registration Fee" />
                                            <option value="Tutorial Fee" />
                                            <option value="Others" />
                                        </datalist>
                                        <Input
                                            id="nature_of_collection"
                                            list="collectionOptions"
                                            value={String(data.nature_of_collection ?? '')}
                                            onChange={(e) => setData('nature_of_collection', e.target.value)}
                                            placeholder="Select or type..."
                                        />
                                        <InputError message={errors.nature_of_collection} />
                                    </div>

                                    <div className="sm:col-span-3">
                                        <Label htmlFor="remarks">Remarks</Label>
                                        <Input id="remarks" value={String(data.remarks ?? '')} onChange={(e) => setData('remarks', e.target.value)} />
                                        <InputError message={errors.remarks} />
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-1">
                                <div className="rounded-xl border bg-secondary/50 p-4">
                                    <Label className="text-base font-medium">Payment method</Label>
                                    <div className="mt-4 space-y-3">
                                        {['Cash', 'Bank', 'GCash', 'PayMaya', 'PalawanPay'].map((method) => (
                                            <label key={method} className="flex items-center gap-2 text-sm text-foreground">
                                                <input
                                                    type="radio"
                                                    name="payment_method"
                                                    value={method}
                                                    required={method === 'Cash'}
                                                    checked={data.payment_method === method}
                                                    onChange={() => setData('payment_method', method)}
                                                    className="h-4 w-4 accent-primary"
                                                />
                                                <span>{method}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <InputError message={errors.payment_method} />
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Payment'}
                        </Button>
                        <Link href={`/payments/${payment.id}`} className="text-sm text-muted-foreground">
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
