import { Component, inject, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { RouterLink } from "@angular/router";
import { UpdaterComponent } from "./updater.component";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { DataService } from "../../core/data/data.service";
import { firstValueFrom } from "rxjs";
import { WebhookDialogComponent } from "../data/webhook-dialog.component";
import { SettingsService } from "../../core/settings/settings.service";
import { SettingsDialogComponent } from "./settings.component";

@Component({
    selector: 'app-home',
    templateUrl: 'home.component.html',
    styles: `:host { @apply flex-1; }`,
    imports: [
        MatCardModule, MatButtonModule, RouterLink, UpdaterComponent,
        MatDialogModule
    ]
})
export class HomeComponent implements OnInit {

    async ngOnInit(): Promise<void> {
        await this.loadSettings();
    }

    dialog = inject(MatDialog);
    dataService = inject(DataService);
    settings = inject(SettingsService);

    async loadSettings(): Promise<void> {
        try {
            this.settings.loadSettings();
        } catch {
            this.dialog.open(SettingsDialogComponent)
        }
    }

    async dataSettings() {
        const dialogRef = this.dialog.open(WebhookDialogComponent, {
            width: '500px'
        });

        const form = await firstValueFrom(dialogRef.afterClosed());

        if (!form) {
            // do something
        }

        await this.settings.saveSettings(form);
    }
}