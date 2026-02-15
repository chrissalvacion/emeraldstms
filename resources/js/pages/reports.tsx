import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    FileText, 
    CheckCircle, 
    XCircle, 
    BookOpen, 
    UserX, 
    GraduationCap,
    TrendingUp,
    Calendar
} from 'lucide-react';

interface ReportCard {
    title: string;
    description: string;
    icon: any;
    href: string;
    color: string;
}

const reportTypes: ReportCard[] = [
    {
        title: 'Unpaid Billings',
        description: 'View all billings with outstanding balances',
        icon: XCircle,
        href: '/reports/unpaid-billings',
        color: 'bg-red-500/10 text-red-600 dark:text-red-400'
    },
    {
        title: 'Paid Billings',
        description: 'View all fully paid billing statements',
        icon: CheckCircle,
        href: '/reports/paid-billings',
        color: 'bg-green-500/10 text-green-600 dark:text-green-400'
    },
    // {
    //     title: 'All Tutorials',
    //     description: 'Complete list of tutorial sessions',
    //     icon: BookOpen,
    //     href: '/reports/tutorials',
    //     color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
    // },
    // {
    //     title: 'Absent Tutors',
    //     description: 'Track tutors with missed sessions',
    //     icon: UserX,
    //     href: '/reports/absent-tutors',
    //     color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
    // },
    // {
    //     title: 'Absent Students',
    //     description: 'Track students with missed sessions',
    //     icon: GraduationCap,
    //     href: '/reports/absent-students',
    //     color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
    // },
    // {
    //     title: 'Revenue Summary',
    //     description: 'Financial overview and revenue statistics',
    //     icon: TrendingUp,
    //     href: '/reports/revenue',
    //     color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    // },
    // {
    //     title: 'Attendance Summary',
    //     description: 'Comprehensive attendance statistics',
    //     icon: Calendar,
    //     href: '/reports/attendance-summary',
    //     color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
    // },
    // {
    //     title: 'All Reports',
    //     description: 'Access complete report archive',
    //     icon: FileText,
    //     href: '/reports/all',
    //     color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
    // }
];

export default function Reports() {
    return (
        <AppLayout breadcrumbs={[{ title: 'Reports', href: '/reports' }]}>
            <Head title="Reports" />
            
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-lg">
                    <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
                    <p className="text-emerald-50">Generate and view various reports and statistics</p>
                </div>

                   <div className="mt-6 rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-background p-6">
                    <h2 className="text-xl font-semibold mb-3">Quick Statistics</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Total Reports Available</p>
                            <p className="text-2xl font-bold">{reportTypes.length}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Last Updated</p>
                            <p className="text-lg font-semibold">Today</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Report Categories</p>
                            <p className="text-lg font-semibold">Financial, Academic, Attendance</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Export Options</p>
                            <p className="text-lg font-semibold">PDF, Excel, Print</p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {reportTypes.map((report) => (
                        <Card 
                            key={report.href} 
                            className="group transition-all duration-300 hover:shadow-lg hover:border-primary/50 cursor-pointer"
                        >
                            <CardHeader>
                                <div className={`w-12 h-12 rounded-lg ${report.color} flex items-center justify-center mb-3`}>
                                    <report.icon className="h-6 w-6" />
                                </div>
                                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                    {report.title}
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    {report.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href={report.href}>
                                    <Button 
                                        variant="outline" 
                                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                                    >
                                        View Report
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>

             
            </div>
        </AppLayout>
    );
}
