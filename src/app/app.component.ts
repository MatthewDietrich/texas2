import { Component, inject, OnInit } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { ThemeService } from './services/theme.service'
import { IconService } from './services/icon.service'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AppComponent implements OnInit {
  readonly _ = inject(ThemeService)
  private icons = inject(IconService)

  ngOnInit(): void {
    this.icons.inject()
  }
}
