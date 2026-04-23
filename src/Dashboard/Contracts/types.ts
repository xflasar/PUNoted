export interface ContractListItem {
  id: string;
  localid?: string;
  name?: string;
  date: string;
  status: 'PENDING' | 'ACCEPTED' | 'FULFILLED' | 'BREACHED' | 'CANCELLED' | 'REJECTED';
  contracttype?: string;
  partnername?: string;
  partnercode?: string;
  duedate?: string;
  total_amount: number;
  currency: string;
  operation_type?: string; 
  party?: string; // CUSTOMER or PROVIDER
}

export interface WeeklyStats {
    revenue: number;
    expenses: number;
    net: number;
    count: number;
}

export interface DashboardStats {
    current_week: WeeklyStats;
    last_week: WeeklyStats;
    total_active: number;
    total_breached_final: number;
    active_breached: number;
}

export interface DashboardWidgets {
    immediate: ContractListItem[];
    active: ContractListItem[];
    breached: ContractListItem[];
}