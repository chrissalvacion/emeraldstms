import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
<<<<<<< HEAD
=======
import Heading from '@/components/heading';
>>>>>>> a7e8c778e9d14e724049fa08653bc0cc8325e51d
import { Separator } from '@/components/ui/separator';
import { useEffect, useMemo, useState } from 'react';
import { ClockArrowUp, Download, MoreHorizontal } from 'lucide-react';

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
<<<<<<< HEAD
    tutorial_level?: string | null;
    time_in?: string | null;
    time_out?: string | null;
    remarks?: string | null;
=======
    time_in?: string | null;
    time_out?: string | null;
>>>>>>> a7e8c778e9d14e724049fa08653bc0cc8325e51d
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

function toTimeInputValue(value: any): string {
    if (!value) return '';
    const min = timeToMinutes(value);
    if (min === null) return '';
    const hh = Math.floor(min / 60) % 24;
    const mm = min % 60;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export default function Attendance() {
    const { props } = usePage();
    const attendances = ((props as any).attendances ?? []) as Attendance[];
    const tutors = ((props as any).tutors ?? []) as Tutor[];
    const errors = ((props as any).errors ?? {}) as Record<string, string>;

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
<<<<<<< HEAD
    const [logsStartDate, setLogsStartDate] = useState('');
    const [logsEndDate, setLogsEndDate] = useState('');
    const [logsLevel, setLogsLevel] = useState('');

    const attendanceLevels = [
        'Kindergarten',
        'Elementary',
        'Junior High School',
        'Senior High School',
        'College',
    ];

    // Daily Time Records state
    const [selectedTutor, setSelectedTutor] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Log actions state
    const [editingRecord, setEditingRecord] = useState<Attendance | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [deletingRecord, setDeletingRecord] = useState<Attendance | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [actionPassword, setActionPassword] = useState('');
    const [editForm, setEditForm] = useState({
        date: '',
        time_in: '',
        time_out: '',
        remarks: '',
    });
=======
    const [query, setQuery] = useState('');
    const [logsStartDate, setLogsStartDate] = useState('');
    const [logsEndDate, setLogsEndDate] = useState('');
    const [pageSize] = useState(15);
    const [currentPage, setCurrentPage] = useState(1);

    // Daily Time Records state
    const [selectedTutor, setSelectedTutor] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Log actions state
    const [editingRecord, setEditingRecord] = useState<Attendance | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [deletingRecord, setDeletingRecord] = useState<Attendance | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [actionPassword, setActionPassword] = useState('');
    const [editForm, setEditForm] = useState({
        date: '',
        time_in: '',
        time_out: '',
    });

    useEffect(() => {
        router.reload({ only: ['attendances'] });
    }, []);
>>>>>>> a7e8c778e9d14e724049fa08653bc0cc8325e51d

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
        let source = attendances;

        if (logsStartDate) {
            source = source.filter((a) => (a.date ?? '') >= logsStartDate);
        }

        if (logsEndDate) {
            source = source.filter((a) => (a.date ?? '') <= logsEndDate);
        }

<<<<<<< HEAD
        if (logsLevel) {
            source = source.filter((a) => (a.tutorial_level ?? '') === logsLevel);
        }

        return source;
    }, [attendances, logsEndDate, logsLevel, logsStartDate]);

    const handleExportLogsPdf = () => {
        const params = new URLSearchParams();
        if (logsStartDate) params.append('startDate', logsStartDate);
        if (logsEndDate) params.append('endDate', logsEndDate);

        const qs = params.toString();
        const url = qs ? `/attendance/dtr-pdf?${qs}` : '/attendance/dtr-pdf';
        window.open(url, '_blank');
    };

    const openEdit = (record: Attendance) => {
        setEditingRecord(record);
        setEditForm({
            date: record.date ?? '',
            time_in: toTimeInputValue(record.time_in),
            time_out: toTimeInputValue(record.time_out),
            remarks: record.remarks ?? '',
        });
        setActionPassword('');
        setEditOpen(true);
    };

    const submitEdit = () => {
        if (!editingRecord) return;

        router.put(
            `/attendance/logs/${editingRecord.id}`,
            {
                date: editForm.date,
                time_in: editForm.time_in || null,
                time_out: editForm.time_out || null,
                remarks: editForm.remarks.trim() || null,
                password: actionPassword,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditOpen(false);
                    setEditingRecord(null);
                    setActionPassword('');
                },
            },
        );
    };

    const submitDelete = () => {
        if (!deletingRecord) return;

        router.delete(`/attendance/logs/${deletingRecord.id}`, {
            data: { password: actionPassword },
            preserveScroll: true,
            onSuccess: () => {
                setDeleteOpen(false);
                setDeletingRecord(null);
                setActionPassword('');
            },
        });
    };

    const dtrFiltered = useMemo(() => {
        let source = attendances;

        if (selectedTutor) {
            source = source.filter((a) => a.tutor_name === selectedTutor);
        }

        if (startDate) {
            source = source.filter((a) => (a.date ?? '') >= startDate);
        }

        if (endDate) {
            source = source.filter((a) => (a.date ?? '') <= endDate);
        }

        return source;
    }, [attendances, selectedTutor, startDate, endDate]);
