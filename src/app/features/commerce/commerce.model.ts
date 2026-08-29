import { ItemData } from '../../core/data/item.model';

export type CommerceType = 'purchase' | 'sale';
export type CommerceSource = 'material' | 'craft';
export type CommercePeriod = 'day' | 'week' | 'month';
export type CommerceRange = '30d' | '90d' | 'all';

export interface CommerceFormItem {
    id: string;
    source: CommerceSource;
    path: string[];
    item: ItemData;
    quantity: number;
    unitPrice: number;
}

export interface CommerceSubmission {
    customer: string;
    comment: string | null;
    items: CommerceFormItem[];
}

export interface CommerceEntry {
    id: string;
    type: CommerceType;
    timestamp: string;
    customer: string;
    comment?: string;
    items: CommerceItem[];
    totalValue: number;
}

export interface CommerceItem {
    source: CommerceSource;
    category: string;
    name: string;
    quantity: number;
    unitPrice: number;
}

export interface CommerceSummary {
    purchasedValue: number;
    soldValue: number;
    netBalance: number;
    purchaseEntries: number;
    saleEntries: number;
}

export interface CommerceBalancePoint {
    period: string;
    label: string;
    balance: number;
}