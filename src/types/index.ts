export interface Subscription {
    id: number;
    name: string;
    cost: string; 
    billing_cycle: 'monthly' | 'annually';
    start_date: string; 
    renewal_date: string; 
    monthly_cost: number | null; 
    annual_cost: number | null; 
  }
  