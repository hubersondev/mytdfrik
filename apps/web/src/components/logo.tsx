import Image from 'next/image';
import logoSrc from '../../public/logo-techdifrik.png';
import { cn } from '@/lib/utils';

interface LogoProps {
  /** Hauteur en pixels — la largeur est calculée selon le ratio natif (~3.4). */
  size?: number;
  className?: string;
  priority?: boolean;
}

/**
 * Logo officiel TECHDIFRIK (orange + vert + or, fond transparent).
 * Lisible sur fond clair et sombre sans variation de teinte.
 *
 * Utilise next/image avec import statique pour bénéficier du width/height
 * auto-renseignés et d'un placeholder blur en option.
 */
export function Logo({ size = 32, className, priority = false }: LogoProps) {
  const aspect = logoSrc.width / logoSrc.height;
  const width = Math.round(size * aspect);
  return (
    <Image
      src={logoSrc}
      alt="TECHDIFRIK"
      width={width}
      height={size}
      priority={priority}
      className={cn('h-auto select-none', className)}
    />
  );
}
