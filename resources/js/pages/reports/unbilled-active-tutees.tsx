import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, BookOpen, UserCog, Calendar, FileText } from 'lucide-react';
import { useMemo, useState } from 'react';
import { type BreadcrumbItem } from '@/types';

type Tutee = {
    tutorialid: string;
    studentid: string;
    student_name?: string | null;
    tutorid: string;
    tutor_name?: string | null;
    start_date: string | null;
    end_date: string | null;
    status: string;
};

interface UnbilledActiveTuteesProps {
    tutees: Tutee[];
    start_date?: string | null;
    end_date?: string | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports' },
    { title: 'Unbilled Active Tutees', href: '/reports/unbilled-active-tutees' },
];

const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return dateStr;
    }
};

export default function UnbilledActiveTuteesReport({ tutees, start_date, end_date }: UnbilledActiveTuteesProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return tutees;
        const q = searchQuery.toLowerCase();
        return tutees.filter(
            (t) =>
                t.tutorialid?.toLowerCase().includes(q) ||
                t.studentid?.toLowerCase().includes(q) ||
                t.student_name?.toLowerCase().includes(q) ||
                t.tutor_name?.toLowerCase().includes(q) ||
                t.status?.toLowerCase().includes(q),
        );
    }, [tutees, searchQuery]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Unbilled Active Tutees Report" />

            <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/reports">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold">Unbilled Active Tutees</h1>
                        <p className="text-sm text-muted-foreground">
                            Tutees with active tutorials that have no billing record
                            {start_date && end_date
                                ? ` for ${formatDate(start_date)} – ${formatDate(end_date)}`
                                : ''}.
                        </p>
                    </div>
                    <div className="ml-auto">
                        <Button
                            variant="outline"
                            onClick={() => {
                                const params = new URLSearchParams();
                                if (start_date) params.set('start_date', start_date);
                                if (end_date) params.set('end_date', end_date);
                                window.open(
                                    `/reports/unbilled-active-tutees/pdf?${params.toString()}`,
                                    '_blank',
                                    'noopener,noreferrer',
                                );
                            }}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Generate PDF
                        </Button>
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border bg-background p-4">
                        <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Total Unbilled Tutees</span>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-semibold">{filtered.length}</p>
                    </div>

                    {start_date && (
                        <div className="rounded-xl border bg-background p-4">
                            <div className="mb-1 flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Period Start</span>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-lg font-semibold">{formatDate(start_date)}</p>
                        </div>
                    )}

                    {end_date && (
                        <div className="rounded-xl border bg-background p-4">
                            <div className="mb-1 flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Period End</span>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-lg font-semibold">{formatDate(end_date)}</p>
                        </div>
                    )}
                </div>

                {/* Search + table */}
                <div className="rounded-xl border bg-background">
                    <div className="border-b p-4">
                        <Input
                            placeholder="Search by student, tutor, tutorial ID…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>

                    {filtered.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            No unbilled active tutees found for the selected period.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                                        <th className="px-4 py-3">Tutorial ID</th>
                                        <th className="px-4 py-3">Student</th>
                                        <th className="px-4 py-3">Tutor</th>
                                        <th className="px-4 py-3">Start Date</th>
                                        <th className="px-4 py-3">End Date</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((t, i) => (
                                        <tr key={t.tutorialid ?? i} className="border-t odd:bg-transparent even:bg-muted/50">
                                            <td className="px-4 py-3 font-mono text-xs">{t.tutorialid ?? '—'}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                    <div>
                                                        <div className="font-medium">{t.student_name ?? '—'}</div>
                                                        <div className="text-xs text-muted-foreground">{t.studentid}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <UserCog className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                    <div>
                                                        <div className="font-medium">{t.tutor_name ?? '—'}</div>
                                                        <div className="text-xs text-muted-foreground">{t.tutorid}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{formatDate(t.start_date)}</td>
                                            <td className="px-4 py-3">{formatDate(t.end_date)}</td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium">
                                                    {t.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
