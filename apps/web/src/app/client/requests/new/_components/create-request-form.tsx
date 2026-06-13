'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, ArrowRight, Bug, Check, Loader2, Send } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useForm, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FREQUENCY_LABELS, type ProductOption } from '@/lib/bug';
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
  products: ProductOption[];
}

type StepKey = 'category' | 'description' | 'bug' | 'impact' | 'review';

const STEP_LABELS: Record<StepKey, string> = {
  category: 'Catégorie',
  description: 'Description',
  bug: 'Détails du bug',
  impact: 'Impact et urgence',
  review: 'Récapitulatif',
};

const STEP_FIELDS: Record<StepKey, Array<keyof CreateRequestInput | `bugDetails.${string}`>> = {
  category: ['categoryId'],
  description: ['title', 'description'],
  bug: [
    'bugDetails.productId',
    'bugDetails.productVersion',
    'bugDetails.expectedBehavior',
    'bugDetails.observedBehavior',
    'bugDetails.reproductionSteps',
    'bugDetails.occurredAt',
    'bugDetails.frequencyLabel',
  ],
  impact: ['impact', 'urgency', 'clientContextNote'],
  review: [],
};

const EMPTY_BUG = {
  productId: '',
  productVersion: '',
  expectedBehavior: '',
  observedBehavior: '',
  reproductionSteps: '',
  occurredAt: '',
  isRecurrent: false,
  frequencyLabel: undefined,
  environmentOs: '',
  environmentBrowser: '',
  environmentHardware: '',
  isBlocking: false,
  errorMessages: '',
} as const;

