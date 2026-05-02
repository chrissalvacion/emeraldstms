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

type Tutor = {
    encrypted_id: string;
    firstname?: string | null;
    middlename?: string | null;
    lastname?: string | null;
    date_of_birth?: string | null;
    email?: string | null;
    phone?: string | null;
    license_number?: string | null;
    hire_date?: string | null;
};

type TutorEditPageProps = {
    tutor: Tutor;
};

export default function TutorEdit() {
    const { tutor } = usePage<TutorEditPageProps>().props;

    const formatForDateInput = (val: unknown) => {
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

    const form = useForm<{ firstname: string; middlename: string; lastname: string; date_of_birth: string; email: string; phone: string; license_number: string; hire_date: string }>({
        firstname: tutor.firstname ?? '',
        middlename: tutor.middlename ?? '',
        lastname: tutor.lastname ?? '',
        date_of_birth: formatForDateInput(tutor.date_of_birth),
        email: tutor.email ?? '',
        phone: tutor.phone ?? '',
        license_number: tutor.license_number ?? '',
        hire_date: formatForDateInput(tutor.hire_date),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.put(`${tutors().url}/${tutor.encrypted_id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Tutor" />

            <div className="mx-auto max-w-2xl px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Edit Tutor</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <fieldset>
                        <legend className="text-base font-semibold leading-7">Personal Information</legend>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">Basic personal details.</p>
                        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-3">
                            <div>
                                <Label htmlFor="firstname" className="block text-sm font-medium leading-6">
                                    First name
                                </Label>
                                <Input
                                    id="firstname"
                                    name="firstname"
                                    value={form.data.firstname}
                                    onChange={(e) => form.setData('firstname', e.target.value)}
                                    required
                                    className="mt-2"
                                />
                                <InputError message={form.errors.firstname} />
                            </div>

                            <div>
                                <Label htmlFor="middlename" className="block text-sm font-medium leading-6">
                                    Middle name
                                </Label>
                                <Input
                                    id="middlename"
                                    name="middlename"
                                    value={form.data.middlename}
                                    onChange={(e) => form.setData('middlename', e.target.value)}
                                    className="mt-2"
                                />
                                <InputError message={form.errors.middlename} />
                            </div>

                            <div>
                                <Label htmlFor="lastname" className="block text-sm font-medium leading-6">
                                    Last name
                                </Label>
                                <Input
                                    id="lastname"
                                    name="lastname"
                                    value={form.data.lastname}
                                    onChange={(e) => form.setData('lastname', e.target.value)}
                                    required
                                    className="mt-2"
                                />
                                <InputError message={form.errors.lastname} />
                            </div>

                            <div>
                                <Label htmlFor="date_of_birth" className="block text-sm font-medium leading-6">
                                    Date of birth
                                </Label>
                                <Input
                                    id="date_of_birth"
                                    name="date_of_birth"
                                    type="date"
                                    value={form.data.date_of_birth}
                                    onChange={(e) => form.setData('date_of_birth', e.target.value)}
                                    className="mt-2"
                                />
                                <InputError message={form.errors.date_of_birth} />
                            </div>
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend className="text-base font-semibold leading-7">Employment</legend>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">Contact and employment information.</p>
                        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="email" className="block text-sm font-medium leading-6">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={form.data.email}
                                    onChange={(e) => form.setData('email', e.target.value)}
                                    required
                                    className="mt-2"
                                />
                                <InputError message={form.errors.email} />
                            </div>

                            <div>
                                <Label htmlFor="phone" className="block text-sm font-medium leading-6">
                                    Phone
                                </Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    value={form.data.phone}
                                    onChange={(e) => form.setData('phone', e.target.value)}
                                    className="mt-2"
                                />
                                <InputError message={form.errors.phone} />
                            </div>

                            <div>
                                <Label htmlFor="license_number" className="block text-sm font-medium leading-6">
                                    License number
                                </Label>
                                <Input
                                    id="license_number"
                                    name="license_number"
                                    value={form.data.license_number}
                                    onChange={(e) => form.setData('license_number', e.target.value)}
                                    className="mt-2"
                                />
                                <InputError message={form.errors.license_number} />
                            </div>

                            <div>
                                <Label htmlFor="hire_date" className="block text-sm font-medium leading-6">
                                    Hire date
                                </Label>
                                <Input
                                    id="hire_date"
                                    name="hire_date"
                                    type="date"
                                    value={form.data.hire_date}
                                    onChange={(e) => form.setData('hire_date', e.target.value)}
                                    className="mt-2"
                                />
                                <InputError message={form.errors.hire_date} />
                            </div>
                        </div>
                    </fieldset>

                    <div className="flex items-center gap-x-6 pt-8">
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Saving...' : 'Save Tutor'}
                        </Button>

                        <Link
                            href={tutors().url}
                            className="text-sm font-semibold leading-6 text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
