import AppLayout from '@/layouts/app-layout';
import { Head, Form, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tutors', href: '/tutors' },
    { title: 'Create' },
];

export default function TutorCreate() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Tutor" />

            <div className="m-5">
                <h1 className="text-2xl font-semibold mb-4">Add New Tutor</h1>

                <Form method="post" action="/tutors" className="space-y-4">
                    {({ processing, errors }) => (
                        <>
                            <div className="space-y-6">
                                <section className="p-4 rounded-md bg-background">
                                    <h2 className="text-lg font-medium mb-2">Personal Information</h2>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div>
                                            <Label htmlFor="firstname">First name</Label>
                                            <Input id="firstname" name="firstname" required />
                                            <InputError message={errors.firstname} />
                                        </div>

                                        <div>
                                            <Label htmlFor="middlename">Middle name</Label>
                                            <Input id="middlename" name="middlename" />
                                            <InputError message={errors.middlename} />
                                        </div>

                                        <div>
                                            <Label htmlFor="lastname">Last name</Label>
                                            <Input id="lastname" name="lastname" required />
                                            <InputError message={errors.lastname} />
                                        </div>

                                        <div>
                                            <Label htmlFor="date_of_birth">Date of birth</Label>
                                            <Input id="date_of_birth" name="date_of_birth" type="date" />
                                            <InputError message={errors.date_of_birth} />
                                        </div>
                                    </div>
                                </section>

                                <section className="p-4 rounded-md bg-background">
                                    <h2 className="text-lg font-medium mb-2">Contact & Work</h2>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div>
                                            <Label htmlFor="address">Address</Label>
                                            <Input id="address" name="address" />
                                            <InputError message={errors.address} />
                                        </div>

                                        <div>
                                            <Label htmlFor="email">Email</Label>
                                            <Input id="email" name="email" type="email" required />
                                            <InputError message={errors.email} />
                                        </div>

                                        <div>
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input id="phone" name="phone" />
                                            <InputError message={errors.phone} />
                                        </div>

                                        <div>
                                            <Label htmlFor="license_number">License #</Label>
                                            <Input id="license_number" name="license_number" />
                                            <InputError message={errors.license_number} />
                                        </div>

                                        <div>
                                            <Label htmlFor="hire_date">Hire date</Label>
                                            <Input id="hire_date" name="hire_date" type="date" />
                                            <InputError message={errors.hire_date} />
                                        </div>
                                    </div>
                                </section>

                                <div className="flex items-center gap-4">
                                    <Button type="submit" disabled={processing}>{processing ? 'Saving...' : 'Save Tutor'}</Button>
                                    <Link href="/tutors" className="text-sm text-muted-foreground">Cancel</Link>
                                </div>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
