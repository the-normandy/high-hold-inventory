import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { RouterLink } from "@angular/router";
import { UpdaterComponent } from "./updater.component";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";

@Component({
    selector: 'app-home',
    templateUrl: 'home.component.html',
    styles: `:host { @apply flex-1; }`,
    imports: [
        MatCardModule, MatButtonModule, RouterLink, UpdaterComponent,
        MatDialogModule
    ]
})
export class HomeComponent {
    dialog = inject(MatDialog);

    dataSettings() {
        // Implement
    }
}