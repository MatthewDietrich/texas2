import { Injectable, signal, effect } from '@angular/core'

export type Theme = 'default' | 'burntorange' | 'maroon' | 'purple'

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>((localStorage.getItem('theme') as Theme) ?? 'default')

  constructor() {
    effect(() => {
      document.documentElement.setAttribute('data-theme', this.theme())
    })
  }

  setTheme(t: Theme): void {
    this.theme.set(t)
    localStorage.setItem('theme', t)
  }
}
