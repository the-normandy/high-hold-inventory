import { Component, inject, OnInit, signal, viewChild } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
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
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";

const DOCUMENTATION_URL = 'https://github.com/the-normandy/high-hold-inventory';

@Component({
    selector: 'app-home',
    templateUrl: 'home.component.html',
    styleUrls: ['./home.component.css'],
    imports: [
        MatButtonModule, MatIconModule, RouterLink, UpdaterComponent,
        MatDialogModule
    ]
})
export class HomeComponent implements OnInit {

    async ngOnInit(): Promise<void> {
        this.appVersion.set(await getVersion());
        await this.offerInitialPricesFile();
        await this.loadSettings();
    }

    dialog = inject(MatDialog);
    dataService = inject(DataService);
    settings = inject(SettingsService);
    snackBar = inject(MatSnackBar);
    readonly appVersion = signal('');
    readonly updater = viewChild.required(UpdaterComponent);

    async openDocumentation(): Promise<void> {
        try {
            await openUrl(DOCUMENTATION_URL);
        } catch {
            this.snackBar.open('Unable to open the documentation.', 'OK', { duration: 3000 });
        }
    }

    async checkForUpdates(): Promise<void> {
        await this.updater().verifyUpdate(true);
    }

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