import { TestBed } from '@angular/core/testing';
import { UserService } from '../user/user.service';
import { LegacyDataMigrationService } from './legacy-data-migration.service';

const fsMocks = vi.hoisted(() => ({
    exists: vi.fn(),
    mkdir: vi.fn(),
    readFile: vi.fn(),
    readTextFile: vi.fn(),
    writeFile: vi.fn(),
    writeTextFile: vi.fn()
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
    BaseDirectory: { AppLocalData: 16 },
    exists: fsMocks.exists,
    mkdir: fsMocks.mkdir,
    readFile: fsMocks.readFile,
    readTextFile: fsMocks.readTextFile,
    writeFile: fsMocks.writeFile,
    writeTextFile: fsMocks.writeTextFile
}));

describe('LegacyDataMigrationService', () => {
    let service: LegacyDataMigrationService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{
                provide: UserService,
                useValue: {
                    clanFilePath: (file: string) => `data/server/clan/${file}`,
                    filePath: (file: string) => `data/server/clan/character/${file}`
                }
            }]
        });
        service = TestBed.inject(LegacyDataMigrationService);
        vi.clearAllMocks();
        fsMocks.mkdir.mockResolvedValue(undefined);
        fsMocks.writeFile.mockResolvedValue(undefined);
        fsMocks.writeTextFile.mockResolvedValue(undefined);
    });

    it('creates settings and reports legacy root files when no decision exists', async () => {
        fsMocks.readTextFile.mockRejectedValue(new Error('missing'));
        fsMocks.exists.mockImplementation(async (file: string) => file === 'prices.json' || file === 'ledger.json');

        const files = await service.findLegacyFiles();

        expect(files).toEqual(['prices.json', 'ledger.json']);
        expect(fsMocks.writeTextFile).toHaveBeenCalledWith(
            'data/settings.json',
            JSON.stringify({ hasMadeMigrationDecision: false }, null, 2),
            expect.any(Object)
        );
    });

    it('does not inspect legacy files after a recorded decision', async () => {
        fsMocks.readTextFile.mockResolvedValue(JSON.stringify({ hasMadeMigrationDecision: true }));

        expect(await service.findLegacyFiles()).toEqual([]);
        expect(fsMocks.exists).not.toHaveBeenCalled();
    });

    it('copies clan and character files to their correct destinations before recording the decision', async () => {
        fsMocks.readFile.mockImplementation(async (file: string) => new TextEncoder().encode(file));

        await service.migrate(['prices.json', 'webhook.json', 'ledger.json', 'ledger-commerce.json']);

        expect(fsMocks.writeFile.mock.calls.map(call => call[0])).toEqual([
            'data/server/clan/prices.json',
            'data/server/clan/webhook.json',
            'data/server/clan/character/ledger.json',
            'data/server/clan/character/ledger-commerce.json'
        ]);
        expect(new TextDecoder().decode(fsMocks.writeFile.mock.calls[0][1])).toBe('prices.json');
        expect(fsMocks.writeTextFile).toHaveBeenLastCalledWith(
            'data/settings.json',
            JSON.stringify({ hasMadeMigrationDecision: true }, null, 2),
            expect.any(Object)
        );
    });
});