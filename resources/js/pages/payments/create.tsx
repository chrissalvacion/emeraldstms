import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { type BreadcrumbItem } from '@/types';
import { useMemo, useState } from 'react';

type TutorialOption = {
tutorialid: string;
studentid?: string | null;
studentname?: string | null;
status?: string | null;
start_date?: string | null;
end_date?: string | null;
tutee_fee_amount?: number;
completed_hours?: number;
estimated_amount?: number;
};

export default function PaymentCreate() {
const { props } = usePage();
const tutorials = ((props as any).tutorials ?? []) as TutorialOption[];
const prefill = ((props as any).prefill ?? null) as { tutorialid?: string; studentname?: string | null } | null;
const today = ((props as any).today ?? '') as string;

const breadcrumbs: BreadcrumbItem[] = [
{ title: 'Billings', href: '/billings' },
{ title: 'Payments', href: '/billings' },
{ title: 'Create', href: '/payments/create' },
];

const { data, setData, post, processing, errors } = useForm({
tutorialid: prefill?.tutorialid ?? '',
payment_date: today,
amount: '',
payment_method: '',
transaction_reference: '',
payer_name: '',
remarks: '',
nature_of_collection: '',
});

const [tutorialOpen, setTutorialOpen] = useState(false);

const selectedTutorial = useMemo(() => {
return tutorials.find((t) => String(t.tutorialid) === String(data.tutorialid)) ?? null;
}, [tutorials, data.tutorialid]);

const formatMoney = (value: any) => {
const n = Number(value ?? 0);
if (!Number.isFinite(n)) return '0.00';
return n.toFixed(2);
};

const tutorialSuggestions = useMemo(() => {
const q = String(data.tutorialid ?? '').toLowerCase().trim();
const filtered = tutorials.filter((t) => {
const tutorialId = (t.tutorialid ?? '').toLowerCase();
const studentName = (t.studentname ?? '').toLowerCase();
if (!q) return true;
return tutorialId.includes(q) || studentName.includes(q);
});
return filtered.slice(0, 20);
}, [tutorials, data.tutorialid]);

const prefillLocked = Boolean(prefill?.tutorialid);

const currentStudentName = useMemo(() => {
if (prefill?.studentname) return prefill.studentname;
if (selectedTutorial?.studentname) return selectedTutorial.studentname;
return '-';
}, [prefill?.studentname, selectedTutorial?.studentname]);

return (
<AppLayout breadcrumbs={breadcrumbs}>
<Head title="Create Payment" />

<div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
<h1 className="mb-6 text-2xl font-semibold">Create Payment</h1>

<form
className="max-w-5xl space-y-6"
onSubmit={(e) => {
e.preventDefault();
post('/payments');
}}
>
<section className="rounded-xl border bg-background p-6">
<h2 className="mb-2 text-lg font-medium">Payment Details</h2>

<div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-2">
<div className="lg:col-span-3">
<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
<div>
<Label htmlFor="tutorialid">Tutorial Session</Label>
<div className="relative">
<Input
id="tutorialid"
placeholder="Search tutorial ID"
value={String(data.tutorialid ?? '')}
onChange={(e) => {
setData('tutorialid', e.target.value);
setTutorialOpen(true);
}}
onFocus={() => setTutorialOpen(true)}
onBlur={() => {
setTimeout(() => setTutorialOpen(false), 150);
}}
disabled={prefillLocked}
required
/>

{!prefillLocked && tutorialOpen && (
<div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-md">
<div className="max-h-64 overflow-auto p-1">
{tutorialSuggestions.length === 0 ? (
<div className="px-2 py-1.5 text-sm text-muted-foreground">No matches</div>
) : (
tutorialSuggestions.map((t) => (
<button
type="button"
key={t.tutorialid}
className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
onMouseDown={(e) => e.preventDefault()}
onClick={() => {
setData('tutorialid', t.tutorialid);
setTutorialOpen(false);
}}
>
<div className="font-medium">{t.tutorialid}</div>
{t.studentname ? <div className="text-xs text-muted-foreground">{t.studentname}</div> : null}
<div className="text-xs text-muted-foreground">Status: {t.status ?? '-'}</div>
</button>
))
)}
</div>
</div>
)}
</div>
<InputError message={errors.tutorialid} />
</div>

<div>
<Label>Student</Label>
<div className="h-10 rounded-md border bg-muted/30 px-3 py-2 text-sm">{currentStudentName ?? '-'}</div>
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

{selectedTutorial && (
<div className="mt-4 rounded-xl border bg-secondary/30 p-4">
<div className="mb-3 text-sm font-medium">Tutorial Session Summary</div>
<div className="grid grid-cols-2 gap-3 text-sm">
<div>Tutorial ID</div>
<div className="text-right font-medium">{selectedTutorial.tutorialid ?? '-'}</div>
<div>Start Date</div>
<div className="text-right font-medium">{selectedTutorial.start_date ?? '-'}</div>
<div>End Date</div>
<div className="text-right font-medium">{selectedTutorial.end_date ?? '-'}</div>
<div>Tutee Fee Rate</div>
<div className="text-right font-medium">{formatMoney(selectedTutorial.tutee_fee_amount)}</div>
<div>Completed Hours</div>
<div className="text-right font-medium">{Number(selectedTutorial.completed_hours ?? 0).toFixed(2)}</div>
<div>Estimated Amount</div>
<div className="text-right font-semibold">{formatMoney(selectedTutorial.estimated_amount)}</div>
</div>
</div>
)}
</div>
</section>

<div className="flex items-center gap-4">
<Button type="submit" disabled={processing}>
{processing ? 'Saving...' : 'Save Payment'}
</Button>
<Link href="/billings" className="text-sm text-muted-foreground">
Cancel
</Link>
</div>
</form>
</div>
</AppLayout>
);
}
