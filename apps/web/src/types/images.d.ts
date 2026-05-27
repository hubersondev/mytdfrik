/**
 * Déclarations de modules pour les imports d'images statiques.
 *
 * Indépendant de `next/image-types/global` (référencé par next-env.d.ts) pour
 * garantir que le typecheck CI passe même quand `.next/dev/types/` n'existe
 * pas (cas typique : `pnpm typecheck` sans build préalable).
 */
declare module '*.png' {
  import type { StaticImageData } from 'next/image';
  const content: StaticImageData;
  export default content;
}

declare module '*.jpg' {
  import type { StaticImageData } from 'next/image';
  const content: StaticImageData;
  export default content;
}

declare module '*.jpeg' {
  import type { StaticImageData } from 'next/image';
  const content: StaticImageData;
  export default content;
}

declare module '*.svg' {
  import type { StaticImageData } from 'next/image';
  const content: StaticImageData;
  export default content;
}

declare module '*.webp' {
  import type { StaticImageData } from 'next/image';
  const content: StaticImageData;
  export default content;
}

declare module '*.avif' {
  import type { StaticImageData } from 'next/image';
  const content: StaticImageData;
  export default content;
}
