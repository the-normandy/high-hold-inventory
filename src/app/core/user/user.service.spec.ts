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
    exists: fsMocks.exists,
    mkdir: fsMocks.mkdir,
    readTextFile: fsMocks.readTextFile,
    remove: fsMocks.remove,
    writeFile: fsMocks.writeFile,
    writeTextFile: fsMocks.writeTextFile
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
        const profile = await service.create({ name: ' John Johnson ', server: ' North America ', clan: ' Silver Sentinels ' });

        expect(profile).toEqual({
            name: 'John Johnson',
            server: 'North America',
            clan: 'Silver Sentinels',
            photo: '/avatar.png',
            clanPath: 'data/north-america/silver-sentinels',
            path: 'data/north-america/silver-sentinels/john-johnson'
        });
        expect(service.profile()).toBe(profile);
        expect(service.profiles()).toEqual([profile]);
        expect(service.filePath('ledger.json')).toBe('data/north-america/silver-sentinels/john-johnson/ledger.json');
        expect(service.clanFilePath('prices.json')).toBe('data/north-america/silver-sentinels/prices.json');
        expect(fsMocks.writeTextFile).toHaveBeenCalledWith(
            'data/profiles.json',
            expect.any(String),
            expect.any(Object)
        );
    });

    it('stores a cropped avatar in the character folder during creation', async () => {
        const avatar = new Uint8Array([1, 2, 3]);

        const profile = await service.create({ name: 'Character', server: 'Server', clan: 'Clan', avatar });

        expect(fsMocks.writeFile).toHaveBeenCalledWith('data/server/clan/character/avatar.png', avatar, {
            baseDir: 16
        });
        expect(profile.photo).toBe('data/server/clan/character/avatar.png');
    });

    it('replaces only the profile avatar', async () => {
        const profile = await service.create({ name: 'Character', server: 'Server', clan: 'Clan' });
        const avatar = new Uint8Array([4, 5, 6]);

        await service.updateAvatar(profile.path, avatar);

        expect(fsMocks.writeFile).toHaveBeenCalledWith('data/server/clan/character/avatar.png', avatar, {
            baseDir: 16
        });
        expect(service.profile()).toEqual({
            ...profile,
            photo: 'data/server/clan/character/avatar.png'
        });
    });

    it('persists the selected profile first', async () => {
        const first = await service.create({ name: 'First', server: 'Server', clan: 'Clan' });
        await service.create({ name: 'Second', server: 'Server', clan: 'Clan' });

        await service.switchProfile(first.path);

        expect(service.profile()).toBe(first);
        const persisted = JSON.parse(fsMocks.writeTextFile.mock.calls.at(-1)?.[1] as string);
        expect(persisted.map((profile: { path: string }) => profile.path)).toEqual([
            'data/server/clan/first',
            'data/server/clan/second'
        ]);
    });

    it('recursively deletes only the character folder', async () => {
        const profile = await service.create({ name: 'Character', server: 'Server', clan: 'Clan' });

        await service.deleteProfile(profile.path);

        expect(fsMocks.remove).toHaveBeenCalledWith('data/server/clan/character', {
            baseDir: 16,
            recursive: true
        });
        expect(service.profiles()).toEqual([]);
        expect(service.profile()).toBeNull();
    });
});