import AppLayout from '@/layouts/app-layout';
import { students } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Form, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Students', href: students().url },
    { title: 'Edit', href: '#' },
];

export default function StudentEdit() {
    const { props } = usePage();
    const student = (props as any).student ?? {};

    // Normalize date strings for HTML date input (expects YYYY-MM-DD)
    const formatForDateInput = (val: any) => {
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
            <Head title="Edit Student" />

            <div className="m-5">
                <h1 className="text-2xl font-semibold mb-4">Edit Student</h1>

                <Form method="post" action={`${students().url}/${student.encrypted_id}`} className="space-y-4">
                    <input type="hidden" name="_method" value="put" />
                    <>
                        <div className="space-y-6">
                            {/* Personal Information */}
                            <section className="p-4 rounded-md bg-background">
                                <h2 className="text-lg font-medium mb-2">Personal Information</h2>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div>
                                        <Label htmlFor="firstname">First name</Label>
                                        <Input id="firstname" name="firstname" defaultValue={student.firstname} required />
                                        <InputError message={(props as any).errors?.firstname} />
                                    </div>

                                    <div>
                                        <Label htmlFor="middlename">Middle name</Label>
                                        <Input id="middlename" name="middlename" defaultValue={student.middlename} />
                                        <InputError message={(props as any).errors?.middlename} />
                                    </div>

                                    <div>
                                        <Label htmlFor="lastname">Last name</Label>
                                        <Input id="lastname" name="lastname" defaultValue={student.lastname} required />
                                        <InputError message={(props as any).errors?.lastname} />
                                    </div>

                                    <div>
                                        <Label htmlFor="date_of_birth">Date of birth</Label>
                                        <Input id="date_of_birth" name="date_of_birth" type="date" defaultValue={formatForDateInput(student.date_of_birth)} />
                                        <InputError message={(props as any).errors?.date_of_birth} />
                                    </div>
                                </div>
                            </section>

                            {/* School Information */}
                            <section className="p-4 rounded-md bg-background">
                                <h2 className="text-lg font-medium mb-2">School Information</h2>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div>
                                        <Label htmlFor="school">School</Label>
                                        <Input id="school" name="school" defaultValue={student.school} />
                                        <InputError message={(props as any).errors?.school} />
                                    </div>
                                </div>
                            </section>

                            {/* Parent & Enrollment */}
                            <section className="p-4 rounded-md bg-background">
                                <h2 className="text-lg font-medium mb-2">Parent / Contact</h2>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div>
                                        <Label htmlFor="parent_name">Parent name</Label>
                                        <Input id="parent_name" name="parent_name" defaultValue={student.parent_name} />
                                        <InputError message={(props as any).errors?.parent_name} />
                                    </div>

                                    <div>
                                        <Label htmlFor="parent_contact">Parent contact</Label>
                                        <Input id="parent_contact" name="parent_contact" defaultValue={student.parent_contact} />
                                        <InputError message={(props as any).errors?.parent_contact} />
                                    </div>
                                </div>
                            </section>

                            {/* Note: Schedule & timing fields removed to match Students model/migration */}

                            {/* Actions */}
                            <div className="flex items-center gap-4">
                                <Button type="submit" disabled={false}>
                                    Save Student
                                </Button>

                                <Link href={students().url} className="text-sm text-muted-foreground">
                                    Cancel
                                </Link>
                            </div>
                        </div>
                    </>
                </Form>
            </div>
        </AppLayout>
    );
}
