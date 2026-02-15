import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Heading from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import { useEffect, useMemo, useState } from 'react';
import { ClockArrowUp, Download } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
	{
		title: 'Attendance',
		href: '/attendance',
	},
];

type Attendance = {
	id: number;
	date: string;
	tutor_name?: string | null;
	student_name?: string | null;
	tutorialid?: string | null;
	time_in?: string | null;
	time_out?: string | null;
};

type Tutor = {
	id: number;
	tutorid: string;
	name: string;
};

function formatDate(value: any) {
	if (!value) return '-';

	if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
		return value.trim();
	}

	return String(value);
}

function formatTime12h(value: any) {
	if (!value) return '-';

	const minutes = timeToMinutes(value);
	if (minutes === null) return String(value);

	const hh24 = Math.floor(minutes / 60) % 24;
	const mm = minutes % 60;
	const suffix = hh24 >= 12 ? 'PM' : 'AM';
	const hh12 = hh24 % 12 || 12;
	return `${hh12}:${String(mm).padStart(2, '0')} ${suffix}`;
}

function timeToMinutes(value: any): number | null {
	if (!value || typeof value !== 'string') return null;
	const raw = value.trim();
	if (!raw) return null;

	const h24 = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
	if (h24) {
		const hh = Number(h24[1]);
		const mm = Number(h24[2]);
		if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
		if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
		return hh * 60 + mm;
	}

	const h12 = raw.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
	if (h12) {
		let hh = Number(h12[1]);
		const mm = Number(h12[2]);
		const ap = String(h12[3]).toUpperCase();
		if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
		if (hh < 1 || hh > 12 || mm < 0 || mm > 59) return null;
		if (ap === 'AM') {
			if (hh === 12) hh = 0;
		} else {
			if (hh !== 12) hh += 12;
		}
		return hh * 60 + mm;
	}

	return null;
}

