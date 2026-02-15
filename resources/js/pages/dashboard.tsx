
import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, CheckCircle, UserCheck, XCircle, DollarSign } from 'lucide-react';
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

export default function Dashboard({ stats }: { stats: DashboardStats }) {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]}> 
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <>

                     <div className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-lg">
                        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                        <p className="text-emerald-50">Welcome, {auth.user?.name || 'Guest'}!</p>
                    </div>


                        <div className="grid auto-rows-min gap-4 md:grid-cols-4">
                            <StatCard 
                                label="Active Sessions" 
                                value={stats.activeSessions}
                                icon={BookOpen}
                                color="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            />
                            <StatCard 
                                label="Active Tutees" 
                                value={stats.activeTutees}
                                icon={Users}
                                color="bg-green-500/10 text-green-600 dark:text-green-400"
                            />
                            <StatCard 
                                label="Total Attendance" 
                                value={stats.totalAttendance}
                                icon={CheckCircle}
                                color="bg-purple-500/10 text-purple-600 dark:text-purple-400"
                            />
                            <StatCard 
                                label="Active Tutors" 
                                value={stats.activeTutors}
                                icon={UserCheck}
                                color="bg-orange-500/10 text-orange-600 dark:text-orange-400"
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                                <Link href="/reports/unpaid-billings">
                                    <Card className="group transition-all duration-300 hover:shadow-lg hover:border-primary/50 cursor-pointer h-full">
                                        <CardHeader>
                                            <div className="w-12 h-12 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mb-3">
                                                <XCircle className="h-6 w-6" />
                                            </div>
                                            <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                                Unpaid Billings
                                            </CardTitle>
                                            <CardDescription className="text-sm">
                                                View all billings with outstanding balances
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl font-bold text-red-600">{stats.unpaidBillings}</span>
                                                <span className="text-muted-foreground text-sm">unpaid {stats.unpaidBillings === 1 ? 'billing' : 'billings'}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>

                                <Link href="/reports/paid-billings">
                                    <Card className="group transition-all duration-300 hover:shadow-lg hover:border-primary/50 cursor-pointer h-full">
                                        <CardHeader>
                                            <div className="w-12 h-12 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center mb-3">
                                                <CheckCircle className="h-6 w-6" />
                                            </div>
                                            <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                                Paid Billings
                                            </CardTitle>
                                            <CardDescription className="text-sm">
                                                View all fully paid billing statements
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl font-bold text-green-600">{stats.paidBillings}</span>
                                                <span className="text-muted-foreground text-sm">paid {stats.paidBillings === 1 ? 'billing' : 'billings'}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-1">
                            <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-background p-4 shadow-md hover:shadow-lg transition-shadow duration-300">
                                <h3 className="font-semibold mb-2 text-lg">Top 5 Tutors by Attendance</h3>
                                <ul className="divide-y divide-border">
                                    {stats.topTutors.length === 0 && <li className="py-2 text-muted-foreground">No data</li>}
                                    {stats.topTutors.map((tutor: any) => (
                                        <li key={tutor.tutorid} className="py-2 flex justify-between">
                                            <span>{tutor.name}</span>
                                            <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                                {tutor.attendance_count}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-background p-4 shadow-md hover:shadow-lg transition-shadow duration-300">
                                <h3 className="font-semibold mb-2 text-lg">Recent Tutorials</h3>
                                <ul className="divide-y divide-border">
                                    {stats.recentTutorials.length === 0 && <li className="py-2 text-muted-foreground">No data</li>}
                                    {stats.recentTutorials.map((t: any) => (
                                        <li key={t.id} className="py-2">
                                            <div className="font-semibold">{t.student_name} <span className="text-muted-foreground">/</span> {t.tutor_name}</div>
                                            <div className="text-xs text-muted-foreground">{t.start_date} &middot; {t.status}</div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-background p-4 shadow-md hover:shadow-lg transition-shadow duration-300">
                                <h3 className="font-semibold mb-2 text-lg">Recent Activity</h3>
                                <div className="space-y-3">
                                    {stats.recentAttendance.length === 0 && <div className="text-muted-foreground text-sm">No data</div>}
                                    {stats.recentAttendance.map((a: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm">
                                            <Avatar className="size-8">
                                                <AvatarFallback className="bg-primary/20 font-semibold">{a.initials}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold truncate">{a.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {a.status === 'in' ? (
                                                        <>Clocked in: {a.time_in}</>
                                                    ) : (
                                                        <>Clocked out: {a.time_out}</>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                </>
            </div>
        </AppLayout>
    );
}

function StatCard({ 
    label, 
    value,
    icon: IconComponent,
    color
}: { 
    label: string
    value: number
    icon: any
    color: string
}) {
    return (
        <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-background p-6 flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${color}`}>
                    <IconComponent className="size-6" />
                </div>
            </div>
            <div>
                <p className="text-muted-foreground text-sm mb-1">{label}</p>
                <p className="text-4xl font-bold">{value}</p>
            </div>
        </div>
    );
}