=======
        if (!query) return source;
        const q = query.toLowerCase();
        return source.filter((a) => {
            const tutor = (a.tutor_name ?? '').toLowerCase();
            const student = (a.student_name ?? '').toLowerCase();
            const tutorialid = (a.tutorialid ?? '').toLowerCase();
            const date = (a.date ?? '').toLowerCase();
            return tutor.includes(q) || student.includes(q) || tutorialid.includes(q) || date.includes(q);
        });
    }, [attendances, logsEndDate, logsStartDate, query]);

    const handleExportLogsPdf = () => {
        const params = new URLSearchParams();
        if (logsStartDate) params.append('startDate', logsStartDate);
        if (logsEndDate) params.append('endDate', logsEndDate);

        const qs = params.toString();
        const url = qs ? `/attendance/dtr-pdf?${qs}` : '/attendance/dtr-pdf';
        window.open(url, '_blank');
    };

    const openEdit = (record: Attendance) => {
        setEditingRecord(record);
        setEditForm({
            date: record.date ?? '',
            time_in: toTimeInputValue(record.time_in),
            time_out: toTimeInputValue(record.time_out),
        });
        setActionPassword('');
        setEditOpen(true);
    };

    const submitEdit = () => {
        if (!editingRecord) return;

        router.put(
            `/attendance/logs/${editingRecord.id}`,
            {
                date: editForm.date,
                time_in: editForm.time_in || null,
                time_out: editForm.time_out || null,
                password: actionPassword,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditOpen(false);
                    setEditingRecord(null);
                    setActionPassword('');
                },
            },
        );
    };

    const submitDelete = () => {
        if (!deletingRecord) return;

        router.delete(`/attendance/logs/${deletingRecord.id}`, {
            data: { password: actionPassword },
            preserveScroll: true,
            onSuccess: () => {
                setDeleteOpen(false);
                setDeletingRecord(null);
                setActionPassword('');
            },
        });
    };

    const dtrFiltered = useMemo(() => {
        let source = attendances;

        if (selectedTutor) {
            source = source.filter((a) => a.tutor_name === selectedTutor);
        }

        if (startDate) {
            source = source.filter((a) => (a.date ?? '') >= startDate);
        }

        if (endDate) {
            source = source.filter((a) => (a.date ?? '') <= endDate);
        }

        return source;
    }, [attendances, selectedTutor, startDate, endDate]);

    useEffect(() => {
        setCurrentPage(1);
    }, [list]);
