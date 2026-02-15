export interface Plan {
  id: string;
  name: string;
  description?: string;
  price_monthly_cents: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
