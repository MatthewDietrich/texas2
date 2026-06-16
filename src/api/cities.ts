import { get, post } from "./client";

export interface City {
  properties: {
    name: string;
    intptlat: string;
    intptlon: string;
  };
  county: string;
  state: string;
  lat: number;
  lon: number;
  population: number | null;
  timesSearched: number | null;
  lastSearched: string | null;
  nearby?: string[];
  reservoirs?: {
    name: string;
    percentFull: number | null;
    nearestCity: string | null;
  }[];
}

export interface SearchedCity {
  name: string;
  timesSearched: number;
}

export interface RecentCity {
  name: string;
  lastSearched: string;
}

export interface SampleCity {
  properties: { name: string; intptlat: string; intptlon: string };
}

export const getCityNames = () => get<string[]>("/cities");
export const getSample = () => get<SampleCity[]>("/cities/sample");
export const getCity = (name: string) =>
  get<City>(`/cities/${encodeURIComponent(name)}`);
export const getTopSearched = (limit = 100) =>
  get<SearchedCity[]>(`/searches/top?limit=${limit}`);
export const getRecentSearched = (limit = 10) =>
  get<RecentCity[]>(`/searches/recent?limit=${limit}`);
export const recordSearch = (name: string) =>
  post<{ name: string; timesSearched: number }>(
    `/cities/${encodeURIComponent(name)}/search`,
  );
