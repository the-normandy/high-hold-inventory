import { ItemData } from "../../core/data/item.model";

export type EntryType = 'deposit' | 'withdraw'
type RecordSource = 'material' | 'craft';

export interface RecordEntry {
    id: string;
    entry: EntryType;
    source: RecordSource;
    timestamp: string;
    items: RecordItem[];
    silver?: number;
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
export interface RecordSummary {
    depositedSilver: number;
    withdrawnSilver: number;
    balanceSilver: number;
    depositedEntries: number;
    withdrawnEntries: number;
    materialEntries: number;
    craftEntries: number;
}
export type BalancePeriod = 'day' | 'week' | 'month';

export type BalanceRange = '30d' | '90d' | 'all';

export interface BalancePoint {
    period: string;
    label: string;
    balance: number;
}