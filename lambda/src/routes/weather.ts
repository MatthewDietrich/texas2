import type { RouteHandler } from "../types";
import { ok, notFound, badRequest } from "../response";
import { getCityCoords } from "../cityCoords";
import {
  getForecastByCoordinates,
  getHistoryByCoordinates,
} from "../openmeteo";
import { getActiveAlerts } from "../nws";

function chicagoParts(date: Date): Record<string, string> {
  const p: Record<string, string> = {};
  new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  })
    .formatToParts(date)
    .forEach(({ type, value }) => {
      p[type] = value;
    });
  return p;
}

function chicagoDateStr(date: Date): string {
  const p = chicagoParts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

function chicagoHourKey(date: Date): string {
  const p = chicagoParts(date);
  const h = p.hour === "24" ? "00" : p.hour;
  return `${p.year}-${p.month}-${p.day}T${h}`;
}

function shiftYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() - years);
  return d;
}

/** GET /cities/:name/weather */
export const getWeather: RouteHandler = async ({ params, origin }) => {
  if (!params.name) return badRequest("City name is required", origin);

  const coords = await getCityCoords(params.name);
  if (!coords)
    return notFound(`No city found with name "${params.name}"`, origin);

  const { lat, lon } = coords;
  const now = new Date();

  const [forecast, hist1, hist5, hist10, alertsResult] = await Promise.all([
    getForecastByCoordinates(lat, lon),
    getHistoryByCoordinates(
      lat,
      lon,
      chicagoDateStr(shiftYears(now, 1)),
      chicagoDateStr(shiftYears(now, 1)),
    ),
    getHistoryByCoordinates(
      lat,
      lon,
      chicagoDateStr(shiftYears(now, 5)),
      chicagoDateStr(shiftYears(now, 5)),
    ),
    getHistoryByCoordinates(
      lat,
      lon,
      chicagoDateStr(shiftYears(now, 10)),
      chicagoDateStr(shiftYears(now, 10)),
    ),
    getActiveAlerts(lat, lon).catch(() => null),
  ]);

  const alerts = (alertsResult?.features ?? []).map((f) => ({
    id: f.properties.id,
    event: f.properties.event,
    severity: f.properties.severity,
    expires: f.properties.ends ?? f.properties.expires,
  }));

  // Next 12 hours starting from the current hour
  const hourKey = chicagoHourKey(now);
  const hStart = Math.max(
    0,
    forecast.hourly.time.findIndex((t) => t.startsWith(hourKey)),
  );
  const hourly = Array.from({ length: 12 }, (_, i) => {
    const idx = hStart + i;
    return {
      time: forecast.hourly.time[idx] ?? "",
      tempF: Math.round(forecast.hourly.temperature_2m[idx] ?? 0),
      precipProbability: forecast.hourly.precipitation_probability[idx] ?? 0,
      weatherCode: forecast.hourly.weather_code[idx] ?? 0,
      isDay: (forecast.hourly.is_day[idx] ?? 1) === 1,
    };
  });

  // 7-day daily forecast starting from today
  const todayStr = chicagoDateStr(now);
  const dStart = Math.max(
    0,
    forecast.daily.time.findIndex((t) => t === todayStr),
  );
  const daily = Array.from({ length: 7 }, (_, i) => {
    const idx = dStart + i;
    return {
      date: forecast.daily.time[idx] ?? "",
      weatherCode: forecast.daily.weather_code[idx] ?? 0,
      highF: Math.round(forecast.daily.temperature_2m_max[idx] ?? 0),
      lowF: Math.round(forecast.daily.temperature_2m_min[idx] ?? 0),
      precipProbability: forecast.daily.precipitation_probability_max[idx] ?? 0,
    };
  });

  function almanacEntry(hist: typeof hist1) {
    const h = hist.daily.temperature_2m_max[0];
    if (h == null) return null;
    return {
      highF: Math.round(h),
      lowF: Math.round(hist.daily.temperature_2m_min[0] ?? 0),
      precipIn: +(hist.daily.precipitation_sum[0] ?? 0).toFixed(2),
    };
  }

  const FIVE_MINUTES = 300;
  return ok(
    {
      current: {
        tempF: Math.round(forecast.current.temperature_2m),
        feelsLikeF: Math.round(forecast.current.apparent_temperature),
        dewPointF: Math.round(forecast.current.dew_point_2m),
        humidity: forecast.current.relative_humidity_2m,
        precipProbability: forecast.current.precipitation_probability,
        windMph: Math.round(forecast.current.wind_speed_10m),
        windDir: forecast.current.wind_direction_10m,
        cloudCover: forecast.current.cloud_cover,
        pressureMb: Math.round(forecast.current.pressure_msl),
        weatherCode: forecast.current.weather_code,
        isDay: forecast.current.is_day === 1,
      },
      hourly,
      daily,
      almanac: {
        yr1: almanacEntry(hist1),
        yr5: almanacEntry(hist5),
        yr10: almanacEntry(hist10),
      },
      alerts,
    },
    origin,
    FIVE_MINUTES,
  );
};
