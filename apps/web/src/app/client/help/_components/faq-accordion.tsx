'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Accordéon FAQ accessible : une seule réponse ouverte à la fois, navigation
 * clavier native (boutons), état piloté côté client.
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <ul className="flex flex-col divide-y divide-zinc-200/80 dark:divide-zinc-800">
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <li key={item.question}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium text-zinc-900 transition-colors hover:text-leaf-700 dark:text-zinc-100 dark:hover:text-leaf-300"
            >
              <span>{item.question}</span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 shrink-0 text-zinc-400 transition-transform',
                  isOpen && 'rotate-180',
                )}
              />
            </button>
            {isOpen && (
              <p className="pb-4 pr-8 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {item.answer}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
