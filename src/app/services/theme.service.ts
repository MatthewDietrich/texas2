import { Injectable, signal, computed, effect } from "@angular/core";

export type Theme = "green" | "orange" | "maroon" | "purple";
export type Mode = "light" | "dark";

function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable — preference won't persist
  }
}

@Injectable({ providedIn: "root" })
export class ThemeService {
  readonly theme = signal<Theme>((storageGet("theme") as Theme) ?? "green");
  readonly mode = signal<Mode>((storageGet("mode") as Mode) ?? "light");

  readonly mapSrc = computed(
    () => `assets/maps/texas-${this.theme()}-${this.mode()}.png`,
  );

  constructor() {
    effect(() => {
      const root = document.documentElement;
      root.setAttribute("data-theme", this.theme());
      root.setAttribute("data-mode", this.mode());
    });
  }

  setTheme(t: Theme): void {
    this.theme.set(t);
    storageSet("theme", t);
  }

  toggleMode(): void {
    const next = this.mode() === "light" ? "dark" : "light";
    this.mode.set(next);
    storageSet("mode", next);
  }
}
