/**
 * Domaine « Messagerie » côté front (CDC §3.7). Le rendu reste en texte brut
 * (le Markdown enrichi sera rendu plus richement ultérieurement) ; aucun HTML
 * arbitraire n'est interprété.
 */
export interface MessageView {
  id: string;
  body: string;
  isInternal: boolean;
  isWithdrawn: boolean;
  withdrawalReason: string | null;
  createdAt: string;
  author: { id: string; firstName: string; lastName: string; roleId: string } | null;
}
