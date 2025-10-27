import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, HeartPulse, BrainCircuit, Activity, Calendar, BarChart, Settings, Info } from 'lucide-react';

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const navLinks: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/quick-risk', label: 'Quick Risk', icon: HeartPulse },
  { href: '/fused-risk', label: 'Fused Risk', icon: BrainCircuit },
  { href: '/forecast', label: 'Forecast', icon: Activity },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/progress', label: 'Progress', icon: BarChart },
  { href: '/status', label: 'Status', icon: Info },
];

export const settingsLink: NavLink = { href: '/settings', label: 'Settings', icon: Settings };
