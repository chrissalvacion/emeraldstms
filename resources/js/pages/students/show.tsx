import AppLayout from '@/layouts/app-layout';
import { students } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    ArrowLeft,
    UserPlus,
    Edit,
    Trash2,
    IdCard,
    User,
    Cake,
    GraduationCap,
    School,
    Users,
    Phone,
    CalendarPlus,
    Info,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { InfoField } from '@/components/ui/info-field';
import { useState } from 'react';

export default function StudentShow() {
    const { props } = usePage();
    const student = (props as any).student ?? {
        id: 0,
        tuteeid: '',
        firstname: '',
        middlename: '',
        lastname: '',
        date_of_birth: null,
        grade_level: null,
        school: null,
        parent_name: null,
        parent_contact: null,
        created_at: null,
        updated_at: null,
    };

    const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Students', href: students().url },
    { title: `${student.firstname ?? ''} ${student.middlename ?? ''} ${student.lastname ?? ''}`.trim() || '—', href:'#'},
    ];

    const fullName = `${student.firstname ?? ''} ${student.middlename ?? ''} ${student.lastname ?? ''}`.trim() || 'Student';

    const scheduleDisplay = (() => {
        const val = student.schedule_days;
        if (Array.isArray(val)) return val.join(', ');
        if (typeof val === 'string') {
            try {
                const parsed = JSON.parse(val);
                if (Array.isArray(parsed)) return parsed.join(', ');
                return val;
            } catch (e) {
                return val;
            }
        }
        return '—';
    })();

    const [confirmOpen, setConfirmOpen] = useState(false);

    const formatTime12 = (timeStr: string) => {
        if (!timeStr) return '';
        // Expecting 'HH:mm' or similar
        const parts = String(timeStr).split(':');
        if (parts.length < 2) return timeStr;
        let hh = parseInt(parts[0], 10);
        const mm = parts[1];
        if (Number.isNaN(hh)) return timeStr;
        const ampm = hh >= 12 ? 'PM' : 'AM';
        hh = hh % 12;
        if (hh === 0) hh = 12;
        return `${hh}:${mm} ${ampm}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={'Student ' + fullName} />

            <div className="p-4">
                <div className="mb-4 flex items-center gap-4">
                    <Link href={students().url}>
                        <Button variant="ghost">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-semibold">{`${student.firstname ?? ''} ${student.middlename ?? ''} ${student.lastname ?? ''}`.trim() || '—'}</h1>
                    
                    <div className="ml-auto flex items-center gap-2">
                        <Link href={`/tutorials/create?student=${student.id}`}>
                            <Button variant="ghost" size="sm" aria-label="Assign Tutor">
                                <UserPlus className="h-4 w-4" />
                            </Button>
                        </Link>

                        <Link href={`${students().url}/${student.encrypted_id}/edit`}>
                            <Button variant="ghost" size="sm" aria-label="Edit Student">
                                <Edit className="h-4 w-4" />
                            </Button>
                        </Link>

                        <button
                            type="button"
                            onClick={() => setConfirmOpen(true)}
                            className="inline-flex items-center justify-center rounded-md p-1 hover:bg-muted"
                            aria-label="Delete Student"
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                    </div>
                </div>

                <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete student</DialogTitle>
                            <DialogDescription>Are you sure you want to delete this student? This action cannot be undone.</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <button type="button" className="btn" onClick={() => setConfirmOpen(false)}>Cancel</button>
                            <button
                                type="button"
                                className="btn btn-destructive ml-2"
                                onClick={() => {
                                    router.delete(`${students().url}/${student.encrypted_id}`);
                                    setConfirmOpen(false);
                                }}
                            >
                                Delete
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                
                        
               
                <div className="rounded-md border bg-background p-4">
                    <h2 className="mb-3 flex items-center gap-2 text-lg font-medium">
                        <Info className="h-5 w-5 text-muted-foreground" />
                        Student Information
                    </h2>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <InfoField icon={IdCard} label="Tutee ID" value={student.tuteeid ?? '—'} />
                        <br/>
                        <InfoField
                            icon={User}
                            label="Full Name"
                            value={
                                `${student.firstname ?? ''} ${student.middlename ?? ''} ${student.lastname ?? ''}`.trim() || '—'
                            }
                        />

                        <InfoField
                            icon={Cake}
                            label="Date of Birth"
                            value={
                                student.date_of_birth
                                    ? (() => {
                                          const d = new Date(student.date_of_birth);
                                          if (isNaN(d.getTime())) return '—';
                                          const mm = String(d.getMonth() + 1).padStart(2, '0');
                                          const dd = String(d.getDate()).padStart(2, '0');
                                          const yyyy = d.getFullYear();
                                          return `${mm}/${dd}/${yyyy}`;
                                      })()
                                    : '—'
                            }
                        />

                        {/* <InfoField icon={GraduationCap} label="Grade Level" value={student.grade_level ?? '—'} /> */}
                        <InfoField icon={School} label="School" value={student.school ?? '—'} />
                        <br/>
                        <InfoField icon={Users} label="Parent / Guardian" value={student.parent_name ?? '—'} />
                        <InfoField icon={Phone} label="Parent's Contact" value={student.parent_contact ?? '—'} />

                        <InfoField
                            icon={CalendarPlus}
                            label="Registered At"
                            value={
                                student.created_at
                                    ? (() => {
                                          const d = new Date(student.created_at);
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

                 <div className="mt-6 rounded-md border bg-background p-4">
                    <h2 className="text-lg font-medium mb-3">Enrolled Tutorials</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full table-fixed">
                            <thead>
                                <tr className="text-left text-sm text-muted-foreground">
                                    <th className="w-[140px] px-3 py-2">Tutorial ID</th>
                                    <th className="w-[160px] px-3 py-2">Date Enrolled</th>
                                    <th className="w-[220px] px-3 py-2">Tutor</th>
                                    <th className="w-[280px] px-3 py-2">Schedule</th>
                                    <th className="w-[200px] px-3 py-2">Time</th>
                                    <th className="w-[120px] px-3 py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {((props as any).tutorials ?? []).length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-4 text-center text-sm text-muted-foreground">No enrolled sessions.</td>
                                    </tr>
                                )}

                                {((props as any).tutorials ?? []).map((t: any) => (
                                    <tr key={t.id} className="border-t">
                                        <td className="px-3 py-2">
                                            <Link href={`/tutorials/${t.encrypted_id ?? t.id}`} className="text-primary">{t.tutorialid ?? t.id}</Link>
                                        </td>
                                        <td className="px-3 py-2">{t.created_at ? (() => {
                                            const d = new Date(t.created_at);
                                            if (isNaN(d.getTime())) return '—';
                                            const mm = String(d.getMonth() + 1).padStart(2, '0');
                                            const dd = String(d.getDate()).padStart(2, '0');
                                            const yyyy = d.getFullYear();
                                            return `${mm}/${dd}/${yyyy}`;
                                        })() : '—'}</td>
                                        <td className="px-3 py-2 break-words">{t.tutor_name ?? '-'}</td>
                                        <td className="px-3 py-2 break-words">
                                            {(() => {
                                                const sched = t.tutorial_schedule ?? [];
                                                const schedules = Array.isArray(sched) ? sched : (() => {
                                                    try { return JSON.parse(sched); } catch (e) { return []; }
                                                })();
                                                if (!schedules.length) return '-';
                                                return schedules.map((s: any) => (Array.isArray(s.days) ? s.days.join(', ') : (s.days ?? ''))).join('; ');
                                            })()}
                                        </td>
                                        <td className="px-3 py-2 break-words">
                                            {(() => {
                                                const sched = t.tutorial_schedule ?? [];
                                                const schedules = Array.isArray(sched) ? sched : (() => {
                                                    try { return JSON.parse(sched); } catch (e) { return []; }
                                                })();
                                                if (!schedules.length) return '-';
                                                return schedules.map((s: any) => {
                                                    const start = s.start_time ?? '';
                                                    const end = s.end_time ?? '';
                                                    const fs = start ? formatTime12(start) : '';
                                                    const fe = end ? formatTime12(end) : '';
                                                    return fs ? (fe ? `${fs} — ${fe}` : fs) : (fe || '-');
                                                }).join('; ');
                                            })()}
                                        </td>
                                        <td className="px-3 py-2">{t.status ?? '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
