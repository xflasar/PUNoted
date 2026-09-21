export interface UserNotification {
    id: string;
    category: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    is_read: boolean;
    created_at: string;
}

export interface MaterialSupplyItem {
    ticker: string;
    amount: number;
    target_days: number;
    days_left?: number;
}