export default function Attendance() {
	const { props } = usePage();
	const attendances = (props as any).attendances ?? [];
	const tutors = (props as any).tutors ?? [];

	const [activeTab, setActiveTab] = useState<'logs' | 'dtr'>(() => {
		if (typeof window === 'undefined') return 'logs';
		try {
			const u = new URL(window.location.href);
			const tab = u.searchParams.get('tab');
			return tab === 'dtr' ? 'dtr' : 'logs';
		} catch {
			return 'logs';
		}
	});

	useEffect(() => {
		if (typeof window === 'undefined') return;
		try {
			const url = new URL(window.location.href);
			const tab = url.searchParams.get('tab');
			const next = tab === 'dtr' ? 'dtr' : 'logs';
			setActiveTab(next);
		} catch {
			// ignore
		}
	}, []);

	const setTab = (tab: 'logs' | 'dtr') => {
		setActiveTab(tab);
		if (typeof window === 'undefined') return;
		try {
			const url = new URL(window.location.href);
			url.searchParams.set('tab', tab);
			window.history.replaceState({}, '', url.toString());
		} catch {
			// ignore
		}
	};

	// Attendance Logs state
	const [query, setQuery] = useState('');
	const [pageSize] = useState(15);
	const [currentPage, setCurrentPage] = useState(1);

	// Daily Time Records state
	const [selectedTutor, setSelectedTutor] = useState('');
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
	const [isGenerating, setIsGenerating] = useState(false);

	useEffect(() => {
		router.reload({ only: ['attendances'] });
	}, []);

	const handleGenerateReport = async () => {
		setIsGenerating(true);
		try {
			const params = new URLSearchParams();
			if (selectedTutor) params.append('tutor', selectedTutor);
			if (startDate) params.append('startDate', startDate);
			if (endDate) params.append('endDate', endDate);

			const url = `/attendance/dtr-pdf?${params.toString()}`;
			window.open(url, '_blank');
		} catch (error) {
			console.error('Error generating report:', error);
		} finally {
			setIsGenerating(false);
		}
	};

	const list = useMemo(() => {
		const source = attendances;
		if (!query) return source;
		const q = query.toLowerCase();
		return source.filter((a: any) => {
			const tutor = (a.tutor_name ?? '').toLowerCase();
			const student = (a.student_name ?? '').toLowerCase();
			const tutorialid = (a.tutorialid ?? '').toLowerCase();
			const date = (a.date ?? '').toLowerCase();
			return tutor.includes(q) || student.includes(q) || tutorialid.includes(q) || date.includes(q);
		});
	}, [attendances, query]);

	const dtrFiltered = useMemo(() => {
		let source = attendances;

		if (selectedTutor) {
			source = source.filter((a: any) => a.tutor_name === selectedTutor);
		}

		if (startDate) {
			source = source.filter((a: any) => (a.date ?? '') >= startDate);
		}

		if (endDate) {
			source = source.filter((a: any) => (a.date ?? '') <= endDate);
		}

		return source;
	}, [attendances, selectedTutor, startDate, endDate]);

	useEffect(() => {
		setCurrentPage(1);
	}, [list]);

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Attendance" />

			<div className="px-4 py-6">
				<Heading title="Attendance Management" description="View attendance logs and generate daily time records" />

				<div className="flex flex-col lg:flex-row lg:space-x-12">
					<aside className="w-full max-w-xl lg:w-48">
						<nav className="flex flex-col space-y-1 space-x-0">
							<Button
								size="sm"
								variant="ghost"
								className={`w-full justify-start ${activeTab === 'logs' ? 'bg-muted' : ''}`}
								onClick={() => setTab('logs')}
							>
								Attendance Logs
							</Button>
							<Button
								size="sm"
								variant="ghost"
								className={`w-full justify-start ${activeTab === 'dtr' ? 'bg-muted' : ''}`}
								onClick={() => setTab('dtr')}
							>
								Daily Time Records
							</Button>
						</nav>
					</aside>

					<Separator className="my-6 lg:hidden" />

					<div className="min-w-0 flex-1 space-y-4">
						{/* Attendance Logs Tab */}
						{activeTab === 'logs' && (
							<div className="space-y-4">
								<div className="flex items-center justify-between gap-4">
									<div className="flex-1 max-w-sm">
										<Input placeholder="Search attendance..." value={query} onChange={(e) => setQuery(e.target.value)} />
									</div>
									{/* <div>
										<Link href="/attendance/clock">
											<Button>
												<ClockArrowUp className="mr-2 h-4 w-4" /> Time Clock
											</Button>
										</Link>
									</div> */}
								</div>

								<div className="relative min-h-[50vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
									<div className="p-4">
										<div className="overflow-x-auto">
											<table className="w-full table-fixed">
												<thead>
													<tr className="text-left text-sm text-muted-foreground">
														<th className="px-3 py-2 w-[140px]">Date</th>
														<th className="px-3 py-2 w-[260px]">Tutor</th>
														<th className="px-3 py-2 w-[260px]">Student</th>
														<th className="px-3 py-2 w-[160px]">Tutorial ID</th>
														<th className="px-3 py-2 w-[140px]">Time In</th>
														<th className="px-3 py-2 w-[140px]">Time Out</th>
													</tr>
												</thead>
												<tbody>
													{list.length === 0 && (
														<tr>
															<td colSpan={6} className="p-4 text-center text-sm text-muted-foreground">
																No attendance records found.
															</td>
														</tr>
													)}
													{(() => {
														const start = (currentPage - 1) * pageSize;
														const paged = list.slice(start, start + pageSize);
														return paged.map((a: any) => (
															<tr key={a.id} className="border-t">
																<td className="px-3 py-2">{formatDate(a.date)}</td>
																<td className="px-3 py-2 break-words">{a.tutor_name ?? '-'}</td>
																<td className="px-3 py-2 break-words">{a.student_name ?? '-'}</td>
																<td className="px-3 py-2 break-words">{a.tutorialid ?? '-'}</td>
																<td className="px-3 py-2">{formatTime12h(a.time_in)}</td>
																<td className="px-3 py-2">{formatTime12h(a.time_out)}</td>
															</tr>
														));
													})()}
												</tbody>
											</table>
										</div>
									</div>
								</div>

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
							</div>
						)}

						{/* Daily Time Records Tab */}
						{activeTab === 'dtr' && (
							<div className="space-y-4">
								<div className="rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
									<h3 className="text-lg font-semibold mb-4">Generate Daily Time Records</h3>

									<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
										<div>
											<label className="text-sm font-medium mb-2 block">Select Tutor</label>
											<Input
												type="text"
												value={selectedTutor}
												onChange={(e) => setSelectedTutor(e.target.value)}
												placeholder="Type to filter tutors..."
												list="tutors-list"
											/>
											<datalist id="tutors-list">
												{tutors.map((tutor: Tutor) => (
													<option key={tutor.id} value={tutor.name} />
												))}
											</datalist>
										</div>

										<div>
											<label className="text-sm font-medium mb-2 block">Start Date</label>
											<Input
												type="date"
												value={startDate}
												onChange={(e) => setStartDate(e.target.value)}
											/>
										</div>

										<div>
											<label className="text-sm font-medium mb-2 block">End Date</label>
											<Input
												type="date"
												value={endDate}
												onChange={(e) => setEndDate(e.target.value)}
											/>
										</div>
									</div>

									<div className="mt-4 flex items-center gap-2">
										<Button
											onClick={() => {
												setSelectedTutor('');
												setStartDate('');
												setEndDate('');
											}}
											variant="outline"
										>
											Clear Filters
										</Button>
										<Button
											onClick={handleGenerateReport}
											disabled={isGenerating}
										>
											<Download className="mr-2 h-4 w-4" /> 
											{isGenerating ? 'Generating...' : 'Generate Report'}
										</Button>
									</div>
								</div>

								<div className="relative min-h-[50vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
									<div className="p-4">
										<div className="overflow-x-auto">
											<table className="w-full table-fixed">
												<thead>
													<tr className="text-left text-sm text-muted-foreground">
														<th className="px-3 py-2 w-[140px]">Date</th>
														<th className="px-3 py-2 w-[260px]">Tutor</th>
														<th className="px-3 py-2 w-[260px]">Student</th>
														<th className="px-3 py-2 w-[160px]">Tutorial ID</th>
														<th className="px-3 py-2 w-[140px]">Time In</th>
														<th className="px-3 py-2 w-[140px]">Time Out</th>
													</tr>
												</thead>
												<tbody>
													{dtrFiltered.length === 0 && (
														<tr>
															<td colSpan={6} className="p-4 text-center text-sm text-muted-foreground">
																No records found for the selected filters.
															</td>
														</tr>
													)}
													{dtrFiltered.map((a: any) => (
														<tr key={a.id} className="border-t">
															<td className="px-3 py-2">{formatDate(a.date)}</td>
															<td className="px-3 py-2 break-words">{a.tutor_name ?? '-'}</td>
															<td className="px-3 py-2 break-words">{a.student_name ?? '-'}</td>
															<td className="px-3 py-2 break-words">{a.tutorialid ?? '-'}</td>
															<td className="px-3 py-2">{formatTime12h(a.time_in)}</td>
															<td className="px-3 py-2">{formatTime12h(a.time_out)}</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</div>
								</div>

								<div className="text-sm text-muted-foreground px-4">
									Total records: {dtrFiltered.length}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</AppLayout>
	);
}

