import { Component, inject, input } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Location } from '@angular/common'
import { ThemeService, type Theme } from '../../services/theme.service'

const THEMES: { value: Theme; label: string }[] = [
  { value: 'default',     label: 'Default Green' },
  { value: 'burntorange', label: 'Burnt Orange'  },
  { value: 'maroon',      label: 'Maroon'        },
  { value: 'purple',      label: 'Purple'        },
]

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './nav-bar.component.html',
})
export class NavBarComponent {
  readonly variant      = input<'home' | 'page'>('page')
  readonly themes       = THEMES
  readonly themeService = inject(ThemeService)
  private  location     = inject(Location)

  goBack(): void { this.location.back() }
}
