type entryType = 'deposit' | 'withdrawal'

export interface RecordEntry {
    id: string;
    entry: entryType;
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