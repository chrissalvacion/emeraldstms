import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useState, useMemo } from 'react';
import { MoreHorizontal, Download, FileText, Plus, Trash2 } from 'lucide-react';
import Heading from '@/components/heading';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payroll',
        href: '/payroll',
    },
];

interface PayrollRecord {
    id: number;
    payrollid: string;
    period_start: string;
    period_end: string;
    tutor_count: number;
    total_hours: number;
    total_amount: number;
    total_received: number;
    status: string;
    encrypted_id: string;
}

interface Tutor {
    tutorid: string;
    name: string;
}

type EducationLevelKey = 'elementary' | 'secondary';

export default function Payroll() {
    const { payroll: payrollData, tutors_by_level: tutorsByLevel } = usePage().props as any;
    const [list, setList] = useState<PayrollRecord[]>(payrollData || []);
    const [query, setQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
    const [selectedTutors, setSelectedTutors] = useState<string[]>([]);
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');
    const [educationLevel, setEducationLevel] = useState<EducationLevelKey | ''>('');
    const [isGenerating, setIsGenerating] = useState(false);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const filtered = useMemo(() => {
        let source = [...list];

        if (query.trim()) {
            const q = query.toLowerCase();
            source = source.filter((p) =>
                p.payrollid?.toLowerCase().includes(q)
            );
        }

        return source;
    }, [list, query]);

    const handleGeneratePayroll = () => {
        if (!educationLevel || selectedTutors.length === 0 || !periodStart || !periodEnd) {
            alert('Please select an education level, at least one tutor, and fill in the period dates');
            return;
        }

        setIsGenerating(true);

        router.post(
            '/payroll/generate',
            {
                tutorids: selectedTutors,
                period_start: periodStart,
                period_end: periodEnd,
                education_level: educationLevel,
            },
            {
                onSuccess: () => {
                    setSelectedTutors([]);
                    setPeriodStart('');
                    setPeriodEnd('');
                    setGenerateDialogOpen(false);
                    setIsGenerating(false);
                    // Reload the page to get updated data
                    router.visit('/payroll');
                },
                onError: (errors: any) => {
                    setIsGenerating(false);
                    console.error('Error generating payroll:', errors);
                },
            }
        );
    };

    const handleDelete = (payrollRecord: PayrollRecord) => {
        setSelectedPayroll(payrollRecord);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!selectedPayroll) return;

        setIsDeleting(true);
        
        router.delete(`/payroll/${selectedPayroll.encrypted_id}`, {
            onSuccess: () => {
                // Update local list immediately
                setList((prevList) => prevList.filter((p) => p.id !== selectedPayroll.id));
                setDeleteDialogOpen(false);
                setSelectedPayroll(null);
                setIsDeleting(false);
            },
            onError: (errors: any) => {
                setIsDeleting(false);
                console.error('Error deleting payroll:', errors);
                alert('Failed to delete payroll. Please try again.');
            },
        });
    };

    const handleExportPdf = (payrollRecord: PayrollRecord) => {
        window.location.href = `/payroll/${payrollRecord.encrypted_id}/pdf`;
    };

    const handleExportExcel = (payrollRecord: PayrollRecord) => {
        window.location.href = `/payroll/${payrollRecord.encrypted_id}/excel`;
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(value);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-PH');
    };

    const availableTutors: Tutor[] = useMemo(() => {
        if (!educationLevel) return [];
        return tutorsByLevel?.[educationLevel] ?? [];
    }, [educationLevel, tutorsByLevel]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll" />

            <div className="px-4 py-6">
                <Heading
                    title="Payroll Management"
                    description="Generate and manage tutor payroll records"
                />

                <div className="flex flex-col lg:flex-row lg:space-x-12">
                    <div className="w-full">
                        <div className="flex items-center justify-between gap-4 mb-4">
                            <div className="flex-1 max-w-sm">
                                <Input
                                    placeholder="Search payroll..."
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                            <div>
                                <Button onClick={() => setGenerateDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" /> Generate Payroll
                                </Button>
                            </div>
                        </div>

                        <div className="relative min-h-[50vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                            <div className="p-4">
                                <div className="overflow-x-auto">
                                    <table className="w-full table-fixed">
                                        <thead>
                                            <tr className="text-left text-sm text-muted-foreground">
                                                <th className="px-3 py-2 w-[160px]">Payroll ID</th>
                                                <th className="px-3 py-2 w-[140px]">Period</th>
                                                <th className="px-3 py-2 w-[120px]">Tutors</th>
                                                <th className="px-3 py-2 w-[120px]">Total Hours</th>
                                                <th className="px-3 py-2 w-[140px]">Total Amount</th>
                                                <th className="px-3 py-2 w-[140px]">Received</th>
                                                <th className="px-3 py-2 w-[120px]">Status</th>
                                                <th className="px-3 py-2 w-[120px]">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={9}
                                                        className="p-4 text-center text-sm text-muted-foreground"
                                                    >
                                                        No payroll records found.
                                                    </td>
                                                </tr>
                                            )}
                                            {(() => {
                                                const start = (currentPage - 1) * pageSize;
                                                const paged = filtered.slice(start, start + pageSize);
                                                return paged.map((p) => (
                                                    <tr key={p.id} className="border-t">
                                                        <td className="px-3 py-2 break-words text-sm">
                                                            {p.payrollid}
                                                        </td>
                                                        <td className="px-3 py-2 break-words text-sm">
                                                            {formatDate(p.period_start)} to {formatDate(p.period_end)}
                                                        </td>
                                                        <td className="px-3 py-2 text-sm text-center">
                                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                                                {p.tutor_count}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-sm">
                                                            {Math.round(p.total_hours)}
                                                        </td>
                                                        <td className="px-3 py-2 text-sm">
                                                            {formatCurrency(p.total_amount)}
                                                        </td>
                                                        <td className="px-3 py-2 text-sm">
                                                            {formatCurrency(p.total_received)}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                                                p.status === 'paid'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : p.status === 'approved'
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                                {p.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                    >
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem asChild>
                                                                        <Link
                                                                            href={`/payroll/${p.encrypted_id}`}
                                                                        >
                                                                            View Details
                                                                        </Link>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            handleExportPdf(p)
                                                                        }
                                                                    >
                                                                        <FileText className="mr-2 h-4 w-4" />
                                                                        Export PDF
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            handleExportExcel(p)
                                                                        }
                                                                    >
                                                                        <Download className="mr-2 h-4 w-4" />
                                                                        Export Excel
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onSelect={(event) => {
                                                                            event.preventDefault();
                                                                            handleDelete(p);
                                                                        }}
                                                                        className="text-red-600"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </td>
                                                    </tr>
                                                ));
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 px-4 mt-4">
                            <div className="text-sm text-muted-foreground">
                                Showing{' '}
                                {filtered.length === 0
                                    ? 0
                                    : (currentPage - 1) * pageSize + 1}{' '}
                                to {Math.min(currentPage * pageSize, filtered.length)} of{' '}
                                {filtered.length}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    onClick={() =>
                                        setCurrentPage((p) => Math.max(1, p - 1))
                                    }
                                    disabled={currentPage <= 1}
                                >
                                    Previous
                                </Button>
                                <div className="text-sm text-muted-foreground">
                                    Page {currentPage} of{' '}
                                    {Math.max(1, Math.ceil(filtered.length / pageSize))}
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.min(
                                                Math.ceil(filtered.length / pageSize) || 1,
                                                p + 1
                                            )
                                        )
                                    }
                                    disabled={
                                        currentPage >=
                                        Math.ceil(filtered.length / pageSize)
                                    }
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Generate Payroll Dialog */}
            <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Generate Payroll</DialogTitle>
                        <DialogDescription>
                            Select one or more tutors to generate payroll for a specific period
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Education Level</label>
                            <select
                                value={educationLevel}
                                onChange={(e) => {
                                    const next = e.target.value as EducationLevelKey | '';
                                    setEducationLevel(next);
                                    setSelectedTutors([]);
                                }}
                                className="mt-1 w-full px-3 py-2 border border-sidebar-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Select level</option>
                                <option value="elementary">Primary/Elementary</option>
                                <option value="secondary">Secondary (JHS/SHS)</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Select Tutors</label>
                            <div className="border border-sidebar-border rounded-md p-4 max-h-[300px] overflow-y-auto mt-2">
                                {availableTutors.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        {educationLevel
                                            ? 'No tutors available for the selected level'
                                            : 'Select an education level first'}
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {availableTutors.map((t: Tutor) => (
                                            <label
                                                key={t.tutorid}
                                                className="flex items-center gap-2 cursor-pointer p-2 hover:bg-muted rounded"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTutors.includes(
                                                        t.tutorid
                                                    )}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedTutors([
                                                                ...selectedTutors,
                                                                t.tutorid,
                                                            ]);
                                                        } else {
                                                            setSelectedTutors(
                                                                selectedTutors.filter(
                                                                    (id) => id !== t.tutorid
                                                                )
                                                            );
                                                        }
                                                    }}
                                                    className="w-4 h-4"
                                                />
                                                <span className="text-sm">{t.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {selectedTutors.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    {selectedTutors.length} tutor(s) selected
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium">Period Start</label>
                            <Input
                                type="date"
                                value={periodStart}
                                onChange={(e) => setPeriodStart(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Period End</label>
                            <Input
                                type="date"
                                value={periodEnd}
                                onChange={(e) => setPeriodEnd(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setGenerateDialogOpen(false);
                                setSelectedTutors([]);
                                setPeriodStart('');
                                setPeriodEnd('');
                                setEducationLevel('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleGeneratePayroll}
                            disabled={isGenerating}
                        >
                            {isGenerating ? 'Generating...' : 'Generate'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Payroll</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this payroll record? This
                            action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteDialogOpen(false);
                                setSelectedPayroll(null);
                            }}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
