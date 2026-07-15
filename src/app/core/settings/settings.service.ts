import { inject, Injectable, signal } from "@angular/core";
import { BaseDirectory, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
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
        const data = (form?.getRawValue() ?? {}) as Settings;

        const normalize = (value?: string, fallback = '') => {
            const text = value?.trim() || fallback;
            return text.charAt(0).toUpperCase() + text.slice(1);
        };

        data.character = normalize(data.character, 'Unknown');
        data.clan = normalize(data.clan, 'Unnamed');

        try {
            await writeTextFile('settings.json', 
                JSON.stringify(data, null, 2), 
                { baseDir: BaseDirectory.AppLocalData }
            );
            await this.loadSettings();
        } catch {
            this.snackBar.open('Something went wrong with the settings.', 'OK', {duration: 2000})
        }
    }
}