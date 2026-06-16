import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  signal,
} from "@angular/core";
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
  private elementRef = inject(ElementRef);

  readonly themeMenuOpen = signal(false);

  readonly themes: { value: Theme; label: string; cls: string }[] = [
    { value: "green", label: "Green", cls: "sw-green" },
    { value: "orange", label: "Burnt orange", cls: "sw-orange" },
    { value: "maroon", label: "Maroon", cls: "sw-maroon" },
    { value: "purple", label: "Purple", cls: "sw-purple" },
  ];

  readonly activeTheme = computed(
    () =>
      this.themes.find((t) => t.value === this.themeService.theme()) ??
      this.themes[0],
  );

  toggleThemeMenu(): void {
    this.themeMenuOpen.update((open) => !open);
  }

  selectTheme(value: Theme): void {
    this.themeService.setTheme(value);
    this.themeMenuOpen.set(false);
  }

  goBack(): void {
    this.location.back();
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    if (!this.themeMenuOpen()) return;
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.themeMenuOpen.set(false);
    }
  }
}
