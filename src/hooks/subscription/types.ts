// ===== SUBSCRIPTION TYPES (EXTRAÍDO) =====

export interface SubscriptionData {
  isActive: boolean;
  status: string;
  planName: string;
  planPrice: number;
  expiresAt: string | null;
  stripeSubscriptionId: string | null;
}
