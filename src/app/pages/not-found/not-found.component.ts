import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";
import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";

@Component({
  selector: "app-not-found",
  standalone: true,
  imports: [NavBarComponent, FooterComponent],
  templateUrl: "./not-found.component.html",
})
export class NotFoundComponent {
  readonly url = inject(Router).url;
}
