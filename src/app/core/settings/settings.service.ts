import { Injectable, signal } from "@angular/core";
import { BaseDirectory, readTextFile } from "@tauri-apps/plugin-fs";
import { Settings } from "./settings.model";
import { FormGroup } from "@angular/forms";

@Injectable({
    providedIn: 'root',
})
export class SettingsService {
    clan = signal<string>('');
    character = signal<string>('');

    async loadSettings() {
        const text = await readTextFile('settings.json', {baseDir: BaseDirectory.AppLocalData});
        const data = JSON.parse(text) as Settings;
        this.clan.set(data.clan);
        this.character.set(data.character);
    }

    async saveSettings(form: FormGroup) {
        // do something
    }
}