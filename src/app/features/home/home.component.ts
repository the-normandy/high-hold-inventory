import { Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { RouterLink } from "@angular/router";

@Component({
    selector: 'app-home',
    templateUrl: 'home.component.html',
    styles: `:host { @apply flex-1; }`,
    imports: [
        MatCardModule, MatButtonModule, RouterLink
    ]
})
export class HomeComponent {

}