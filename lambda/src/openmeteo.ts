const FORECAST_BASE = "https://api.open-meteo.com/v1/forecast";
const HISTORICAL_BASE = "https://archive-api.open-meteo.com/v1/archive";

export interface OpenMeteoForecast {
  latitude: number;
  longitude: number;
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    dew_point_2m: number;
    precipitation_probability: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    weather_code: number;
    cloud_cover: number;
    rain: number;
    is_day: number;
    pressure_msl: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
  hourly: {
    time: string[];
    weather_code: number[];
    temperature_2m: number[];
    precipitation_probability: number[];
    is_day: (0 | 1)[];
  };
}

export interface OpenMeteoHistory {
  latitude: number;
  longitude: number;
  daily: {
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    precipitation_sum: number[];
    wind_speed_10m_mean: number[];
    wind_direction_10m_dominant: number[];
    relative_humidity_2m_mean: number[];
    cloud_cover_mean: number[];
    pressure_msl_mean: number[];
  };
}

export async function getForecastByCoordinates(
  latitude: number,
  longitude: number,
): Promise<OpenMeteoForecast> {
  const url = FORECAST_BASE;
  const params = {
    latitude: latitude.toFixed(7),
    longitude: longitude.toFixed(7),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,dew_point_2m,precipitation_probability,rain,wind_speed_10m,wind_direction_10m,weather_code,cloud_cover,is_day,pressure_msl",
    daily:
      "weather_code,temperature_2m_max,precipitation_probability_max,temperature_2m_min",
    hourly: "weather_code,temperature_2m,precipitation_probability,is_day",
    precipitation_unit: "inch",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    timezone: "America/Chicago",
    past_days: "1",
  };
  const queryString = new URLSearchParams(params).toString();
  const res = await fetch(`${url}?${queryString}`);
  if (!res.ok) {
    throw new Error(
      `Open Meteo forecast API ${res.status} for ${latitude} N, ${longitude} W`,
    );
  }
  return res.json() as Promise<OpenMeteoForecast>;
}

export async function getHistoryByCoordinates(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string,
): Promise<OpenMeteoHistory> {
  const url = HISTORICAL_BASE;
  const params = {
    latitude: latitude.toFixed(7),
    longitude: longitude.toFixed(7),
    start_date: startDate,
    end_date: endDate,
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,wind_speed_10m_mean,wind_direction_10m_dominant,relative_humidity_2m_mean,cloud_cover_mean,pressure_msl_mean",
    precipitation_unit: "inch",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    timezone: "America/Chicago",
  };
  const queryString = new URLSearchParams(params).toString();
  const res = await fetch(`${url}?${queryString}`);
  if (!res.ok) {
    throw new Error(
      `Open Meteo history API ${res.status} for ${latitude} N, ${longitude} W (${startDate} - ${endDate})`,
    );
  }
  return res.json() as Promise<OpenMeteoHistory>;
}
