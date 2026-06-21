import { Component, input, computed } from "@angular/core";
import type { Weather, WeatherDay } from "../../../../api/weather";

@Component({
  selector: "app-weather-tab",
  standalone: true,
  styles: [
    `
      .wx-2col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--s5);
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
      @media (max-width: 760px) {
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
  template: `
    @if (loading()) {
      <p class="muted mt4">Loading weather…</p>
    } @else if (error()) {
      <p style="color: var(--accent)">{{ error() }}</p>
    } @else {
      @if (weather(); as w) {
        <div class="card card-pad mb5">
          <div class="now-card">
            <div class="now-temp">
              <span class="wi">{{
                wmoIcon(w.current.weatherCode, w.current.isDay)
              }}</span>
              <div>
                <div class="deg">{{ w.current.tempF }}°</div>
                <div class="cond">
                  <div class="c">{{ wmoLabel(w.current.weatherCode) }}</div>
                  <div class="f">Feels like {{ w.current.feelsLikeF }}°</div>
                </div>
              </div>
            </div>
            <div class="now-grid">
              <div class="metric">
                <span class="k"><span class="wi">&#xf07a;</span> Humidity</span>
                <span class="v">{{ w.current.humidity }}%</span>
              </div>
              <div class="metric">
                <span class="k"><span class="wi">&#xf04e;</span> Precip.</span>
                <span class="v">{{ w.current.precipProbability }}%</span>
              </div>
              <div class="metric">
                <span class="k"
                  ><span class="wi">&#xf041;</span> Cloud cover</span
                >
                <span class="v">{{ w.current.cloudCover }}%</span>
              </div>
              <div class="metric">
                <span class="k"><span class="wi">&#xf050;</span> Wind</span>
                <span class="v"
                  >{{ w.current.windMph }} mph
                  {{ windDirLabel(w.current.windDir) }}</span
                >
              </div>
              <div class="metric">
                <span class="k"><span class="wi">&#xf079;</span> Pressure</span>
                <span class="v">{{ w.current.pressureMb }} mb</span>
              </div>
              <div class="metric">
                <span class="k"
                  ><span class="wi">&#xf055;</span> Dew point</span
                >
                <span class="v">{{ w.current.dewPointF }}°</span>
              </div>
            </div>
          </div>
        </div>

        <h3 class="card-title mb4">Next 12 hours</h3>
        <div class="hourly mb6">
          @for (h of w.hourly; track h.time; let i = $index) {
            <div class="hour" [class.peak]="i === 0">
              <div class="t">{{ hourLabel(h.time, i) }}</div>
              <span class="wi">{{ wmoIcon(h.weatherCode, h.isDay) }}</span>
              <div class="deg">{{ h.tempF }}°</div>
              <div class="pp">{{ h.precipProbability }}%</div>
            </div>
          }
        </div>

        <div class="wx-2col">
          <div>
            <h3 class="card-title mb4">7-day forecast</h3>
            <div class="card card-pad">
              <div class="forecast">
                @for (f of w.daily; track f.date; let i = $index) {
                  <div class="fc-row">
                    <span class="fc-day">{{ dayLabel(f.date, i) }}</span>
                    <span class="wi">{{ wmoIcon(f.weatherCode, true) }}</span>
                    <span
                      class="fc-bar"
                      [style.margin-left.%]="barLeft(f)"
                      [style.width.%]="barWidth(f)"
                    ></span>
                    <span class="fc-temps">
                      <span>{{ f.highF }}°</span>
                      <span class="lo">{{ f.lowF }}°</span>
                    </span>
                  </div>
                }
              </div>
            </div>
          </div>
          <div>
            <h3 class="card-title mb4">Almanac for {{ almanacLabel }}</h3>
            <div class="card card-pad">
              <table class="dtable" style="font-size: 14px">
                <thead>
                  <tr>
                    <th></th>
                    <th class="num">1 yr</th>
                    <th class="num">5 yr</th>
                    <th class="num">10 yr</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>High</td>
                    <td class="num">
                      {{ w.almanac.yr1 ? w.almanac.yr1.highF + "°" : "—" }}
                    </td>
                    <td class="num">
                      {{ w.almanac.yr5 ? w.almanac.yr5.highF + "°" : "—" }}
                    </td>
                    <td class="num">
                      {{ w.almanac.yr10 ? w.almanac.yr10.highF + "°" : "—" }}
                    </td>
                  </tr>
                  <tr>
                    <td>Low</td>
                    <td class="num">
                      {{ w.almanac.yr1 ? w.almanac.yr1.lowF + "°" : "—" }}
                    </td>
                    <td class="num">
                      {{ w.almanac.yr5 ? w.almanac.yr5.lowF + "°" : "—" }}
                    </td>
                    <td class="num">
                      {{ w.almanac.yr10 ? w.almanac.yr10.lowF + "°" : "—" }}
                    </td>
                  </tr>
                  <tr>
                    <td>Precip.</td>
                    <td class="num">
                      {{ w.almanac.yr1 ? w.almanac.yr1.precipIn + '"' : "—" }}
                    </td>
                    <td class="num">
                      {{ w.almanac.yr5 ? w.almanac.yr5.precipIn + '"' : "—" }}
                    </td>
                    <td class="num">
                      {{ w.almanac.yr10 ? w.almanac.yr10.precipIn + '"' : "—" }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }
    }
    <p class="src-line mt5">
      Forecasts by
      <a href="https://open-meteo.com" target="_blank" rel="noreferrer"
        >Open-Meteo</a
      >
      · Alerts by the
      <a href="https://weather.gov/alerts" target="_blank" rel="noreferrer"
        >National Weather Service</a
      >.
    </p>
  `,
})
export class WeatherTabComponent {
  readonly weather = input<Weather | null>(null);
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  readonly almanacLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "long",
    day: "numeric",
  }).format(new Date());

  readonly forecastRange = computed(() => {
    const w = this.weather();
    if (!w?.daily.length) return { min: 0, max: 100 };
    const min = Math.min(...w.daily.map((d) => d.lowF));
    const max = Math.max(...w.daily.map((d) => d.highF));
    return { min, max: max === min ? max + 1 : max };
  });

  wmoIcon(code: number, isDay: boolean): string {
    if (code === 0) return isDay ? "" : "";
    if (code <= 2) return isDay ? "" : "";
    if (code === 3) return "";
    if (code <= 48) return "";
    if (code <= 55) return "";
    if (code <= 65) return "";
    if (code <= 77) return "";
    if (code <= 82) return "";
    if (code <= 86) return "";
    return "";
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
