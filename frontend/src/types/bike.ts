/** Поля, по которым разрешена сортировка (F-SORT-01) */
export type SortField = 'brand' | 'model' | 'year' | 'vin' | 'mileage' | 'status' | 'lastService';

/** Строка таблицы байков с бэкенда */
export type BikeRow = {
  id: string;
  brand: string;
  model: string;
  year: number;
  vin: string;
  mileage: number;
  status: string;
  lastService: string;
  notes?: string | null;
};

export type FilterFieldKey = 'yearFrom' | 'yearTo' | 'mileageFrom' | 'mileageTo';
