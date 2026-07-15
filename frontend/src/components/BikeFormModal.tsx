import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import {
  bikeSchema,
  type BikeFormData,
  VIN_FORMAT_HINT,
  LAST_SERVICE_FORMAT_HINT,
  normalizeVinInput,
  formatLastServiceMask,
  toCompleteLastServiceIso,
} from '../schemas';
import { useModalA11y } from '../hooks/useModalA11y';

/** Режим модального окна: создание или редактирование */
export type BikeModalMode = 'create' | 'edit';

type BikeFormModalProps = {
  open: boolean;
  mode: BikeModalMode;
  /** Начальные значения при редактировании (из строки таблицы) */
  initialValues?: Partial<BikeFormData> | null;
  /** Сообщение об ошибке с сервера (403, валидация и т.д.) */
  serverError?: string | null;
  onClose: () => void;
  onSubmit: (data: BikeFormData) => Promise<void>;
};

/** Значения формы по умолчанию для нового байка */
const defaultFormValues: BikeFormData = {
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  vin: '',
  mileage: 0,
  status: 'available',
  lastService: new Date().toISOString().slice(0, 10),
  notes: '',
};

/**
 * МОДАЛЬНОЕ ОКНО ФОРМЫ БАЙКА (F-BIKE-CREATE-02, F-BIKE-EDIT-02)
 * Одна форма для добавления и редактирования со всеми полями модели Bike.
 */
