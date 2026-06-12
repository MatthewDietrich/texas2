import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="p-4 text-center">
      <ng-content />
      <p><a routerLink="/">Back to search</a></p>
      <small>&copy; Texas City Snapshot</small>
    </footer>
  `,
})
export class FooterComponent {}
