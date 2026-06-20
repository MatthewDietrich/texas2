import { get } from "./client";

export interface LoadForecastHour {
  intervalStart: string;
  systemMW: number;
  zoneMW: number | null;
}

export interface Energy {
  loadZone: string | null;
  loadForecast: LoadForecastHour[];
}

export const getEnergy = (name: string) =>
  get<Energy>(`/cities/${encodeURIComponent(name)}/energy`);
