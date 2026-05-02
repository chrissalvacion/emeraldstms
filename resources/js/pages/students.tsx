import AppLayout from '@/layouts/app-layout';
import { students } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
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
        title: 'Tutees',
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
    const [uploadOpen, setUploadOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    // pagination
    const pageSize = 15;
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        // reset to first page when the filtered list changes
        setCurrentPage(1);
    }, [list]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tutees" />

            <div className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">

                <div className="w-full">
                    <h1 className="mb-2 text-2xl font-bold">Tutees</h1>
                    <p className="text-muted-foreground text-sm">Register and manage tutees records and information.</p>
                </div>

                <div className="rounded-xl border bg-background p-4">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="w-full flex-1 sm:max-w-sm">
                        <Input
                            placeholder="Search tutees..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                        <Button variant="outline" onClick={() => setUploadOpen(true)}>
                            <Upload className="mr-2 h-4 w-4" /> Bulk Upload
                        </Button>
                        <Link href={`${students().url}/create`}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4"/> Add Tutee
                            </Button>
                        </Link>
                    </div>
                    </div>
                </div>

                <div className="relative min-h-[50vh] flex-1 overflow-hidden rounded-xl border bg-background md:min-h-min">
                    <div className="p-4">
                        <div className="overflow-x-auto">
                            <table className="w-full table-fixed">
                                <thead>
                                    <tr className="border-b text-left text-sm text-muted-foreground">
                                        <th className="px-3 py-2 w-[140px]">Tutee ID</th>
                                        <th className="px-3 py-2 w-[320px]">Name</th>
                                        <th className="px-3 py-2 w-[260px]">School</th>
                                        <th className="px-3 py-2 w-[260px]">Parent's Name</th>
                                        <th className="px-3 py-2 w-[120px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-4 text-center text-sm text-muted-foreground">
                                                No tutees found.
                                            </td>
                                        </tr>
                                    )}
                                    {(() => {
                                        const start = (currentPage - 1) * pageSize;
                                        const paged = list.slice(start, start + pageSize);
                                        return paged.map((s: any) => {
                                        const name = `${s.firstname ?? ''} ${String(s.middlename).substring(0,1) ?? ''} ${s.lastname ?? ''}`.trim();
                                        return (
                                            <tr key={s.id} className="border-t odd:bg-transparent even:bg-muted/50">
                                                <td className="px-3 py-2 break-words">
                                                    <Link href={`${students().url}/${s.encrypted_id}`} className="font-medium text-primary hover:underline">{s.tuteeid ?? '-'}</Link>
                                                </td>
                                                <td className="px-3 py-2">
                                                        <Link href={`${students().url}/${s.encrypted_id}`} className="font-medium text-primary hover:underline">{name || '—'}</Link>
                                                </td>
                                                <td className="px-3 py-2">{s.school ?? '-'}</td>
                                                <td className="px-3 py-2">{s.parent_name ?? '-'}</td>
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
                <div className="flex items-center justify-between gap-4 rounded-xl border bg-background px-4 py-3">
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
                            <DialogTitle>Delete tutee</DialogTitle>
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

                <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Bulk Register Tutees</DialogTitle>
                            <DialogDescription>
                                Upload a CSV or Excel file. Required columns: firstname, lastname. Optional columns: tuteeid, middlename, date_of_birth, school, parent_name, parent_contact.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3">
                            <Input
                                type="file"
                                accept=".csv,.txt,.xlsx,.xls"
                                onChange={(e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0] ?? null;
                                    setUploadFile(file);
                                }}
                            />
                            {(props as any).errors?.file && (
                                <p className="text-sm text-destructive">{(props as any).errors.file}</p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setUploadOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                disabled={!uploadFile || isUploading}
                                onClick={() => {
                                    if (!uploadFile || isUploading) return;

                                    setIsUploading(true);
                                    router.post(
                                        '/students/import',
                                        { file: uploadFile },
                                        {
                                            forceFormData: true,
                                            onSuccess: () => {
                                                setUploadOpen(false);
                                                setUploadFile(null);
                                            },
                                            onFinish: () => {
                                                setIsUploading(false);
                                            },
                                        },
                                    );
                                }}
                            >
                                {isUploading ? 'Uploading...' : 'Upload and Import'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
