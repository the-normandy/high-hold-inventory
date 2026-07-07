import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { RouterLink } from "@angular/router";
import { UpdaterComponent } from "./updater.component";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { DataService } from "../../core/data/data.service";
import { firstValueFrom } from "rxjs";
import { WebhookDialogComponent } from "../data/webhook-dialog.component";

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
    dataService = inject(DataService);

    async dataSettings() {
        const dialogRef = this.dialog.open(WebhookDialogComponent, {
            width: '800px'
        });

        const url = await firstValueFrom(dialogRef.afterClosed());

        if (!url) {
            return;
        }

        await this.dataService.saveWebhook(url);
    }
}