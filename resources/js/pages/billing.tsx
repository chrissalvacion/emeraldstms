import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Heading from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { router } from '@inertiajs/react';
import { MoreHorizontal, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { type BreadcrumbItem } from '@/types';

type Billing = {
	id: number;
	encrypted_id: string;
	billingid: string;
	studentid: string;
	student_name?: string | null;
	billing_startdate: string | null;
	billing_enddate: string | null;
	total_hours: number;
	amount: string | number;
	status: 'unpaid' | 'paid' | 'cancelled' | string;
};

type Payment = {
	id: number;
	paymentid: string;
	billingid: string;
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
	const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid' | 'cancelled'>('all');
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
				return (
					`${b.id}`.includes(q) ||
					(b.billingid ?? '').toLowerCase().includes(q) ||
					(b.studentid ?? '').toLowerCase().includes(q) ||
					studentName.includes(q) ||
					(b.status ?? '').toLowerCase().includes(q)
				);
			});
		}

		return source;
	}, [billingsFromServer, monthFilter, query, statusFilter]);

	const paymentsList = useMemo(() => {
		let source = paymentsFromServer;
		const q = paymentQuery.trim().toLowerCase();
		if (!q) return source;

		return source.filter((p) => {
			return (
				String(p.paymentid ?? '').toLowerCase().includes(q) ||
				String(p.id ?? '').toLowerCase().includes(q) ||
				String(p.billingid ?? '').toLowerCase().includes(q) ||
				String(p.studentname ?? '').toLowerCase().includes(q) ||
				String(p.payment_method ?? '').toLowerCase().includes(q) ||
				String(p.status ?? '').toLowerCase().includes(q) ||
				String(p.payment_date ?? '').toLowerCase().includes(q)
			);
		});
	}, [paymentQuery, paymentsFromServer]);

	const [confirmOpen, setConfirmOpen] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [deletingLabel, setDeletingLabel] = useState('');

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

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Billings" />

			<div className="px-4 py-6">
				<Heading title="Billings and Payments" description="Manage billings and payments" />

				<div className="flex flex-col lg:flex-row lg:space-x-12">
					<aside className="w-full max-w-xl lg:w-48">
						<nav className="flex flex-col space-y-1 space-x-0">
							<Button
								size="sm"
								variant="ghost"
								className={`w-full justify-start ${activeTab === 'billings' ? 'bg-muted' : ''}`}
								onClick={() => setTab('billings')}
							>
								Billings
							</Button>
							<Button
								size="sm"
								variant="ghost"
								className={`w-full justify-start ${activeTab === 'payments' ? 'bg-muted' : ''}`}
								onClick={() => setTab('payments')}
							>
								Payments
							</Button>
						</nav>
					</aside>

					<Separator className="my-6 lg:hidden" />

					<div className="min-w-0 flex-1 space-y-4">

						{activeTab === 'billings' && (
							<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div className="flex flex-col gap-2 md:flex-row md:items-center">
						<div className="max-w-sm">
							<Input placeholder="Search billings..." value={query} onChange={(e) => setQuery(e.target.value)} />
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
						)}

						{activeTab === 'payments' && (
							<div className="flex items-center justify-between gap-4">
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

						<div className="relative min-h-[50vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
					<div className="p-4">
						<div className="overflow-x-auto">
							{activeTab === 'billings' ? (
								<table className="w-full table-fixed">
									<thead>
										<tr className="text-left text-sm text-muted-foreground">
											<th className="px-3 py-2 w-[180px]">Billing ID</th>
											<th className="px-3 py-2 w-[220px]">Student</th>
											<th className="px-3 py-2 w-[140px]">Start</th>
											<th className="px-3 py-2 w-[140px]">End</th>
											<th className="px-3 py-2 w-[120px]">Hours</th>
											<th className="px-3 py-2 w-[120px]">Amount</th>
											<th className="px-3 py-2 w-[120px]">Status</th>
											<th className="px-3 py-2 w-[120px]">Actions</th>
										</tr>
									</thead>
									<tbody>
										{list.length === 0 && (
											<tr>
												<td colSpan={8} className="p-4 text-center text-sm text-muted-foreground">
													No billings found.
												</td>
											</tr>
										)}
										{(() => {
											const start = (currentPage - 1) * pageSize;
											const paged = list.slice(start, start + pageSize);
											return paged.map((b) => (
												<tr key={b.id} className="border-t">
													<td className="px-3 py-2 break-words">
														<Link href={`/billings/${b.encrypted_id}`} className="text-primary">
															{b.billingid ?? '-'}
														</Link>
													</td>
													<td className="px-3 py-2 break-words">{b.student_name ?? b.studentid ?? '-'}</td>
													<td className="px-3 py-2">{formatDate(b.billing_startdate)}</td>
													<td className="px-3 py-2">{formatDate(b.billing_enddate)}</td>
													<td className="px-3 py-2">{b.total_hours ?? '-'}</td>
													<td className="px-3 py-2">{formatAmount(b.amount)}</td>
													<td className="px-3 py-2">{(b.status ?? '').toLowerCase()}</td>
													<td className="px-3 py-2">
														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<button className="p-1 rounded-md hover:bg-muted" aria-label="Billing actions">
																	<MoreHorizontal className="h-4 w-4" />
																</button>
															</DropdownMenuTrigger>
															<DropdownMenuContent>
																<DropdownMenuItem asChild>
																	<Link href={`/billings/${b.encrypted_id}`} className="w-full">
																		View
																	</Link>
																</DropdownMenuItem>
																<DropdownMenuItem asChild>
																	<Link href={`/billings/${b.encrypted_id}/edit`} className="w-full">
																		Edit
																	</Link>
																</DropdownMenuItem>
																<DropdownMenuItem
																	onSelect={() => {
																		setDeletingId(b.encrypted_id);
																		setDeletingLabel(b.billingid ?? `#${b.id}`);
																		setConfirmOpen(true);
																	}}
																	className="text-destructive"
																>
																	Delete
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
										<tr className="text-left text-sm text-muted-foreground">
											<th className="px-3 py-2 w-[200px]">Payment ID</th>
											<th className="px-3 py-2 w-[200px]">Billing ID</th>
											<th className="px-3 py-2 w-[240px]">Student</th>
											<th className="px-3 py-2 w-[140px]">Date</th>
											<th className="px-3 py-2 w-[140px]">Amount</th>
											<th className="px-3 py-2 w-[180px]">Method</th>
											<th className="px-3 py-2 w-[140px]">Status</th>
										</tr>
									</thead>
									<tbody>
										{paymentsList.length === 0 && (
											<tr>
												<td colSpan={7} className="p-4 text-center text-sm text-muted-foreground">
													No payments found.
												</td>
											</tr>
										)}
										{paymentsList.map((p) => (
											<tr key={p.id} className="border-t">
												<td className="px-3 py-2 break-words">
													<Link href={`/payments/${p.id}`} className="text-primary">
														{p.paymentid ?? '-'}
													</Link>
												</td>
												<td className="px-3 py-2 break-words">
													{p.billing_encrypted_id ? (
														<Link href={`/billings/${p.billing_encrypted_id}`} className="text-primary">
															{p.billingid ?? '-'}
														</Link>
													) : (
														p.billingid ?? '-'
													)}
												</td>
												<td className="px-3 py-2 break-words">{p.studentname ?? '-'}</td>
												<td className="px-3 py-2">{formatDate(p.payment_date)}</td>
												<td className="px-3 py-2">{formatAmount(p.amount)}</td>
												<td className="px-3 py-2 break-words">{p.payment_method ?? '-'}</td>
												<td className="px-3 py-2">{(p.status ?? '').toLowerCase()}</td>
											</tr>
										))}
									</tbody>
								</table>
							)}
						</div>
					</div>
						</div>

						{activeTab === 'billings' && (
							<div className="flex items-center justify-between gap-4 px-4">
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

				<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Delete billing</DialogTitle>
							<DialogDescription>
								Are you sure you want to delete {deletingLabel}? This action cannot be undone.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<button type="button" className="btn" onClick={() => setConfirmOpen(false)}>
								Cancel
							</button>
							<button
								type="button"
								className="btn btn-destructive ml-2"
								onClick={() => {
									if (!deletingId) return;
									router.delete(`/billings/${deletingId}`);
									setConfirmOpen(false);
								}}
							>
								Delete
							</button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

			</div>
		</AppLayout>
	);
}
