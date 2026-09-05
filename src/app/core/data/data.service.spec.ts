import { TestBed } from '@angular/core/testing';
import { UserService } from '../user/user.service';
import { DataService } from './data.service';

const fsMocks = vi.hoisted(() => ({
    exists: vi.fn(),
    readTextFile: vi.fn(),
    writeTextFile: vi.fn()
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
    exists: fsMocks.exists,
    readTextFile: fsMocks.readTextFile,
    writeTextFile: fsMocks.writeTextFile
}));

describe('DataService clan initialization', () => {
    let service: DataService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{
                provide: UserService,
                useValue: { clanFilePath: (fileName: string) => `silver-sentinels/${fileName}` }
            }]
        });
        service = TestBed.inject(DataService);
        vi.clearAllMocks();
        fsMocks.writeTextFile.mockResolvedValue(undefined);
    });

    it('does not overwrite an existing clan prices file', async () => {
        fsMocks.exists.mockResolvedValue(true);

        await service.ensureInitialFile();

        expect(fsMocks.writeTextFile).not.toHaveBeenCalled();
    });

    it('creates a blank clan prices file when one is missing', async () => {
        fsMocks.exists.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
        fsMocks.readTextFile.mockResolvedValue(JSON.stringify({ schema: 1, materials: {}, craft: {} }));

        await service.ensureInitialFile();

        expect(fsMocks.writeTextFile).toHaveBeenCalledWith(
            'silver-sentinels/prices.json',
            JSON.stringify({ schema: 1, materials: {}, craft: {} }, null, 2),
            expect.any(Object)
        );
    });
});