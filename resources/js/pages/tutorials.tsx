import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { router } from '@inertiajs/react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '@/components/ui/dialog';

const breadcrumbs: BreadcrumbItem[] = [
	{
		title: 'Tutorials',
		href: '/tutorials',
	},
];

export default function Tutorials() {
	const { props } = usePage();
	const tutorialsFromServer = (props as any).tutorials ?? [];
	const [query, setQuery] = useState('');

	const safeSchedules = (raw: any): Array<{ days: string[]; start_time: string; end_time: string }> => {
		if (!raw) return [];
		if (Array.isArray(raw)) return raw;
		if (typeof raw === 'string') {
			try {
				const parsed = JSON.parse(raw);
				return Array.isArray(parsed) ? parsed : [];
			} catch {
				return [];
			}
		}
		return [];
	};

	const formatTime12h = (value: any) => {
		if (!value) return '-';
		try {
			return new Date(`2000-01-01 ${value}`).toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true,
			});
		} catch {
			return String(value);
		}
	};

	const list = useMemo(() => {
		const source = tutorialsFromServer;
		if (!query) return source;
		return source.filter((s: any) => {
			const student = (s.student_name ?? '').toLowerCase();
			const tutor = (s.tutor_name ?? '').toLowerCase();
			const tid = (s.tutorialid ?? '').toLowerCase();
			const q = query.toLowerCase();
			return (
				tid.includes(q) ||
				student.includes(q) ||
				tutor.includes(q) ||
				`${s.tutorial_date ?? ''}`.includes(q)
			);
		});
	}, [tutorialsFromServer, query]);

	const [confirmOpen, setConfirmOpen] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [deletingName, setDeletingName] = useState('');
	const pageSize = 15;
	const [currentPage, setCurrentPage] = useState(1);

	useEffect(() => {
		setCurrentPage(1);
	}, [list]);

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Tutorials" />

			<div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

				 <div className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-lg">
                    <h1 className="text-3xl font-bold mb-2">Tutorials</h1>
                    <p className="text-emerald-50">Manage tutorial sessions and schedules.</p>
                </div>

				<div className="flex items-center justify-between gap-4">
					<div className="flex-1 max-w-sm">
						<Input
							placeholder="Search tutorials..."
							value={query}
							onChange={(e) => setQuery(e.target.value)}
						/>
					</div>

					<div>
						<Link href={`/tutorials/create`}>
							<Button>
								<Plus className="mr-2 h-4 w-4" /> Add Tutorial
							</Button>
						</Link>
					</div>
				</div>

				<div className="relative min-h-[50vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
					<div className="p-4">
						<div className="overflow-x-auto">
							<table className="w-full table-fixed">
								<thead>
									<tr className="text-left text-sm text-muted-foreground">
										<th className="px-3 py-2 w-[160px]">Session ID</th>
										<th className="px-3 py-2 w-[260px]">Student</th>
										<th className="px-3 py-2 w-[260px]">Tutor</th>
										<th className="px-3 py-2 w-[240px]">Scheduled Days</th>
										<th className="px-3 py-2 w-[220px]">Time</th>
										<th className="px-3 py-2 w-[140px]">Start Date</th>
										<th className="px-3 py-2 w-[100px]">Status</th>
										<th className="px-3 py-2 w-[120px]">Actions</th>
									</tr>
								</thead>
								<tbody>
									{list.length === 0 && (
										<tr>
											<td colSpan={8} className="p-4 text-center text-sm text-muted-foreground">
												No tutorials found.
											</td>
										</tr>
									)}
									{(() => {
										const start = (currentPage - 1) * pageSize;
										const paged = list.slice(start, start + pageSize);
										return paged.map((s: any) => {
										const student = s.student_name ?? '-';
										const tutor = s.tutor_name ?? '-';
										const tutorialId = s.tutorialid ?? '-';
										const enc = s.encrypted_id ?? s.id;
										const schedules = safeSchedules(s.tutorial_schedule);
										return (
											<tr key={s.id} className="border-t">
												<td className="px-3 py-2 break-words">
													<Link href={`/tutorials/${enc}`} className="text-black">{tutorialId}</Link>
												</td>
												<td className="px-3 py-2 break-words">
													<Link href={`/tutorials/${enc}`} className="text-black">{student}</Link>
												</td>
												<td className="px-3 py-2 break-words">{tutor}</td>
												<td className="px-3 py-2 align-top">
													{schedules.length ? (
														<div className="space-y-1">
															{schedules.map((sc: any, i: number) => (
																<div key={i} className="text-sm">
																	{(sc.days ?? []).join(', ') || '-'}
																</div>
															))}
														</div>
													) : (
														'-'
													)}
												</td>
												<td className="px-3 py-2 align-top">
													{schedules.length ? (
														<div className="space-y-1">
															{schedules.map((sc: any, i: number) => (
																<div key={i} className="text-sm">
																	{formatTime12h(sc.start_time)} — {formatTime12h(sc.end_time)}
																</div>
															))}
														</div>
													) : (
														'-'
													)}
												</td>
												<td className="px-3 py-2">
													{s.start_date ? new Date(s.start_date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-'}
												</td>
												<td className="px-3 py-2">{s.status ?? '-'}</td>
												<td className="px-3 py-2">
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<button className="p-1 rounded-md hover:bg-muted">
																<MoreHorizontal className="h-4 w-4" />
															</button>
														</DropdownMenuTrigger>
														<DropdownMenuContent>
															<DropdownMenuItem asChild>
																<Link href={`/tutorials/${enc}`} className="w-full">View</Link>
															</DropdownMenuItem>
															<DropdownMenuItem asChild>
																<Link href={`/tutorials/${enc}/edit`} className="w-full">Edit</Link>
															</DropdownMenuItem>
															<DropdownMenuItem
																onSelect={() => {
																	setDeletingId(enc);
																	setDeletingName(`${student} - ${tutorialId}`);
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
										);
										});
									})()}
								</tbody>
							</table>
						</div>
					</div>
				</div>
				<div className="flex items-center justify-between gap-4 px-4">
					<div className="text-sm text-muted-foreground">Showing {(list.length === 0) ? 0 : ((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, list.length)} of {list.length}</div>
					<div className="flex items-center gap-2">
						<Button size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>Previous</Button>
						<div className="text-sm text-muted-foreground">Page {currentPage} of {Math.max(1, Math.ceil(list.length / pageSize))}</div>
						<Button size="sm" onClick={() => setCurrentPage((p) => Math.min(Math.ceil(list.length / pageSize) || 1, p + 1))} disabled={currentPage >= Math.ceil(list.length / pageSize)}>Next</Button>
					</div>
				</div>
				<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Delete tutorial</DialogTitle>
							<DialogDescription>Are you sure you want to delete {deletingName}? This action cannot be undone.</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<button type="button" className="btn" onClick={() => setConfirmOpen(false)}>Cancel</button>
							<button
								type="button"
								className="btn btn-destructive ml-2"
								onClick={() => {
									if (!deletingId) return;
									router.delete(`/tutorials/${deletingId}`);
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


