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

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Calendar" />

			<div className="p-4">
				<div className="mb-4">
					<div className="flex items-center justify-between gap-2">
						<h1 className="text-2xl font-semibold">{monthLabel}</h1>
						<div className="flex gap-2">
							<Button variant="outline" size="icon" onClick={goPrevMonth} aria-label="Previous month" title="Previous month">
								<ChevronLeft />
							</Button>
							<Button variant="outline" size="icon" onClick={goNextMonth} aria-label="Next month" title="Next month">
								<ChevronRight />
							</Button>
						</div>
					</div>
					<div className="text-sm text-muted-foreground">Tutorial sessions plotted from tutorial schedules.</div>
				</div>

				<div className="flex flex-col gap-4 lg:flex-row">
					<div className="flex-1 rounded-md border bg-background p-4">
					<div className="grid grid-cols-7 gap-2 mb-2">
						{dayLabels.map((d) => (
							<div key={d} className="text-xs font-medium text-muted-foreground text-center">
								{d}
							</div>
						))}
					</div>

						<div className="grid grid-cols-7 gap-2">
						{dates.map((d) => {
							const ymd = formatYmd(d);
							const inMonth = d.getMonth() === visibleMonth;
							const isToday = formatYmd(d) === formatYmd(today);
							const occ = occurrencesByDate.get(ymd) ?? [];

								return (
									<div
										key={ymd}
										role="button"
										tabIndex={0}
										onClick={() => {
											setSelectedYmd(ymd);
											setPanelOpen(true);
										}}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											setSelectedYmd(ymd);
											setPanelOpen(true);
										}
									}}
										className={
											'min-h-28 cursor-pointer rounded-md border p-2 ' +
											(inMonth ? '' : 'opacity-60 ') +
											(isToday ? 'bg-muted' : 'bg-background')
										}
									>
									<div className="flex items-start justify-between">
										<div className="text-sm font-medium">{d.getDate()}</div>
										{occ.length ? (
											<div className="text-[10px] text-muted-foreground">{occ.length} session{occ.length > 1 ? 's' : ''}</div>
										) : null}
									</div>

									<div className="mt-2 space-y-1">
										{occ.slice(0, 3).map((o, idx) => (
											<div key={idx} className="text-xs">
												<div className="font-medium truncate">{formatTime12h(o.start)}–{formatTime12h(o.end)} • {o.tutor}</div>
												<div className="text-muted-foreground truncate">{o.student}</div>
											</div>
										))}
										{occ.length > 3 ? (
											<div className="text-xs text-muted-foreground">+{occ.length - 3} more</div>
										) : null}
									</div>
								</div>
							);
							})}
						</div>
					</div>

					{panelOpen && selectedYmd ? (
						<div className="w-full rounded-md border bg-background p-4 lg:w-[420px]">
							<div className="mb-2 flex items-start justify-between gap-2">
								<div>
									<div className="text-sm font-medium">Schedules</div>
									<div className="text-xs text-muted-foreground">{selectedDateLabel}</div>
								</div>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => {
										setPanelOpen(false);
									}}
									aria-label="Close schedules panel"
									title="Close"
								>
									<X />
								</Button>
							</div>

							<div className="space-y-3">
								{selectedOccurrences.length === 0 ? (
									<div className="text-sm text-muted-foreground">No schedules on this day.</div>
								) : (
									selectedOccurrences.map((o, idx) => (
										<div key={idx} className="rounded-md border p-3">
											<div className="text-sm font-medium">
												{formatTime12h(o.start)}–{formatTime12h(o.end)}
											</div>
											<div className="text-xs text-muted-foreground">Tutorial: {o.tutorialId}</div>
											<div className="mt-1 text-sm">Tutor: {o.tutor}</div>
											<div className="text-sm text-muted-foreground">Student: {o.student}</div>
										</div>
									))
								)}
							</div>
						</div>
					) : null}
				</div>
			</div>
		</AppLayout>
	);
}
