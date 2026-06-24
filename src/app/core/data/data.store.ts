import { Injectable } from "@angular/core";
import { AlchemyCategory, BlacksmithingCategory, Category, CraftCategory, ItemData, LeatherworkingCategory, WoodcarvingCategory } from "./item.model";

@Injectable({
    providedIn: 'root'
})
export class DataStore {

    alchemyItems: Record<AlchemyCategory, ItemData[]> = {
        Reagents: [
            { name: "Curative Reagent (5)", price: 6, labor: 4 },
            { name: "Medical Supply (5)", price: 8, labor: 4 },
            { name: "Poisonous Reagent (5)", price: 8, labor: 4 },
            { name: "Reactive Reagent (5)", price: 8, labor: 4 }
        ],
        Potions: [
            { name: "Potion of Featherfall", price: 11, labor: 4 },
            { name: "Potion of Giant's Strength", price: 15, labor: 4 },
            { name: "Potion of Healing", price: 5, labor: 4 },
            { name: "Potion of Greater Healing", price: 5, labor: 4 },
            { name: "Potion of Superior Healing", price: 15, labor: 4 },
            { name: "Potion of Speed", price: 27, labor: 12 },
            { name: "Potion of Viciousness", price: 15, labor: 4 },
            { name: "Potion of Vigilance", price: 15, labor: 4 }
        ],
        Other: [
            { name: "Alchemist's Fire", price: 15, labor: 4 },
            { name: "Grease Bottle", price: 5, labor: 4 }
        ]
    };

    blacksmithingItems: Record<BlacksmithingCategory, ItemData[]> = {
        '1H Weapons': [
            { name: "Battleaxe", price: 20, labor: 8 },
            { name: "Cleaver", price: 12, labor: 8 },
            { name: "Dagger", price: 6, labor: 4 },
            { name: "Flail", price: 16, labor: 12 },
            { name: "Handaxe", price: 12, labor: 8 },
            { name: "Javelin (3)", price: 13, labor: 8 },
            { name: "Light Hammer", price: 12, labor: 8 },
            { name: "Longsword", price: 16, labor: 8 },
            { name: "Mace", price: 18, labor: 8 },
            { name: "Morningstar", price: 18, labor: 12 },
            { name: "Rapier", price: 10, labor: 8 },
            { name: "Scimitar", price: 12, labor: 8 },
            { name: "Short Sword", price: 12, labor: 8 },
            { name: "Sickle", price: 12, labor: 8 },
            { name: "Spear", price: 16, labor: 8 },
            { name: "Trident", price: 20, labor: 8 },
            { name: "War Pick", price: 18, labor: 8 },
            { name: "Warhammer", price: 18, labor: 8 }
        ],

        '2H Weapons': [
            { name: "Glaive", price: 18, labor: 8 },
            { name: "Greataxe", price: 36, labor: 12 },
            { name: "Greatsword", price: 32, labor: 12 },
            { name: "Halberd", price: 26, labor: 12 },
            { name: "Maul", price: 38, labor: 8 },
            { name: "Pike", price: 16, labor: 4 }
        ],

        Armor: [
            { name: "Chain Shirt", price: 26, labor: 16 },
            { name: "Half Plate", price: 67, labor: 20 },
            { name: "Plate Armor", price: 103, labor: 28 },
            { name: "Scale Mail", price: 31, labor: 16 },
            { name: "Shield", price: 14, labor: 12 },
            { name: "Splint Armor", price: 59, labor: 20 }
        ],

        Other: [
            { name: "Buckles", price: 1, labor: 4 },
            { name: "Chain", price: 6, labor: 4 },
            { name: "Horseshoes (4)", price: 8, labor: 4 },
            { name: "Metal Scraps (20)", price: 6, labor: 4 },
            { name: "Parts", price: 4, labor: 0 },
            { name: "Parts (4)", price: 22, labor: 16 },
            { name: "Pickaxe", price: 12, labor: 8 }
        ]
    };

    leatherworkingItems: Record<LeatherworkingCategory, ItemData[]> = {
        Leather: [
            { name: "Leather Scraps (20)", price: 10, labor: 4 },
            { name: "Rawhide Leather", price: 6, labor: 4 },
            { name: "Tanned Leather", price: 10, labor: 4 }
        ],

        Armor: [
            { name: "Armor Padding", price: 15, labor: 4 },
            { name: "Hide Armor", price: 20, labor: 4 },
            { name: "Leather Armor", price: 28, labor: 8 },
            { name: "Padded Armor", price: 15, labor: 4 },
            { name: "Studded Leather Armor", price: 36, labor: 12 }
        ],

        Other: [
            { name: "Saddle", price: 42, labor: 4 }
        ]
    };

    woodcarvingItems: Record<WoodcarvingCategory, ItemData[]> = {
        Weapons: [
            { name: "Hand Crossbow", price: 59, labor: 24 },
            { name: "Heavy Crossbow", price: 64, labor: 20 },
            { name: "Light Crossbow", price: 56, labor: 16 },
            { name: "Longbow", price: 41, labor: 24 },
            { name: "Pitchfork", price: 12, labor: 4 },
            { name: "Quarterstaff", price: 6, labor: 4 },
            { name: "Shortbow", price: 29, labor: 16 }
        ],

        Components: [
            { name: "Long Haft", price: 6, labor: 4 },
            { name: "Quality Branch", price: 6, labor: 4 },
            { name: "Short Haft", price: 6, labor: 4 },
            { name: "Wooden Stock", price: 6, labor: 4 }
        ],

        Other: [
            { name: "Arrows (10)", price: 14, labor: 8 },
            { name: "Wooden Shield", price: 29, labor: 12 }
        ]
    };


    craftItems: CraftCategory[] = ['Alchemy', 'Blacksmithing', 'Leatherworking', 'Woodcarving'];

    items: Record<Category, ItemData[]> = {
        Mining: [
            { name: "Avardonian Salt", price: 2 },
            { name: "Brimstone", price: 2 },
            { name: "Iron Ore/Ingot", price: 2 }
        ],

        Hunting: [
            { name: "Animal Fat", price: 2 },
            { name: "Giant Finger", price: 12 },
            { name: "Hide", price: 2 },
            { name: "Hook", price: 12 },
            { name: "Hyena Ear", price: 12 }
        ],

        Foraging: [
            { name: "Autumncrocus", price: 8 },
            { name: "Balsam", price: 2 },
            { name: "Bonecap", price: 2 },
            { name: "Fire Amber", price: 12 },
            { name: "Flax", price: 2 },
            { name: "Rogue's Morsel", price: 2 },
            { name: "Shadowroot Sac", price: 12 },
            { name: "Valerian Flower", price: 2 },
            { name: "Yellow Musk Creeper Petals", price: 8 }
        ],

        Forestry: [
            { name: "Branch", price: 2 }
        ]
    };



}