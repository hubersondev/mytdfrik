import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { User } from '../entities';

/**
 * Seed du compte admin de bootstrap — utilisé pour le tout premier accès à la plateforme.
 *
 * Si les variables d'env ADMIN_BOOTSTRAP_EMAIL et ADMIN_BOOTSTRAP_PASSWORD ne sont pas
 * fournies, ce seed est ignoré (production stricte). En dev, des valeurs par défaut
 * permettent de bootstrapper rapidement.
 *
 * Le compte créé est en rôle ADMIN, isActive=true. Il devra changer son mot de passe
 * dès la première connexion (à imposer dans une story ultérieure).
 */
export async function seedAdminBootstrap(
  dataSource: DataSource,
): Promise<void> {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;

  if (!email || !password) {
    console.log(
      '[seed] ADMIN_BOOTSTRAP_EMAIL / ADMIN_BOOTSTRAP_PASSWORD non définis — admin non créé.',
    );
    return;
  }

  const userRepo = dataSource.getRepository(User);

  const existing = await userRepo
    .createQueryBuilder('u')
    .where('LOWER(u.email) = LOWER(:email)', { email })
    .getOne();

  if (existing) {
    console.log(
      `[seed] Admin bootstrap déjà présent (${email}) — aucune action.`,
    );
    return;
  }

  const cost = Number(process.env.BCRYPT_COST ?? 12);
  const passwordHash = await bcrypt.hash(password, cost);

  await userRepo.insert({
    email,
    passwordHash,
    firstName: process.env.ADMIN_BOOTSTRAP_FIRST_NAME ?? 'Admin',
    lastName: process.env.ADMIN_BOOTSTRAP_LAST_NAME ?? 'Bootstrap',
    roleId: 'ADMIN',
    organizationId: null,
    isActive: true,
    emailStatus: 'VALID',
  });

  console.log(`[seed] Admin bootstrap créé : ${email}`);
}
