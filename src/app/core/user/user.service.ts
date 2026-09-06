import { Injectable, signal } from '@angular/core';
import { BaseDirectory, exists, mkdir, readTextFile, remove, writeFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { UserProfile } from './user.model';

const DATA_DIRECTORY = 'data';
const PROFILES_FILE = `${DATA_DIRECTORY}/profiles.json`;
const DEFAULT_CLAN = 'Solo';
const DEFAULT_PHOTO = '/avatar.png';

export interface UserProfileInput {
    name: string;
    server: string;
    clan?: string | null;
    photo?: string | null;
    avatar?: Uint8Array;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private readonly activeProfile = signal<UserProfile | null>(null);
    private readonly profileList = signal<readonly UserProfile[]>([]);
    private readonly avatarChange = signal(0);

    readonly profile = this.activeProfile.asReadonly();
    readonly profiles = this.profileList.asReadonly();
    readonly avatarRevision = this.avatarChange.asReadonly();

    async load(): Promise<void> {
        const text = await readTextFile(PROFILES_FILE, { baseDir: BaseDirectory.AppLocalData });
        const profiles = JSON.parse(text) as unknown;

        if (!Array.isArray(profiles) || profiles.length === 0 || !profiles.every(profile => this.isProfileInput(profile))) {
            throw new Error('profiles.json does not contain a valid profile.');
        }

        const loadedProfiles = profiles.map(profile => this.buildProfile(profile));
        this.profileList.set(loadedProfiles);
        this.activeProfile.set(loadedProfiles[0]);
    }

    async create(input: UserProfileInput): Promise<UserProfile> {
        const profile = this.buildProfile(input);
        if (this.profileList().some(existing => existing.path === profile.path)) {
            throw new Error('A profile for this character, clan, and server already exists.');
        }

        await mkdir(profile.path, {
            baseDir: BaseDirectory.AppLocalData,
            recursive: true
        });
        if (input.avatar) {
            await writeFile(profile.photo, input.avatar, { baseDir: BaseDirectory.AppLocalData });
        }

        const profiles = [profile, ...this.profileList()];
        await this.persist(profiles);
        this.profileList.set(profiles);
        this.activeProfile.set(profile);
        return profile;
    }

    async updateAvatar(path: string, avatar: Uint8Array): Promise<void> {
        const profile = this.profileList().find(candidate => candidate.path === path);
        if (!profile) {
            throw new Error('Profile not found.');
        }

        const photo = `${profile.path}/avatar.png`;
        await writeFile(photo, avatar, { baseDir: BaseDirectory.AppLocalData });
        const updatedProfile = { ...profile, photo };
        const profiles = this.profileList().map(candidate => candidate.path === path ? updatedProfile : candidate);
        await this.persist(profiles);
        this.profileList.set(profiles);
        if (this.activeProfile()?.path === path) {
            this.activeProfile.set(updatedProfile);
        }
        this.avatarChange.update(revision => revision + 1);
    }

    async switchProfile(path: string): Promise<void> {
        const profile = this.profileList().find(candidate => candidate.path === path);
        if (!profile || profile.path === this.activeProfile()?.path) {
            return;
        }

        const profiles = [profile, ...this.profileList().filter(candidate => candidate.path !== path)];
        await this.persist(profiles);
        this.profileList.set(profiles);
        this.activeProfile.set(profile);
    }

    async deleteProfile(path: string): Promise<void> {
        const profile = this.profileList().find(candidate => candidate.path === path);
        if (!profile) {
            throw new Error('Profile not found.');
        }

        if (await exists(profile.path, { baseDir: BaseDirectory.AppLocalData })) {
            await remove(profile.path, { baseDir: BaseDirectory.AppLocalData, recursive: true });
        }

        const profiles = this.profileList().filter(candidate => candidate.path !== path);
        await this.persist(profiles);
        this.profileList.set(profiles);
        if (this.activeProfile()?.path === path) {
            this.activeProfile.set(profiles[0] ?? null);
        }
    }

    filePath(fileName: string): string {
        const profile = this.activeProfile();
        if (!profile) {
            throw new Error('A user profile is required before accessing character data.');
        }

        return `${profile.path}/${fileName}`;
    }

    clanFilePath(fileName: string): string {
        const profile = this.activeProfile();
        if (!profile) {
            throw new Error('A user profile is required before accessing clan data.');
        }

        return `${profile.clanPath}/${fileName}`;
    }

    private buildProfile(input: UserProfileInput): UserProfile {
        const name = input.name.trim();
        if (!name) {
            throw new Error('A character name is required.');
        }

        const server = input.server.trim();
        if (!server) {
            throw new Error('A server name is required.');
        }

        const clan = input.clan?.trim() || DEFAULT_CLAN;
        const clanPath = `${DATA_DIRECTORY}/${this.toPathSegment(server)}/${this.toPathSegment(clan)}`;
        const path = `${clanPath}/${this.toPathSegment(name)}`;
        return {
            name,
            server,
            clan,
            photo: input.avatar ? `${path}/avatar.png` : input.photo?.trim() || DEFAULT_PHOTO,
            clanPath,
            path
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
            && typeof profile.server === 'string'
            && profile.server.trim().length > 0
            && (profile.clan == null || typeof profile.clan === 'string')
            && (profile.photo == null || typeof profile.photo === 'string');
    }

    private persist(profiles: readonly UserProfile[]): Promise<void> {
        return mkdir(DATA_DIRECTORY, { baseDir: BaseDirectory.AppLocalData, recursive: true })
            .then(() => writeTextFile(
                PROFILES_FILE,
                JSON.stringify(profiles, null, 2),
                { baseDir: BaseDirectory.AppLocalData }
            ));
    }
}