import {
  Bell,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  PlusCircle,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavSectionDef {
  title: string;
  items: NavItem[];
}

/** Navigation du portail Client — partagée entre la sidebar desktop et le menu mobile. */
export const CLIENT_NAV: NavSectionDef[] = [
  {
    title: 'Mon espace',
    items: [
      { label: 'Tableau de bord', href: '/client', icon: LayoutDashboard },
      { label: 'Nouvelle demande', href: '/client/requests/new', icon: PlusCircle },
      { label: 'Mes demandes', href: '/client/requests', icon: FileText },
    ],
  },
  {
    title: 'Suivi',
    items: [
      { label: 'Notifications', href: '/client/notifications', icon: Bell },
      { label: "Centre d'aide", href: '/client/help', icon: LifeBuoy },
    ],
  },
];
