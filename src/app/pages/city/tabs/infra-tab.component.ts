import { Component, input, signal, effect } from "@angular/core";
import { DecimalPipe } from "@angular/common";
import { getTransportation } from "../../../../api/transportation";
import type { Transportation } from "../../../../api/transportation";
import { getWells } from "../../../../api/wells";
import type { Well } from "../../../../api/wells";
import type { City } from "../../../../api/cities";

@Component({
  selector: "app-infra-tab",
  standalone: true,
  imports: [DecimalPipe],
  styles: [
    `
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
      .src-line {
        color: var(--text-subtle);
        font-size: 13px;
      }
      .src-line a {
        color: var(--text-muted);
        text-decoration: underline;
        text-underline-offset: 2px;
      }
      .well-grid {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 0 var(--s4);
        align-items: baseline;
      }
      .well-grid .drow {
        display: contents;
      }
      .well-grid .drow > * {
        padding: var(--s3) 0;
        border-bottom: 1px solid var(--border);
      }
      .well-grid .drow:last-child > * {
        border-bottom: none;
      }
      .wtag {
        font-size: 12px;
        color: var(--text-muted);
        white-space: nowrap;
      }
      @media (max-width: 760px) {
        .wx-2col {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  template: `
    @if (transLoading()) {
      <p class="muted mt4">Loading transportation data…</p>
    } @else if (transError()) {
      <p style="color: var(--accent)">{{ transError() }}</p>
    } @else {
      <div class="wx-2col">
        <div>
          <h3 class="card-title mb4">Nearest airports</h3>
          <div class="card card-pad">
            @if (transportation()?.airports?.length) {
              <div class="dlist">
                @for (a of transportation()!.airports; track a.name) {
                  <div class="drow">
                    <span class="dname">{{ a.name }}</span>
                    <span class="ddist">{{ a.distanceMiles }} mi</span>
                  </div>
                }
              </div>
            } @else {
              <p class="muted"><em>No nearby airports found.</em></p>
            }
          </div>
        </div>
        <div>
          <h3 class="card-title mb4">Nearest highways</h3>
          <div class="card card-pad">
            @if (transportation()?.highways?.length) {
              <div class="dlist">
                @for (h of transportation()!.highways; track h.name) {
                  <div class="drow">
                    <span class="dname">{{ h.name }}</span>
                    <span class="ddist">{{ h.distanceMiles }} mi</span>
                  </div>
                }
              </div>
            } @else {
              <p class="muted"><em>No nearby highways found.</em></p>
            }
          </div>
        </div>
      </div>
      @if (city()?.sirens?.length) {
        <div class="mt5">
          <h3 class="card-title mb4">Outdoor warning sirens</h3>
          <div class="card card-pad">
            <div class="dlist">
              @for (s of city()!.sirens!; track s.name) {
                <div class="drow">
                  <div>
                    <span class="dname">{{ s.name }}</span>
                    @if (s.description) {
                      <p
                        class="muted"
                        style="font-size: 0.85em; margin: 0.15em 0 0"
                      >
                        {{ s.description }}
                      </p>
                    }
                  </div>
                  <span class="ddist" style="white-space: nowrap">
                    {{ s.lat | number: "1.4-4" }}, {{ s.lon | number: "1.4-4" }}
                  </span>
                </div>
              }
            </div>
          </div>
          <p class="src-line mt5">
            Source:
            <a
              href="https://www.google.com/maps/d/u/0/viewer?mid=1fRAxrc0b1Wng0PRe3d9x9mzQD6s"
              target="_blank"
              rel="noreferrer"
              >Texas Statewide Siren Map</a
            >.
          </p>
        </div>
      }
      <div class="mt5">
        <h3 class="card-title mb4">
          Oil &amp; gas wells
          @if (wells()?.length) {
            <span class="ddist">({{ wells()!.length }})</span>
          }
        </h3>
        @if (wellsLoading()) {
          <p class="muted">Loading wells data…</p>
        } @else if (wellsError()) {
          <p style="color: var(--accent)">{{ wellsError() }}</p>
        } @else if (!wells()?.length) {
          <div class="card card-pad">
            <p class="muted"><em>No wells found within city boundary.</em></p>
          </div>
        } @else {
          <div class="card card-pad">
            <div class="well-grid">
              @for (w of wells()!; track w.api) {
                <div class="drow">
                  <span class="dname">
                    {{ w.attributes["LEASE_NAME"] || w.api }}
                    @if (w.attributes["WELL_NO"]) {
                      <span class="wtag">&nbsp;#{{ w.attributes["WELL_NO"] }}</span>
                    }
                  </span>
                  <span class="wtag">{{ w.status?.wellType ?? "—" }}</span>
                  <span class="wtag">{{ w.status?.status ?? "—" }}</span>
                </div>
              }
            </div>
          </div>
          <p class="src-line mt5">
            Source:
            <a
              href="https://www.rrc.texas.gov/"
              target="_blank"
              rel="noreferrer"
              >Texas Railroad Commission</a
            >.
          </p>
        }
      </div>
    }
  `,
})
export class InfraTabComponent {
  readonly cityName = input.required<string>();
  readonly city = input<City | null>(null);
  transportation = signal<Transportation | null>(null);
  transLoading = signal(true);
  transError = signal<string | null>(null);
  wells = signal<Well[] | null>(null);
  wellsLoading = signal(true);
  wellsError = signal<string | null>(null);

  constructor() {
    effect(() => {
      const name = this.cityName();
      this.loadTransportation(name);
      this.loadWells(name);
    });
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

  private async loadWells(name: string): Promise<void> {
    this.wellsLoading.set(true);
    this.wellsError.set(null);
    try {
      this.wells.set(await getWells(name));
    } catch (err) {
      this.wellsError.set(
        err instanceof Error ? err.message : "Request failed",
      );
    } finally {
      this.wellsLoading.set(false);
    }
  }
}
