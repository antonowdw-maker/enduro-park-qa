import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { bikeSchema, type BikeFormData, VIN_FORMAT_HINT, normalizeVinInput } from '../schemas';

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
    formState: { errors, isSubmitting },
  } = useForm<BikeFormData>({
    resolver: zodResolver(bikeSchema),
    defaultValues: defaultFormValues,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bike-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
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

        {serverError && (
          <p
            data-testid="form-server-error"
            className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
          >
            {serverError}
          </p>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Марка</label>
            <input
              {...register('brand')}
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
            <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Модель</label>
            <input
              {...register('model')}
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
              <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Год</label>
              <input
                type="number"
                {...register('year', { valueAsNumber: true })}
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
              <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Пробег</label>
              <input
                type="number"
                {...register('mileage', { valueAsNumber: true })}
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
            <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">VIN (17 знаков)</label>
            <input
              {...register('vin', {
                setValueAs: normalizeVinInput,
              })}
              data-testid="input-vin"
              maxLength={17}
              autoComplete="off"
              spellCheck={false}
              readOnly={mode === 'edit'}
              className={`w-full rounded-lg border p-2.5 font-mono text-sm tracking-wider outline-none transition-all focus:ring-2 focus:ring-blue-500 ${errors.vin ? 'border-rose-500 bg-rose-50 text-rose-900' : 'border-slate-200'} ${mode === 'edit' ? 'bg-slate-50 text-slate-500' : ''}`}
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
            <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Статус в парке</label>
            <select
              {...register('status')}
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
            <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Последнее ТО</label>
            <input
              type="date"
              {...register('lastService')}
              data-testid="input-lastService"
              className={`w-full rounded-lg border p-2.5 font-semibold outline-none transition-all focus:ring-2 focus:ring-blue-500 ${errors.lastService ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`}
            />
            {errors.lastService && (
              <p data-testid="error-lastService" className="mt-1 text-[10px] font-bold uppercase text-rose-500">
                {errors.lastService.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Заметки</label>
            <textarea
              {...register('notes')}
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
  );
}
