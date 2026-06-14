import { Component, inject, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { Location } from "@angular/common";
import { ThemeService, type Theme } from "../../services/theme.service";

@Component({
  selector: "app-nav-bar",
  standalone: true,
  imports: [RouterLink],
  templateUrl: "./nav-bar.component.html",
})
export class NavBarComponent {
  readonly variant = input<"home" | "page">("page");
  readonly themeService = inject(ThemeService);
  private location = inject(Location);

  readonly themes: { value: Theme; label: string; cls: string }[] = [
    { value: "green", label: "Green", cls: "sw-green" },
    { value: "orange", label: "Burnt orange", cls: "sw-orange" },
    { value: "maroon", label: "Maroon", cls: "sw-maroon" },
    { value: "purple", label: "Purple", cls: "sw-purple" },
  ];

  goBack(): void {
    this.location.back();
  }
}
