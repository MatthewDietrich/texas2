import { get } from "./client";

export interface NearbyAirport {
  name: string;
  distanceMiles: number;
}

export interface NearbyHighway {
  name: string;
  distanceMiles: number;
}

export interface Transportation {
  airports: NearbyAirport[];
  highways: NearbyHighway[];
}

export const getTransportation = (name: string) =>
  get<Transportation>(`/cities/${encodeURIComponent(name)}/transportation`);
