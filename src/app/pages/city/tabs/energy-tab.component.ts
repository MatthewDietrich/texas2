import { Component, input, signal, effect } from "@angular/core";
import { DatePipe, DecimalPipe } from "@angular/common";
import { getEnergy } from "../../../../api/energy";
import type { Energy, LoadForecastHour } from "../../../../api/energy";

@Component({
  selector: "app-energy-tab",
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  styles: [
    `
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
      .src-line {
        color: var(--text-subtle);
        font-size: 13px;
      }
      .src-line a {
        color: var(--text-muted);
        text-decoration: underline;
        text-underline-offset: 2px;
      }
    `,
  ],
  template: `
    @if (energyLoading()) {
      <p class="muted mt4">Loading electricity data…</p>
    } @else if (energyError()) {
      <p style="color: var(--accent)">{{ energyError() }}</p>
    } @else if (!energy()?.loadZone) {
      <p class="muted mt4">No ERCOT data available for this location.</p>
    } @else {
      @if (energy(); as e) {
        @if (e.loadForecast.length) {
          <h3 class="card-title mb4">Zone-wide load forecast</h3>
          <div class="card card-pad">
            <div class="forecast">
              @for (f of e.loadForecast; track f.intervalStart) {
                <div class="fc-row">
                  <span class="fc-day" style="width: 4rem">
                    {{ f.intervalStart | date: "h a" : "America/Chicago" }}
                  </span>
                  <span class="fc-temps">
                    @if (f.zoneMW != null) {
                      <span
                        >{{ f.zoneMW | number }}
                        <span class="lo">MW zone</span></span
                      >
                    }
                    <span
                      >{{ f.systemMW | number }}
                      <span class="lo">MW system</span></span
                    >
                  </span>
                </div>
              }
            </div>
          </div>
        } @else {
          <p class="muted mt4">
            <em>No load forecast data yet — check back shortly.</em>
          </p>
        }

        <p class="src-line mt5">
          Forecasts via
          <a href="https://gridstatus.io" target="_blank" rel="noreferrer"
            >GridStatus.io</a
          >
          · data from
          <a href="https://www.ercot.com" target="_blank" rel="noreferrer"
            >ERCOT</a
          >.
        </p>
      }
    }
  `,
})
export class EnergyTabComponent {
  readonly cityName = input.required<string>();
  energy = signal<Energy | null>(null);
  energyLoading = signal(true);
  energyError = signal<string | null>(null);

  constructor() {
    effect(() => {
      this.load(this.cityName());
    });
  }

  private async load(name: string): Promise<void> {
    this.energyLoading.set(true);
    this.energyError.set(null);
    try {
      this.energy.set(await getEnergy(name));
    } catch (err) {
      this.energyError.set(
        err instanceof Error ? err.message : "Request failed",
      );
    } finally {
      this.energyLoading.set(false);
    }
  }

  loadBarWidth(mw: number, forecast: { systemMW: number }[]): number {
    const max = Math.max(...forecast.map((f) => f.systemMW), 1);
    return Math.max(4, (mw / max) * 100);
  }
}
