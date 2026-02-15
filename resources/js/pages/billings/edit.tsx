import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { type BreadcrumbItem } from '@/types';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Billing = {
    encrypted_id: string;
    billingid: string;
    studentid: string;
    billing_startdate: string | null;
    billing_enddate: string | null;
    attendance_record: any;
    total_hours: number;
    amount: string | number;
    status: 'unpaid' | 'paid' | 'cancelled' | string;
};

export default function BillingEdit() {
    const { props } = usePage();
    const billing = (props as any).billing as Billing;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Billings', href: '/billings' },
        { title: billing?.billingid ?? 'Billing', href: `/billings/${billing?.encrypted_id ?? ''}` },
        { title: 'Edit', href: `/billings/${billing?.encrypted_id ?? ''}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        studentid: billing?.studentid ?? '',
        billing_startdate: billing?.billing_startdate ?? '',
        billing_enddate: billing?.billing_enddate ?? '',
        status: (billing?.status ?? 'unpaid') as string,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Billing" />

            <div className="m-5">
                <h1 className="text-2xl font-semibold mb-4">Edit Billing</h1>

                <form
                    className="space-y-6"
                    onSubmit={(e) => {
                        e.preventDefault();
                        put(`/billings/${billing.encrypted_id}`);
                    }}
                >
                    <section className="p-4 rounded-md bg-background">
                        <h2 className="text-lg font-medium mb-2">Billing Details</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <Label htmlFor="studentid">Student ID</Label>
                                <Input id="studentid" value={data.studentid} onChange={(e) => setData('studentid', e.target.value)} required />
                                <InputError message={errors.studentid} />
                            </div>

                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select value={String(data.status)} onValueChange={(v) => setData('status', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unpaid">Unpaid</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.status} />
                            </div>

                            {/* <div>
                                <Label htmlFor="billing_startdate">Start date</Label>
                                <Input
                                    id="billing_startdate"
                                    type="date"
                                    value={data.billing_startdate}
                                    onChange={(e) => setData('billing_startdate', e.target.value)}
                                    required
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
                                    required
                                />
                                <InputError message={errors.billing_enddate} />
                            </div> */}
                        </div>
                    </section>

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Link href={`/billings/${billing.encrypted_id}`} className="text-sm text-muted-foreground">
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
