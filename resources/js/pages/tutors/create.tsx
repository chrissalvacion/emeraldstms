import AppLayout from '@/layouts/app-layout';
import { Head, Form, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tutors', href: '/tutors' },
    { title: 'Create', href: '#' },
];

export default function TutorCreate() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Tutor" />

            <div className="mx-auto max-w-2xl px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Add New Tutor</h1>
                </div>

                <Form method="post" action="/tutors" className="space-y-8">
                    {({ processing, errors }) => (
                        <div className="space-y-8">
                            <fieldset>
                                <legend className="text-base font-semibold leading-7">Personal Information</legend>
                                <p className="mt-1 text-sm leading-6 text-muted-foreground">Basic details about the tutor.</p>
                                <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-3">
                                    <div>
                                        <Label htmlFor="firstname" className="block text-sm font-medium leading-6">
                                            First name
                                        </Label>
                                        <Input id="firstname" name="firstname" required className="mt-2" />
                                        <InputError message={errors.firstname} />
                                    </div>

                                    <div>
                                        <Label htmlFor="middlename" className="block text-sm font-medium leading-6">
                                            Middle name
                                        </Label>
                                        <Input id="middlename" name="middlename" className="mt-2" />
                                        <InputError message={errors.middlename} />
                                    </div>

                                    <div>
                                        <Label htmlFor="lastname" className="block text-sm font-medium leading-6">
                                            Last name
                                        </Label>
                                        <Input id="lastname" name="lastname" required className="mt-2" />
                                        <InputError message={errors.lastname} />
                                    </div>

                                    <div>
                                        <Label htmlFor="date_of_birth" className="block text-sm font-medium leading-6">
                                            Date of birth <span className="text-sm text-muted-foreground">(Optional)</span>
                                        </Label>
                                        <Input id="date_of_birth" name="date_of_birth" type="date" className="mt-2" />
                                        <InputError message={errors.date_of_birth} />
                                    </div>
                                </div>
                            </fieldset>

                            <fieldset>
                                <legend className="text-base font-semibold leading-7">Contact & Work</legend>
                                <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                                    <div>
                                        <Label htmlFor="address" className="block text-sm font-medium leading-6">
                                            Address <span className="text-sm text-muted-foreground">(Optional)</span>
                                        </Label>
                                        <Input id="address" name="address" className="mt-2" />
                                        <InputError message={errors.address} />
                                    </div>

                                    <div>
                                        <Label htmlFor="email" className="block text-sm font-medium leading-6">
                                            Email <span className="text-sm text-muted-foreground">(Optional)</span>
                                        </Label>
                                        <Input id="email" name="email" type="email" className="mt-2" />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div>
                                        <Label htmlFor="phone" className="block text-sm font-medium leading-6">
                                            Phone <span className="text-sm text-muted-foreground">(Optional)</span>
                                        </Label>
                                        <Input id="phone" name="phone" className="mt-2" />
                                        <InputError message={errors.phone} />
                                    </div>

                                    <div>
                                        <Label htmlFor="license_number" className="block text-sm font-medium leading-6">
                                            License # <span className="text-sm text-muted-foreground">(Optional)</span>
                                        </Label>
                                        <Input id="license_number" name="license_number" className="mt-2" />
                                        <InputError message={errors.license_number} />
                                    </div>

                                    <div>
                                        <Label htmlFor="hire_date" className="block text-sm font-medium leading-6">
                                            Hire date
                                        </Label>
                                        <Input id="hire_date" name="hire_date" type="date" className="mt-2" />
                                        <InputError message={errors.hire_date} />
                                    </div>
                                </div>
                            </fieldset>

                            <div className="flex items-center gap-x-6 pt-8">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving...' : 'Save Tutor'}
                                </Button>

                                <Link
                                    href="/tutors"
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
