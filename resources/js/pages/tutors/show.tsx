import AppLayout from '@/layouts/app-layout';
import { tutors } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    IdCard,
    User,
    Cake,
    Mail,
    Phone,
    MapPin,
    Badge,
    CalendarPlus,
    Info,
} from 'lucide-react';
import { InfoField } from '@/components/ui/info-field';


export default function TutorShow() {
    const { props } = usePage();
    const tutor = (props as any).tutor ?? {
        id: 0,
        firstname: 'Unknown',
        middlename: '',
        lastname: '',
        date_of_birth: null,
        address: null,
        email: null,
        phone: null,
        license_number: null,
        subject_specialty: null,
        hire_date: null,
        hourly_rate: null,
        created_at: null,
        updated_at: null,
    };

    const name = `${tutor.firstname ?? ''} ${tutor.middlename ?? ''} ${tutor.lastname ?? ''}`.trim() || '—';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Tutors', href: tutors().url },
        { title: `${name}`, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Tutor ${name}`} />

            <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center gap-4 mt-4">
                    {/* <Link href={tutors().url}>
                        <Button variant="ghost">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                    </Link> */}
                    <h1 className="text-2xl font-semibold">{name}</h1>
                </div>
                
                <div className="space-y-6">
                <div className="rounded-xl border bg-background p-6">
                    <h2 className="mb-3 flex items-center gap-2 text-lg font-medium">
                        <Info className="h-5 w-5 text-muted-foreground" />
                        Tutor Information
                    </h2>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <InfoField icon={IdCard} label="Tutor ID" value={tutor.tutorid ?? '—'} />
                        <InfoField
                            icon={User}
                            label="Full Name"
                            value={
                                `${tutor.firstname ?? ''} ${tutor.middlename ?? ''} ${tutor.lastname ?? ''}`.trim() || '—'
                            }
                        />

                        <InfoField
                            icon={Cake}
                            label="Date of Birth"
                            value={
                                tutor.date_of_birth
                                    ? (() => {
                                          const d = new Date(tutor.date_of_birth);
                                          if (isNaN(d.getTime())) return '—';
                                          const mm = String(d.getMonth() + 1).padStart(2, '0');
                                          const dd = String(d.getDate()).padStart(2, '0');
                                          const yyyy = d.getFullYear();
                                          return `${mm}/${dd}/${yyyy}`;
                                      })()
                                    : '—'
                            }
                        />

                        <InfoField icon={Mail} label="Email" value={tutor.email ?? '—'} />
                        <InfoField icon={Phone} label="Phone" value={tutor.phone ?? '—'} />
                        <InfoField icon={MapPin} label="Address" value={tutor.address ?? '—'} />
                        <InfoField icon={Badge} label="License No." value={tutor.license_number ?? '—'} />

                        <InfoField
                            icon={CalendarPlus}
                            label="Hire Date"
                            value={
                                tutor.hire_date
                                    ? (() => {
                                          const d = new Date(tutor.hire_date);
                                          if (isNaN(d.getTime())) return '—';
                                          const mm = String(d.getMonth() + 1).padStart(2, '0');
                                          const dd = String(d.getDate()).padStart(2, '0');
                                          const yyyy = d.getFullYear();
                                          return `${mm}/${dd}/${yyyy}`;
                                      })()
                                    : '—'
                            }
                        />

                        <InfoField
                            icon={CalendarPlus}
                            label="Registered at"
                            value={
                                tutor.created_at
                                    ? (() => {
                                          const d = new Date(tutor.created_at);
                                          if (isNaN(d.getTime())) return '—';
                                          const mm = String(d.getMonth() + 1).padStart(2, '0');
                                          const dd = String(d.getDate()).padStart(2, '0');
                                          const yyyy = d.getFullYear();
                                          return `${mm}/${dd}/${yyyy}`;
                                      })()
                                    : '—'
                            }
                        />
                    </div>
                </div>
                
                <div className="rounded-xl border bg-background p-6">
                    <h2 className="text-lg font-medium mb-3">Tutorial Sessions</h2>
                    {(() => {
                        const pageProps = props as any;
                        const tutorProp = pageProps.tutor ?? tutor;

                        let list: any[] = [];
                        if (tutorProp && Array.isArray(tutorProp.tutorials) && tutorProp.tutorials.length) {
                            list = tutorProp.tutorials;
                        } else if (Array.isArray(pageProps.tutorials) && pageProps.tutorials.length) {
                            const matchKey = tutorProp?.tutorid ?? tutorProp?.id;
                            list = pageProps.tutorials.filter((t: any) => {
                                return String(t.tutorid) === String(matchKey) || String(t.tutorid) === String(tutorProp?.id) || String(t.tutor_id) === String(tutorProp?.id);
                            });
                        }

                        const rows = list.map((item: any) => {
                            let schedules: any[] = [];
                            if (item.tutorial_schedule) {
                                schedules = Array.isArray(item.tutorial_schedule) ? item.tutorial_schedule : (() => {
                                    try { return JSON.parse(item.tutorial_schedule); } catch (e) { return []; }
                                })();
                            }

                            const first = schedules[0] ?? null;
                            const startTime = first?.start_time ?? item.tutorial_time ?? item.start_time ?? '';
                            const endTime = first?.end_time ?? '';
                            const days = first ? (Array.isArray(first.days) ? first.days.join(', ') : first.days) : (item.tutorial_date ?? '');

                            return {
                                id: item.id ?? null,
                                tutorialid: item.tutorialid ?? item.id ?? '—',
                                student_name: item.student_name ?? (item.student ? `${item.student.firstname ?? ''} ${item.student.lastname ?? ''}`.trim() : null),
                                subject: item.subject ?? '—',
                                days,
                                startTime,
                                endTime,
                                start_date: item.start_date ?? null,
                                end_date: item.end_date ?? null,
                                encrypted: item.encrypted_id ?? item.encrypted ?? null,
                                raw: item,
                            };
                        });

                        if (rows.length === 0) {
                            return (
                                <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
                                    No sessions scheduled
                                </div>
                            );
                        }

                        return (
                            <div className="overflow-x-auto">
                                <table className="w-full table-fixed text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="w-[160px] px-3 py-2 text-muted-foreground">Tutorial ID</th>
                                            <th className="w-[240px] px-3 py-2 text-muted-foreground">Student</th>
                                            <th className="w-[260px] px-3 py-2 text-muted-foreground">Days</th>
                                            <th className="w-[220px] px-3 py-2 text-muted-foreground">Time</th>
                                            <th className="w-[140px] px-3 py-2 text-muted-foreground">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((r: any, i: number) => (
                                            <tr key={i} className="border-t odd:bg-transparent even:bg-muted/50">
                                                <td className="px-3 py-2">
                                                    {r.encrypted ? (
                                                        <Link
                                                            href={`/tutorials/${r.encrypted}`}
                                                            className="font-medium text-primary hover:underline"
                                                        >
                                                            {r.tutorialid}
                                                        </Link>
                                                    ) : (
                                                        <span>{r.tutorialid}</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 break-words">{r.student_name ?? '—'}</td>
                                                <td className="px-3 py-2">
                                                    {(() => {
                                                        const raw = r.raw ?? {};
                                                        let schedules: any[] = [];
                                                        if (raw.tutorial_schedule) {
                                                            schedules = Array.isArray(raw.tutorial_schedule) ? raw.tutorial_schedule : (() => {
                                                                try { return JSON.parse(raw.tutorial_schedule); } catch (e) { return []; }
                                                            })();
                                                        }

                                                        if (!schedules.length) return '—';

                                                        return (
                                                            <div className="space-y-1 break-words">
                                                                {schedules.map((s: any, idx: number) => {
                                                                    const days = Array.isArray(s.days) ? s.days.join(', ') : (s.days ?? '');
                                                                    return (
                                                                        <div key={idx} className="text-sm font-medium">{days || '—'}</div>
                                                                    );
                                                                })}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {(() => {
                                                        const raw = r.raw ?? {};
                                                        let schedules: any[] = [];
                                                        if (raw.tutorial_schedule) {
                                                            schedules = Array.isArray(raw.tutorial_schedule) ? raw.tutorial_schedule : (() => {
                                                                try { return JSON.parse(raw.tutorial_schedule); } catch (e) { return []; }
                                                            })();
                                                        }

                                                        if (!schedules.length) return '—';

                                                        return (
                                                            <div className="space-y-1 break-words">
                                                                {schedules.map((s: any, idx: number) => {
                                                                    const formatTime = (time: string) => {
                                                                        if (!time) return '';
                                                                        const [hours, minutes] = time.split(':');
                                                                        const hour = parseInt(hours, 10);
                                                                        const ampm = hour >= 12 ? 'PM' : 'AM';
                                                                        const displayHour = hour % 12 || 12;
                                                                        return `${displayHour}:${minutes} ${ampm}`;
                                                                    };
                                                                    const start = formatTime(s.start_time ?? '');
                                                                    const end = formatTime(s.end_time ?? '');
                                                                    const time = start ? (end ? `${start} — ${end}` : start) : (end || '');
                                                                    return (
                                                                        <div key={idx} className="text-sm text-muted-foreground">{time || '—'}</div>
                                                                    );
                                                                })}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span className="text-sm text-muted-foreground">{r.raw?.status ?? '—'}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })()}
                </div>
                </div>
            </div>
        </AppLayout>    
    );
}
