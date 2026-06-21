import { Component, input } from "@angular/core";
import type { City } from "../../../../api/cities";

@Component({
  selector: "app-water-tab",
  standalone: true,
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
    <div class="flex between center mb5">
      <h2 class="h-section">Reservoirs near {{ city()?.properties?.name }}</h2>
      <span class="subtle mono" style="font-size: 13px">updated 24h ago</span>
    </div>
    @if (city()?.reservoirs?.length) {
      <div class="card card-pad">
        <div class="res">
          @for (r of city()!.reservoirs!; track r.name) {
            <div class="res-row">
              <div class="res-head">
                <div>
                  <span class="res-name">{{ r.name }}</span>
                  @if (r.nearestCity) {
                    <span class="res-near"> near {{ r.nearestCity }}</span>
                  }
                </div>
                <span class="res-pct">
                  @if (r.percentFull != null) {
                    {{ r.percentFull }}%
                  } @else {
                    —
                  }
                </span>
              </div>
              <div class="res-track">
                <div
                  class="res-fill"
                  [style.width.%]="r.percentFull ?? 0"
                ></div>
              </div>
            </div>
          }
        </div>
      </div>
    } @else {
      <p class="muted"><em>No reservoir data available.</em></p>
    }
    <p class="src-line mt5">
      Source:
      <a href="https://waterdatafortexas.org" target="_blank" rel="noreferrer"
        >Water Data for Texas</a
      >.
    </p>
  `,
})
export class WaterTabComponent {
  readonly city = input<City | null>(null);
}
