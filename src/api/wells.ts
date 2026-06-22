import { get } from "./client";

export interface WellStatus {
  api: string;
  status: string | null;
  wellType: string | null;
  completionDate: string | null;
  plugDate: string | null;
  lastProductionMonth: string | null;
  oilBbl: number | null;
  gasMcf: number | null;
}

export interface Well {
  api: string;
  longitude: number;
  latitude: number;
  attributes: {
    LEASE_NAME?: string;
    OPERATOR_NO?: string;
    WELL_NO?: string;
    [key: string]: unknown;
  };
  status: WellStatus | null;
}

export const getWells = (name: string) =>
  get<Well[]>(`/cities/${encodeURIComponent(name)}/wells`);
