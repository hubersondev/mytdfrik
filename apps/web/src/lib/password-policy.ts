/**
 * Politique de mot de passe (CDC §10.2.1), miroir de la validation serveur :
 * 12–128 caractères, au moins 3 des 4 classes (minuscules, majuscules,
 * chiffres, caractères spéciaux). Retourne un message d'erreur ou `null`.
 */
export function validatePassword(password: string): string | null {
  if (password.length < 12) {
    return 'Le mot de passe doit faire au moins 12 caractères.';
  }
  if (password.length > 128) {
    return 'Le mot de passe est limité à 128 caractères.';
  }
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/].filter((re) => re.test(password)).length;
  if (classes < 3) {
    return 'Le mot de passe doit contenir au moins 3 des 4 classes : minuscules, majuscules, chiffres, caractères spéciaux.';
  }
  return null;
}
