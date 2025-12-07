import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { toast } from 'sonner';
import { PrintLayoutConfig } from '@/components/printing/PrintLayoutEditor';

const defaultLayout: PrintLayoutConfig = {
  show_logo: false,
  show_store_name: true,
  show_store_phone: true,
  show_store_address: false,
  show_customer_cpf: false,
  show_customer_email: false,
  font_size: 'normal',
  line_spacing: 2,
  footer_message: 'Obrigado pela preferência!',
};

export function usePrintLayout() {
  const [layout, setLayout] = useState<PrintLayoutConfig>(defaultLayout);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch layout config
  const fetchLayout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('print_layout_config')
        .select('*')
        .limit(1)
        .single();

      if (fetchError) {
        // If no config exists, create default
        if (fetchError.code === 'PGRST116') {
          await createDefaultLayout();
          return;
        }
        throw fetchError;
      }

      setLayout({
        id: data.id,
        show_logo: data.show_logo ?? false,
        show_store_name: data.show_store_name ?? true,
        show_store_phone: data.show_store_phone ?? true,
        show_store_address: data.show_store_address ?? false,
        show_customer_cpf: data.show_customer_cpf ?? false,
        show_customer_email: data.show_customer_email ?? false,
        font_size: (data.font_size as PrintLayoutConfig['font_size']) ?? 'normal',
        line_spacing: data.line_spacing ?? 2,
        footer_message: data.footer_message ?? 'Obrigado pela preferência!',
      });
    } catch (err: any) {
      console.error('[PRINT-LAYOUT] Error fetching layout:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create default layout
  const createDefaultLayout = async () => {
    try {
      const { data, error } = await supabase
        .from('print_layout_config')
        .insert({
          show_logo: defaultLayout.show_logo,
          show_store_name: defaultLayout.show_store_name,
          show_store_phone: defaultLayout.show_store_phone,
          show_store_address: defaultLayout.show_store_address,
          show_customer_cpf: defaultLayout.show_customer_cpf,
          show_customer_email: defaultLayout.show_customer_email,
          font_size: defaultLayout.font_size,
          line_spacing: defaultLayout.line_spacing,
          footer_message: defaultLayout.footer_message,
        })
        .select()
        .single();

      if (error) throw error;

      setLayout({
        id: data.id,
        ...defaultLayout,
      });
    } catch (err: any) {
      console.error('[PRINT-LAYOUT] Error creating default:', err);
      setError(err.message);
    }
  };

  // Save layout config
  const saveLayout = useCallback(async (newLayout: PrintLayoutConfig) => {
    try {
      const updateData = {
        show_logo: newLayout.show_logo,
        show_store_name: newLayout.show_store_name,
        show_store_phone: newLayout.show_store_phone,
        show_store_address: newLayout.show_store_address,
        show_customer_cpf: newLayout.show_customer_cpf,
        show_customer_email: newLayout.show_customer_email,
        font_size: newLayout.font_size,
        line_spacing: newLayout.line_spacing,
        footer_message: newLayout.footer_message,
        updated_at: new Date().toISOString(),
      };

      let result;

      if (newLayout.id) {
        // Update existing
        result = await supabase
          .from('print_layout_config')
          .update(updateData)
          .eq('id', newLayout.id)
          .select()
          .single();
      } else {
        // Insert new
        result = await supabase
          .from('print_layout_config')
          .insert(updateData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      setLayout({
        id: result.data.id,
        ...newLayout,
      });

      toast.success('Layout salvo com sucesso!');
    } catch (err: any) {
      console.error('[PRINT-LAYOUT] Error saving layout:', err);
      toast.error('Erro ao salvar layout');
      throw err;
    }
  }, []);

  // Reset to defaults
  const resetLayout = useCallback(() => {
    setLayout((prev) => ({
      id: prev.id,
      ...defaultLayout,
    }));
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchLayout();
  }, [fetchLayout]);

  return {
    layout,
    isLoading,
    error,
    saveLayout,
    resetLayout,
    fetchLayout,
    defaultLayout,
  };
}
