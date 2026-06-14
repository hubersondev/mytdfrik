import { Repository } from 'typeorm';
import { Category } from '../database/entities/category.entity';
import { Product } from '../database/entities/product.entity';
import { Request } from '../database/entities/request.entity';
import { User } from '../database/entities/user.entity';
import {
  buildLikeTerm,
  SearchService,
  type SearchViewer,
} from './search.service';

/** QueryBuilder chaînable factice : toutes les méthodes renvoient le builder. */
function qbMock(rows: unknown[]) {
  const qb: Record<string, jest.Mock> = {};
  for (const m of [
    'where',
    'andWhere',
    'orWhere',
    'orderBy',
    'addOrderBy',
    'take',
  ]) {
    qb[m] = jest.fn(() => qb);
  }
  qb.getMany = jest.fn(() => Promise.resolve(rows));
  return qb;
}

function repoMock(rows: unknown[]) {
  const qb = qbMock(rows);
  const createQueryBuilder = jest.fn(() => qb);
  return {
    repo: { createQueryBuilder } as unknown as Repository<
      Record<string, unknown>
    >,
    createQueryBuilder,
    qb,
  };
}

const REQUESTS = [
  {
    id: 'r1',
    publicReference: 'MTF-20260101-0001',
    title: 'Bug login',
    status: 'NOUVELLE',
  },
];
const USERS = [
  {
    id: 'u1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@x.io',
    roleId: 'ADMIN',
  },
];
const PRODUCTS = [{ id: 'p1', code: 'PORTAIL', label: 'Portail' }];
const CATEGORIES = [{ id: 'c1', code: 'TECH', label: 'Technique' }];

function build() {
  const requests = repoMock(REQUESTS);
  const users = repoMock(USERS);
  const products = repoMock(PRODUCTS);
  const categories = repoMock(CATEGORIES);
  const service = new SearchService(
    requests.repo as unknown as Repository<Request>,
    users.repo as unknown as Repository<User>,
    products.repo as unknown as Repository<Product>,
    categories.repo as unknown as Repository<Category>,
  );
  return { service, requests, users, products, categories };
}

const internalAdmin: SearchViewer = {
  id: 'admin',
  scope: 'INTERNAL',
  organizationId: null,
  permissions: ['users.read', 'catalog.manage'],
};

describe('SearchService', () => {
  it('ignore une requête trop courte sans toucher aux dépôts', async () => {
    const { service, requests, users, products, categories } = build();
    const res = await service.search(internalAdmin, 'a');
    expect(res).toEqual({
      query: 'a',
      requests: [],
      users: [],
      products: [],
      categories: [],
    });
    expect(requests.createQueryBuilder).not.toHaveBeenCalled();
    expect(users.createQueryBuilder).not.toHaveBeenCalled();
    expect(products.createQueryBuilder).not.toHaveBeenCalled();
    expect(categories.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('rôle interne avec users.read : recherche dans les quatre domaines', async () => {
    const { service, requests, users, products, categories } = build();
    const res = await service.search(internalAdmin, 'bug');
    expect(res.requests).toHaveLength(1);
    expect(res.users).toHaveLength(1);
    expect(res.products).toHaveLength(1);
    expect(res.categories).toHaveLength(1);
    expect(requests.createQueryBuilder).toHaveBeenCalled();
    expect(users.createQueryBuilder).toHaveBeenCalled();
    expect(products.createQueryBuilder).toHaveBeenCalled();
    expect(categories.createQueryBuilder).toHaveBeenCalled();
  });

  it('rôle interne sans users.read : exclut les utilisateurs', async () => {
    const { service, users } = build();
    const viewer: SearchViewer = { ...internalAdmin, permissions: [] };
    const res = await service.search(viewer, 'bug');
    expect(res.users).toEqual([]);
    expect(users.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('Client : seulement ses demandes, ni utilisateurs ni catalogue', async () => {
    const { service, requests, users, products, categories } = build();
    const viewer: SearchViewer = {
      id: 'client',
      scope: 'CLIENT',
      organizationId: 'org-1',
      permissions: [],
    };
    const res = await service.search(viewer, 'bug');
    expect(res.requests).toHaveLength(1);
    expect(res.users).toEqual([]);
    expect(res.products).toEqual([]);
    expect(res.categories).toEqual([]);
    // Le filtre d'organisation est appliqué sur la requête des demandes.
    expect(requests.qb.andWhere).toHaveBeenCalledWith(
      'r.organization_id = :orgId',
      {
        orgId: 'org-1',
      },
    );
    expect(users.createQueryBuilder).not.toHaveBeenCalled();
    expect(products.createQueryBuilder).not.toHaveBeenCalled();
    expect(categories.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('Client sans organisation : aucune demande remontée', async () => {
    const { service } = build();
    const viewer: SearchViewer = {
      id: 'client',
      scope: 'CLIENT',
      organizationId: null,
      permissions: [],
    };
    const res = await service.search(viewer, 'bug');
    expect(res.requests).toEqual([]);
  });

  it('neutralise les jokers ILIKE (%, _ et \\) dans le terme', () => {
    expect(buildLikeTerm('50%')).toBe('%50\\%%');
    expect(buildLikeTerm('a_b')).toBe('%a\\_b%');
    expect(buildLikeTerm('c\\d')).toBe('%c\\\\d%');
    expect(buildLikeTerm('bug')).toBe('%bug%');
  });
});
