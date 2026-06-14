import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-footer",
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="foot">
      <div class="wrap">
        <ng-content />
      </div>
    </footer>
  `,
})
export class FooterComponent {}
