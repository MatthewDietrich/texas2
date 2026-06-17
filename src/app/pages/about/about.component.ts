import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";

@Component({
  selector: "app-about",
  standalone: true,
  imports: [RouterLink, NavBarComponent, FooterComponent],
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
      .dataset-list {
        display: flex;
        flex-direction: column;
        gap: var(--s5);
      }
      .dataset-list h4 {
        font-size: 14px;
        font-weight: 600;
        margin: 0 0 var(--s2);
      }
      .dataset-list a {
        display: block;
        font-size: 13px;
        margin-bottom: var(--s1);
      }
      .about-wrap a {
        color: var(--accent);
        text-decoration: none;
      }
    `,
  ],
})
export class AboutComponent {}
