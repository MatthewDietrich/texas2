import { get } from "./client";

export interface EnergyPrice {
  timestamp: string;
  price: number;
}

export interface LoadForecastHour {
  hourEnding: string;
  systemMW: number;
  zoneMW: number | null;
}

export interface Energy {
  loadZone: string | null;
  settlementPoint: string | null;
  currentPrice: EnergyPrice | null;
  recentPrices: EnergyPrice[];
  loadForecast: LoadForecastHour[];
}

export const getEnergy = (name: string) =>
  get<Energy>(`/cities/${encodeURIComponent(name)}/energy`);
