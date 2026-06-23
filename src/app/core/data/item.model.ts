export interface ItemData {
    name: string;
    price: number;
    labor?: number;
}

export type Category = 'Mining' | 'Hunting' | 'Forestry' | 'Foraging';

export type CraftCategory = 'Alchemy' | 'Blacksmithing' | 'Leatherworking' | 'Woodcarving';

export type AlchemyCategory = 'Reagents' | 'Potions' | 'Other';

export type BlacksmithingCategory = '1H Weapons' | '2H Weapons' | 'Armor' | 'Other';

export type LeatherworkingCategory = 'Leather' | 'Armor' | 'Other';

export type WoodcarvingCategory = 'Weapons' | 'Components' | 'Other';