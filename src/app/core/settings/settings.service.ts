import { inject, Injectable, signal } from "@angular/core";
import { BaseDirectory, readTextFile } from "@tauri-apps/plugin-fs";
import { Settings } from "./settings.model";
import { FormGroup } from "@angular/forms";
import { MatSnackBar } from "@angular/material/snack-bar";

@Injectable({
    providedIn: 'root',
})
export class SettingsService {
    clan = signal<string>('');
    character = signal<string>('');
    snackBar = inject(MatSnackBar);

    async loadSettings() {
        const text = await readTextFile('settings.json', {baseDir: BaseDirectory.AppLocalData});
        const data = JSON.parse(text) as Settings;
        this.clan.set(data.clan);
        this.character.set(data.character);
    }

    async saveSettings(form: FormGroup) {
        if (!form) {
            this.snackBar.open('Something went wrong with the settings.', 'OK', {duration: 2000});
            return;
        }

        const data = form.getRawValue() as Settings;
    }
}