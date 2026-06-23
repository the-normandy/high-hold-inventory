import { Component } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { RouterLink } from "@angular/router";
import { MatAnchor } from "@angular/material/button";

@Component({
    selector: 'app-actions',
    templateUrl: 'actions.component.html',
    styles: ':host { @apply flex-1; }',
    imports: [MatCardModule, RouterLink, MatAnchor]
})
export class ActionsComponent {

}