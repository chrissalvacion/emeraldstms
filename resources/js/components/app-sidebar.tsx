import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard, students, tutors, tutorials, billings } from '@/routes';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { CalendarDays, Handshake, User, LayoutGrid, Rocket, FileChartColumnIncreasing, ClockArrowUp, WalletMinimal, ReceiptRussianRuble, TagIcon, Package, Home } from 'lucide-react';
import AppLogo from './app-logo';
import rates from '@/routes/rates';

const mainNavItems: NavItem[] = [
    {
        title: 'Overview',
        href: dashboard(),
        icon: Home,
    },
    {
        title: 'Tutees',
        href: students(),
        icon: User,
    },
    {
        title: 'Tutors',
        href: tutors(),
        icon: Handshake,
    },
    {
        title: 'Tutorial Sessions',
        href: tutorials(),
        icon: Rocket,
    },
    {
        title: 'Attendance',
        href: '/attendance',
        icon: ClockArrowUp,
    },
    {
        title: 'Calendar',
        href: '/calendar',
        icon: CalendarDays,
    },
    {
        title: 'Billings & Payments',
        href: billings(),
        icon: WalletMinimal,
    },
    {
        title:'Payroll',
        href: '/payroll',
        icon: ReceiptRussianRuble,
    },
  
    {
        title: 'Reports',
        href: '/reports',
        icon: FileChartColumnIncreasing,
    }
];

const footerNavItems: NavItem[] = [
    // {
    //     title: 'Pricing and Rates',
    //     href: rates.edit(),
    //     icon: TagIcon,
    // },
    {
        title: 'Packages',
        href: '/packages',
        icon: Package,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