>>>>>>> a7e8c778e9d14e724049fa08653bc0cc8325e51d

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance" />

<<<<<<< HEAD
            <div className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
                <div className="w-full">
                    <h1 className="mb-2 text-2xl font-bold">Attendance Management</h1>
                    <p className="text-sm text-muted-foreground">View attendance logs and generate daily time records.</p>
                </div>

                <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:space-x-12">
                    <aside className="w-full max-w-xl lg:w-52">
                        <nav className="flex flex-col space-y-1 rounded-xl border bg-background p-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                className={`w-full justify-start ${activeTab === 'logs' ? 'bg-muted font-medium' : ''}`}
=======
            <div className="px-4 py-6">
                <Heading title="Attendance Management" description="View attendance logs and generate daily time records" />

                <div className="flex flex-col lg:flex-row lg:space-x-12">
                    <aside className="w-full max-w-xl lg:w-48">
                        <nav className="flex flex-col space-y-1 space-x-0">
                            <Button
                                size="sm"
                                variant="ghost"
                                className={`w-full justify-start ${activeTab === 'logs' ? 'bg-muted' : ''}`}
>>>>>>> a7e8c778e9d14e724049fa08653bc0cc8325e51d
                                onClick={() => setTab('logs')}
                            >
                                Attendance Logs
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
<<<<<<< HEAD
                                className={`w-full justify-start ${activeTab === 'dtr' ? 'bg-muted font-medium' : ''}`}
=======
                                className={`w-full justify-start ${activeTab === 'dtr' ? 'bg-muted' : ''}`}
>>>>>>> a7e8c778e9d14e724049fa08653bc0cc8325e51d
                                onClick={() => setTab('dtr')}
                            >
                                Daily Time Records
                            </Button>
                        </nav>
                    </aside>

                    <Separator className="my-6 lg:hidden" />

