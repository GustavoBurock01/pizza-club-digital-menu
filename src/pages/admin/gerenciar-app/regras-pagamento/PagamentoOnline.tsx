import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { toast } from 'sonner';

export default function PagamentoOnline() {
  const [pix, setPix] = useState(true);
  const [credit, setCredit] = useState(true);
  const [debit, setDebit] = useState(true);
  const [creditFee, setCreditFee] = useState('2.5');
  const [debitFee, setDebitFee] = useState('1.5');

  const handleSave = () => {
    console.log('Salvando pagamento online:', { pix, credit, debit, creditFee, debitFee });
    toast.success('Configurações de pagamento online salvas!');
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-1">Pagamento Online</h3>
        <p className="text-sm text-muted-foreground">
          Configure as formas de pagamento online aceitas
        </p>
      </div>

      <Separator />

      {/* PIX */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="pix" className="font-medium">PIX</Label>
            <p className="text-sm text-muted-foreground">Pagamento instantâneo via PIX</p>
          </div>
          <Switch id="pix" checked={pix} onCheckedChange={setPix} />
        </div>
      </div>

      <Separator />

      {/* Cartão de Crédito */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="credit" className="font-medium">Cartão de Crédito</Label>
            <p className="text-sm text-muted-foreground">Aceitar pagamentos com cartão de crédito</p>
          </div>
          <Switch id="credit" checked={credit} onCheckedChange={setCredit} />
        </div>

        {credit && (
          <div className="ml-6 space-y-2">
            <Label htmlFor="credit-fee">Taxa de processamento (%)</Label>
            <Input
              id="credit-fee"
              type="number"
              step="0.1"
              value={creditFee}
              onChange={(e) => setCreditFee(e.target.value)}
              className="w-32"
            />
          </div>
        )}
      </div>

      <Separator />

      {/* Cartão de Débito */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="debit" className="font-medium">Cartão de Débito</Label>
            <p className="text-sm text-muted-foreground">Aceitar pagamentos com cartão de débito</p>
          </div>
          <Switch id="debit" checked={debit} onCheckedChange={setDebit} />
        </div>

        {debit && (
          <div className="ml-6 space-y-2">
            <Label htmlFor="debit-fee">Taxa de processamento (%)</Label>
            <Input
              id="debit-fee"
              type="number"
              step="0.1"
              value={debitFee}
              onChange={(e) => setDebitFee(e.target.value)}
              className="w-32"
            />
          </div>
        )}
      </div>

      <div className="pt-4">
        <Button onClick={handleSave}>Salvar Configurações</Button>
      </div>
    </Card>
  );
}
