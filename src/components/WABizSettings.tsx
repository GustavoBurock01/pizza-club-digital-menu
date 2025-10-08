// ===== SETTINGS DRAWER - CONFIGURAÇÕES DO ATENDENTE =====

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, Printer, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface WABizSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenMessages?: () => void;
}

export const WABizSettings = ({ 
  isOpen, 
  onClose, 
  soundEnabled, 
  onToggleSound,
  onOpenMessages 
}: WABizSettingsProps) => {
  const [autoAccept, setAutoAccept] = useState(false);
  const [printCopies, setPrintCopies] = useState("1");
  const [loading, setLoading] = useState(false);

  // Carregar configurações da loja
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('auto_accept_orders')
          .single();

        if (error) throw error;
        if (data) {
          setAutoAccept(data.auto_accept_orders || false);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };

    if (isOpen) {
      loadSettings();
      // Carregar cópias do localStorage
      const savedCopies = localStorage.getItem('print_copies');
      if (savedCopies) {
        setPrintCopies(savedCopies);
      }
    }
  }, [isOpen]);

  const handleAutoAcceptChange = async (checked: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('store_settings')
        .update({ auto_accept_orders: checked })
        .eq('id', (await supabase.from('store_settings').select('id').single()).data?.id);

      if (error) throw error;

      setAutoAccept(checked);
      toast.success(checked ? "Auto aceitar ativado" : "Auto aceitar desativado");
    } catch (error: any) {
      toast.error("Erro ao salvar configuração");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintCopiesChange = (value: string) => {
    const copies = parseInt(value) || 1;
    if (copies >= 1 && copies <= 5) {
      setPrintCopies(value);
      localStorage.setItem('print_copies', value);
      toast.success(`Cópias de impressão: ${copies}`);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações
          </SheetTitle>
          <SheetDescription>
            Ajuste as preferências do sistema
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Som de Notificações */}
          <div className="space-y-2">
            <Label htmlFor="sound" className="text-sm font-medium">
              Notificações Sonoras
            </Label>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Tocar som ao receber novos pedidos
              </p>
              <Switch
                id="sound"
                checked={soundEnabled}
                onCheckedChange={onToggleSound}
              />
            </div>
          </div>

          {/* Auto Aceitar Pedidos */}
          <div className="space-y-2">
            <Label htmlFor="auto-accept" className="text-sm font-medium">
              Auto Aceitar Pedidos
            </Label>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Aceitar pedidos automaticamente
              </p>
              <Switch
                id="auto-accept"
                checked={autoAccept}
                onCheckedChange={handleAutoAcceptChange}
                disabled={loading}
              />
            </div>
          </div>

          {/* Cópias de Impressão */}
          <div className="space-y-2">
            <Label htmlFor="print-copies" className="text-sm font-medium flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Cópias de Impressão
            </Label>
            <Input
              id="print-copies"
              type="number"
              min="1"
              max="5"
              value={printCopies}
              onChange={(e) => handlePrintCopiesChange(e.target.value)}
              className="w-24"
            />
            <p className="text-xs text-muted-foreground">
              Número de cópias padrão ao imprimir (1-5)
            </p>
          </div>

          {/* Botão Central de Mensagens */}
          {onOpenMessages && (
            <div className="space-y-2 pt-4 border-t">
              <Button
                onClick={() => {
                  onClose();
                  onOpenMessages();
                }}
                variant="outline"
                className="w-full"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Central de Mensagens
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Acesse todos os chats dos pedidos
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
