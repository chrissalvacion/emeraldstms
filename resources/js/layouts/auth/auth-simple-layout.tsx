import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
    backgroundClassName?: string;
    backgroundImageUrl?: string;
    cardClassName?: string;
}

export default function AuthSimpleLayout({
    children,
    title,
    description,
    backgroundClassName,
    backgroundImageUrl,
    cardClassName,
}: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div
            className={`group relative flex min-h-svh flex-col items-center justify-center gap-6 overflow-hidden p-6 md:p-10 ${backgroundClassName ?? 'bg-background'}`}
        >
            {backgroundImageUrl && (
                <>
                    <div
                        className="absolute inset-0 scale-105 bg-cover bg-center bg-no-repeat blur-sm transition-all duration-700 ease-out group-hover:scale-100 group-hover:blur-0"
                        style={{ backgroundImage: `url(${backgroundImageUrl})` }}
                    />
                    <div className="absolute inset-0 bg-black/25" />
                </>
            )}

            <div className="relative z-10 w-full max-w-sm">
                <div className={`flex flex-col gap-8 ${cardClassName ?? ''}`}>
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-md">
                                <AppLogoIcon className="size-9 fill-current text-[var(--foreground)] dark:text-white" />
                            </div>
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">{title}</h1>
                            <p className="text-center text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
