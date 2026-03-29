import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage, Form } from '@inertiajs/react';
import { tutors } from '@/routes';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal, Upload } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { router } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import InputError from '@/components/input-error';
import { type BreadcrumbItem } from '@/types';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tutors',
        href: tutors().url,
    },
];

export default function Tutors() {
    const { props } = usePage();
    const tutorsFromServer = (props as any).tutors ?? [];
    const [query, setQuery] = useState('');

    const formatDate = (v: any) => {
        if (!v) return '-';
        const d = new Date(v);
        if (isNaN(d.getTime())) return '-';
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
    };

    const list = useMemo(() => {
        const source = tutorsFromServer;
        if (!query) return source;
        const q = query.toLowerCase();
        return source.filter((t: any) => {
            const name = `${t.firstname ?? ''} ${t.middlename ?? ''} ${t.lastname ?? ''}`.toLowerCase();
            return (
                `${t.id}`.includes(query) ||
                name.includes(q) ||
                (t.email ?? '').toLowerCase().includes(q) ||
                (t.phone ?? '').toLowerCase().includes(q)
            );
        });
    }, [tutorsFromServer, query]);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deletingName, setDeletingName] = useState('');

    const [uploadOpen, setUploadOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const uploadErrors = (usePage().props as any).errors ?? {};
    const pageSize = 15;
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [list]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tutors" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

                 <div className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-lg">
                    <h1 className="text-3xl font-bold mb-2">Tutors</h1>
                    <p className="text-emerald-50">Manage tutor records and information.</p>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 max-w-sm">
                        <Input
                            placeholder="Search tutors..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setUploadOpen(true)}>
                            <Upload className="mr-2 h-4 w-4" /> Bulk Upload
                        </Button>
                        <Link href={`${tutors().url}/create`}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Tutor
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
                                        <th className='px-3 py-2 w-[160px]'>Tutor ID</th>
                                        <th className="px-3 py-2 w-[300px]">Name</th>
                                        <th className="px-3 py-2 w-[260px]">Email</th>
                                        <th className="px-3 py-2 w-[160px]">Phone</th>
                                        <th className="px-3 py-2 w-[120px]">Hire Date</th>
                                        <th className="px-3 py-2 w-[120px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-4 text-center text-sm text-muted-foreground">
                                                No tutors found.
                                            </td>
                                        </tr>
                                    )}
                                    {(() => {
                                        const start = (currentPage - 1) * pageSize;
                                        const paged = list.slice(start, start + pageSize);
                                        return paged.map((t: any) => {
                                        const name = `${t.firstname ?? ''} ${t.middlename ?? ''} ${t.lastname ?? ''}`.trim();
                                        const hired = t.hire_date ?? '';
                                        return (
                                            <tr key={t.id} className="border-t">
                                                <td className="px-3 py-2 break-words">{t.tutorid ?? '-'}</td>
                                                <td className="px-3 py-2 break-words">
                                                    <Link href={`${tutors().url}/${t.encrypted_id}`} className="text-dark">{name || '—'}</Link>
                                                </td>
                                                <td className="px-3 py-2 break-words">{t.email ?? '-'}</td>
                                                <td className="px-3 py-2 break-words">{t.phone ?? '-'}</td>
                                                <td className="px-3 py-2">{hired ? formatDate(hired) : '-'}</td>
                                                <td className="px-3 py-2">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button className="p-1 rounded-md hover:bg-muted">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`${tutors().url}/${t.encrypted_id}`} className="w-full">View</Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`${tutors().url}/${t.encrypted_id}/edit`} className="w-full">Edit</Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onSelect={() => {
                                                                    setDeletingId(t.encrypted_id);
                                                                    setDeletingName(name || `${t.firstname} ${t.lastname}`);
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
                <Dialog open={uploadOpen} onOpenChange={(open) => { setUploadOpen(open); if (!open) setUploadFile(null); }}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Bulk Upload Tutors</DialogTitle>
                            <DialogDescription>
                                Upload a CSV or Excel file to import multiple tutors at once.
                                Required columns: <strong>firstname</strong>, <strong>lastname</strong>, <strong>email</strong>.
                                Optional: tutorid, middlename, date_of_birth, address, phone, license_number, hire_date.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-3 py-2">
                            <input
                                type="file"
                                accept=".csv,.txt,.xlsx,.xls"
                                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                                className="text-sm"
                            />
                            {uploadErrors.file && (
                                <InputError message={uploadErrors.file} />
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setUploadOpen(false); setUploadFile(null); }}>Cancel</Button>
                            <Button
                                disabled={!uploadFile || isUploading}
                                onClick={() => {
                                    if (!uploadFile) return;
                                    setIsUploading(true);
                                    router.post('/tutors/import', { file: uploadFile }, {
                                        forceFormData: true,
                                        onSuccess: () => { setUploadOpen(false); setUploadFile(null); },
                                        onFinish: () => setIsUploading(false),
                                    });
                                }}
                            >
                                {isUploading ? 'Uploading...' : 'Upload'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete tutor</DialogTitle>
                            <DialogDescription>Are you sure you want to delete {deletingName}? This action cannot be undone.</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <button type="button" className="btn" onClick={() => setConfirmOpen(false)}>Cancel</button>
                            <button
                                type="button"
                                className="btn btn-destructive ml-2"
                                    onClick={() => {
                                    if (!deletingId) return;
                                    router.delete(`${tutors().url}/${deletingId}`);
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
