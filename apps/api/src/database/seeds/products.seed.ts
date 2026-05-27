import { DataSource } from 'typeorm';
import { Product } from '../entities';

/**
 * Catalogue produits indicatif (CDC annexe A3 §A3.4).
 * À enrichir par l'Administrateur via l'API avant ouverture aux clients.
 */
const PRODUCTS: Array<{
  code: string;
  label: string;
  description: string;
  defaultOwnerTeam: string;
  requiresOs: boolean;
  requiresBrowser: boolean;
}> = [
  {
    code: 'TDFK_ONLINE',
    label: 'Portail TDFK Online',
    description: 'Portail web TECHDIFRIK accessible aux clients en SaaS.',
    defaultOwnerTeam: 'Équipe Web',
    requiresOs: false,
    requiresBrowser: true,
  },
  {
    code: 'TDFK_DESKTOP',
    label: 'Application bureau TDFK',
    description: 'Application desktop installée sur les postes clients.',
    defaultOwnerTeam: 'Équipe Desktop',
    requiresOs: true,
    requiresBrowser: false,
  },
  {
    code: 'TDFK_API',
    label: 'API B2B TDFK',
    description: 'Interface programmatique exposée aux partenaires.',
    defaultOwnerTeam: 'Équipe API',
    requiresOs: false,
    requiresBrowser: false,
  },
];

export async function seedProducts(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(Product);
  for (const product of PRODUCTS) {
    const existing = await repo.findOne({ where: { code: product.code } });
    if (!existing) {
      await repo.insert(product);
    }
  }
}
