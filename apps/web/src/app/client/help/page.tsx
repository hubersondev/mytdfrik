import {
  ArrowRight,
  FileText,
  LifeBuoy,
  Mail,
  MessageSquare,
  PlusCircle,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  priorityLabel,
  statusLabel,
  statusVariant,
  type PriorityCode,
  type RequestStatus,
} from '@/lib/requests';
import { FaqAccordion, type FaqItem } from './_components/faq-accordion';

export const metadata = { title: "Centre d'aide · MyTDFRIK" };

/** Adresse de support TECHDIFRIK (assistance aux clients). */
const SUPPORT_EMAIL = 'support@techdifrik.com';

interface QuickLink {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

const QUICK_LINKS: QuickLink[] = [
  {
    title: 'Soumettre une demande',
    description: 'Décrivez votre besoin ou votre incident en quelques étapes guidées.',
    href: '/client/requests/new',
    icon: PlusCircle,
  },
  {
    title: 'Suivre mes demandes',
    description: 'Consultez l’avancement, les échanges et le statut de chaque demande.',
    href: '/client/requests',
    icon: FileText,
  },
];

const FAQ: FaqItem[] = [
  {
    question: 'Comment créer une nouvelle demande ?',
    answer:
      'Depuis « Nouvelle demande », choisissez la catégorie qui correspond le mieux à votre besoin, ' +
      'décrivez la situation, puis indiquez l’impact et l’urgence. Un identifiant unique (MTF-…) ' +
      'vous est attribué et un accusé de réception vous est envoyé par e-mail.',
  },
  {
    question: 'Que signifie l’impact et l’urgence que je dois renseigner ?',
    answer:
      'L’impact mesure la gêne sur votre activité (du blocage total à l’absence d’impact). ' +
      'L’urgence indique le délai attendu. La combinaison des deux détermine la priorité de ' +
      'traitement de votre demande.',
  },
  {
    question: 'Comment suivre l’avancement de ma demande ?',
    answer:
      'Dans « Mes demandes », ouvrez une demande pour voir son statut courant, l’historique des ' +
      'étapes et les messages échangés avec l’équipe TECHDIFRIK.',
  },
  {
    question: 'On me demande un complément d’information, que faire ?',
    answer:
      'Lorsqu’une demande passe « En attente de votre retour », répondez directement depuis la ' +
      'messagerie de la demande. Votre réponse relance automatiquement son traitement.',
  },
  {
    question: 'Comment ajouter une pièce jointe ?',
    answer:
      'Depuis le détail d’une demande, utilisez la zone de pièces jointes. Chaque fichier est ' +
      'analysé par un antivirus avant d’être disponible (25 Mo maximum par fichier).',
  },
  {
    question: 'Une résolution m’est proposée : que se passe-t-il ?',
    answer:
      'Vous pouvez valider la résolution (la demande est alors clôturée) ou la refuser pour ' +
      'rouvrir le traitement. Sans action de votre part, la demande est clôturée automatiquement ' +
      'au bout de 7 jours.',
  },
  {
    question: 'Puis-je rouvrir une demande clôturée ?',
    answer:
      'Oui, une demande peut être rouverte dans les 30 jours suivant sa clôture, jusqu’à deux fois, ' +
      'depuis son détail.',
  },
  {
    question: 'Comment évaluer la prise en charge ?',
    answer:
      'À la clôture, vous pouvez attribuer une note de 1 à 5 étoiles et laisser un commentaire ' +
      'facultatif. Votre retour nous aide à améliorer la qualité du service.',
  },
];

/** Statuts visibles côté client, avec une explication simple. */
const STATUS_GUIDE: { status: RequestStatus; description: string }[] = [
  {
    status: 'NOUVELLE',
    description: 'Votre demande est enregistrée et attend une première analyse.',
  },
  {
    status: 'EN_COURS',
    description: 'Un responsable traite activement votre demande.',
  },
  {
    status: 'EN_ATTENTE_CLIENT',
    description: 'Nous attendons une information ou une réponse de votre part pour avancer.',
  },
  {
    status: 'RESOLUE',
    description: 'Une solution vous est proposée : à vous de la valider ou de la refuser.',
  },
  {
    status: 'CLOTUREE',
    description: 'La demande est terminée. Vous pouvez encore la rouvrir sous 30 jours.',
  },
];

const PRIORITIES: PriorityCode[] = ['P0', 'P1', 'P2', 'P3', 'P4'];

export default function ClientHelpPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <header className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-leaf-50 text-leaf-700 dark:bg-leaf-950/60 dark:text-leaf-300">
          <LifeBuoy className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Centre d&apos;aide
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Tout pour bien utiliser MyTDFRIK et suivre vos demandes.
          </p>
        </div>
      </header>

      {/* Démarrage rapide */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {QUICK_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="group">
            <Card className="flex h-full items-start gap-4 p-5 transition-colors hover:border-leaf-300 hover:bg-leaf-50/40 dark:hover:border-leaf-800 dark:hover:bg-leaf-950/20">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-leaf-100 text-leaf-700 dark:bg-leaf-950 dark:text-leaf-300">
                <link.icon className="h-5 w-5" />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {link.title}
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{link.description}</span>
              </div>
            </Card>
          </Link>
        ))}
      </section>

      {/* FAQ */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Questions fréquentes
        </h2>
        <Card className="px-5 py-1">
          <FaqAccordion items={FAQ} />
        </Card>
      </section>

      {/* Comprendre les statuts */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Comprendre les statuts d&apos;une demande
        </h2>
        <Card className="flex flex-col divide-y divide-zinc-200/80 p-0 dark:divide-zinc-800">
          {STATUS_GUIDE.map(({ status, description }) => (
            <div key={status} className="flex items-start gap-4 px-5 py-3.5">
              <Badge variant={statusVariant(status)} className="mt-0.5 shrink-0">
                {statusLabel(status)}
              </Badge>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
            </div>
          ))}
        </Card>
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="font-medium">Niveaux de priorité :</span>
          {PRIORITIES.map((p) => (
            <span
              key={p}
              className="rounded-md bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {priorityLabel(p)}
            </span>
          ))}
        </div>
      </section>

      {/* Contact support */}
      <section>
        <Card className="flex flex-col items-start gap-4 bg-leaf-50/50 p-6 dark:bg-leaf-950/20 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-leaf-700 shadow-soft dark:bg-zinc-900 dark:text-leaf-300">
              <MessageSquare className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Vous ne trouvez pas votre réponse ?
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Créez une demande dans la catégorie adaptée ou écrivez-nous directement.
              </p>
            </div>
          </div>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-leaf-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-leaf-800"
          >
            <Mail className="h-4 w-4" />
            {SUPPORT_EMAIL}
          </a>
        </Card>
      </section>

      <p className="flex items-center justify-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
        <Star className="h-3 w-3" />
        Votre satisfaction nous aide à progresser — pensez à évaluer chaque demande clôturée.
      </p>
    </div>
  );
}
