export interface TreeNode {
    name: string;
    path: string[];
    children?: TreeNode[];
}

export interface WebhookSettings {
    url: string;
}