import AppLayout from '@/layouts/app-layout';
import { tutors } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tutors', href: tutors().url },
    { title: 'Edit', href: '#' },
];

export default function TutorEdit() {
    const { props } = usePage();
    const tutor = (props as any).tutor ?? {};

    const formatForDateInput = (val: any) => {
        if (!val) return '';
        if (typeof val !== 'string') return '';
        const isoMatch = val.match(/^(\d{4}-\d{2}-\d{2})/);
        if (isoMatch) return isoMatch[1];
        const m = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (m) {
            const mm = m[1].padStart(2, '0');
            const dd = m[2].padStart(2, '0');
            return `${m[3]}-${mm}-${dd}`;
        }
        return '';
    };

    const form = useForm({
        firstname: tutor.firstname ?? '',
        middlename: tutor.middlename ?? '',
        lastname: tutor.lastname ?? '',
        date_of_birth: formatForDateInput(tutor.date_of_birth),
        email: tutor.email ?? '',
        phone: tutor.phone ?? '',
        license_number: tutor.license_number ?? '',
        hire_date: formatForDateInput(tutor.hire_date),
    });

    const handleSubmit = (e: any) => {
        e.preventDefault();
        form.put(`${tutors().url}/${tutor.encrypted_id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Tutor" />

            <div className="m-5">
                <h1 className="text-2xl font-semibold mb-4">Edit Tutor</h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-6">
                        <section className="p-4 rounded-md bg-background">
                            <h2 className="text-lg font-medium mb-2">Personal Information</h2>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <Label htmlFor="firstname">First name</Label>
                                    <Input id="firstname" name="firstname" value={form.data.firstname} onChange={(e: any) => form.setData('firstname', e.target.value)} required />
                                    <InputError message={form.errors.firstname} />
                                </div>

                                <div>
                                    <Label htmlFor="middlename">Middle name</Label>
                                    <Input id="middlename" name="middlename" value={form.data.middlename} onChange={(e: any) => form.setData('middlename', e.target.value)} />
                                    <InputError message={form.errors.middlename} />
                                </div>

                                <div>
                                    <Label htmlFor="lastname">Last name</Label>
                                    <Input id="lastname" name="lastname" value={form.data.lastname} onChange={(e: any) => form.setData('lastname', e.target.value)} required />
                                    <InputError message={form.errors.lastname} />
                                </div>

                                <div>
                                    <Label htmlFor="date_of_birth">Date of birth</Label>
                                    <Input id="date_of_birth" name="date_of_birth" type="date" value={form.data.date_of_birth} onChange={(e: any) => form.setData('date_of_birth', e.target.value)} />
                                    <InputError message={form.errors.date_of_birth} />
                                </div>
                            </div>
                        </section>

                        <section className="p-4 rounded-md bg-background">
                            <h2 className="text-lg font-medium mb-2">Employment</h2>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" name="email" type="email" value={form.data.email} onChange={(e: any) => form.setData('email', e.target.value)} required />
                                    <InputError message={form.errors.email} />
                                </div>

                                <div>
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input id="phone" name="phone" value={form.data.phone} onChange={(e: any) => form.setData('phone', e.target.value)} />
                                    <InputError message={form.errors.phone} />
                                </div>

                                <div>
                                    <Label htmlFor="license_number">License number</Label>
                                    <Input id="license_number" name="license_number" value={form.data.license_number} onChange={(e: any) => form.setData('license_number', e.target.value)} />
                                    <InputError message={form.errors.license_number} />
                                </div>

                                <div>
                                    <Label htmlFor="hire_date">Hire date</Label>
                                    <Input id="hire_date" name="hire_date" type="date" value={form.data.hire_date} onChange={(e: any) => form.setData('hire_date', e.target.value)} />
                                    <InputError message={form.errors.hire_date} />
                                </div>
                            </div>
                        </section>

                        <div className="flex items-center gap-4">
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? 'Saving...' : 'Save Tutor'}
                            </Button>

                            <Link href={tutors().url} className="text-sm text-muted-foreground">
                                Cancel
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
