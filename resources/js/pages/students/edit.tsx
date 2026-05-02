import AppLayout from '@/layouts/app-layout';
import { students } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Form, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tutees', href: students().url },
    { title: 'Edit', href: '#' },
];

type Student = {
    encrypted_id: string;
    firstname?: string | null;
    middlename?: string | null;
    lastname?: string | null;
    date_of_birth?: string | null;
    school?: string | null;
    parent_name?: string | null;
    parent_contact?: string | null;
};

type StudentEditPageProps = {
    student: Student;
};

export default function StudentEdit() {
    const { student } = usePage<StudentEditPageProps>().props;

    // Normalize date strings for HTML date input (expects YYYY-MM-DD)
    const formatForDateInput = (val: unknown) => {
        if (!val) return '';
        if (typeof val !== 'string') return '';
        // already YYYY-MM-DD or with time ISO
        const isoMatch = val.match(/^(\d{4}-\d{2}-\d{2})/);
        if (isoMatch) return isoMatch[1];

        // convert mm/dd/yyyy -> yyyy-mm-dd
        const m = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (m) {
            const mm = m[1].padStart(2, '0');
            const dd = m[2].padStart(2, '0');
            return `${m[3]}-${mm}-${dd}`;
        }

        return '';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Tutee" />

            <div className="mx-auto max-w-2xl px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Edit Tutee</h1>
                </div>

                <Form method="post" action={`${students().url}/${student.encrypted_id}`} className="space-y-8">
                    {({ processing, errors }) => (
                        <div className="space-y-8">
                            <input type="hidden" name="_method" value="put" />

                            <fieldset>
                                <legend className="text-base font-semibold leading-7">Personal Information</legend>
                                <p className="mt-1 text-sm leading-6 text-muted-foreground">Basic details about the tutee.</p>
                                <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-3">
                                    <div>
                                        <Label htmlFor="firstname" className="block text-sm font-medium leading-6">
                                            First name
                                        </Label>
                                        <Input id="firstname" name="firstname" defaultValue={student.firstname ?? ''} required className="mt-2" />
                                        <InputError message={errors.firstname} />
                                    </div>

                                    <div>
                                        <Label htmlFor="middlename" className="block text-sm font-medium leading-6">
                                            Middle name
                                        </Label>
                                        <Input id="middlename" name="middlename" defaultValue={student.middlename ?? ''} className="mt-2" />
                                        <InputError message={errors.middlename} />
                                    </div>

                                    <div>
                                        <Label htmlFor="lastname" className="block text-sm font-medium leading-6">
                                            Last name
                                        </Label>
                                        <Input id="lastname" name="lastname" defaultValue={student.lastname ?? ''} required className="mt-2" />
                                        <InputError message={errors.lastname} />
                                    </div>

                                    <div>
                                        <Label htmlFor="date_of_birth" className="block text-sm font-medium leading-6">
                                            Date of birth
                                        </Label>
                                        <Input
                                            id="date_of_birth"
                                            name="date_of_birth"
                                            type="date"
                                            defaultValue={formatForDateInput(student.date_of_birth)}
                                            className="mt-2"
                                        />
                                        <InputError message={errors.date_of_birth} />
                                    </div>
                                </div>
                            </fieldset>

                            <fieldset>
                                <legend className="text-base font-semibold leading-7">School Information</legend>
                                <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                                    <div>
                                        <Label htmlFor="school" className="block text-sm font-medium leading-6">
                                            School
                                        </Label>
                                        <Input id="school" name="school" defaultValue={student.school ?? ''} className="mt-2" />
                                        <InputError message={errors.school} />
                                    </div>
                                </div>
                            </fieldset>

                            <fieldset>
                                <legend className="text-base font-semibold leading-7">Parent / Enrollment</legend>
                                <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                                    <div>
                                        <Label htmlFor="parent_name" className="block text-sm font-medium leading-6">
                                            Parent name
                                        </Label>
                                        <Input id="parent_name" name="parent_name" defaultValue={student.parent_name ?? ''} className="mt-2" />
                                        <InputError message={errors.parent_name} />
                                    </div>

                                    <div>
                                        <Label htmlFor="parent_contact" className="block text-sm font-medium leading-6">
                                            Parent contact
                                        </Label>
                                        <Input
                                            id="parent_contact"
                                            name="parent_contact"
                                            type="tel"
                                            inputMode="numeric"
                                            pattern="\d{12}"
                                            maxLength={12}
                                            defaultValue={student.parent_contact ?? ''}
                                            className="mt-2"
                                            onInput={(e) => {
                                                const t = e.target as HTMLInputElement;
                                                t.value = t.value.replace(/\D/g, '').slice(0, 12);
                                            }}
                                        />
                                        <InputError message={errors.parent_contact} />
                                    </div>
                                </div>
                            </fieldset>

                            <div className="flex items-center gap-x-6 border-t border-border pt-8">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving...' : 'Save Student'}
                                </Button>

                                <Link
                                    href={students().url}
                                    className="text-sm font-semibold leading-6 text-muted-foreground hover:text-foreground"
                                >
                                    Cancel
                                </Link>
                            </div>
                        </div>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
