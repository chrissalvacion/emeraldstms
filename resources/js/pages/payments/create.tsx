import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { type BreadcrumbItem } from '@/types';
import { useMemo, useState } from 'react';

type BillingOption = {
	billingid: string;
	studentname?: string | null;
	status?: string | null;
	total_hours?: number;
	total_amount?: number;
	total_paid?: number;
	balance_due?: number;
	tutorial_sessions?: Array<{
		tutorialid: string;
		hours: number;
		rounded_hours: number;
		hourly_rate: number;
		amount: number;
	}>;
};

export default function PaymentCreate() {
	const { props } = usePage();
	const billings = ((props as any).billings ?? []) as BillingOption[];
	const prefill = ((props as any).prefill ?? null) as { billingid?: string; studentname?: string | null } | null;
	const today = ((props as any).today ?? '') as string;

	const breadcrumbs: BreadcrumbItem[] = [
		{ title: 'Billings', href: '/billings' },
		{ title: 'Payments', href: '/billings' },
		{ title: 'Create', href: '/payments/create' },
	];

	const { data, setData, post, processing, errors } = useForm({
		billingid: prefill?.billingid ?? '',
		payment_date: today,
		amount: '',
		payment_method: '',
		transaction_reference: '',
		payer_name: '',
		remarks: '',
		nature_of_collection: '',
	});

	const [billingOpen, setBillingOpen] = useState(false);

	const selectedBilling = useMemo(() => {
		return billings.find((b) => String(b.billingid) === String(data.billingid)) ?? null;
	}, [billings, data.billingid]);

	const remainingBalance = Number(selectedBilling?.balance_due ?? 0);

	const formatMoney = (value: any) => {
		const n = Number(value ?? 0);
		if (!Number.isFinite(n)) return '0.00';
		return n.toFixed(2);
	};

	const billingSuggestions = useMemo(() => {
		const q = String(data.billingid ?? '').toLowerCase().trim();
		const filtered = billings.filter((b) => {
			const billingId = (b.billingid ?? '').toLowerCase();
			const studentName = (b.studentname ?? '').toLowerCase();
			if (!q) return true;
			return billingId.includes(q) || studentName.includes(q);
		});
		return filtered.slice(0, 20);
	}, [billings, data.billingid]);

	const prefillLocked = Boolean(prefill?.billingid);

	const currentStudentName = useMemo(() => {
		if (prefill?.studentname) return prefill.studentname;
		if (selectedBilling?.studentname) return selectedBilling.studentname;
		return '-';
	}, [prefill?.studentname, selectedBilling?.studentname]);

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Create Payment" />

			<div className="m-5">
				<h1 className="text-2xl font-semibold mb-4">Create Payment</h1>

				<form
					className="space-y-8 max-w-3xl"
					onSubmit={(e) => {
						e.preventDefault();
						if (selectedBilling && remainingBalance > 0 && !data.amount) {
							setData('amount', formatMoney(remainingBalance));
						}
						post('/payments');
					}}
				>
					<section className="p-4 rounded-md bg-background">
						<h2 className="text-lg font-medium mb-2">Payment Details</h2>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-2">
							<div className="lg:col-span-3">
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
									<div>
										<Label htmlFor="billingid">Billing</Label>
										<div className="relative">
											<Input
												id="billingid"
												placeholder="Search billing ID"
												value={String(data.billingid ?? '')}
												onChange={(e) => {
													setData('billingid', e.target.value);
													setBillingOpen(true);
													setData('amount', '');
												}}
												onFocus={() => setBillingOpen(true)}
												onBlur={() => {
													setTimeout(() => setBillingOpen(false), 150);
												}}
												disabled={prefillLocked}
												required
											/>

											{!prefillLocked && billingOpen && (
												<div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
													<div className="max-h-64 overflow-auto p-1">
														{billingSuggestions.length === 0 ? (
															<div className="px-2 py-1.5 text-sm text-muted-foreground">No matches</div>
														) : (
															billingSuggestions.map((b) => (
																<button
																	type="button"
																	key={b.billingid}
																	className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
																	onMouseDown={(e) => e.preventDefault()}
																	onClick={() => {
																	setData('billingid', b.billingid);
																	if (Number(b.balance_due ?? 0) > 0) {
																		setData('amount', formatMoney(b.balance_due));
																	}
																	setBillingOpen(false);
																}}
																>
																	<div className="font-medium">{b.billingid}</div>
																	{b.studentname ? (
																		<div className="text-xs text-muted-foreground">{b.studentname}</div>
																	) : null}
																	<div className="text-xs text-muted-foreground">
																		Balance: {formatMoney(b.balance_due)}
																	</div>
																</button>
															))
														)}
													</div>
												</div>
											)}
										</div>
										<InputError message={errors.billingid} />
									</div>

									<div>
										<Label>Student</Label>
										<div className="h-10 rounded-md border bg-muted/30 px-3 py-2 text-sm">
											{currentStudentName ?? '-'}
										</div>
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
											max={remainingBalance > 0 ? remainingBalance : undefined}
											value={String(data.amount ?? '')}
											onChange={(e) => setData('amount', e.target.value)}
											required
										/>
										{selectedBilling && (
											<div className="mt-1 text-xs text-muted-foreground">
												Remaining balance: {formatMoney(remainingBalance)}
											</div>
										)}
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
										<Input
											id="payer_name"
											value={String(data.payer_name ?? '')}
											onChange={(e) => setData('payer_name', e.target.value)}
										/>
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
										<Input
											id="remarks"
											value={String(data.remarks ?? '')}
											onChange={(e) => setData('remarks', e.target.value)}
										/>
										<InputError message={errors.remarks} />
									</div>
								</div>
							</div>

							<div className="lg:col-span-1">
								<div className="border rounded-md p-4 bg-secondary/50">
									<Label className="text-base font-medium">Payment method</Label>
									<div className="mt-4 space-y-3">
										<label className="flex items-center gap-2 text-sm text-foreground">
											<input
												type="radio"
												name="payment_method"
												value="Cash"
												required
												checked={data.payment_method === 'Cash'}
												onChange={() => setData('payment_method', 'Cash')}
												className="h-4 w-4 accent-primary"
											/>
											<span>Cash</span>
										</label>

										<label className="flex items-center gap-2 text-sm text-foreground">
											<input
												type="radio"
												name="payment_method"
												value="Bank"
												checked={data.payment_method === 'Bank'}
												onChange={() => setData('payment_method', 'Bank')}
												className="h-4 w-4 accent-primary"
											/>
											<span>Bank</span>
										</label>

										<label className="flex items-center gap-2 text-sm text-foreground">
											<input
												type="radio"
												name="payment_method"
												value="GCash"
												checked={data.payment_method === 'GCash'}
												onChange={() => setData('payment_method', 'GCash')}
												className="h-4 w-4 accent-primary"
											/>
											<span>GCash</span>
										</label>

										<label className="flex items-center gap-2 text-sm text-foreground">
											<input
												type="radio"
												name="payment_method"
												value="PayMaya"
												checked={data.payment_method === 'PayMaya'}
												onChange={() => setData('payment_method', 'PayMaya')}
												className="h-4 w-4 accent-primary"
											/>
											<span>PayMaya</span>
										</label>

										<label className="flex items-center gap-2 text-sm text-foreground">
											<input
												type="radio"
												name="payment_method"
												value="PalawanPay"
												checked={data.payment_method === 'PalawanPay'}
												onChange={() => setData('payment_method', 'PalawanPay')}
												className="h-4 w-4 accent-primary"
											/>
											<span>PalawanPay</span>
										</label>
									</div>
									<InputError message={errors.payment_method} />
								</div>
							</div>

							{selectedBilling && (
								<div className="mt-4 rounded-md border p-4 bg-secondary/30">
									<div className="mb-3 text-sm font-medium">Tutorial Sessions Billing Summary</div>
									<div className="grid grid-cols-2 gap-3 text-sm">
										<div>Total Tutorial Hours</div>
										<div className="text-right font-medium">{Number(selectedBilling.total_hours ?? 0).toFixed(2)}</div>
										<div>Total Billable Amount</div>
										<div className="text-right font-medium">{formatMoney(selectedBilling.total_amount)}</div>
										<div>Total Paid</div>
										<div className="text-right font-medium">{formatMoney(selectedBilling.total_paid)}</div>
										<div>Balance to Collect</div>
										<div className="text-right font-semibold">{formatMoney(selectedBilling.balance_due)}</div>
									</div>

									{Array.isArray(selectedBilling.tutorial_sessions) && selectedBilling.tutorial_sessions.length > 0 && (
										<div className="mt-4 space-y-2">
											<div className="text-sm font-medium">Per Tutorial Session</div>
											<div className="overflow-x-auto rounded-md border">
												<table className="w-full table-fixed text-sm">
													<thead>
														<tr className="text-left text-muted-foreground">
															<th className="px-2 py-2">Tutorial ID</th>
															<th className="px-2 py-2 text-right">Hours</th>
															<th className="px-2 py-2 text-right">Rate</th>
															<th className="px-2 py-2 text-right">Amount</th>
														</tr>
													</thead>
													<tbody>
														{selectedBilling.tutorial_sessions.map((s) => (
															<tr key={s.tutorialid} className="border-t">
																<td className="px-2 py-2">{s.tutorialid}</td>
																<td className="px-2 py-2 text-right">{Number(s.hours ?? 0).toFixed(2)}</td>
																<td className="px-2 py-2 text-right">{formatMoney(s.hourly_rate)}</td>
																<td className="px-2 py-2 text-right">{formatMoney(s.amount)}</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>
										</div>
									)}
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
