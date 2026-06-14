import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import type { RoleScope } from '../database/entities/role.entity';
import { Category } from '../database/entities/category.entity';
import { Product } from '../database/entities/product.entity';
import { Request } from '../database/entities/request.entity';
import { User } from '../database/entities/user.entity';

/** Profil minimal de l'appelant pour appliquer le cloisonnement RBAC. */
export interface SearchViewer {
  id: string;
  scope: RoleScope;
  organizationId: string | null;
  permissions: string[];
}

export interface RequestHit {
  id: string;
  publicReference: string;
  title: string;
  status: string;
}

export interface UserHit {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
}

export interface CatalogHit {
  id: string;
  code: string;
  label: string;
}

export interface GlobalSearchResults {
  query: string;
  requests: RequestHit[];
  users: UserHit[];
  products: CatalogHit[];
  categories: CatalogHit[];
}

/** Nombre maximal de résultats remontés par catégorie (aperçu rapide). */
const GROUP_LIMIT = 6;
/** En-deçà de ce nombre de caractères, la recherche est ignorée (bruit). */
const MIN_QUERY_LENGTH = 2;

/**
 * Construit le motif ILIKE encadré de `%`, en neutralisant les jokers de la
 * saisie : `%` et `_` sont des jokers, `\` est l'échappement par défaut côté
 * PostgreSQL. La saisie est ainsi traitée littéralement.
 */
export function buildLikeTerm(query: string): string {
  return `%${query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Request)
    private readonly requests: Repository<Request>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

  /**
   * Recherche transverse (demandes, utilisateurs, catalogue) avec cloisonnement :
   * - demandes : un Client ne voit que celles de son organisation ;
   * - utilisateurs : réservés aux porteurs de `users.read` (rôles internes) ;
   * - produits/catégories : réservés aux rôles internes (portail Admin).
   */
  async search(
    viewer: SearchViewer,
    rawQuery: string | undefined,
  ): Promise<GlobalSearchResults> {
    const query = (rawQuery ?? '').trim();
    const empty: GlobalSearchResults = {
      query,
      requests: [],
      users: [],
      products: [],
      categories: [],
    };
    if (query.length < MIN_QUERY_LENGTH) {
      return empty;
    }

    const term = buildLikeTerm(query);
    const isInternal = viewer.scope === 'INTERNAL';
    const canReadUsers = viewer.permissions.includes('users.read');

    const [requests, usersList, products, categories] = await Promise.all([
      this.searchRequests(viewer, term),
      canReadUsers ? this.searchUsers(term) : Promise.resolve([]),
      isInternal ? this.searchProducts(term) : Promise.resolve([]),
      isInternal ? this.searchCategories(term) : Promise.resolve([]),
    ]);

    return { query, requests, users: usersList, products, categories };
  }

  private async searchRequests(
    viewer: SearchViewer,
    term: string,
  ): Promise<RequestHit[]> {
    const qb = this.requests
      .createQueryBuilder('r')
      .where('r.deleted_at IS NULL')
      .andWhere(
        new Brackets((w) => {
          w.where('r.title ILIKE :term', { term })
            .orWhere('r.description ILIKE :term', { term })
            .orWhere('r.public_reference ILIKE :term', { term });
        }),
      );

    if (viewer.scope === 'CLIENT') {
      if (!viewer.organizationId) {
        return [];
      }
      qb.andWhere('r.organization_id = :orgId', {
        orgId: viewer.organizationId,
      });
    }

    const rows = await qb
      .orderBy('r.updated_at', 'DESC')
      .take(GROUP_LIMIT)
      .getMany();

    return rows.map((r) => ({
      id: r.id,
      publicReference: r.publicReference,
      title: r.title,
      status: r.status,
    }));
  }

  private async searchUsers(term: string): Promise<UserHit[]> {
    const rows = await this.users
      .createQueryBuilder('u')
      .where('u.deleted_at IS NULL')
      .andWhere(
        new Brackets((w) => {
          w.where('u.email ILIKE :term', { term })
            .orWhere('u.first_name ILIKE :term', { term })
            .orWhere('u.last_name ILIKE :term', { term })
            .orWhere("(u.first_name || ' ' || u.last_name) ILIKE :term", {
              term,
            });
        }),
      )
      .orderBy('u.last_name', 'ASC')
      .addOrderBy('u.first_name', 'ASC')
      .take(GROUP_LIMIT)
      .getMany();

    return rows.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      roleId: u.roleId,
    }));
  }

  private async searchProducts(term: string): Promise<CatalogHit[]> {
    const rows = await this.products
      .createQueryBuilder('p')
      .where('p.deleted_at IS NULL')
      .andWhere(
        new Brackets((w) => {
          w.where('p.code ILIKE :term', { term })
            .orWhere('p.label ILIKE :term', { term })
            .orWhere('p.description ILIKE :term', { term });
        }),
      )
      .orderBy('p.label', 'ASC')
      .take(GROUP_LIMIT)
      .getMany();

    return rows.map((p) => ({ id: p.id, code: p.code, label: p.label }));
  }

  private async searchCategories(term: string): Promise<CatalogHit[]> {
    const rows = await this.categories
      .createQueryBuilder('c')
      .where('c.deleted_at IS NULL')
      .andWhere(
        new Brackets((w) => {
          w.where('c.code ILIKE :term', { term })
            .orWhere('c.label ILIKE :term', { term })
            .orWhere('c.description ILIKE :term', { term });
        }),
      )
      .orderBy('c.label', 'ASC')
      .take(GROUP_LIMIT)
      .getMany();

    return rows.map((c) => ({ id: c.id, code: c.code, label: c.label }));
  }
}
