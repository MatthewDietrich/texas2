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
      .faq {
        display: flex;
        flex-direction: column;
        gap: var(--s5);
        max-width: 680px;
      }
      .faq-ans {
        font-size: 14px;
        color: var(--text-muted);
      }
      .faq-ans a {
        color: var(--accent);
        text-decoration: underline;
        text-underline-offset: 2px;
      }
    `,
  ],
})
export class AboutComponent {}
