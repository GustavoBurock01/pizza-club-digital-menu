import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface IntegrationsOverview {
  active_integrations: number;
  pending_webhooks: number;
  reconciliation_issues: number;
  fiscal_reports_pending: number;
}

interface IntegrationsData {
  overview: IntegrationsOverview;
  delivery_integrations: any[];
  webhook_logs: any[];
  payment_reconciliation: any[];
  fiscal_reports: any[];
  erp_configurations: any[];
}

export function useIntegrationsData() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["integrations-data"],
    queryFn: async (): Promise<IntegrationsData> => {
      // Fetch delivery integrations
      const { data: deliveryIntegrations } = await supabase
        .from("delivery_integrations")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch webhook logs (last 100)
      const { data: webhookLogs } = await supabase
        .from("webhook_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      // Fetch payment reconciliation data
      const { data: paymentReconciliation } = await supabase
        .from("payment_reconciliation")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      // Fetch fiscal reports
      const { data: fiscalReports } = await supabase
        .from("fiscal_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      // Fetch ERP configurations
      const { data: erpConfigurations } = await supabase
        .from("erp_configurations")
        .select("*")
        .order("created_at", { ascending: false });

      // Calculate overview stats
      const overview: IntegrationsOverview = {
        active_integrations: deliveryIntegrations?.filter(i => i.is_active).length || 0,
        pending_webhooks: webhookLogs?.filter(w => w.status === 'pending').length || 0,
        reconciliation_issues: paymentReconciliation?.filter(r => r.status === 'discrepancy').length || 0,
        fiscal_reports_pending: fiscalReports?.filter(r => r.status === 'pending').length || 0,
      };

      return {
        overview,
        delivery_integrations: deliveryIntegrations || [],
        webhook_logs: webhookLogs || [],
        payment_reconciliation: paymentReconciliation || [],
        fiscal_reports: fiscalReports || [],
        erp_configurations: erpConfigurations || [],
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return {
    data,
    loading: isLoading,
    refetch,
  };
}