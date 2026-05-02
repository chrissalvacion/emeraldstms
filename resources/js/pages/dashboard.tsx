
import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BookOpen, Users, CheckCircle, UserCheck, XCircle, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { type SharedData } from '@/types';

interface DashboardStats {
    activeSessions: number;
    activeTutees: number;
    totalAttendance: number;
    activeTutors: number;
    unpaidBillings: number;
    paidBillings: number;
    topTutors: Array<{ tutorid: string; name: string; attendance_count: number }>;
    recentTutorials: Array<{ id: number; student_name: string; tutor_name: string; start_date: string; status: string }>;
    recentAttendance: Array<{ name: string; initials: string; time_in: string; time_out: string; status: string }>;
}

const statusColors: Record<string, string> = {
    ongoing: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-muted text-muted-foreground',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function Dashboard({ stats }: { stats: DashboardStats }) {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={[{ title: 'Overview', href: '/dashboard' }]}>
            <Head title="Overview" />

            <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">

                {/* Welcome header */}
                <div className="flex items-center gap-4">
                    <Avatar className="size-12">
                        <AvatarFallback className="bg-primary/20 text-sm font-semibold">
                            {auth.user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-2xl font-semibold">Welcome back, {auth.user.name}!</h1>
                        <p className="text-sm text-muted-foreground">Here's what's happening with your tutoring sessions today.</p>
                    </div>
                </div>

                {/* Primary stat cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <StatCard label="Active Sessions" value={stats.activeSessions} icon={BookOpen} />
                    <StatCard label="Active Tutees" value={stats.activeTutees} icon={Users} />
                    <StatCard label="Total Attendance" value={stats.totalAttendance} icon={CheckCircle} />
                    <StatCard label="Active Tutors" value={stats.activeTutors} icon={UserCheck} />
                </div>

                {/* Billing status cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Link href="/reports/unpaid-billings" className="group">
                        <div className="flex items-center gap-4 rounded-xl border bg-background p-4 transition-shadow hover:shadow-md">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                <XCircle className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Unpaid Billings</p>
                                <p className="text-3xl font-semibold text-red-600 dark:text-red-400">{stats.unpaidBillings}</p>
                                <p className="text-xs text-muted-foreground">Outstanding balances</p>
                            </div>
                        </div>
                    </Link>

                    <Link href="/reports/paid-billings" className="group">
                        <div className="flex items-center gap-4 rounded-xl border bg-background p-4 transition-shadow hover:shadow-md">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                <DollarSign className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Paid Billings</p>
                                <p className="text-3xl font-semibold text-green-600 dark:text-green-400">{stats.paidBillings}</p>
                                <p className="text-xs text-muted-foreground">Fully paid statements</p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Bottom three panels */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                    {/* Top tutors */}
                    <div className="rounded-xl border bg-background p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            Top 5 Tutors by Attendance
                        </div>
                        <ul className="divide-y divide-border">
                            {stats.topTutors.length === 0 && (
                                <li className="py-3 text-sm text-muted-foreground">No data available.</li>
                            )}
                            {stats.topTutors.map((tutor) => (
                                <li key={tutor.tutorid} className="flex items-center justify-between gap-2 py-2.5">
                                    <span className="truncate text-sm">{tutor.name}</span>
                                    <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                        {tutor.attendance_count}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Recent tutorials */}
                    <div className="rounded-xl border bg-background p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            Recent Tutorials
                        </div>
                        <ul className="divide-y divide-border">
                            {stats.recentTutorials.length === 0 && (
                                <li className="py-3 text-sm text-muted-foreground">No data available.</li>
                            )}
                            {stats.recentTutorials.map((t) => (
                                <li key={t.id} className="py-2.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-medium">{t.student_name}</div>
                                            <div className="truncate text-xs text-muted-foreground">{t.tutor_name}</div>
                                        </div>
                                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[t.status?.toLowerCase()] ?? 'bg-muted text-muted-foreground'}`}>
                                            {t.status}
                                        </span>
                                    </div>
                                    <div className="mt-1 text-xs text-muted-foreground">{t.start_date}</div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Recent activity */}
                    <div className="rounded-xl border bg-background p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            Recent Attendance Activity
                        </div>
                        <div className="space-y-3">
                            {stats.recentAttendance.length === 0 && (
                                <div className="text-sm text-muted-foreground">No data available.</div>
                            )}
                            {stats.recentAttendance.map((a, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <Avatar className="size-8 shrink-0">
                                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                            {a.initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium">{a.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {a.status === 'in' ? `Clocked in: ${a.time_in}` : `Clocked out: ${a.time_out}`}
                                        </div>
                                    </div>
                                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${a.status === 'in' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                                        {a.status === 'in' ? 'In' : 'Out'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}

function StatCard({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: number;
    icon: React.ElementType;
}) {
    return (
        <div className="rounded-xl border bg-background p-4 transition-shadow hover:shadow-md">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
            </div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 text-3xl font-semibold">{value}</p>
        </div>
    );
}
