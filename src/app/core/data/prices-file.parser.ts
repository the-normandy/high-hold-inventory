import type { ItemData, ItemTree } from './item.model';
import type { PricesFile } from './data.service';

function isItemData(value: unknown): value is ItemData {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }

    const item = value as Record<string, unknown>;
    return typeof item['name'] === 'string'
        && typeof item['price'] === 'number'
        && Number.isFinite(item['price'])
        && (item['labor'] === undefined
            || (typeof item['labor'] === 'number' && Number.isFinite(item['labor'])));
}

function isItemTree(value: unknown): value is ItemTree {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }

    return Object.values(value).every(child =>
        Array.isArray(child)
            ? child.every(isItemData)
            : isItemTree(child)
    );
}

export function parsePricesFile(text: string): PricesFile {
    const value: unknown = JSON.parse(text);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('The file must contain a JSON object.');
    }

    const data = value as Record<string, unknown>;
    if (typeof data['schema'] !== 'number' || !Number.isFinite(data['schema'])) {
        throw new Error('The file must contain a numeric schema.');
    }
    if (!isItemTree(data['materials']) || !isItemTree(data['craft'])) {
        throw new Error('Materials and craft must contain valid item categories.');
    }

    return value as PricesFile;
}