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
  /**
   * Permission requise pour afficher l'entrée. Absente = visible par tout
   * utilisateur interne (ex. Tableau de bord, Demandes, Bugs).
   */
  permission?: string;
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
      { label: 'Utilisateurs', href: '/admin/users', icon: Users, permission: 'users.read' },
      {
        label: 'Organisations',
        href: '/admin/organizations',
        icon: Building2,
        permission: 'organizations.read',
      },
      { label: 'Demandes', href: '/admin/requests', icon: TicketCheck },
      { label: 'Bugs', href: '/admin/bugs', icon: Bug },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { label: 'Catégories', href: '/admin/categories', icon: Tags, permission: 'catalog.manage' },
      { label: 'Produits', href: '/admin/products', icon: Boxes, permission: 'catalog.manage' },
      {
        label: 'Priorités',
        href: '/admin/priorities',
        icon: Sparkles,
        permission: 'catalog.manage',
      },
      { label: 'Pays', href: '/admin/countries', icon: Globe, permission: 'geo.manage' },
      { label: 'Villes', href: '/admin/cities', icon: Building, permission: 'geo.manage' },
    ],
  },
  {
    title: 'Système',
    items: [
      {
        label: 'Rôles & permissions',
        href: '/admin/roles',
        icon: Shield,
        permission: 'roles.read',
      },
    ],
  },
];

/**
 * Filtre la navigation selon les permissions de l'utilisateur : une entrée sans
 * `permission` est toujours visible ; sinon elle l'est si la permission est
 * présente. Les sections devenues vides sont retirées.
 */
export function filterNavByPermissions(
  sections: NavSectionDef[],
  permissions: string[],
): NavSectionDef[] {
  const set = new Set(permissions);
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.permission || set.has(item.permission)),
    }))
    .filter((section) => section.items.length > 0);
}
