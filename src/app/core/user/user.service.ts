import { Injectable, signal } from '@angular/core';
import { BaseDirectory, mkdir, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { UserProfile } from './user.model';

const PROFILES_FILE = 'profiles.json';
const DEFAULT_CLAN = 'Solo';
const DEFAULT_PHOTO = '/avatar.png';

export interface UserProfileInput {
    name: string;
    clan?: string | null;
    photo?: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private readonly activeProfile = signal<UserProfile | null>(null);
    private profiles: UserProfile[] = [];

    readonly profile = this.activeProfile.asReadonly();

    async load(): Promise<void> {
        const text = await readTextFile(PROFILES_FILE, { baseDir: BaseDirectory.AppLocalData });
        const profiles = JSON.parse(text) as unknown;

        if (!Array.isArray(profiles) || profiles.length === 0 || !profiles.every(profile => this.isProfileInput(profile))) {
            throw new Error('profiles.json does not contain a valid profile.');
        }

        this.profiles = profiles.map(profile => this.createProfile(profile));
        this.activeProfile.set(this.profiles[0]);
    }

    async save(input: UserProfileInput): Promise<void> {
        const profile = this.createProfile(input, this.activeProfile()?.photo);

        await mkdir(profile.path, {
            baseDir: BaseDirectory.AppLocalData,
            recursive: true
        });
        const activePath = this.activeProfile()?.path;
        this.profiles = activePath
            ? this.profiles.map(existing => existing.path === activePath ? profile : existing)
            : [...this.profiles, profile];
        await writeTextFile(
            PROFILES_FILE,
            JSON.stringify(this.profiles, null, 2),
            { baseDir: BaseDirectory.AppLocalData }
        );
        this.activeProfile.set(profile);
    }

    filePath(fileName: string): string {
        const profile = this.activeProfile();
        if (!profile) {
            throw new Error('A user profile is required before accessing character data.');
        }

        return `${profile.path}/${fileName}`;
    }

    private createProfile(input: UserProfileInput, fallbackPhoto = DEFAULT_PHOTO): UserProfile {
        const name = input.name.trim();
        if (!name) {
            throw new Error('A character name is required.');
        }

        const clan = input.clan?.trim() || DEFAULT_CLAN;
        return {
            name,
            clan,
            photo: input.photo?.trim() || fallbackPhoto,
            path: `${this.toPathSegment(clan)}/${this.toPathSegment(name)}`
        };
    }

    private toPathSegment(value: string): string {
        const segment = value
            .trim()
            .toLocaleLowerCase()
            .replace(/\s+/g, '-');
        const encoded = encodeURIComponent(segment)
            .replace(/[!'()*]/g, character => `%${character.charCodeAt(0).toString(16)}`)
            .toLocaleLowerCase();

        return encoded === '.' || encoded === '..'
            ? encoded.replaceAll('.', '%2e')
            : encoded;
    }

    private isProfileInput(value: unknown): value is UserProfileInput {
        if (!value || typeof value !== 'object') {
            return false;
        }

        const profile = value as Partial<UserProfileInput>;
        return typeof profile.name === 'string'
            && profile.name.trim().length > 0
            && (profile.clan == null || typeof profile.clan === 'string')
            && (profile.photo == null || typeof profile.photo === 'string');
    }
}