import { ItemData } from "../../core/data/item.model";

export type EntryType = 'deposit' | 'withdraw'

export interface RecordEntry {
    id: string;
    entry: EntryType;
    timestamp: string;
    items: RecordItem[];
    totalValue: number;
    note?: string;
}

export interface RecordItem {
    category: string;
    name: string;
    quantity: number;
    value: number;
}

export interface MaterialSubmission {
    purpose: string | null;
    silver: number | null;
    ownership: string | null;
    usage: string | null;
    items: MaterialSubmissionItem[];
}

export interface MaterialSubmissionItem {
    category: string;
    item: ItemData;
    quantity: number;
}

export interface CraftSubmission {
    purpose: string | null;
    items: CraftSubmissionItem[];
}

export interface CraftSubmissionItem {
    category: string;
    item: ItemData;
    quantity: number;
    laborOnly: boolean;
}