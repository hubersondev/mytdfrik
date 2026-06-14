import {
  Boxes,
  Building,
  Building2,
  Bug,
  Globe,
  LayoutDashboard,
  Shield,
  Sparkles,
  Tags,
  TicketCheck,
  Users,
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

/** Navigation du portail Admin — partagée entre la sidebar desktop et le menu mobile. */
export const ADMIN_NAV: NavSectionDef[] = [
  {
    title: 'Administration',
    items: [
      { label: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
      { label: 'Utilisateurs', href: '/admin/users', icon: Users },
      { label: 'Organisations', href: '/admin/organizations', icon: Building2 },
      { label: 'Demandes', href: '/admin/requests', icon: TicketCheck },
      { label: 'Bugs', href: '/admin/bugs', icon: Bug },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { label: 'Catégories', href: '/admin/categories', icon: Tags },
      { label: 'Produits', href: '/admin/products', icon: Boxes },
      { label: 'Priorités', href: '/admin/priorities', icon: Sparkles },
      { label: 'Pays', href: '/admin/countries', icon: Globe },
      { label: 'Villes', href: '/admin/cities', icon: Building },
    ],
  },
  {
    title: 'Système',
    items: [{ label: 'Rôles & permissions', href: '/admin/roles', icon: Shield }],
  },
];
