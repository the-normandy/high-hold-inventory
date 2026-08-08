export interface TreeNode {
    name: string;
    path: string[];
    children?: TreeNode[];
    isLeafNode?: boolean;
    hasLeafChildren?: boolean;
}

export interface WebhookSettings {
    url: string;
}