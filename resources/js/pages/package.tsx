import type { ChangeEvent, FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import packagesRoutes from '@/routes/packages';
import { type BreadcrumbItem } from '@/types';

interface Package {
    id: number;
    name: string;
    description: string | null;
    type: string | null;
    level: string | null;
    duration_hours: number | null;
    tutee_fee_amount: number | null;
    tutor_fee_amount: number | null;
    status: 'active' | 'inactive' | 'archived' | string;
    created_at: string;
    updated_at: string;
}

interface Props {
    packages: Package[];
    package?: Package;
}

type PackageFormData = {
    name: string;
    description: string;
    type: string;
    level: string;
    duration_hours: string;
    tutee_fee_amount: string;
    tutor_fee_amount: string;
    status: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Packages',
        href: packagesRoutes.index().url,
    },
];


export default function PackagePage({ packages, package: editingPackage }: Props) {
    const [query, setQuery] = useState('');
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState<Package | null>(null);
    const [deleteProcessing, setDeleteProcessing] = useState(false);

    const emptyDefaults: PackageFormData = {
        name: '',
        description: '',
        type: '',
        level: '',
        duration_hours: '',
        tutee_fee_amount: '',
        tutor_fee_amount: '',
        status: 'active',
    };

    const toFormData = (pkg?: Package | null): PackageFormData => ({
        name: pkg?.name ?? '',
        description: pkg?.description ?? '',
        type: pkg?.type ?? '',
        level: pkg?.level ?? '',
        duration_hours: pkg?.duration_hours != null ? String(pkg.duration_hours) : '',
        tutee_fee_amount: pkg?.tutee_fee_amount != null ? String(pkg.tutee_fee_amount) : '',
        tutor_fee_amount: pkg?.tutor_fee_amount != null ? String(pkg.tutor_fee_amount) : '',
        status: pkg?.status ?? 'active',
    });

    const [open, setOpen] = useState(() => Boolean(editingPackage));
    const [editing, setEditing] = useState<Package | null>(() => editingPackage ?? null);

    const { data, setData, post, put, processing, errors, clearErrors } = useForm<PackageFormData>(
        toFormData(editingPackage)
    );

    const openCreate = () => {
        setEditing(null);
        setData(emptyDefaults);
        clearErrors();
        setOpen(true);
    };

    const openEdit = (pkg: Package) => {
        setEditing(pkg);
        setData(toFormData(pkg));
        clearErrors();
        setOpen(true);
    };

    const openDelete = (pkg: Package) => {
        setDeleting(pkg);
        setDeleteOpen(true);
    };

    const closeDelete = () => {
        setDeleteOpen(false);
        setDeleting(null);
        setDeleteProcessing(false);
    };

    const confirmDelete = () => {
        if (!deleting) return;
        setDeleteProcessing(true);
        router.delete(`/packages/${deleting.id}`, {
            preserveScroll: true,
            onFinish: () => {
                closeDelete();
            },
        });
    };

    const closeModal = () => {
        setOpen(false);
        setEditing(null);
        setData(emptyDefaults);
        clearErrors();
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            closeModal();
            return;
        }
        setOpen(true);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();

        const onSuccess = () => {
            closeModal();
        };

        if (editing) {
            put(`/packages/${editing.id}`, { preserveScroll: true, onSuccess });
        } else {
            post('/packages', { preserveScroll: true, onSuccess });
        }
    };

    const list = useMemo(() => {
        const source = packages;
        if (!query) return source;
        const q = query.toLowerCase();
        return source.filter((pkg) => {
            const name = (pkg.name ?? '').toLowerCase();
            const description = (pkg.description ?? '').toLowerCase();
            const type = (pkg.type ?? '').toLowerCase();
            const level = (pkg.level ?? '').toLowerCase();
            const status = (pkg.status ?? '').toLowerCase();
            return (
                `${pkg.id}`.includes(q) ||
                name.includes(q) ||
                description.includes(q) ||
                type.includes(q) ||
                level.includes(q) ||
                status.includes(q)
            );
        });
    }, [packages, query]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Packages" />

            <div className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
                <div className="w-full">
                    <h1 className="mb-2 text-2xl font-semibold">Tutorial Packages</h1>
                    <p className="text-sm text-muted-foreground">Manage tutoring packages, rates, and pricing details.</p>
                </div>

                <div className="rounded-xl border bg-background p-4">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="w-full flex-1 sm:max-w-sm">
                            <Input
                                placeholder="Search packages..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex w-full items-center justify-end sm:w-auto">
                            <Button onClick={openCreate}>New Package</Button>
                        </div>
                    </div>
                </div>

                {list.length === 0 ? (
                    <div className="rounded-xl border bg-background p-8 text-center text-sm text-muted-foreground">
                        No packages found.
                    </div>
                ) : (

                    <div className="overflow-hidden rounded-xl border bg-background">
                        <div className="overflow-x-auto">
                            <table className="w-full table-fixed text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="w-[260px] px-4 py-3 font-medium">Name</th>
                                        <th className="w-[140px] px-4 py-3 font-medium">Type</th>
                                        <th className="w-[180px] px-4 py-3 font-medium">Level</th>
                                        <th className="w-[100px] px-4 py-3 font-medium">Hours</th>
                                        <th className="w-[100px] px-4 py-3 font-medium">Tutee Fee</th>
                                        <th className="w-[100px] px-4 py-3 font-medium">Tutor Fee</th>
                                        <th className="w-[100px] px-4 py-3 font-medium">Status</th>
                                        <th className="w-[60px] px-4 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.map((pkg) => (
                                        <tr key={pkg.id} className="border-t align-top odd:bg-transparent even:bg-muted/50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-foreground">{pkg.name}</div>
                                                {pkg.description ? (
                                                    <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                                        {pkg.description}
                                                    </div>
                                                ) : null}
                                            </td>
                                            <td className="px-4 py-3">{pkg.type ?? '—'}</td>
                                            <td className="px-4 py-3">{pkg.level ?? '—'}</td>
                                            <td className="px-4 py-3">{pkg.duration_hours ?? '—'}</td>
                                            <td className="px-4 py-3">{pkg.tutee_fee_amount ?? '—'}</td>
                                            <td className="px-4 py-3">{pkg.tutor_fee_amount ?? '—'}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant="secondary" className="capitalize">{pkg.status}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Open menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEdit(pkg)}>
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => openDelete(pkg)}
                                                        >
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <Dialog open={open} onOpenChange={handleOpenChange}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Update Package' : 'Create Package'}</DialogTitle>
                            <DialogDescription>
                                {editing
                                    ? 'Update the package details and save changes.'
                                    : 'Fill in the package details to create a new record.'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="name">Package Name</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g., Standard Package"
                                        aria-invalid={!!errors.name}
                                    />
                                    {errors.name ? (
                                        <p className="text-sm text-destructive">{errors.name}</p>
                                    ) : null}
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                                            setData('description', e.target.value)
                                        }
                                        placeholder="Package details..."
                                        aria-invalid={!!errors.description}
                                    />
                                    {errors.description ? (
                                        <p className="text-sm text-destructive">{errors.description}</p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type">Type</Label>
                                    <Select value={data.type} onValueChange={(value) => setData('type', value)}>
                                        <SelectTrigger id="type" aria-invalid={!!errors.type}>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Per-Session">Per-Session</SelectItem>
                                            <SelectItem value="Prepaid">Prepaid</SelectItem>
                                            <SelectItem value="Promotional">Promotional</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.type ? (
                                        <p className="text-sm text-destructive">{errors.type}</p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="level">Level</Label>
                                    <Select value={data.level} onValueChange={(value) => setData('level', value)}>
                                        <SelectTrigger id="level" aria-invalid={!!errors.level}>
                                            <SelectValue placeholder="Select level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Preparatory">Preparatory</SelectItem>
                                            <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                                            <SelectItem value="Elementary">Elementary</SelectItem>
                                            <SelectItem value="Junior High School">Junior High School</SelectItem>
                                            <SelectItem value="Senior High School">Senior High School</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.level ? (
                                        <p className="text-sm text-destructive">{errors.level}</p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tutee_fee_amount">Tutee Fee Amount</Label>
                                    <Input
                                        id="tutee_fee_amount"
                                        type="number"
                                        step="0.01"
                                        value={data.tutee_fee_amount}
                                        onChange={(e) => setData('tutee_fee_amount', e.target.value)}
                                        placeholder="0.00"
                                        aria-invalid={!!errors.tutee_fee_amount}
                                    />
                                    {errors.tutee_fee_amount ? (
                                        <p className="text-sm text-destructive">{errors.tutee_fee_amount}</p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tutor_fee_amount">Tutor Fee Amount</Label>
                                    <Input
                                        id="tutor_fee_amount"
                                        type="number"
                                        step="0.01"
                                        value={data.tutor_fee_amount}
                                        onChange={(e) => setData('tutor_fee_amount', e.target.value)}
                                        placeholder="0.00"
                                        aria-invalid={!!errors.tutor_fee_amount}
                                    />
                                    {errors.tutor_fee_amount ? (
                                        <p className="text-sm text-destructive">{errors.tutor_fee_amount}</p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="duration_hours">Duration (Hours)</Label>
                                    <Input
                                        id="duration_hours"
                                        type="number"
                                        value={data.duration_hours}
                                        onChange={(e) => setData('duration_hours', e.target.value)}
                                        placeholder="e.g., 12"
                                        aria-invalid={!!errors.duration_hours}
                                    />
                                    {errors.duration_hours ? (
                                        <p className="text-sm text-destructive">{errors.duration_hours}</p>
                                    ) : null}
                                </div>
                            </div>
                                
                            <div className="hidden space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={data.status}
                                    onValueChange={(value) => setData('status', value)}
                                >
                                    <SelectTrigger id="status" aria-invalid={!!errors.status}>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">active</SelectItem>
                                        <SelectItem value="inactive">inactive</SelectItem>
                                        <SelectItem value="archived">archived</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status ? (
                                    <p className="text-sm text-destructive">{errors.status}</p>
                                ) : null}
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={closeModal}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {editing ? 'Update Package' : 'Create Package'}
                                </Button>
                            </DialogFooter>

                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete package</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete{' '}
                                <span className="font-medium text-foreground">{deleting?.name}</span>? This action
                                cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeDelete} disabled={deleteProcessing}>
                                Cancel
                            </Button>
                            <Button type="button" variant="destructive" onClick={confirmDelete} disabled={deleteProcessing}>
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}