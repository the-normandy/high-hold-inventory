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
import { FormGroup } from "@angular/forms";
import { MissingPricesDialogComponent } from "./missing-prices-dialog.component";
import { MatSnackBar } from "@angular/material/snack-bar";

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
        await this.offerInitialPricesFile();
        await this.loadSettings();
    }

    dialog = inject(MatDialog);
    dataService = inject(DataService);
    settings = inject(SettingsService);
    snackBar = inject(MatSnackBar);

    async offerInitialPricesFile(): Promise<void> {
        if (!this.dataService.isMissing()) {
            return;
        }

        const dialogRef = this.dialog.open(MissingPricesDialogComponent, {
            width: '460px',
            disableClose: true
        });
        const shouldCreate = await firstValueFrom(dialogRef.afterClosed()) as boolean;

        if (!shouldCreate) {
            return;
        }

        try {
            await this.dataService.createInitialFile();
            this.snackBar.open('prices.json created successfully.', 'OK', { duration: 2000 });
        } catch {
            this.snackBar.open('Failed to create prices.json.', 'OK', { duration: 3000 });
        }
    }

    async loadSettings(): Promise<void> {
        try {
            await this.settings.loadSettings();
        } catch {
            const dialogRef = this.dialog.open(SettingsDialogComponent, { width: '400px' });
            const data = await firstValueFrom(dialogRef.afterClosed()) as FormGroup | undefined;
            if (data) {
                await this.settings.saveSettings(data);
            }
        }
    }

    async dataSettings() {
        const dialogRef = this.dialog.open(WebhookDialogComponent, {
            width: '500px'
        });

        const url = await firstValueFrom(dialogRef.afterClosed());

        if (!url) {
            return;
        }

        await this.dataService.saveWebhook(url);
    }
}