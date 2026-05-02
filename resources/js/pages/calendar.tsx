import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

type ScheduleEntry = {
	days?: string[];
	start_time?: string;
	end_time?: string;
};

type Tutorial = {
	id: number;
	tutorialid?: string;
	student_name?: string | null;
	tutor_name?: string | null;
	start_date?: string | null;
	end_date?: string | null;
	status?: string | null;
	tutorial_schedule?: ScheduleEntry[] | string | null;
};

type Occurrence = {
	tutorialId: string;
	tutor: string;
	student: string;
	start: string;
	end: string;
	status: string;
};

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

function parseYmdToLocalDate(ymd: string): Date | null {
	if (!ymd) return null;
	// Use noon to avoid timezone shift for date-only strings.
	const d = new Date(`${ymd}T12:00:00`);
	return Number.isNaN(d.getTime()) ? null : d;
}

function formatYmd(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

function normalizeDay(day: string): string | null {
	const key = day.trim().toLowerCase();
	const map: Record<string, string> = {
		mon: 'Monday',
		monday: 'Monday',
		tue: 'Tuesday',
		tues: 'Tuesday',
		tuesday: 'Tuesday',
		wed: 'Wednesday',
		wednesday: 'Wednesday',
		thu: 'Thursday',
		thur: 'Thursday',
		thurs: 'Thursday',
		thursday: 'Thursday',
		fri: 'Friday',
		friday: 'Friday',
		sat: 'Saturday',
		saturday: 'Saturday',
		sun: 'Sunday',
		sunday: 'Sunday',
	};
	return map[key] ?? null;
}

function inDateRange(date: Date, startYmd?: string | null, endYmd?: string | null): boolean {
	const start = startYmd ? parseYmdToLocalDate(startYmd) : null;
	const end = endYmd ? parseYmdToLocalDate(endYmd) : null;

	const t = date.getTime();
	if (start && t < start.getTime()) return false;
	if (end && t > end.getTime()) return false;
	return true;
}

function safeSchedules(raw: Tutorial['tutorial_schedule']): ScheduleEntry[] {
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
}

function timeToMinutes(value: any): number | null {
	if (!value || typeof value !== 'string') return null;
	const raw = value.trim();
	if (!raw) return null;

	// "HH:MM" or "HH:MM:SS"
	const h24 = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
	if (h24) {
		const hh = Number(h24[1]);
		const mm = Number(h24[2]);
		if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
		if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
		return hh * 60 + mm;
	}

	// "h:mm AM" / "h:mm PM"
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

export default function CalendarPage() {
	const { props } = usePage();
	const tutorials: Tutorial[] = ((props as any).tutorials ?? []) as Tutorial[];

	const today = useMemo(() => new Date(), []);
	const [visibleYear, setVisibleYear] = useState(() => today.getFullYear());
	const [visibleMonth, setVisibleMonth] = useState(() => today.getMonth());
	const [selectedYmd, setSelectedYmd] = useState<string | null>(null);
	const [panelOpen, setPanelOpen] = useState(false);

	const setVisibleMonthAndMaybeSelectFirstDay = (year: number, month: number) => {
		setVisibleYear(year);
		setVisibleMonth(month);
		// Only update selection if the schedules panel is already open.
		if (panelOpen) {
			setSelectedYmd(formatYmd(new Date(year, month, 1)));
		}
	};

	const goPrevMonth = () => {
		if (visibleMonth === 0) {
			setVisibleMonthAndMaybeSelectFirstDay(visibleYear - 1, 11);
			return;
		}
		setVisibleMonthAndMaybeSelectFirstDay(visibleYear, visibleMonth - 1);
	};

	const goNextMonth = () => {
		if (visibleMonth === 11) {
			setVisibleMonthAndMaybeSelectFirstDay(visibleYear + 1, 0);
			return;
		}
		setVisibleMonthAndMaybeSelectFirstDay(visibleYear, visibleMonth + 1);
	};

	const monthStart = useMemo(() => new Date(visibleYear, visibleMonth, 1), [visibleYear, visibleMonth]);
	const monthEnd = useMemo(() => new Date(visibleYear, visibleMonth + 1, 0), [visibleYear, visibleMonth]);
	const gridStart = useMemo(() => {
		const d = new Date(monthStart);
		d.setDate(d.getDate() - d.getDay());
		return d;
	}, [monthStart]);
	const gridEnd = useMemo(() => {
		const d = new Date(monthEnd);
		d.setDate(d.getDate() + (6 - d.getDay()));
		return d;
	}, [monthEnd]);

	const dates = useMemo(() => {
		const out: Date[] = [];
		const cur = new Date(gridStart);
		while (cur.getTime() <= gridEnd.getTime()) {
			out.push(new Date(cur));
			cur.setDate(cur.getDate() + 1);
		}
		return out;
	}, [gridStart, gridEnd]);

	const occurrencesByDate = useMemo(() => {
		const map = new Map<string, Occurrence[]>();

		for (const d of dates) {
			const ymd = formatYmd(d);
			const dayName = dayNames[d.getDay()];

			for (const t of tutorials) {
				const schedules = safeSchedules(t.tutorial_schedule);
				if (!schedules.length) continue;

				if (!inDateRange(d, t.start_date, t.end_date)) continue;

				for (const s of schedules) {
					const days = (s.days ?? []).map(normalizeDay).filter(Boolean) as string[];
					if (!days.includes(dayName)) continue;

					const occ: Occurrence = {
						tutorialId: t.tutorialid ?? String(t.id),
						tutor: (t.tutor_name ?? '').trim() || '—',
						student: (t.student_name ?? '').trim() || '—',
						start: s.start_time ?? '',
						end: s.end_time ?? '',
						status: t.status ?? 'Scheduled',
					};

					const list = map.get(ymd) ?? [];
					list.push(occ);
					map.set(ymd, list);
				}
			}
		}

		for (const [k, list] of map.entries()) {
			list.sort((a, b) => (a.start || '').localeCompare(b.start || ''));
			map.set(k, list);
		}

		return map;
	}, [dates, tutorials]);

	const monthLabel = useMemo(() => {
		return monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	}, [monthStart]);

	const breadcrumbs: BreadcrumbItem[] = [
		{ title: 'Calendar', href: '/calendar' }
	];

	const selectedDateLabel = useMemo(() => {
		if (!selectedYmd) return '';
		const d = parseYmdToLocalDate(selectedYmd);
		if (!d) return selectedYmd;
		return d.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	}, [selectedYmd]);

	const selectedOccurrences = useMemo(() => {
		if (!selectedYmd) return [] as Occurrence[];
		return occurrencesByDate.get(selectedYmd) ?? [];
	}, [occurrencesByDate, selectedYmd]);

	const statusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case 'ongoing': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
			case 'scheduled': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
			case 'completed': return 'bg-muted text-muted-foreground';
			case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
			default: return 'bg-muted text-muted-foreground';
		}
	};

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Calendar" />

			<div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">

				{/* Header */}
				<div className="flex items-center justify-between gap-4">
					<div>
						<h1 className="text-2xl font-semibold">{monthLabel}</h1>
						<p className="text-sm text-muted-foreground">Tutorial sessions plotted from tutorial schedules.</p>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="outline" size="icon" onClick={goPrevMonth} aria-label="Previous month">
							<ChevronLeft className="h-4 w-4" />
						</Button>
						<Button variant="outline" size="icon" onClick={goNextMonth} aria-label="Next month">
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</div>

				<div className="flex flex-col gap-4 lg:flex-row">

					{/* Calendar grid */}
					<div className="flex-1 rounded-xl border bg-background p-4">
						{/* Day labels */}
						<div className="mb-2 grid grid-cols-7">
							{dayLabels.map((d) => (
								<div key={d} className="py-1 text-center text-xs font-medium text-muted-foreground">
									{d}
								</div>
							))}
						</div>

						{/* Date cells */}
						<div className="grid grid-cols-7 gap-1">
							{dates.map((d) => {
								const ymd = formatYmd(d);
								const inMonth = d.getMonth() === visibleMonth;
								const isToday = ymd === formatYmd(today);
								const isSelected = ymd === selectedYmd;
								const occ = occurrencesByDate.get(ymd) ?? [];

								return (
									<div
										key={ymd}
										role="button"
										tabIndex={0}
										onClick={() => { setSelectedYmd(ymd); setPanelOpen(true); }}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault();
												setSelectedYmd(ymd);
												setPanelOpen(true);
											}
										}}
										className={[
											'min-h-24 cursor-pointer rounded-lg border p-2 text-left transition-colors hover:bg-muted/50',
											inMonth ? '' : 'opacity-40',
											isToday ? 'border-primary/50 bg-primary/5' : 'bg-background',
											isSelected ? 'ring-2 ring-primary ring-offset-1' : '',
										].join(' ')}
									>
										<div className="flex items-start justify-between gap-1">
											<span className={[
												'flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium',
												isToday ? 'bg-primary text-primary-foreground' : '',
											].join(' ')}>
												{d.getDate()}
											</span>
											{occ.length > 0 && (
												<span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
													{occ.length}
												</span>
											)}
										</div>

										<div className="mt-1.5 space-y-1">
											{occ.slice(0, 2).map((o, idx) => (
												<div key={idx} className="truncate rounded bg-muted/60 px-1.5 py-0.5 text-[10px] leading-tight">
													<span className="font-medium">{formatTime12h(o.start)}</span>
													<span className="text-muted-foreground"> · {o.tutor}</span>
												</div>
											))}
											{occ.length > 2 && (
												<div className="text-[10px] text-muted-foreground">+{occ.length - 2} more</div>
											)}
										</div>
									</div>
								);
							})}
						</div>
					</div>

					{/* Side panel */}
					{panelOpen && selectedYmd && (
						<div className="w-full shrink-0 rounded-xl border bg-background lg:w-[360px]">
							<div className="flex items-start justify-between gap-2 border-b px-4 py-3">
								<div>
									<div className="text-sm font-medium">Schedules</div>
									<div className="text-xs text-muted-foreground">{selectedDateLabel}</div>
								</div>
								<Button
									variant="ghost"
									size="icon"
									className="shrink-0"
									onClick={() => setPanelOpen(false)}
									aria-label="Close schedules panel"
								>
									<X className="h-4 w-4" />
								</Button>
							</div>

							<div className="space-y-3 p-4">
								{selectedOccurrences.length === 0 ? (
									<div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
										No sessions scheduled on this day.
									</div>
								) : (
									selectedOccurrences.map((o, idx) => (
										<div key={idx} className="rounded-xl border bg-background p-3 space-y-2">
											<div className="flex items-center justify-between gap-2">
												<span className="text-sm font-semibold">
													{formatTime12h(o.start)} – {formatTime12h(o.end)}
												</span>
												<span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColor(o.status)}`}>
													{o.status}
												</span>
											</div>
											<div className="text-xs text-muted-foreground">ID: {o.tutorialId}</div>
											<div className="grid grid-cols-2 gap-1 text-sm">
												<div>
													<div className="text-xs text-muted-foreground">Tutor</div>
													<div className="font-medium truncate">{o.tutor}</div>
												</div>
												<div>
													<div className="text-xs text-muted-foreground">Student</div>
													<div className="font-medium truncate">{o.student}</div>
												</div>
											</div>
										</div>
									))
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</AppLayout>
	);
}
