import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Eye, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { type BreadcrumbItem } from '@/types';

type Billing = {
	id: number;
	encrypted_id: string;
	billingid: string;
	studentid: string;
	student_name?: string | null;
	tutorial_ids?: string | null;
	billing_startdate: string | null;
	billing_enddate: string | null;
	total_hours: number;
	amount: string | number;
	total_paid?: string | number;
	balance?: string | number;
	status: 'unpaid' | 'paid' | 'cancelled' | string;
};

type Payment = {
	id: number;
	paymentid: string;
	billingid?: string | null;
	tutorialid?: string | null;
	billing_encrypted_id?: string | null;
	studentname?: string | null;
	payment_date: string;
	amount: string | number;
	payment_method: string;
	status: string;
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Billings', href: '/billings' }];

const toMonthKey = (yyyyMmDd?: string | null) => {
	if (!yyyyMmDd) return null;
	// expect YYYY-MM-DD
	if (!/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) return null;
	return yyyyMmDd.slice(0, 7);
};

export default function BillingIndex() {
	const page = usePage();
	const { props } = page;
	const billingsFromServer = ((props as any).billings ?? []) as Billing[];
	const paymentsFromServer = ((props as any).payments ?? []) as Payment[];

	const [activeTab, setActiveTab] = useState<'billings' | 'payments'>(() => {
		if (typeof window === 'undefined') return 'billings';
		try {
			const u = new URL(window.location.href);
			const tab = u.searchParams.get('tab');
			return tab === 'payments' ? 'payments' : 'billings';
		} catch {
			return 'billings';
		}
	});

	useEffect(() => {
		if (typeof window === 'undefined') return;
		try {
			const u = new URL(page.url, window.location.origin);
			const tab = u.searchParams.get('tab');
			const next = tab === 'payments' ? 'payments' : 'billings';
			setActiveTab(next);
		} catch {
			// ignore
		}
	}, [page.url]);

	const setTab = (tab: 'billings' | 'payments') => {
		setActiveTab(tab);
		if (typeof window === 'undefined') return;
		try {
			const u = new URL(window.location.href);
			u.searchParams.set('tab', tab);
			window.history.replaceState({}, '', u.toString());
		} catch {
			// ignore
		}
	};

	const [query, setQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'partial' | 'paid' | 'cancelled'>('all');
	const [monthFilter, setMonthFilter] = useState<string>(''); // YYYY-MM
	const [paymentQuery, setPaymentQuery] = useState('');

	const list = useMemo(() => {
		let source = billingsFromServer;

		if (statusFilter !== 'all') {
			source = source.filter((b) => (b.status ?? '').toLowerCase() === statusFilter);
		}

		if (monthFilter) {
			source = source.filter((b) => {
				const month = toMonthKey(b.billing_startdate) ?? toMonthKey(b.billing_enddate);
				return month === monthFilter;
			});
		}

		if (query) {
			const q = query.toLowerCase();
			source = source.filter((b) => {
				const studentName = (b.student_name ?? '').toLowerCase();
				const tutorialIds = (b.tutorial_ids ?? '').toLowerCase();
				return (
					`${b.id}`.includes(q) ||
					(b.billingid ?? '').toLowerCase().includes(q) ||
					(b.studentid ?? '').toLowerCase().includes(q) ||
					studentName.includes(q) ||
					tutorialIds.includes(q) ||
					(b.status ?? '').toLowerCase().includes(q)
				);
			});
		}

		return source;
	}, [billingsFromServer, monthFilter, query, statusFilter]);

	const paymentsList = useMemo(() => {
		const source = paymentsFromServer;
		const q = paymentQuery.trim().toLowerCase();
		if (!q) return source;

		return source.filter((p) => {
			return (
				String(p.paymentid ?? '').toLowerCase().includes(q) ||
				String(p.id ?? '').toLowerCase().includes(q) ||
				String(p.tutorialid ?? '').toLowerCase().includes(q) ||
				String(p.billingid ?? '').toLowerCase().includes(q) ||
				String(p.studentname ?? '').toLowerCase().includes(q) ||
				String(p.payment_method ?? '').toLowerCase().includes(q) ||
				String(p.status ?? '').toLowerCase().includes(q) ||
				String(p.payment_date ?? '').toLowerCase().includes(q)
			);
		});
	}, [paymentQuery, paymentsFromServer]);

	const pageSize = 15;
	const [currentPage, setCurrentPage] = useState(1);

	useEffect(() => {
		setCurrentPage(1);
	}, [list]);

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

	const formatBillingDate = (start: string | null, end: string | null) => {
		if (start && end) return `${formatDate(start)} - ${formatDate(end)}`;
		return formatDate(start ?? end);
	};

	const getActualBillingStatus = (billing: Billing) => {
		const savedStatus = String(billing.status ?? '').toLowerCase();
		if (savedStatus === 'cancelled') return 'cancelled';

		const amount = Number(billing.amount ?? 0);
		const totalPaid = Number(billing.total_paid ?? 0);
		const computedBalance = Number.isFinite(Number(billing.balance))
			? Number(billing.balance)
			: amount - totalPaid;

		if (Number.isFinite(computedBalance) && computedBalance <= 0) return 'paid';
		if (Number.isFinite(totalPaid) && totalPaid > 0) return 'partial';
		return 'unpaid';
	};

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Billings" />

			<div className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
				<div className="w-full">
					<h1 className="mb-2 text-2xl font-bold">Billings and Payments</h1>
					<p className="text-sm text-muted-foreground">Manage billings and payments.</p>
				</div>

				<div className="flex flex-col lg:flex-row lg:space-x-12">
					<aside className="w-full max-w-xl lg:w-52">
						<nav className="flex flex-col space-y-1 rounded-xl border bg-background p-2">
							<Button
								size="sm"
								variant="ghost"
								className={`w-full justify-start ${activeTab === 'billings' ? 'bg-muted font-medium' : ''}`}
								onClick={() => setTab('billings')}
							>
								Billings
							</Button>
							<Button
								size="sm"
								variant="ghost"
								className={`w-full justify-start ${activeTab === 'payments' ? 'bg-muted font-medium' : ''}`}
								onClick={() => setTab('payments')}
							>
								Payments
							</Button>
						</nav>
					</aside>

					<Separator className="my-6 lg:hidden" />

					<div className="min-w-0 flex-1 space-y-4">

						{activeTab === 'billings' && (
							<div className="rounded-xl border bg-background p-4">
							<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div className="flex flex-col gap-2 md:flex-row md:items-center">
						<div className="max-w-sm">
							<Input placeholder="Search billings, tutee, tutorial ID..." value={query} onChange={(e) => setQuery(e.target.value)} />
						</div>

						<div className="flex items-center gap-2">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline">
										Status: {statusFilter === 'all' ? 'All' : statusFilter}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem onSelect={() => setStatusFilter('all')}>All</DropdownMenuItem>
									<DropdownMenuItem onSelect={() => setStatusFilter('unpaid')}>Unpaid</DropdownMenuItem>
									<DropdownMenuItem onSelect={() => setStatusFilter('partial')}>Partial</DropdownMenuItem>
									<DropdownMenuItem onSelect={() => setStatusFilter('paid')}>Paid</DropdownMenuItem>
									<DropdownMenuItem onSelect={() => setStatusFilter('cancelled')}>Cancelled</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>

							<Input
								type="month"
								value={monthFilter}
								onChange={(e) => setMonthFilter(e.target.value)}
								className="w-[160px]"
								aria-label="Filter by month"
							/>

							{(statusFilter !== 'all' || monthFilter || query) && (
								<Button
									variant="ghost"
									onClick={() => {
										setQuery('');
										setStatusFilter('all');
										setMonthFilter('');
									}}
								>
									Clear
								</Button>
							)}
						</div>
					</div>

					<div>
						<Link href="/billings/create">
							<Button>
								<Plus className="mr-2 h-4 w-4" /> Create Billing
							</Button>
						</Link>
					</div>
				</div>
							</div>
						)}

						{activeTab === 'payments' && (
							<div className="flex items-center justify-between gap-4 rounded-xl border bg-background p-4">
								<div className="max-w-sm">
									<Input
										placeholder="Search payments..."
										value={paymentQuery}
										onChange={(e) => setPaymentQuery(e.target.value)}
									/>
								</div>
								<Link href="/payments/create">
									<Button>
										<Plus className="mr-2 h-4 w-4" /> Create Payment
									</Button>
								</Link>
							</div>
						)}

						<div className="relative min-h-[50vh] flex-1 overflow-hidden rounded-xl border bg-background md:min-h-min">
					<div className="p-4">
						<div className="overflow-x-auto">
							{activeTab === 'billings' ? (
								<table className="w-full table-fixed">
									<thead>
										<tr className="border-b text-left text-sm text-muted-foreground">
											<th className="px-3 py-2 w-[180px]">Billing ID</th>
											<th className="px-3 py-2 w-[200px]">Tutee Name</th>
											<th className="px-3 py-2 w-[200px]">Tutorial ID</th>
											<th className="px-3 py-2 w-[220px]">Billing Date</th>
											{/* <th className="px-3 py-2 w-[120px]">Status</th> */}
											<th className="px-3 py-2 w-[80px] text-right">Actions</th>
										</tr>
									</thead>
									<tbody>
										{list.length === 0 && (
											<tr>
												<td colSpan={6} className="p-4 text-center text-sm text-muted-foreground">
													No billings found.
												</td>
											</tr>
										)}
										{(() => {
											const start = (currentPage - 1) * pageSize;
											const paged = list.slice(start, start + pageSize);
											return paged.map((b) => (
												<tr key={b.id} className="border-t odd:bg-transparent even:bg-muted/50">
													<td className="px-3 py-2 break-words">
														<Link href={`/billings/${b.encrypted_id}`} className="text-primary">
															{b.billingid ?? '-'}
														</Link>
													</td>
													<td className="px-3 py-2 break-words">{b.student_name ?? b.studentid ?? '-'}</td>
													<td className="px-3 py-2 break-words">{b.tutorial_ids || '-'}</td>
													<td className="px-3 py-2">{formatBillingDate(b.billing_startdate, b.billing_enddate)}</td>
													{/* <td className="px-3 py-2">{getActualBillingStatus(b)}</td> */}
													<td className="px-3 py-2 text-right">
														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<Button variant="ghost" size="icon" className="h-7 w-7">
																	<MoreHorizontal className="h-4 w-4" />
																</Button>
															</DropdownMenuTrigger>
															<DropdownMenuContent align="end">
																<DropdownMenuItem asChild>
																	<Link href={`/billings/${b.encrypted_id}`}>
																		<Eye className="mr-2 h-4 w-4" /> View
																	</Link>
																</DropdownMenuItem>
																<DropdownMenuItem asChild>
																	<Link href={`/billings/${b.encrypted_id}/edit`}>
																		<Pencil className="mr-2 h-4 w-4" /> Edit
																	</Link>
																</DropdownMenuItem>
																<DropdownMenuItem
																	className="text-destructive focus:text-destructive"
																	onSelect={() => {
																		if (confirm(`Delete billing ${b.billingid}?`)) {
																			router.delete(`/billings/${b.encrypted_id}`);
																		}
																	}}
																>
																	<Trash2 className="mr-2 h-4 w-4" /> Delete
																</DropdownMenuItem>
															</DropdownMenuContent>
														</DropdownMenu>
													</td>
												</tr>
											));
										})()}
									</tbody>
								</table>
							) : (
								<table className="w-full table-fixed">
									<thead>
										<tr className="border-b text-left text-sm text-muted-foreground">
											<th className="px-3 py-2 w-[200px]">Payment ID</th>
											<th className="px-3 py-2 w-[200px]">Tutorial ID</th>
											<th className="px-3 py-2 w-[240px]">Student</th>
											<th className="px-3 py-2 w-[140px]">Date</th>
											{/* <th className="px-3 py-2 w-[140px]">Amount</th>
											<th className="px-3 py-2 w-[180px]">Method</th>
											<th className="px-3 py-2 w-[140px]">Status</th> */}
											<th className="px-3 py-2 w-[80px] text-right">Actions</th>
										</tr>
									</thead>
									<tbody>
										{paymentsList.length === 0 && (
											<tr>
												<td colSpan={8} className="p-4 text-center text-sm text-muted-foreground">
													No payments found.
												</td>
											</tr>
										)}
										{paymentsList.map((p) => (
											<tr key={p.id} className="border-t odd:bg-transparent even:bg-muted/50">
												<td className="px-3 py-2 break-words">
													<Link href={`/payments/${p.id}`} className="text-primary">
														{p.paymentid ?? '-'}
													</Link>
												</td>
											<td className="px-3 py-2 break-words">{p.tutorialid ?? '-'}</td>
												<td className="px-3 py-2 break-words">{p.studentname ?? '-'}</td>
												<td className="px-3 py-2">{formatDate(p.payment_date)}</td>
												{/* <td className="px-3 py-2">{formatAmount(p.amount)}</td>
												<td className="px-3 py-2 break-words">{p.payment_method ?? '-'}</td>
												<td className="px-3 py-2">{p.status ?? '-'}</td> */}
												<td className="px-3 py-2 text-right">
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button variant="ghost" size="icon" className="h-7 w-7">
																<MoreHorizontal className="h-4 w-4" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem asChild>
																<Link href={`/payments/${p.id}`}>
																	<Eye className="mr-2 h-4 w-4" /> View
																</Link>
															</DropdownMenuItem>
															<DropdownMenuItem asChild>
																<Link href={`/payments/${p.id}/edit`}>
																	<Pencil className="mr-2 h-4 w-4" /> Edit
																</Link>
															</DropdownMenuItem>
															<DropdownMenuItem
																className="text-destructive focus:text-destructive"
																onSelect={() => {
																	if (confirm(`Delete payment ${p.paymentid}?`)) {
																		router.delete(`/payments/${p.id}`);
																	}
																}}
															>
																<Trash2 className="mr-2 h-4 w-4" /> Delete
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							)}
						</div>
					</div>
						</div>

						{activeTab === 'billings' && (
							<div className="flex items-center justify-between gap-4 rounded-xl border bg-background px-4 py-3">
						<div className="text-sm text-muted-foreground">
							Showing {list.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, list.length)} of {list.length}
						</div>
						<div className="flex items-center gap-2">
							<Button size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>
								Previous
							</Button>
							<div className="text-sm text-muted-foreground">Page {currentPage} of {Math.max(1, Math.ceil(list.length / pageSize))}</div>
							<Button
								size="sm"
								onClick={() => setCurrentPage((p) => Math.min(Math.ceil(list.length / pageSize) || 1, p + 1))}
								disabled={currentPage >= Math.ceil(list.length / pageSize)}
							>
								Next
							</Button>
						</div>
							</div>
						)}
					</div>
				</div>

			</div>
		</AppLayout>
	);
}
