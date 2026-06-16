import {
  Component,
  inject,
  input,
  signal,
  effect,
  computed,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";
import { ThemeService } from "../../services/theme.service";
import { getCity, recordSearch } from "../../../api/cities";
import { getCamerasForCity } from "../../../api/cameras";
import { getWeather } from "../../../api/weather";
import { getTransportation } from "../../../api/transportation";
import type { City } from "../../../api/cities";
import type { Camera } from "../../../api/cameras";
import type { Weather, WeatherDay } from "../../../api/weather";
import type { Transportation } from "../../../api/transportation";

type Tab = "snap" | "weather" | "water" | "trans";

const CAMERA_PLACEHOLDERS = Array.from({ length: 8 }, (_, i) => i);

// Texas geographic bounds — matches the bounds used on the home page map
const TX = { north: 36.5, south: 25.84, west: -106.65, east: -93.51 };

@Component({
  selector: "app-city",
  standalone: true,
  imports: [RouterLink, NavBarComponent, FooterComponent],
  templateUrl: "./city.component.html",
  styles: [
    `
      .city-head {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: var(--s5);
        align-items: center;
        padding: var(--s7) 0 var(--s6);
      }
      .city-map {
        position: relative;
        width: 120px;
        aspect-ratio: 1;
        flex: none;
        justify-self: end;
      }
      .city-map img {
        width: 100%;
        height: 100%;
        display: block;
      }
      .city-map .city-dot {
        position: absolute;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--accent);
        border: 2px solid var(--surface);
        box-shadow: 0 0 0 1px var(--border-strong);
        transform: translate(-50%, -50%);
      }
      .tabbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--s4);
        flex-wrap: wrap;
        margin-bottom: var(--s5);
      }
      .panels {
        padding-bottom: var(--s8);
      }
      .src-line {
        color: var(--text-subtle);
        font-size: 13px;
      }
      .src-line a {
        color: var(--text-muted);
        text-decoration: underline;
        text-underline-offset: 2px;
      }
      .wx-2col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--s5);
      }
      .dlist {
        display: flex;
        flex-direction: column;
      }
      .drow {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: var(--s4);
        padding: var(--s3) 0;
        border-bottom: 1px solid var(--border);
      }
      .drow:last-child {
        border-bottom: none;
      }
      .dname {
        font-size: 14px;
      }
      .ddist {
        color: var(--text-muted);
        font-size: 13px;
        white-space: nowrap;
      }
      @media (max-width: 760px) {
        .city-head {
          padding: var(--s6) 0 var(--s5);
        }
        .statrow {
          gap: var(--s5);
        }
        .segtabs {
          width: 100%;
          overflow-x: auto;
        }
        .wx-2col {
          grid-template-columns: 1fr;
        }
        .now-grid {
          flex-basis: 100%;
          min-width: 0;
          gap: 0;
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class CityComponent {
  readonly cityName = input.required<string>();
  readonly themeService = inject(ThemeService);

  city = signal<City | null>(null);
  cityLoading = signal(true);
  cityError = signal<string | null>(null);
  cameras = signal<Camera[] | null>(null);
  camsLoading = signal(true);
  camsError = signal<string | null>(null);
  weather = signal<Weather | null>(null);
  weatherLoading = signal(true);
  weatherError = signal<string | null>(null);
  transportation = signal<Transportation | null>(null);
  transLoading = signal(true);
  transError = signal<string | null>(null);

  activeTab = signal<Tab>("snap");

  readonly cameraPlaceholders = CAMERA_PLACEHOLDERS;
  readonly almanacLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "long",
    day: "numeric",
  }).format(new Date());

  readonly lat = computed(() => {
    const c = this.city();
    return c ? parseFloat(c.properties.intptlat).toFixed(7) : "";
  });
  readonly lon = computed(() => {
    const c = this.city();
    return c ? Math.abs(parseFloat(c.properties.intptlon)).toFixed(7) : "";
  });
  readonly population = computed(() => {
    const c = this.city();
    return c?.population?.toLocaleString() || "(no data)";
  });
  readonly timesSearched = computed(() => {
    const c = this.city();
    return c?.timesSearched?.toLocaleString() || "0";
  });
  readonly mapPos = computed(() => {
    const c = this.city();
    if (!c) return { top: 50, left: 50 };
    const lat = parseFloat(c.properties.intptlat);
    const lon = parseFloat(c.properties.intptlon);
    return {
      left: ((lon - TX.west) / (TX.east - TX.west)) * 100,
      top: ((TX.north - lat) / (TX.north - TX.south)) * 100,
    };
  });
  readonly forecastRange = computed(() => {
    const w = this.weather();
    if (!w?.daily.length) return { min: 0, max: 100 };
    const min = Math.min(...w.daily.map((d) => d.lowF));
    const max = Math.max(...w.daily.map((d) => d.highF));
    return { min, max: max === min ? max + 1 : max };
  });

  constructor() {
    effect(() => {
      const name = this.cityName();
      this.loadCity(name);
      this.loadCameras(name);
      this.loadWeather(name);
      this.loadTransportation(name);
      recordSearch(name).catch(() => {});
    });
  }

  private async loadCity(name: string): Promise<void> {
    this.cityLoading.set(true);
    this.cityError.set(null);
    try {
      this.city.set(await getCity(name));
    } catch (err) {
      this.cityError.set(err instanceof Error ? err.message : "Request failed");
    } finally {
      this.cityLoading.set(false);
    }
  }

  private async loadCameras(name: string): Promise<void> {
    this.camsLoading.set(true);
    this.camsError.set(null);
    try {
      this.cameras.set(await getCamerasForCity(name));
    } catch (err) {
      this.camsError.set(err instanceof Error ? err.message : "Request failed");
    } finally {
      this.camsLoading.set(false);
    }
  }

  private async loadWeather(name: string): Promise<void> {
    this.weatherLoading.set(true);
    this.weatherError.set(null);
    try {
      this.weather.set(await getWeather(name));
    } catch (err) {
      this.weatherError.set(
        err instanceof Error ? err.message : "Request failed",
      );
    } finally {
      this.weatherLoading.set(false);
    }
  }

  private async loadTransportation(name: string): Promise<void> {
    this.transLoading.set(true);
    this.transError.set(null);
    try {
      this.transportation.set(await getTransportation(name));
    } catch (err) {
      this.transError.set(
        err instanceof Error ? err.message : "Request failed",
      );
    } finally {
      this.transLoading.set(false);
    }
  }

  wmoIcon(code: number, isDay: boolean): string {
    if (code === 0) return isDay ? "" : "";
    if (code <= 2) return isDay ? "" : "";
    if (code === 3) return "";
    if (code <= 48) return "";
    if (code <= 55) return "";
    if (code <= 65) return "";
    if (code <= 77) return "";
    if (code <= 82) return "";
    if (code <= 86) return "";
    return "";
  }

  wmoLabel(code: number): string {
    if (code === 0) return "Clear";
    if (code === 1) return "Mainly clear";
    if (code === 2) return "Partly cloudy";
    if (code === 3) return "Overcast";
    if (code <= 48) return "Fog";
    if (code <= 55) return "Drizzle";
    if (code <= 65) return "Rain";
    if (code <= 77) return "Snow";
    if (code <= 82) return "Showers";
    if (code <= 86) return "Snow showers";
    return "Thunderstorm";
  }

  hourLabel(time: string, i: number): string {
    if (i === 0) return "Now";
    const h = parseInt(time.slice(11, 13), 10);
    return h === 0
      ? "12am"
      : h < 12
        ? `${h}am`
        : h === 12
          ? "12pm"
          : `${h - 12}pm`;
  }

  dayLabel(date: string, i: number): string {
    if (i === 0) return "Today";
    const d = new Date(date + "T12:00:00");
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  }

  windDirLabel(deg: number): string {
    return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][
      Math.round(deg / 45) % 8
    ];
  }

  barLeft(day: WeatherDay): number {
    const { min, max } = this.forecastRange();
    return ((day.lowF - min) / (max - min)) * 100;
  }

  barWidth(day: WeatherDay): number {
    const { min, max } = this.forecastRange();
    return ((day.highF - day.lowF) / (max - min)) * 100;
  }
}