export default function BikeFormModal({
  open,
  mode,
  initialValues,
  serverError,
  onClose,
  onSubmit,
}: BikeFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BikeFormData>({
    resolver: zodResolver(bikeSchema),
    defaultValues: defaultFormValues,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const lastServiceValue = watch('lastService');
  const todayIso = new Date().toISOString().slice(0, 10);
  const calendarValue = toCompleteLastServiceIso(lastServiceValue ?? '');
  const lastServiceField = register('lastService');
  const panelRef = useRef<HTMLDivElement>(null);

  useModalA11y(open, panelRef, onClose, {
    escapeDisabled: isSubmitting,
    initialFocusSelector: '[data-testid="input-brand"]',
  });

  // При открытии — подставляем данные (создание или редактирование)
  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && initialValues) {
      reset({
        ...defaultFormValues,
        ...initialValues,
        notes: initialValues.notes ?? '',
      });
    } else {
      reset(defaultFormValues);
    }
  }, [open, mode, initialValues, reset]);

  if (!open) return null;

  const title = mode === 'create' ? 'Добавить байк' : 'Редактировать байк';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bike-modal-title"
      data-testid="bike-form-modal"
    >
      <div
        ref={panelRef}
        className="flex max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:max-h-[min(90vh,100dvh)] sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
          <h2 id="bike-modal-title" className="text-lg font-bold uppercase tracking-tight text-slate-800">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
          {serverError && (
            <p
              data-testid="form-server-error"
              className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
            >
              {serverError}
            </p>
          )}

          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
          <div>
            <label htmlFor="bike-field-brand" className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Марка</label>
            <input
              {...register('brand')}
              id="bike-field-brand"
              data-testid="input-brand"
              className={`w-full rounded-lg border p-2.5 font-semibold outline-none transition-all focus:ring-2 focus:ring-blue-500 ${errors.brand ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`}
              placeholder="Напр. KTM"
            />
            {errors.brand && (
              <p data-testid="error-brand" className="mt-1 text-[10px] font-bold uppercase text-rose-500">
                {errors.brand.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="bike-field-model" className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Модель</label>
            <input
              {...register('model')}
              id="bike-field-model"
              data-testid="input-model"
              className={`w-full rounded-lg border p-2.5 font-semibold outline-none transition-all focus:ring-2 focus:ring-blue-500 ${errors.model ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`}
              placeholder="Напр. 300 EXC"
            />
            {errors.model && (
              <p data-testid="error-model" className="mt-1 text-[10px] font-bold uppercase text-rose-500">
                {errors.model.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="bike-field-year" className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Год</label>
              <input
                type="number"
                {...register('year', { valueAsNumber: true })}
                id="bike-field-year"
                data-testid="input-year"
                className={`w-full rounded-lg border p-2.5 font-semibold outline-none transition-all focus:ring-2 focus:ring-blue-500 ${errors.year ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`}
              />
              {errors.year && (
                <p data-testid="error-year" className="mt-1 text-[10px] font-bold uppercase text-rose-500">
                  {errors.year.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="bike-field-mileage" className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Пробег</label>
              <input
                type="number"
                {...register('mileage', { valueAsNumber: true })}
                id="bike-field-mileage"
                data-testid="input-mileage"
                className={`w-full rounded-lg border p-2.5 font-semibold outline-none transition-all focus:ring-2 focus:ring-blue-500 ${errors.mileage ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`}
              />
              {errors.mileage && (
                <p data-testid="error-mileage" className="mt-1 text-[10px] font-bold uppercase text-rose-500">
                  {errors.mileage.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="bike-field-vin" className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">VIN (17 знаков)</label>
            <input
              {...register('vin', {
                setValueAs: normalizeVinInput,
              })}
              id="bike-field-vin"
              data-testid="input-vin"
              maxLength={17}
              autoComplete="off"
              spellCheck={false}
              className={`w-full rounded-lg border p-2.5 font-mono text-sm tracking-wider outline-none transition-all focus:ring-2 focus:ring-blue-500 ${errors.vin ? 'border-rose-500 bg-rose-50 text-rose-900' : 'border-slate-200'}`}
              placeholder="1HGBH41JXMN109186"
            />
            <p className="mt-1 text-[10px] leading-snug text-slate-400">{VIN_FORMAT_HINT}</p>
            {errors.vin && (
              <p data-testid="error-vin" className="mt-1 text-[10px] font-bold uppercase text-rose-500">
                {errors.vin.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="bike-field-status" className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Статус в парке</label>
            <select
              {...register('status')}
              id="bike-field-status"
              data-testid="select-status"
              className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white p-2.5 font-bold text-slate-700 outline-none"
            >
              <option value="available">Доступен</option>
              <option value="repair">В ремонте</option>
              <option value="sold">Продан</option>
            </select>
            {errors.status && (
              <p data-testid="error-status" className="mt-1 text-[10px] font-bold uppercase text-rose-500">
                {errors.status.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="bike-field-lastService" className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Последнее ТО</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                id="bike-field-lastService"
                name={lastServiceField.name}
                ref={lastServiceField.ref}
                onBlur={lastServiceField.onBlur}
                value={lastServiceValue ?? ''}
                onChange={(event) => {
                  setValue('lastService', formatLastServiceMask(event.target.value), {
                    shouldDirty: true,
                    // не валидируем на каждый символ до первой ошибки / submit
                    shouldValidate: Boolean(errors.lastService),
                  });
                }}
                data-testid="input-lastService"
                inputMode="numeric"
                autoComplete="off"
                placeholder="2024-06-15 или 20240615"
                className={`min-w-0 flex-1 rounded-lg border p-2.5 font-mono text-sm tracking-wide outline-none transition-all focus:ring-2 focus:ring-blue-500 ${errors.lastService ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`}
              />
              <input
                type="date"
                data-testid="input-lastService-calendar"
                value={calendarValue}
                min="1990-01-01"
                max={todayIso}
                onChange={(event) => {
                  setValue('lastService', event.target.value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
                aria-label="Выбрать дату последнего ТО в календаре"
                className={`w-full shrink-0 rounded-lg border p-2.5 outline-none transition-all focus:ring-2 focus:ring-blue-500 sm:w-[9.5rem] ${errors.lastService ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`}
              />
            </div>
            <p className="mt-1 text-[10px] leading-snug text-slate-400">{LAST_SERVICE_FORMAT_HINT}</p>
            {errors.lastService && (
              <p data-testid="error-lastService" className="mt-1 text-[10px] font-bold uppercase text-rose-500">
                {errors.lastService.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="bike-field-notes" className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Заметки</label>
            <textarea
              {...register('notes')}
              id="bike-field-notes"
              data-testid="input-notes"
              rows={3}
              className={`w-full resize-none rounded-lg border p-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500 ${errors.notes ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`}
              placeholder="Необязательно, до 500 символов"
            />
            {errors.notes && (
              <p data-testid="error-notes" className="mt-1 text-[10px] font-bold uppercase text-rose-500">
                {errors.notes.message}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              data-testid="form-cancel-btn"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              data-testid="form-save-btn"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-blue-600 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 disabled:opacity-60"
            >
              {mode === 'create' ? 'Добавить' : 'Сохранить'}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
}
