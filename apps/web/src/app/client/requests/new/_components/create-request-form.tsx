'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, ArrowRight, Check, Loader2, Send } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  IMPACT_OPTIONS,
  URGENCY_OPTIONS,
  type CategoryOption,
  type ImpactValue,
  type UrgencyValue,
} from '@/lib/requests';
import { cn } from '@/lib/utils';
import { submitRequestAction } from '../actions';
import { createRequestSchema, type CreateRequestInput } from '../schema';

interface Props {
  categories: CategoryOption[];
}

type StepIndex = 0 | 1 | 2 | 3;

const STEP_TITLES = ['Catégorie', 'Description', 'Impact et urgence', 'Récapitulatif'] as const;

const STEP_FIELDS: Array<Array<keyof CreateRequestInput>> = [
  ['categoryId'],
  ['title', 'description'],
  ['impact', 'urgency', 'clientContextNote'],
  [],
];

export function CreateRequestForm({ categories }: Props) {
  const [step, setStep] = useState<StepIndex>(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  const form = useForm<CreateRequestInput>({
    resolver: zodResolver(createRequestSchema),
    mode: 'onBlur',
    defaultValues: {
      categoryId: '',
      title: '',
      description: '',
      impact: undefined as unknown as ImpactValue,
      urgency: undefined as unknown as UrgencyValue,
      clientContextNote: '',
    },
  });

  const values = form.watch();
  const selectedCategory = categories.find((c) => c.id === values.categoryId);

  async function goNext() {
    const ok = await form.trigger(STEP_FIELDS[step]);
    if (ok && step < 3) {
      setStep((step + 1) as StepIndex);
      setFormError(null);
    }
  }

  function goBack() {
    if (step > 0) {
      setStep((step - 1) as StepIndex);
      setFormError(null);
    }
  }

  function onSubmit(data: CreateRequestInput) {
    setFormError(null);
    startSubmit(async () => {
      const result = await submitRequestAction(data);
      // En cas de succès la Server Action redirige : on n'arrive ici qu'en cas
      // d'erreur de validation côté serveur ou d'erreur API.
      if (result && result.ok === false) {
        const fieldEntries = Object.entries(result.fieldErrors) as Array<
          [keyof CreateRequestInput, string]
        >;
        for (const [field, message] of fieldEntries) {
          form.setError(field, { type: 'server', message });
        }
        if (result.formError) {
          setFormError(result.formError);
        }
        // Reset step to where errors occurred so user can fix them.
        for (let i = 0; i < STEP_FIELDS.length; i++) {
          const stepFields = STEP_FIELDS[i];
          if (stepFields.some((f) => f in result.fieldErrors)) {
            setStep(i as StepIndex);
            break;
          }
        }
      }
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
      aria-busy={submitting}
    >
      <Stepper currentStep={step} />

      <Card className="p-6 sm:p-8">
        {step === 0 && (
          <CategoryStep
            categories={categories}
            value={values.categoryId}
            onChange={(id) =>
              form.setValue('categoryId', id, { shouldValidate: true, shouldDirty: true })
            }
            errors={form.formState.errors}
          />
        )}

        {step === 1 && (
          <DescriptionStep
            register={form.register}
            errors={form.formState.errors}
            descriptionLength={values.description?.length ?? 0}
          />
        )}

        {step === 2 && (
          <ImpactUrgencyStep
            impact={values.impact}
            urgency={values.urgency}
            onImpactChange={(v) =>
              form.setValue('impact', v, { shouldValidate: true, shouldDirty: true })
            }
            onUrgencyChange={(v) =>
              form.setValue('urgency', v, { shouldValidate: true, shouldDirty: true })
            }
            register={form.register}
            errors={form.formState.errors}
            contextLength={values.clientContextNote?.length ?? 0}
          />
        )}

        {step === 3 && <ReviewStep values={values} selectedCategory={selectedCategory ?? null} />}
      </Card>

      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" onClick={goBack} disabled={step === 0 || submitting}>
          <ArrowLeft className="h-4 w-4" />
          Précédent
        </Button>

        {step < 3 ? (
          <Button type="button" onClick={goNext} disabled={submitting}>
            Suivant
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Envoi…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Soumettre ma demande
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  );
}

function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-xs">
      {STEP_TITLES.map((title, idx) => {
        const isActive = idx === currentStep;
        const isDone = idx < currentStep;
        return (
          <li key={title} className="flex items-center gap-2">
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold',
                isActive &&
                  'border-leaf-700 bg-leaf-50 text-leaf-700 dark:border-leaf-500 dark:bg-leaf-950/40 dark:text-leaf-300',
                isDone &&
                  'border-leaf-700 bg-leaf-700 text-white dark:border-leaf-500 dark:bg-leaf-600',
                !isActive &&
                  !isDone &&
                  'border-zinc-300 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400',
              )}
            >
              {isDone ? <Check className="h-3.5 w-3.5" /> : idx + 1}
            </span>
            <span
              className={cn(
                'font-medium',
                isActive ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 dark:text-zinc-400',
              )}
            >
              {title}
            </span>
            {idx < STEP_TITLES.length - 1 && (
              <span className="mx-1 hidden h-px w-8 bg-zinc-200 dark:bg-zinc-800 sm:inline-block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
      <AlertCircle className="h-3 w-3" />
      {message}
    </p>
  );
}

function CategoryStep({
  categories,
  value,
  onChange,
  errors,
}: {
  categories: CategoryOption[];
  value: string;
  onChange: (id: string) => void;
  errors: FieldErrors<CreateRequestInput>;
}) {
  const active = categories.filter((c) => c.isActive);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          De quel type de demande s&apos;agit-il&nbsp;?
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Choisissez la catégorie qui décrit le mieux votre besoin. Elle aide à orienter votre
          demande vers la bonne équipe.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {active.map((cat) => {
          const selected = value === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onChange(cat.id)}
              aria-pressed={selected}
              className={cn(
                'group flex flex-col items-start gap-1.5 rounded-lg border p-4 text-left transition-colors',
                selected
                  ? 'border-leaf-600 bg-leaf-50/60 ring-1 ring-leaf-600 dark:border-leaf-500 dark:bg-leaf-950/30 dark:ring-leaf-500'
                  : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700',
              )}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{cat.label}</span>
                <span className="font-mono text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                  {cat.code}
                </span>
              </div>
              {cat.description && (
                <p className="text-xs text-zinc-600 dark:text-zinc-400">{cat.description}</p>
              )}
            </button>
          );
        })}
        {active.length === 0 && (
          <p className="col-span-full rounded-md border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
            Aucune catégorie disponible. Contactez votre Administrateur.
          </p>
        )}
      </div>
      <FieldError message={errors.categoryId?.message} />
    </div>
  );
}

function DescriptionStep({
  register,
  errors,
  descriptionLength,
}: {
  register: ReturnType<typeof useForm<CreateRequestInput>>['register'];
  errors: FieldErrors<CreateRequestInput>;
  descriptionLength: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Décrivez votre demande
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Plus la description est précise, plus la prise en charge est rapide.
        </p>
      </div>

      <div>
        <Label htmlFor="title">Titre court</Label>
        <Input
          id="title"
          type="text"
          placeholder="Ex. Impossible de me connecter au portail facturation"
          maxLength={200}
          autoFocus
          {...register('title')}
        />
        <FieldError message={errors.title?.message} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="description">Description détaillée</Label>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{descriptionLength}/5000</span>
        </div>
        <textarea
          id="description"
          rows={8}
          maxLength={5000}
          placeholder="Expliquez ce que vous essayez de faire, ce que vous observez, et tout détail utile (dates, écrans, messages d'erreur…)."
          className="mt-1 flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500 dark:focus-visible:ring-zinc-100"
          {...register('description')}
        />
        <FieldError message={errors.description?.message} />
      </div>
    </div>
  );
}

function ImpactUrgencyStep({
  impact,
  urgency,
  onImpactChange,
  onUrgencyChange,
  register,
  errors,
  contextLength,
}: {
  impact: ImpactValue | undefined;
  urgency: UrgencyValue | undefined;
  onImpactChange: (v: ImpactValue) => void;
  onUrgencyChange: (v: UrgencyValue) => void;
  register: ReturnType<typeof useForm<CreateRequestInput>>['register'];
  errors: FieldErrors<CreateRequestInput>;
  contextLength: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Impact métier et urgence ressentie
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Ces deux informations permettent à TECHDIFRIK de prioriser objectivement votre demande
          (matrice CDC §5.4).
        </p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Impact sur votre activité
        </legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {IMPACT_OPTIONS.map((opt) => {
            const selected = impact === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={selected}
                onClick={() => onImpactChange(opt.value)}
                className={cn(
                  'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors',
                  selected
                    ? 'border-leaf-600 bg-leaf-50/60 ring-1 ring-leaf-600 dark:border-leaf-500 dark:bg-leaf-950/30 dark:ring-leaf-500'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700',
                )}
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{opt.label}</span>
                <span className="text-xs text-zinc-600 dark:text-zinc-400">{opt.description}</span>
              </button>
            );
          })}
        </div>
        <FieldError message={errors.impact?.message} />
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Urgence ressentie
        </legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {URGENCY_OPTIONS.map((opt) => {
            const selected = urgency === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={selected}
                onClick={() => onUrgencyChange(opt.value)}
                className={cn(
                  'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors',
                  selected
                    ? 'border-leaf-600 bg-leaf-50/60 ring-1 ring-leaf-600 dark:border-leaf-500 dark:bg-leaf-950/30 dark:ring-leaf-500'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700',
                )}
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{opt.label}</span>
                <span className="text-xs text-zinc-600 dark:text-zinc-400">{opt.description}</span>
              </button>
            );
          })}
        </div>
        <FieldError message={errors.urgency?.message} />
      </fieldset>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="clientContextNote">Contexte additionnel (optionnel)</Label>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{contextLength}/500</span>
        </div>
        <textarea
          id="clientContextNote"
          rows={3}
          maxLength={500}
          placeholder="Échéances, contraintes externes, parties prenantes concernées…"
          className="mt-1 flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500"
          {...register('clientContextNote')}
        />
        <FieldError message={errors.clientContextNote?.message} />
      </div>
    </div>
  );
}

function ReviewStep({
  values,
  selectedCategory,
}: {
  values: CreateRequestInput;
  selectedCategory: CategoryOption | null;
}) {
  const impactOpt = IMPACT_OPTIONS.find((o) => o.value === values.impact);
  const urgencyOpt = URGENCY_OPTIONS.find((o) => o.value === values.urgency);
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Récapitulatif avant envoi
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Vérifiez les informations ci-dessous. Vous pourrez ensuite suivre l&apos;avancement de
          votre demande depuis votre espace.
        </p>
      </div>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ReviewField label="Catégorie">
          {selectedCategory ? (
            <span>
              {selectedCategory.label}
              <span className="ml-2 font-mono text-xs text-zinc-500">{selectedCategory.code}</span>
            </span>
          ) : (
            '—'
          )}
        </ReviewField>

        <ReviewField label="Impact">{impactOpt?.label ?? '—'}</ReviewField>
        <ReviewField label="Urgence">{urgencyOpt?.label ?? '—'}</ReviewField>
        <ReviewField label="Titre" className="sm:col-span-2">
          {values.title}
        </ReviewField>
        <ReviewField label="Description" className="sm:col-span-2">
          <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
            {values.description}
          </p>
        </ReviewField>
        {values.clientContextNote && (
          <ReviewField label="Contexte additionnel" className="sm:col-span-2">
            <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
              {values.clientContextNote}
            </p>
          </ReviewField>
        )}
      </dl>

      <p className="rounded-md border border-leaf-200 bg-leaf-50/50 px-4 py-3 text-xs text-leaf-800 dark:border-leaf-900/60 dark:bg-leaf-950/30 dark:text-leaf-300">
        Une fois soumise, votre demande recevra un identifiant
        <span className="mx-1 rounded bg-white px-1 py-0.5 font-mono text-[11px] text-leaf-900 shadow-sm dark:bg-leaf-950 dark:text-leaf-100">
          MTF-AAAAMMJJ-NNNN
        </span>
        et un accusé de réception par courriel.
      </p>
    </div>
  );
}

function ReviewField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="text-sm text-zinc-900 dark:text-zinc-100">{children}</dd>
    </div>
  );
}
