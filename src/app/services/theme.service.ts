import { Injectable, signal, computed, effect } from '@angular/core'

export type Theme = 'green' | 'orange' | 'maroon' | 'purple'
export type Mode  = 'light' | 'dark'

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>((localStorage.getItem('theme') as Theme) ?? 'green')
  readonly mode  = signal<Mode>((localStorage.getItem('mode')  as Mode)  ?? 'light')

  readonly mapSrc = computed(() =>
    `assets/maps/texas-${this.theme()}-${this.mode()}.png`
  )

  constructor() {
    effect(() => {
      const root = document.documentElement
      root.setAttribute('data-theme', this.theme())
      root.setAttribute('data-mode',  this.mode())
    })
  }

  setTheme(t: Theme): void {
    this.theme.set(t)
    localStorage.setItem('theme', t)
  }

  toggleMode(): void {
    const next = this.mode() === 'light' ? 'dark' : 'light'
    this.mode.set(next)
    localStorage.setItem('mode', next)
  }
}
