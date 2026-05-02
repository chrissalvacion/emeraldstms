import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    FileText, 
    CheckCircle, 
    XCircle, 
    BookOpen, 
    UserX, 
    GraduationCap,
    TrendingUp,
    Calendar,
    ChevronRight,
    ChevronDown,
    Users,
} from 'lucide-react';
import { useState } from 'react';

interface ReportCard {
    title: string;
    description: string;
    icon: React.ElementType;
    href: string;
}

const reportTypes: ReportCard[] = [
    {
        title: 'Unpaid Billings',
        description: 'View all billings with outstanding balances',
        icon: XCircle,
        href: '/reports/unpaid-billings',
    },
    {
        title: 'Paid Billings',
        description: 'View all fully paid billing statements',
        icon: CheckCircle,
        href: '/reports/paid-billings',
    },
];

export default function Reports() {
    const today = new Date().toISOString().slice(0, 10);
    const firstOfMonth = today.slice(0, 7) + '-01';

    const [unbilledDialogOpen, setUnbilledDialogOpen] = useState(false);
    const [unbilledStart, setUnbilledStart] = useState(firstOfMonth);
    const [unbilledEnd, setUnbilledEnd] = useState(today);

    function goToUnbilledReport() {
        setUnbilledDialogOpen(false);
        router.visit(
            `/reports/unbilled-active-tutees?start_date=${unbilledStart}&end_date=${unbilledEnd}`,
        );
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Reports', href: '/reports' }]}>
            <Head title="Reports" />

            <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">

                {/* Page header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">Reports</h1>
                        <p className="text-sm text-muted-foreground">Generate and view various reports and statistics.</p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <FileText className="h-4 w-4" />
                                Generate Report
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                            <DropdownMenuLabel>Billing Exports</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <a href="/reports/unpaid-billings/pdf" target="_blank" rel="noreferrer">
                                    Unpaid Billings (PDF)
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <a href="/reports/paid-billings/pdf" target="_blank" rel="noreferrer">
                                    Paid Billings (PDF)
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/reports/unpaid-billings">View Unpaid Billings</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/reports/paid-billings">View Paid Billings</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Active Tutees</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setUnbilledDialogOpen(true)}>
                                <Users className="mr-2 h-4 w-4" />
                                Unbilled Active Tutees
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Quick stats
                <div className="rounded-xl border bg-background p-4">
                    <div className="mb-3 text-sm font-medium text-muted-foreground">Quick Statistics</div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div>
                            <p className="text-xs text-muted-foreground">Reports Available</p>
                            <p className="text-2xl font-semibold">{reportTypes.length}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Last Updated</p>
                            <p className="text-lg font-semibold">Today</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Categories</p>
                            <p className="text-sm font-semibold">Financial, Academic, Attendance</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Export Options</p>
                            <p className="text-sm font-semibold">PDF, Excel, Print</p>
                        </div>
                    </div>
                </div> */}

                {/* Report cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {reportTypes.map((report) => (
                        <Link key={report.href} href={report.href} className="group">
                            <div className="flex h-full flex-col justify-between rounded-xl border bg-background p-4 transition-shadow hover:shadow-md">
                                <div>
                                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <report.icon className="h-5 w-5" />
                                    </div>
                                    <div className="text-sm font-semibold group-hover:text-primary transition-colors">{report.title}</div>
                                    <div className="mt-1 text-xs text-muted-foreground">{report.description}</div>
                                </div>
                                <div className="mt-4 flex items-center text-xs font-medium text-primary">
                                    View Report <ChevronRight className="ml-1 h-3 w-3" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

            </div>

            {/* Date range dialog for Unbilled Active Tutees */}
            <Dialog open={unbilledDialogOpen} onOpenChange={setUnbilledDialogOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Unbilled Active Tutees</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Select a billing period to find tutees with active tutorials that have not yet been billed.
                    </p>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-1.5">
                            <Label htmlFor="unbilled-start">Start Date</Label>
                            <Input
                                id="unbilled-start"
                                type="date"
                                value={unbilledStart}
                                onChange={(e) => setUnbilledStart(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="unbilled-end">End Date</Label>
                            <Input
                                id="unbilled-end"
                                type="date"
                                value={unbilledEnd}
                                onChange={(e) => setUnbilledEnd(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            onClick={goToUnbilledReport}
                            disabled={!unbilledStart || !unbilledEnd}
                        >
                            Generate Report
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

