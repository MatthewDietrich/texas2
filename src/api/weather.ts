import { get } from "./client";

export interface WeatherCurrent {
  tempF: number;
  feelsLikeF: number;
  dewPointF: number;
  humidity: number;
  precipProbability: number;
  windMph: number;
  windDir: number;
  cloudCover: number;
  pressureMb: number;
  weatherCode: number;
  isDay: boolean;
}

export interface WeatherHour {
  time: string;
  tempF: number;
  precipProbability: number;
  weatherCode: number;
  isDay: boolean;
}

export interface WeatherDay {
  date: string;
  weatherCode: number;
  highF: number;
  lowF: number;
  precipProbability: number;
}

export interface AlmanacEntry {
  highF: number;
  lowF: number;
  precipIn: number;
}

export interface WeatherAlert {
  id: string;
  event: string;
  severity: string;
  expires: string;
}

export interface Weather {
  current: WeatherCurrent;
  hourly: WeatherHour[];
  daily: WeatherDay[];
  almanac: {
    yr1: AlmanacEntry | null;
    yr5: AlmanacEntry | null;
    yr10: AlmanacEntry | null;
  };
  alerts: WeatherAlert[];
}

export const getWeather = (name: string) =>
  get<Weather>(`/cities/${encodeURIComponent(name)}/weather`);