export function CreateRequestForm({ categories, products }: Props) {
  const [stepIdx, setStepIdx] = useState(0);
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
      bugDetails: undefined,
    },
  });

  const values = form.watch();
  const selectedCategory = categories.find((c) => c.id === values.categoryId);
  const isBug = Boolean(selectedCategory?.requiresBugDetails);

  // Étapes dynamiques : l'étape « Détails du bug » n'apparaît que pour une
  // catégorie de type bug (CDC §6.2.1).
  const steps: StepKey[] = isBug
    ? ['category', 'description', 'bug', 'impact', 'review']
    : ['category', 'description', 'impact', 'review'];
  const step = steps[Math.min(stepIdx, steps.length - 1)];
  const isLast = stepIdx >= steps.length - 1;

  const onCategoryChange = (id: string) => {
    form.setValue('categoryId', id, { shouldValidate: true, shouldDirty: true });
    const cat = categories.find((c) => c.id === id);
    if (cat?.requiresBugDetails) {
      if (!values.bugDetails) form.setValue('bugDetails', { ...EMPTY_BUG });
    } else {
      form.setValue('bugDetails', undefined);
    }
  };

  async function goNext() {
    const ok = await form.trigger(STEP_FIELDS[step] as never);
    if (ok && !isLast) {
      setStepIdx(stepIdx + 1);
      setFormError(null);
    }
  }

  function goBack() {
    if (stepIdx > 0) {
      setStepIdx(stepIdx - 1);
      setFormError(null);
    }
  }

  function onSubmit(data: CreateRequestInput) {
    setFormError(null);
    startSubmit(async () => {
      const result = await submitRequestAction(data);
      if (result && result.ok === false) {
        const fieldEntries = Object.entries(result.fieldErrors) as Array<[string, string]>;
        for (const [field, message] of fieldEntries) {
          form.setError(field as never, { type: 'server', message });
        }
        if (result.formError) setFormError(result.formError);
      }
    });
  }

  const selectedProduct = products.find((p) => p.id === values.bugDetails?.productId);

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
      aria-busy={submitting}
    >
      <Stepper steps={steps} currentStep={stepIdx} />

      <Card className="p-6 sm:p-8">
        {step === 'category' && (
          <CategoryStep
            categories={categories}
            value={values.categoryId}
            onChange={onCategoryChange}
            errors={form.formState.errors}
          />
        )}

        {step === 'description' && (
          <DescriptionStep
            register={form.register}
            errors={form.formState.errors}
            descriptionLength={values.description?.length ?? 0}
          />
        )}

        {step === 'bug' && (
          <BugStep
            products={products}
            selectedProduct={selectedProduct ?? null}
            isRecurrent={Boolean(values.bugDetails?.isRecurrent)}
            isBlocking={Boolean(values.bugDetails?.isBlocking)}
            register={form.register}
            errors={form.formState.errors}
          />
        )}

        {step === 'impact' && (
          <ImpactUrgencyStep
            impact={values.impact}
            urgency={values.urgency}
            isBlockingBug={isBug && Boolean(values.bugDetails?.isBlocking)}
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

        {step === 'review' && (
          <ReviewStep values={values} selectedCategory={selectedCategory ?? null} />
        )}
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
        <Button
          type="button"
          variant="ghost"
          onClick={goBack}
          disabled={stepIdx === 0 || submitting}
        >
          <ArrowLeft className="h-4 w-4" />
          Précédent
        </Button>

        {!isLast ? (
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

function Stepper({ steps, currentStep }: { steps: StepKey[]; currentStep: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-xs">
      {steps.map((key, idx) => {
        const isActive = idx === currentStep;
        const isDone = idx < currentStep;
        return (
          <li key={key} className="flex items-center gap-2">
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
              {STEP_LABELS[key]}
            </span>
            {idx < steps.length - 1 && (
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

const FIELD_CLASS =
  'mt-1 flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500 dark:focus-visible:ring-zinc-100';

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
                <span className="flex items-center gap-1.5">
                  {cat.requiresBugDetails && (
                    <Bug className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  )}
                  <span className="font-mono text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                    {cat.code}
                  </span>
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
  register: UseFormRegister<CreateRequestInput>;
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
          className={FIELD_CLASS}
          {...register('description')}
        />
        <FieldError message={errors.description?.message} />
      </div>
    </div>
  );
}

function BugStep({
  products,
  selectedProduct,
  isRecurrent,
  isBlocking,
  register,
  errors,
}: {
  products: ProductOption[];
  selectedProduct: ProductOption | null;
  isRecurrent: boolean;
  isBlocking: boolean;
  register: UseFormRegister<CreateRequestInput>;
  errors: FieldErrors<CreateRequestInput>;
}) {
  const bugErrors = errors.bugDetails as FieldErrors<NonNullable<CreateRequestInput['bugDetails']>>;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          <Bug className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          Détails du dysfonctionnement
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Ces informations structurées accélèrent le diagnostic par nos équipes (CDC §6.2).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="bug-product">Produit concerné</Label>
          <select id="bug-product" className={FIELD_CLASS} {...register('bugDetails.productId')}>
            <option value="">Sélectionnez un produit…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} ({p.code})
              </option>
            ))}
          </select>
          <FieldError message={bugErrors?.productId?.message} />
        </div>
        <div>
          <Label htmlFor="bug-version">Version</Label>
          <Input
            id="bug-version"
            type="text"
            maxLength={60}
            placeholder="Ex. 2.3.1"
            {...register('bugDetails.productVersion')}
          />
          <FieldError message={bugErrors?.productVersion?.message} />
        </div>
      </div>

      <div>
        <Label htmlFor="bug-expected">Comportement attendu</Label>
        <textarea
          id="bug-expected"
          rows={2}
          maxLength={2000}
          placeholder="Ce que vous vouliez obtenir."
          className={FIELD_CLASS}
          {...register('bugDetails.expectedBehavior')}
        />
        <FieldError message={bugErrors?.expectedBehavior?.message} />
      </div>

      <div>
        <Label htmlFor="bug-observed">Comportement observé</Label>
        <textarea
          id="bug-observed"
          rows={2}
          maxLength={2000}
          placeholder="Ce qui s'est réellement produit."
          className={FIELD_CLASS}
          {...register('bugDetails.observedBehavior')}
        />
        <FieldError message={bugErrors?.observedBehavior?.message} />
      </div>

      <div>
        <Label htmlFor="bug-steps">Étapes de reproduction</Label>
        <textarea
          id="bug-steps"
          rows={3}
          maxLength={3000}
          placeholder={'1. …\n2. …\n3. …'}
          className={FIELD_CLASS}
          {...register('bugDetails.reproductionSteps')}
        />
        <FieldError message={bugErrors?.reproductionSteps?.message} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="bug-occurred">Date/heure d&apos;apparition</Label>
          <Input id="bug-occurred" type="datetime-local" {...register('bugDetails.occurredAt')} />
          <FieldError message={bugErrors?.occurredAt?.message} />
        </div>
        <div className="flex flex-col justify-end gap-2 pb-1">
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
              {...register('bugDetails.isRecurrent')}
            />
            Bug récurrent
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
              {...register('bugDetails.isBlocking')}
            />
            Bloque mon activité
          </label>
        </div>
      </div>

      {isRecurrent && (
        <div>
          <Label htmlFor="bug-frequency">Fréquence</Label>
          <select
            id="bug-frequency"
            className={FIELD_CLASS}
            {...register('bugDetails.frequencyLabel')}
          >
            <option value="">Sélectionnez…</option>
            {FREQUENCY_LABELS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <FieldError message={bugErrors?.frequencyLabel?.message} />
        </div>
      )}

      {isBlocking && (
        <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Un bug bloquant impose un impact « Blocage total » ou « Blocage partiel » à l&apos;étape
          suivante.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {selectedProduct?.requiresOs && (
          <div>
            <Label htmlFor="bug-os">Système d&apos;exploitation</Label>
            <Input
              id="bug-os"
              type="text"
              maxLength={120}
              placeholder="Ex. Windows 11"
              {...register('bugDetails.environmentOs')}
            />
            <FieldError message={bugErrors?.environmentOs?.message} />
          </div>
        )}
        {selectedProduct?.requiresBrowser && (
          <div>
            <Label htmlFor="bug-browser">Navigateur</Label>
            <Input
              id="bug-browser"
              type="text"
              maxLength={120}
              placeholder="Ex. Chrome 120"
              {...register('bugDetails.environmentBrowser')}
            />
            <FieldError message={bugErrors?.environmentBrowser?.message} />
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="bug-hardware">Configuration matérielle (optionnel)</Label>
        <Input
          id="bug-hardware"
          type="text"
          maxLength={300}
          placeholder="Ex. Poste fixe, 16 Go RAM"
          {...register('bugDetails.environmentHardware')}
        />
      </div>

      <div>
        <Label htmlFor="bug-errors">Messages d&apos;erreur (optionnel)</Label>
        <textarea
          id="bug-errors"
          rows={2}
          maxLength={2000}
          placeholder="Collez ici les messages d'erreur affichés."
          className={FIELD_CLASS}
          {...register('bugDetails.errorMessages')}
        />
      </div>
    </div>
  );
}

function ImpactUrgencyStep({
  impact,
  urgency,
  isBlockingBug,
  onImpactChange,
  onUrgencyChange,
  register,
  errors,
  contextLength,
}: {
  impact: ImpactValue | undefined;
  urgency: UrgencyValue | undefined;
  isBlockingBug: boolean;
  onImpactChange: (v: ImpactValue) => void;
  onUrgencyChange: (v: UrgencyValue) => void;
  register: UseFormRegister<CreateRequestInput>;
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
            // Un bug bloquant restreint l'impact aux deux niveaux de blocage.
            const disabled =
              isBlockingBug && opt.value !== 'BLOCAGE_TOTAL' && opt.value !== 'BLOCAGE_PARTIEL';
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={selected}
                disabled={disabled}
                onClick={() => onImpactChange(opt.value)}
                className={cn(
                  'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors',
                  selected
                    ? 'border-leaf-600 bg-leaf-50/60 ring-1 ring-leaf-600 dark:border-leaf-500 dark:bg-leaf-950/30 dark:ring-leaf-500'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700',
                  disabled && 'cursor-not-allowed opacity-40 hover:border-zinc-200',
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
          className={FIELD_CLASS}
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
        {values.bugDetails && (
          <ReviewField label="Bug" className="sm:col-span-2">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Version {values.bugDetails.productVersion || '—'}
              {values.bugDetails.isBlocking && ' · bloquant'}
              {values.bugDetails.isRecurrent &&
                ` · récurrent (${values.bugDetails.frequencyLabel ?? '?'})`}
            </p>
          </ReviewField>
        )}
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
