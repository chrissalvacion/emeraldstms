import AppLayout from '@/layouts/app-layout';
import { students } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Form, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Students', href: students().url },
    { title: 'Create', href: '#' },
];

export default function StudentCreate() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Student" />

            <div className="m-5">
                <h1 className="text-2xl font-semibold mb-4">Add New Student</h1>

                <Form method="post" action={students().url} className="space-y-4">
                    {({ processing, errors }) => (
                        <>
                            <div className="space-y-6">
                                {/* Personal Information */}
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

                                {/* School Information */}
                                <section className="p-4 rounded-md bg-background">
                                    <h2 className="text-lg font-medium mb-2">School Information</h2>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div>
                                            <Label htmlFor="school">School</Label>
                                            <Input id="school" name="school" />
                                            <InputError message={errors.school} />
                                        </div>
                                    </div>
                                </section>

                                {/* Parent & Enrollment */}
                                <section className="p-4 rounded-md bg-background">
                                    <h2 className="text-lg font-medium mb-2">Parent / Enrollment</h2>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div>
                                            <Label htmlFor="parent_name">Parent name</Label>
                                            <Input id="parent_name" name="parent_name" />
                                            <InputError message={errors.parent_name} />
                                        </div>

                                        <div>
                                            <Label htmlFor="parent_contact">Parent contact</Label>
                                            <Input
                                                id="parent_contact"
                                                name="parent_contact"
                                                type="tel"
                                                inputMode="numeric"
                                                pattern="\d{12}"
                                                maxLength={12}
                                                onInput={(e) => {
                                                    const t = e.target as HTMLInputElement;
                                                    t.value = t.value.replace(/\D/g, '').slice(0, 12);
                                                }}
                                            />
                                            <InputError message={errors.parent_contact} />
                                        </div>
                                    </div>
                                </section>

                                {/* Note: Schedule & timing fields removed to match Students model/migration */}

                                {/* Actions */}
                                <div className="flex items-center gap-4">
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Saving...' : 'Save Student'}
                                    </Button>

                                    <Link href={students().url} className="text-sm text-muted-foreground">
                                        Cancel
                                    </Link>
                                </div>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
