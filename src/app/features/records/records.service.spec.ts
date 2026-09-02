import { CraftSubmission, MaterialSubmission, RecordEntry } from './records.model';
import { RecordsService } from './records.service';

describe('RecordsService', () => {
    let service: RecordsService;
    let writtenRecord: RecordEntry | undefined;

    beforeEach(() => {
        service = new RecordsService();
        writtenRecord = undefined;

        vi.spyOn(service, 'writeRecord').mockImplementation(async record => {
            writtenRecord = record;
        });
    });

    it('rounds a material report up only after summing all decimal item values', async () => {
        const material: MaterialSubmission = {
            comment: null,
            silver: null,
            items: [
                {
                    path: ['Ore'],
                    item: { name: 'Iron ore', price: 2.3 },
                    quantity: 1
                },
                {
                    path: ['Wood'],
                    item: { name: 'Wood', price: 1.2 },
                    quantity: 1
                }
            ]
        };

        await service.recordSubmission(material, undefined, 'deposit');

        expect(writtenRecord?.totalValue).toBe(4);
        expect(writtenRecord?.items.map(item => item.value)).toEqual([2.3, 1.2]);
    });

    it('rounds combined material and craft values once as a single ledger entry', async () => {
        const material: MaterialSubmission = {
            comment: null,
            silver: null,
            items: [{
                path: ['Ore'],
                item: { name: 'Ore', price: 0.4 },
                quantity: 1
            }]
        };
        const craft: CraftSubmission = {
            comment: null,
            items: [{
                path: ['Tools'],
                item: { name: 'Tool', price: 0.4 },
                quantity: 1,
                laborOnly: false
            }]
        };

        await service.recordSubmission(material, craft, 'withdraw');

        expect(writtenRecord?.source).toBe('mixed');
        expect(writtenRecord?.totalValue).toBe(1);
        expect(writtenRecord?.items.map(item => item.value)).toEqual([0.4, 0.4]);
    });
});