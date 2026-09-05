import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';

const fsMocks = vi.hoisted(() => ({
    exists: vi.fn(),
    mkdir: vi.fn(),
    readTextFile: vi.fn(),
    remove: vi.fn(),
    writeFile: vi.fn(),
    writeTextFile: vi.fn()
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
    BaseDirectory: { AppLocalData: 16 },
    ...fsMocks
}));

describe('UserService', () => {
    let service: UserService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(UserService);
        vi.clearAllMocks();
        fsMocks.exists.mockResolvedValue(true);
        fsMocks.mkdir.mockResolvedValue(undefined);
        fsMocks.remove.mockResolvedValue(undefined);
        fsMocks.writeFile.mockResolvedValue(undefined);
        fsMocks.writeTextFile.mockResolvedValue(undefined);
    });

    it('creates immutable profile paths and makes the new profile active', async () => {
        const profile = await service.create({ name: ' John Johnson ', clan: ' Silver Sentinels ' });

        expect(profile).toEqual({
            name: 'John Johnson',
            clan: 'Silver Sentinels',
            photo: '/avatar.png',
            clanPath: 'silver-sentinels',
            path: 'silver-sentinels/john-johnson'
        });
        expect(service.profile()).toBe(profile);
        expect(service.profiles()).toEqual([profile]);
    });

    it('stores a cropped avatar in the character folder during creation', async () => {
        const avatar = new Uint8Array([1, 2, 3]);

        const profile = await service.create({ name: 'Character', clan: 'Clan', avatar });

        expect(fsMocks.writeFile).toHaveBeenCalledWith('clan/character/avatar.png', avatar, {
            baseDir: 16
        });
        expect(profile.photo).toBe('clan/character/avatar.png');
    });

    it('replaces only the profile avatar', async () => {
        const profile = await service.create({ name: 'Character', clan: 'Clan' });
        const avatar = new Uint8Array([4, 5, 6]);

        await service.updateAvatar(profile.path, avatar);

        expect(fsMocks.writeFile).toHaveBeenCalledWith('clan/character/avatar.png', avatar, {
            baseDir: 16
        });
        expect(service.profile()).toEqual({
            ...profile,
            photo: 'clan/character/avatar.png'
        });
    });

    it('persists the selected profile first', async () => {
        const first = await service.create({ name: 'First', clan: 'Clan' });
        await service.create({ name: 'Second', clan: 'Clan' });

        await service.switchProfile(first.path);

        expect(service.profile()).toBe(first);
        const persisted = JSON.parse(fsMocks.writeTextFile.mock.calls.at(-1)?.[1] as string);
        expect(persisted.map((profile: { path: string }) => profile.path)).toEqual([
            'clan/first',
            'clan/second'
        ]);
    });

    it('recursively deletes only the character folder', async () => {
        const profile = await service.create({ name: 'Character', clan: 'Clan' });

        await service.deleteProfile(profile.path);

        expect(fsMocks.remove).toHaveBeenCalledWith('clan/character', {
            baseDir: 16,
            recursive: true
        });
        expect(service.profiles()).toEqual([]);
        expect(service.profile()).toBeNull();
    });
});