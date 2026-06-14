'use client';

import { CornerDownLeft, FileText, FolderTree, Loader2, Package, Search, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import {
  flattenResults,
  GROUP_LABELS,
  type GlobalSearchResults,
  type SearchEntity,
  type SearchItem,
} from '@/lib/search';

const ENTITY_ICON: Record<SearchEntity, typeof Search> = {
  request: FileText,
  user: User,
  product: Package,
  category: FolderTree,
};

const EMPTY: GlobalSearchResults = {
  query: '',
  requests: [],
  users: [],
  products: [],
  categories: [],
};

/**
 * Recherche globale (palette ⌘K) : déclencheur dans la topbar + modale.
 * Interroge `/api/search` (proxy authentifié) avec debounce, regroupe les
 * résultats par type et permet la navigation clavier (↑ ↓ Entrée Échap).
 */
export function GlobalSearch() {
  const router = useRouter();
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);

  const items = useMemo(() => flattenResults(results), [results]);

  const openPalette = useCallback(() => {
    setQuery('');
    setResults(EMPTY);
    setActive(0);
    setOpen(true);
  }, []);

  // Ouverture/fermeture globale au clavier (⌘K / Ctrl+K).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const metaK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (metaK) {
        event.preventDefault();
        setOpen((prev) => {
          if (!prev) {
            setQuery('');
            setResults(EMPTY);
            setActive(0);
          }
          return !prev;
        });
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Recherche debouncée + annulation des requêtes obsolètes. Tout effet de bord
  // (setState) est confiné au callback différé pour éviter les rendus en cascade.
  useEffect(() => {
    const term = query.trim();
    const controller = new AbortController();
    const id = window.setTimeout(async () => {
      if (term.length < 2) {
        setResults(EMPTY);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          setResults(EMPTY);
          return;
        }
        const data = (await res.json()) as GlobalSearchResults;
        setResults(data);
        setActive(0);
      } catch {
        // Requête annulée ou réseau indisponible : on ignore silencieusement.
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      controller.abort();
      window.clearTimeout(id);
    };
  }, [query]);

  const go = useCallback(
    (item: SearchItem | undefined) => {
      if (!item) return;
      setOpen(false);
      router.push(item.href);
    },
    [router],
  );

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => (items.length ? (i + 1) % items.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      go(items[active]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    }
  }

  const term = query.trim();

  return (
    <>
      {/* Déclencheur — calque le rendu de l'ancien champ de recherche. */}
      <button
        type="button"
        onClick={openPalette}
        aria-label="Ouvrir la recherche globale"
        className="relative mx-auto hidden h-9 w-full max-w-md items-center gap-2 rounded-md border border-zinc-200 bg-white pl-9 pr-2 text-left text-sm text-zinc-400 transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 md:flex"
      >
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
        <span className="flex-1 truncate">Rechercher un ticket, un utilisateur…</span>
        <kbd className="pointer-events-none hidden select-none rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 sm:inline-block">
          ⌘K
        </kbd>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-900/40 px-4 pt-[12vh] backdrop-blur-sm"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Recherche globale"
            className="w-full max-w-xl overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-soft-lg dark:border-zinc-800 dark:bg-zinc-950"
          >
            {/* Champ de saisie */}
            <div className="flex items-center gap-3 border-b border-zinc-200 px-4 dark:border-zinc-800">
              {loading ? (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-leaf-600 dark:text-leaf-400" />
              ) : (
                <Search className="h-5 w-5 shrink-0 text-zinc-400 dark:text-zinc-500" />
              )}
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Rechercher une demande, un utilisateur, un produit…"
                role="combobox"
                aria-expanded="true"
                aria-controls={listboxId}
                aria-autocomplete="list"
                className="h-14 w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none dark:text-zinc-50 dark:placeholder:text-zinc-500"
              />
              <kbd className="pointer-events-none hidden select-none rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 sm:inline-block">
                Échap
              </kbd>
            </div>

            {/* Résultats */}
            <ul
              id={listboxId}
              role="listbox"
              aria-label="Résultats de recherche"
              className="max-h-[55vh] overflow-y-auto p-2"
            >
              {term.length < 2 ? (
                <li className="px-3 py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
                  Saisissez au moins 2 caractères pour lancer la recherche.
                </li>
              ) : items.length === 0 && !loading ? (
                <li className="px-3 py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
                  Aucun résultat pour «&nbsp;{term}&nbsp;».
                </li>
              ) : (
                renderGroupedItems(items, active, setActive, go, listboxId)
              )}
            </ul>

            {/* Pied de page — aide clavier */}
            <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-2 text-[11px] text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
              <span className="flex items-center gap-1.5">
                <CornerDownLeft className="h-3 w-3" /> pour ouvrir
              </span>
              <span>↑ ↓ pour naviguer</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Rend les items en intercalant un en-tête à chaque changement de groupe. */
function renderGroupedItems(
  items: SearchItem[],
  active: number,
  setActive: (i: number) => void,
  go: (item: SearchItem) => void,
  listboxId: string,
) {
  const nodes: React.ReactNode[] = [];
  let lastEntity: SearchEntity | null = null;

  items.forEach((item, index) => {
    if (item.entity !== lastEntity) {
      lastEntity = item.entity;
      nodes.push(
        <li
          key={`hdr-${item.entity}`}
          aria-hidden="true"
          className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
        >
          {GROUP_LABELS[item.entity]}
        </li>,
      );
    }
    const Icon = ENTITY_ICON[item.entity];
    const isActive = index === active;
    nodes.push(
      <li key={item.key} role="option" aria-selected={isActive} id={`${listboxId}-opt-${index}`}>
        <button
          type="button"
          onMouseEnter={() => setActive(index)}
          onClick={() => go(item)}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
            isActive
              ? 'bg-leaf-50 text-leaf-900 dark:bg-leaf-950/50 dark:text-leaf-100'
              : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900'
          }`}
        >
          <span
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${
              isActive
                ? 'bg-leaf-100 text-leaf-700 dark:bg-leaf-900 dark:text-leaf-300'
                : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{item.title}</span>
            <span className="block truncate text-xs text-zinc-400 dark:text-zinc-500">
              {item.subtitle}
            </span>
          </span>
        </button>
      </li>,
    );
  });

  return nodes;
}
