/**
 * Helpers de pagination par curseur (CDC §9.2.3 [EXG-09-020]).
 *
 * Le curseur est un payload base64url JSON {id, createdAt}. Il représente
 * la position *après* le dernier élément déjà rendu.
 */

export interface CursorPayload {
  id: string;
  createdAt: string;
}

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function decodeCursor(raw: string | undefined): CursorPayload | null {
  if (!raw) return null;
  try {
    const json = Buffer.from(raw, 'base64url').toString('utf-8');
    const parsed = JSON.parse(json) as Partial<CursorPayload>;
    if (typeof parsed.id !== 'string' || typeof parsed.createdAt !== 'string') {
      return null;
    }
    return { id: parsed.id, createdAt: parsed.createdAt };
  } catch {
    return null;
  }
}
