import { Component, input, signal, effect } from "@angular/core";
import { RouterLink } from "@angular/router";
import { getCamerasForCity } from "../../../../api/cameras";
import type { Camera } from "../../../../api/cameras";

const PLACEHOLDERS = Array.from({ length: 8 }, (_, i) => i);

@Component({
  selector: "app-snap-tab",
  standalone: true,
  imports: [RouterLink],
  styles: [
    `
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
    <div class="flex between center mb4">
      <h2 class="h-section">Live road cameras</h2>
    </div>
    @if (camsError()) {
      <p style="color: var(--accent)">{{ camsError() }}</p>
    }
    @if (!camsLoading() && !camsError() && cameras()?.length === 0) {
      <p class="muted">No cameras found near this city.</p>
    }
    <div class="cam-grid">
      @if (camsLoading()) {
        @for (i of placeholders; track i) {
          <article class="cam">
            <div class="cam-thumb"><span class="ph">Loading…</span></div>
            <div class="cam-meta"><span class="cam-id">&nbsp;</span></div>
          </article>
        }
      } @else {
        @for (cam of cameras() ?? []; track cam.icdId) {
          <article class="cam">
            <div class="cam-thumb">
              @if (cam.snapshot) {
                <img
                  [src]="'data:image/jpeg;base64,' + cam.snapshot"
                  [alt]="cam.icdId"
                />
              } @else {
                <div class="cam-unavailable">
                  <svg class="ic"><use href="#i-camera-off"></use></svg>
                  <span>Camera image unavailable</span>
                </div>
              }
            </div>
            <div class="cam-meta">
              <a [routerLink]="['/camera', cam.icdId]" class="cam-id">{{
                cam.icdId
              }}</a>
            </div>
          </article>
        }
      }
    </div>
    <p class="src-line mt5">
      Camera snapshots from the
      <a
        href="https://www.txdot.gov/discover/live-traffic-cameras.html"
        target="_blank"
        rel="noreferrer"
        >Texas Department of Transportation</a
      >.
    </p>
  `,
})
export class SnapTabComponent {
  readonly cityName = input.required<string>();
  cameras = signal<Camera[] | null>(null);
  camsLoading = signal(true);
  camsError = signal<string | null>(null);
  readonly placeholders = PLACEHOLDERS;

  constructor() {
    effect(() => {
      this.load(this.cityName());
    });
  }

  private async load(name: string): Promise<void> {
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
}
