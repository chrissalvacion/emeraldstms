import AppLayout from '@/layouts/app-layout';
import { students } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { router } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Students',
        href: students().url,
    },
];

export default function Students() {
    const { props } = usePage();
    const studentsFromServer = (props as any).students ?? [];
    const [query, setQuery] = useState('');

    const list = useMemo(() => {
        const source = studentsFromServer;
        if (!query) return source;
        return source.filter((s: any) => {
            const name = `${s.firstname ?? ''} ${s.middlename ?? ''} ${s.lastname ?? ''}`.toLowerCase();
            const school = (s.school ?? '').toLowerCase();
            const parent = (s.parent_name ?? '').toLowerCase();
            const tutee = (s.tuteeid ?? '').toLowerCase();
            const q = query.toLowerCase();
            return (
                `${s.id}`.includes(q) ||
                tutee.includes(q) ||
                name.includes(q) ||
                school.includes(q) ||
                parent.includes(q)
            );
        });
    }, [studentsFromServer, query]);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deletingName, setDeletingName] = useState('');
    // pagination
    const pageSize = 15;
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        // reset to first page when the filtered list changes
        setCurrentPage(1);
    }, [list]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Students" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

                <div className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-lg">
                    <h1 className="text-3xl font-bold mb-2">Students</h1>
                    <p className="text-emerald-50">Manage student records and information.</p>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 max-w-sm">
                        <Input
                            placeholder="Search students..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>

                    <div>
                        <Link href={`${students().url}/create`}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4"/> Add Student
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="relative min-h-[50vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <div className="p-4">
                        <div className="overflow-x-auto">
                            <table className="w-full table-fixed">
                                <thead>
                                    <tr className="text-left text-sm text-muted-foreground">
                                        <th className="px-3 py-2 w-[140px]">Tutee ID</th>
                                        <th className="px-3 py-2 w-[320px]">Name</th>
                                        <th className="px-3 py-2 w-[260px]">School</th>
                                        <th className="px-3 py-2 w-[120px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-4 text-center text-sm text-muted-foreground">
                                                No students found.
                                            </td>
                                        </tr>
                                    )}
                                    {(() => {
                                        const start = (currentPage - 1) * pageSize;
                                        const paged = list.slice(start, start + pageSize);
                                        return paged.map((s: any) => {
                                        const name = `${s.firstname ?? ''} ${s.middlename ?? ''} ${s.lastname ?? ''}`.trim();
                                        const enrolled = s.enrollment_date ?? s.start_date ?? '';
                                        return (
                                            <tr key={s.id} className="border-t">
                                                <td className="px-3 py-2 break-words">
                                                    <Link href={`${students().url}/${s.encrypted_id}`} className="text-dark">{s.tuteeid ?? '-'}</Link>
                                                </td>
                                                <td className="px-3 py-2">
                                                        <Link href={`${students().url}/${s.encrypted_id}`} className="text-dark">{name || '—'}</Link>
                                                </td>
                                                <td className="px-3 py-2">{s.school ?? '-'}</td>
                                                <td className="px-3 py-2">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button className="p-1 rounded-md hover:bg-muted">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`${students().url}/${s.encrypted_id}`} className="w-full">View</Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`${students().url}/${s.encrypted_id}/edit`} className="w-full">Edit</Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onSelect={() => {
                                                                    setDeletingId(s.encrypted_id);
                                                                    setDeletingName(name || `${s.firstname} ${s.lastname}`);
                                                                    setConfirmOpen(true);
                                                                }}
                                                                className="text-destructive"
                                                            >
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        );
                                        });
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between gap-4 px-4">
                    <div className="text-sm text-muted-foreground">Showing {(list.length === 0) ? 0 : ((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, list.length)} of {list.length}</div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>Previous</Button>
                        <div className="text-sm text-muted-foreground">Page {currentPage} of {Math.max(1, Math.ceil(list.length / pageSize))}</div>
                        <Button size="sm" onClick={() => setCurrentPage((p) => Math.min(Math.ceil(list.length / pageSize) || 1, p + 1))} disabled={currentPage >= Math.ceil(list.length / pageSize)}>Next</Button>
                    </div>
                </div>
                <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete student</DialogTitle>
                            <DialogDescription>Are you sure you want to delete {deletingName}? This action cannot be undone.</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <button type="button" className="btn" onClick={() => setConfirmOpen(false)}>Cancel</button>
                            <button
                                type="button"
                                className="btn btn-destructive ml-2"
                                onClick={() => {
                                    if (!deletingId) return;
                                    router.delete(`${students().url}/${deletingId}`);
                                    setConfirmOpen(false);
                                }}
                            >
                                Delete
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
