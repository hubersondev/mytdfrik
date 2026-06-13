'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ExportRow {
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
  createdAt: string;
}

/** Export CSV (côté navigateur) de la liste filtrée des utilisateurs. */
export function ExportUsersButton({ rows }: { rows: ExportRow[] }) {
  const exportCsv = () => {
    const esc = (v: string) => (/[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const header = ['Nom', 'E-mail', 'Rôle', 'Statut', 'Dernière connexion', 'Créé le'];
    const lines = [
      header.join(';'),
      ...rows.map((r) =>
        [r.name, r.email, r.role, r.status, r.lastLogin, r.createdAt].map(esc).join(';'),
      ),
    ];
    const blob = new Blob(['﻿' + lines.join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'utilisateurs-mytdfrik.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" onClick={exportCsv} disabled={rows.length === 0}>
      <Download className="h-4 w-4" />
      Exporter
    </Button>
  );
}
