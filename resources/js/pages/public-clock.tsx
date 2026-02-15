import { Head, router, usePage } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Clock, LogIn, LogOut } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

function formatNowTime12hWithSeconds(now: Date, timeZone?: string | null) {
    try {
        const dtf = new Intl.DateTimeFormat('en-US', {
            timeZone: timeZone ?? undefined,
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
        return dtf.format(now);
    } catch {
        const minutes = now.getHours() * 60 + now.getMinutes();
        const hh24 = Math.floor(minutes / 60) % 24;
        const mm = minutes % 60;
        const ss = String(now.getSeconds()).padStart(2, '0');
        const suffix = hh24 >= 12 ? 'PM' : 'AM';
        const hh12 = hh24 % 12 || 12;
        return `${hh12}:${String(mm).padStart(2, '0')}:${ss} ${suffix}`;
    }
}

export default function PublicClock() {
    const { props } = usePage();
    const appTimezone: string | null = ((props as any).app_timezone as string | undefined) ?? null;

    const [now, setNow] = useState(() => new Date());
    const [tutorId, setTutorId] = useState('');

    const [resultOpen, setResultOpen] = useState(false);
    const [resultTitle, setResultTitle] = useState('');
    const [resultDescription, setResultDescription] = useState('');

    useEffect(() => {
        const id = window.setInterval(() => setNow(new Date()), 1000);
        return () => window.clearInterval(id);
    }, []);

    useEffect(() => {
        if (resultOpen) {
            const timeout = window.setTimeout(() => {
                setResultOpen(false);
            }, 3000);
            return () => window.clearTimeout(timeout);
        }
    }, [resultOpen]);

    const currentTime = useMemo(
        () => formatNowTime12hWithSeconds(now, appTimezone),
        [now, appTimezone]
    );

    const currentDate = useMemo(() => {
        try {
            const dtf = new Intl.DateTimeFormat('en-US', {
                timeZone: appTimezone ?? undefined,
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            return dtf.format(now);
        } catch {
            return now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        }
    }, [now, appTimezone]);

    const handleTimeIn = () => {
        const payload = tutorId.trim();
        if (!payload) return;

        router.post('/attendance/time-in', { tutorid: payload }, {
            preserveScroll: true,
            onSuccess: (page) => {
                const success = (page.props as any).success;
                setResultTitle('Success');
                setResultDescription(success || 'Time-in recorded successfully');
                setResultOpen(true);
                setTutorId('');
            },
            onError: (errors) => {
                const message = errors.tutorid || 'An error occurred while clocking in.';
                setResultTitle('Error');
                setResultDescription(message);
                setResultOpen(true);
            },
        });
    };

    const handleTimeOut = () => {
        const payload = tutorId.trim();
        if (!payload) return;

        router.post('/attendance/time-out', { tutorid: payload }, {
            preserveScroll: true,
            onSuccess: (page) => {
                const success = (page.props as any).success;
                setResultTitle('Success');
                setResultDescription(success || 'Time-out recorded successfully');
                setResultOpen(true);
                setTutorId('');
            },
            onError: (errors) => {
                const message = errors.tutorid || 'An error occurred while clocking out.';
                setResultTitle('Error');
                setResultDescription(message);
                setResultOpen(true);
            },
        });
    };

    return (
        <>
            <Head title="Tutor Clock In/Out" />

            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4">
                <Card className="w-full max-w-md shadow-xl">
                    <CardHeader className="text-center space-y-2 pb-4">
                        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                            <Clock className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-3xl font-bold">Tutor Time Clock</CardTitle>
                        <CardDescription className="text-base">
                            Enter your tutor ID to clock in or out
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Current Time Display */}
                        <div className="text-center py-4 bg-muted rounded-lg">
                            <div className="text-4xl font-bold text-primary mb-1">
                                {currentTime}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {currentDate}
                            </div>
                        </div>

                        {/* Tutor ID Input */}
                        <div className="space-y-2">
                            <Input
                                id="tutorid"
                                type="text"
                                placeholder="Enter your tutor ID"
                                value={tutorId}
                                onChange={(e) => setTutorId(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleTimeIn();
                                    }
                                }}
                                className="text-center text-2xl h-12"
                                autoFocus
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                onClick={handleTimeIn}
                                disabled={!tutorId.trim()}
                                className="h-14 text-base"
                                size="lg"
                            >
                                <LogIn className="mr-2 h-5 w-5" />
                                Clock In
                            </Button>
                            <Button
                                onClick={handleTimeOut}
                                disabled={!tutorId.trim()}
                                variant="outline"
                                className="h-14 text-base"
                                size="lg"
                            >
                                <LogOut className="mr-2 h-5 w-5" />
                                Clock Out
                            </Button>
                        </div>

                        <div className="text-xs text-center text-muted-foreground pt-2">
                            Make sure you have an active tutorial session scheduled
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Result Dialog */}
            <Dialog open={resultOpen} onOpenChange={setResultOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{resultTitle}</DialogTitle>
                        <DialogDescription>{resultDescription}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => setResultOpen(false)}>OK</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
