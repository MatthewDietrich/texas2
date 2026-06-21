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
import { getWeather } from "../../../api/weather";
import type { City } from "../../../api/cities";
import type { Weather } from "../../../api/weather";
import { SnapTabComponent } from "./tabs/snap-tab.component";
import { WeatherTabComponent } from "./tabs/weather-tab.component";
import { WaterTabComponent } from "./tabs/water-tab.component";
import { InfraTabComponent } from "./tabs/infra-tab.component";
import { EnergyTabComponent } from "./tabs/energy-tab.component";

type Tab = "snap" | "weather" | "water" | "infra" | "energy";

const TX = { north: 36.5, south: 25.84, west: -106.65, east: -93.51 };

@Component({
  selector: "app-city",
  standalone: true,
  imports: [
    RouterLink,
    NavBarComponent,
    FooterComponent,
    SnapTabComponent,
    WeatherTabComponent,
    WaterTabComponent,
    InfraTabComponent,
    EnergyTabComponent,
  ],
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
  weather = signal<Weather | null>(null);
  weatherLoading = signal(true);
  weatherError = signal<string | null>(null);

  activeTab = signal<Tab>("snap");

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

  constructor() {
    effect(() => {
      const name = this.cityName();
      this.loadCity(name);
      this.loadWeather(name);
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

  private async loadWeather(name: string): Promise<void> {
    this.weatherLoading.set(true);
    this.weatherError.set(null);
    try {
      this.weather.set(await getWeather(name));
    } catch (err) {
      this.weatherError.set(err instanceof Error ? err.message : "Request failed");
    } finally {
      this.weatherLoading.set(false);
    }
  }
}
