import { parsePricesFile } from './prices-file.parser';

describe('parsePricesFile', () => {
    it('accepts recursive material and craft categories with item leaves', () => {
        const data = {
            schema: 1,
            materials: {
                ore: [{ name: 'Iron ore', price: 12 }],
                wood: { refined: [{ name: 'Beam', price: 20 }] }
            },
            craft: {
                tools: [{ name: 'Hammer', price: 100, labor: 25 }]
            }
        };

        expect(parsePricesFile(JSON.stringify(data))).toEqual(data);
    });

    it.each([
        ['missing materials', { schema: 1, craft: {} }],
        ['missing craft', { schema: 1, materials: {} }],
        ['an object instead of an item array leaf', {
            schema: 1,
            materials: { ore: [{ name: 'Iron ore', price: 12 }] },
            craft: { tools: { hammer: { name: 'Hammer', price: 100 } } }
        }],
        ['an item with a nonnumeric price', {
            schema: 1,
            materials: { ore: [{ name: 'Iron ore', price: '12' }] },
            craft: {}
        }]
    ])('rejects %s', (_, data) => {
        expect(() => parsePricesFile(JSON.stringify(data))).toThrow();
    });

    it('rejects malformed JSON', () => {
        expect(() => parsePricesFile('{')).toThrow();
    });
});