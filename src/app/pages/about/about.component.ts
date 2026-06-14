import { Component } from "@angular/core";
import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";

@Component({
  selector: "app-about",
  standalone: true,
  imports: [NavBarComponent, FooterComponent],
  templateUrl: "./about.component.html",
  styles: [
    `
      .about-wrap {
        max-width: 820px;
        margin: 0 auto;
        padding: var(--s7) 0 var(--s8);
      }
      .about-hero {
        margin-bottom: var(--s7);
      }
    `,
  ],
})
export class AboutComponent {}
