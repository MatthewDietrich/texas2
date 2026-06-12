import { Component } from '@angular/core'
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component'
import { FooterComponent } from '../../components/footer/footer.component'

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [NavBarComponent, FooterComponent],
  templateUrl: './about.component.html',
})
export class AboutComponent {}
