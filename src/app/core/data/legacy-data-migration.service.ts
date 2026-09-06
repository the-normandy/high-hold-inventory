import { inject, Injectable } from '@angular/core';
import { BaseDirectory, exists, mkdir, readFile, readTextFile, writeFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { UserService } from '../user/user.service';

const SETTINGS_FILE = 'data/settings.json';
const LEGACY_FILES = ['prices.json', 'ledger.json', 'ledger-commerce.json', 'webhook.json'] as const;

interface AppSettings {
    hasMadeMigrationDecision: boolean;
}

export type LegacyFile = typeof LEGACY_FILES[number];

@Injectable({ providedIn: 'root' })
export class LegacyDataMigrationService {
    private readonly user = inject(UserService);

    async findLegacyFiles(): Promise<readonly LegacyFile[]> {
        const settings = await this.loadOrCreateSettings();
        if (settings.hasMadeMigrationDecision) return [];

        const checks = await Promise.all(
            LEGACY_FILES.map(async file => ({
                file,
                exists: await exists(file, { baseDir: BaseDirectory.AppLocalData })
            }))
        );
        return checks.filter(check => check.exists).map(check => check.file);
    }

    async migrate(files: readonly LegacyFile[]): Promise<void> {
        for (const file of files) {
            const contents = await readFile(file, { baseDir: BaseDirectory.AppLocalData });
            await writeFile(this.destinationFor(file), contents, { baseDir: BaseDirectory.AppLocalData });
        }
        await this.completeDecision();
    }

    async completeDecision(): Promise<void> {
        await this.writeSettings({ hasMadeMigrationDecision: true });
    }

    private destinationFor(file: LegacyFile): string {
        return file === 'prices.json' || file === 'webhook.json'
            ? this.user.clanFilePath(file)
            : this.user.filePath(file);
    }

    private async loadOrCreateSettings(): Promise<AppSettings> {
        try {
            const text = await readTextFile(SETTINGS_FILE, { baseDir: BaseDirectory.AppLocalData });
            const settings = JSON.parse(text) as Partial<AppSettings>;
            return { hasMadeMigrationDecision: settings.hasMadeMigrationDecision === true };
        } catch {
            const settings = { hasMadeMigrationDecision: false };
            await this.writeSettings(settings);
            return settings;
        }
    }

    private async writeSettings(settings: AppSettings): Promise<void> {
        await mkdir('data', { baseDir: BaseDirectory.AppLocalData, recursive: true });
        await writeTextFile(
            SETTINGS_FILE,
            JSON.stringify(settings, null, 2),
            { baseDir: BaseDirectory.AppLocalData }
        );
    }
}