<<<<<<< HEAD
                    <div className="min-w-0 flex-1 min-h-0">
                        {activeTab === 'logs' && (
                            <div className="flex min-h-0 flex-col gap-4">
                                <div className="rounded-xl border bg-background p-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                                        <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
                                            <div>
                                                <label className="mb-1 block text-sm text-muted-foreground">Start Date</label>
                                                <Input type="date" value={logsStartDate} onChange={(e) => setLogsStartDate(e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm text-muted-foreground">End Date</label>
                                                <Input type="date" value={logsEndDate} onChange={(e) => setLogsEndDate(e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm text-muted-foreground">Level</label>
                                                <select
                                                    value={logsLevel}
                                                    onChange={(e) => setLogsLevel(e.target.value)}
                                                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none ring-offset-background transition-[color,box-shadow] focus-visible:ring-1 focus-visible:ring-ring"
                                                >
                                                    <option value="">All Levels</option>
                                                    {attendanceLevels.map((level) => (
                                                        <option key={level} value={level}>
                                                            {level}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" onClick={handleExportLogsPdf}>
                                                <Download className="mr-2 h-4 w-4" /> Export PDF
                                            </Button>
                                            <Link href="/attendance/clock">
                                                <Button>
                                                    <ClockArrowUp className="mr-2 h-4 w-4" /> Record Attendance
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative min-h-[50vh] flex-1 overflow-hidden rounded-xl border bg-background md:min-h-min">
=======
                    <div className="min-w-0 flex-1 space-y-4">
                        {activeTab === 'logs' && (
                            <div className="space-y-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                                    <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
                                        <div className="max-w-sm">
                                            <label className="mb-1 block text-sm text-muted-foreground">Search Tutor</label>
                                            <Input placeholder="Search attendance..." value={query} onChange={(e) => setQuery(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm text-muted-foreground">Start Date</label>
                                            <Input type="date" value={logsStartDate} onChange={(e) => setLogsStartDate(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm text-muted-foreground">End Date</label>
                                            <Input type="date" value={logsEndDate} onChange={(e) => setLogsEndDate(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" onClick={handleExportLogsPdf}>
                                            <Download className="mr-2 h-4 w-4" /> Export PDF
                                        </Button>
                                        <Link href="/attendance/clock">
                                            <Button>
                                                <ClockArrowUp className="mr-2 h-4 w-4" /> Record Attendance
                                            </Button>
                                        </Link>
                                    </div>
                                </div>

                                <div className="relative min-h-[50vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
>>>>>>> a7e8c778e9d14e724049fa08653bc0cc8325e51d
                                    <div className="p-4">
                                        <div className="overflow-x-auto">
                                            <table className="w-full table-fixed">
                                                <thead>
<<<<<<< HEAD
                                                    <tr className="border-b text-left text-sm text-muted-foreground">
                                                        <th className="px-3 py-2 w-[140px]">Date</th>
                                                        <th className="px-3 py-2 w-[200px]">Tutor</th>
                                                        <th className="px-3 py-2 w-[200px]">Student</th>
                                                        {/* <th className="px-3 py-2 w-[160px]">Tutorial ID</th> */}
                                                        <th className="px-3 py-2 w-[140px]">Time Log</th>
                                                        {/* <th className="px-3 py-2 w-[140px]">Time Out</th> */}
                                                        {/* <th className="px-3 py-2 w-[260px]">Remarks</th> */}
=======
                                                    <tr className="text-left text-sm text-muted-foreground">
                                                        <th className="px-3 py-2 w-[140px]">Date</th>
                                                        <th className="px-3 py-2 w-[260px]">Tutor</th>
                                                        <th className="px-3 py-2 w-[260px]">Student</th>
                                                        <th className="px-3 py-2 w-[160px]">Tutorial ID</th>
                                                        <th className="px-3 py-2 w-[140px]">Time In</th>
                                                        <th className="px-3 py-2 w-[140px]">Time Out</th>
>>>>>>> a7e8c778e9d14e724049fa08653bc0cc8325e51d
                                                        <th className="px-3 py-2 w-[100px]">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {list.length === 0 && (
                                                        <tr>
<<<<<<< HEAD
                                                            <td colSpan={8} className="p-4 text-center text-sm text-muted-foreground">
=======
                                                            <td colSpan={7} className="p-4 text-center text-sm text-muted-foreground">
>>>>>>> a7e8c778e9d14e724049fa08653bc0cc8325e51d
                                                                No attendance records found.
                                                            </td>
                                                        </tr>
                                                    )}
<<<<<<< HEAD
                                                    {list.map((a) => (
                                                        <tr key={a.id} className="border-t text-sm odd:bg-transparent even:bg-muted/50">
                                                            <td className="px-3 py-2">{formatDate(a.date)}</td>
                                                            <td className="px-3 py-2 break-words">{a.tutor_name ?? '-'}</td>
                                                            <td className="px-3 py-2 break-words">{a.student_name ?? '-'}</td>
                                                            {/* <td className="px-3 py-2 break-words">{a.tutorialid ?? '-'}</td> */}
                                                            <td className="px-3 py-2">{formatTime12h(a.time_in)} - {formatTime12h(a.time_out)}</td>
                                                            {/* <td className="px-3 py-2 break-words">{a.remarks ? a.remarks : '-'}</td> */}
                                                            <td className="px-3 py-2">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <button type="button" className="rounded-md p-1 hover:bg-muted" aria-label="Attendance row actions">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onSelect={() => openEdit(a)}>Edit</DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            className="text-destructive"
                                                                            onSelect={() => {
                                                                                setDeletingRecord(a);
                                                                                setActionPassword('');
                                                                                setDeleteOpen(true);
                                                                            }}
                                                                        >
                                                                            Delete
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </td>
                                                        </tr>
                                                    ))}
=======
                                                    {(() => {
                                                        const start = (currentPage - 1) * pageSize;
                                                        const paged = list.slice(start, start + pageSize);
                                                        return paged.map((a) => (
                                                            <tr key={a.id} className="border-t">
                                                                <td className="px-3 py-2">{formatDate(a.date)}</td>
                                                                <td className="px-3 py-2 break-words">{a.tutor_name ?? '-'}</td>
                                                                <td className="px-3 py-2 break-words">{a.student_name ?? '-'}</td>
                                                                <td className="px-3 py-2 break-words">{a.tutorialid ?? '-'}</td>
                                                                <td className="px-3 py-2">{formatTime12h(a.time_in)}</td>
                                                                <td className="px-3 py-2">{formatTime12h(a.time_out)}</td>
                                                                <td className="px-3 py-2">
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <button type="button" className="rounded-md p-1 hover:bg-muted" aria-label="Attendance row actions">
                                                                                <MoreHorizontal className="h-4 w-4" />
                                                                            </button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuItem onSelect={() => openEdit(a)}>Edit</DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                className="text-destructive"
                                                                                onSelect={() => {
                                                                                    setDeletingRecord(a);
                                                                                    setActionPassword('');
                                                                                    setDeleteOpen(true);
                                                                                }}
                                                                            >
                                                                                Delete
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </td>
                                                            </tr>
                                                        ));
                                                    })()}
>>>>>>> a7e8c778e9d14e724049fa08653bc0cc8325e51d
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

<<<<<<< HEAD
                                <div className="rounded-xl border bg-background px-4 py-3 text-sm text-muted-foreground">
                                    Total records: {list.length}
=======
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
>>>>>>> a7e8c778e9d14e724049fa08653bc0cc8325e51d
                                </div>
                            </div>
                        )}

                        {activeTab === 'dtr' && (
<<<<<<< HEAD
                            <div className="flex min-h-0 flex-col gap-4">
                                <div className="rounded-xl border bg-background p-4">
                                    <h3 className="mb-4 text-lg font-semibold">Generate Daily Time Records</h3>
=======
                            <div className="space-y-4">
                                <div className="rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                                    <h3 className="text-lg font-semibold mb-4">Generate Daily Time Records</h3>
>>>>>>> a7e8c778e9d14e724049fa08653bc0cc8325e51d

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
                                                {tutors.map((tutor) => (
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

<<<<<<< HEAD
                                <div className="relative min-h-[50vh] flex-1 overflow-hidden rounded-xl border bg-background md:min-h-min">
=======
                                <div className="relative min-h-[50vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
>>>>>>> a7e8c778e9d14e724049fa08653bc0cc8325e51d
                                    <div className="p-4">
                                        <div className="overflow-x-auto">
                                            <table className="w-full table-fixed">
                                                <thead>
<<<<<<< HEAD
                                                    <tr className="border-b text-left text-sm text-muted-foreground">
                                                        <th className="px-3 py-2 w-[140px]">Date</th>
                                                        <th className="px-3 py-2 w-[200px]">Tutor</th>
                                                        <th className="px-3 py-2 w-[200px]">Student</th>
                                                        {/* <th className="px-3 py-2 w-[160px]">Tutorial ID</th> */}
                                                        <th className="px-3 py-2 w-[140px]">Time Logs</th>
                                                        {/* <th className="px-3 py-2 w-[140px]">Time Out</th> */}
=======
                                                    <tr className="text-left text-sm text-muted-foreground">
                                                        <th className="px-3 py-2 w-[140px]">Date</th>
                                                        <th className="px-3 py-2 w-[260px]">Tutor</th>
                                                        <th className="px-3 py-2 w-[260px]">Student</th>
                                                        <th className="px-3 py-2 w-[160px]">Tutorial ID</th>
                                                        <th className="px-3 py-2 w-[140px]">Time In</th>
                                                        <th className="px-3 py-2 w-[140px]">Time Out</th>
>>>>>>> a7e8c778e9d14e724049fa08653bc0cc8325e51d
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
                                                    {dtrFiltered.map((a) => (
<<<<<<< HEAD
                                                        <tr key={a.id} className="border-t odd:bg-transparent even:bg-muted/50">
                                                            <td className="px-3 py-2">{formatDate(a.date)}</td>
                                                            <td className="px-3 py-2 break-words">{a.tutor_name ?? '-'}</td>
                                                            <td className="px-3 py-2 break-words">{a.student_name ?? '-'}</td>
                                                            {/* <td className="px-3 py-2 break-words">{a.tutorialid ?? '-'}</td> */}
                                                            <td className="px-3 py-2">{formatTime12h(a.time_in)} - {formatTime12h(a.time_out)}</td>
=======
                                                        <tr key={a.id} className="border-t">
                                                            <td className="px-3 py-2">{formatDate(a.date)}</td>
                                                            <td className="px-3 py-2 break-words">{a.tutor_name ?? '-'}</td>
                                                            <td className="px-3 py-2 break-words">{a.student_name ?? '-'}</td>
                                                            <td className="px-3 py-2 break-words">{a.tutorialid ?? '-'}</td>
                                                            <td className="px-3 py-2">{formatTime12h(a.time_in)}</td>
                                                            <td className="px-3 py-2">{formatTime12h(a.time_out)}</td>
>>>>>>> a7e8c778e9d14e724049fa08653bc0cc8325e51d
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

<<<<<<< HEAD
                                <div className="rounded-xl border bg-background px-4 py-3 text-sm text-muted-foreground">
=======
                                <div className="text-sm text-muted-foreground px-4">
>>>>>>> a7e8c778e9d14e724049fa08653bc0cc8325e51d
                                    Total records: {dtrFiltered.length}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Attendance Log</DialogTitle>
                        <DialogDescription>Enter your password to confirm updates.</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-3">
                        <div>
                            <label className="mb-1 block text-sm text-muted-foreground">Date</label>
                            <Input
                                type="date"
                                value={editForm.date}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, date: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm text-muted-foreground">Time In</label>
                            <Input
                                type="time"
                                step={60}
                                value={editForm.time_in}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, time_in: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm text-muted-foreground">Time Out</label>
                            <Input
                                type="time"
                                step={60}
                                value={editForm.time_out}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, time_out: e.target.value }))}
                            />
                        </div>
                        <div>
<<<<<<< HEAD
                            <label className="mb-1 block text-sm text-muted-foreground">Remarks (optional)</label>
                            <Input
                                value={editForm.remarks}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, remarks: e.target.value }))}
                                placeholder="Remarks"
                            />
                            {errors.remarks && <div className="mt-1 text-sm text-destructive">{errors.remarks}</div>}
                        </div>
                        <div>
=======
>>>>>>> a7e8c778e9d14e724049fa08653bc0cc8325e51d
                            <label className="mb-1 block text-sm text-muted-foreground">Password</label>
                            <Input
                                type="password"
                                value={actionPassword}
                                onChange={(e) => setActionPassword(e.target.value)}
                                placeholder="Enter your password"
                            />
                            {errors.password && <div className="mt-1 text-sm text-destructive">{errors.password}</div>}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setEditOpen(false);
                                setEditingRecord(null);
                                setActionPassword('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={submitEdit}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Attendance Log</DialogTitle>
                        <DialogDescription>
                            Enter your password to permanently delete this record.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-3">
                        <div>
                            <label className="mb-1 block text-sm text-muted-foreground">Password</label>
                            <Input
                                type="password"
                                value={actionPassword}
                                onChange={(e) => setActionPassword(e.target.value)}
                                placeholder="Enter your password"
                            />
                            {errors.password && <div className="mt-1 text-sm text-destructive">{errors.password}</div>}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteOpen(false);
                                setDeletingRecord(null);
                                setActionPassword('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={submitDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
