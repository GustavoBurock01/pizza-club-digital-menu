import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

const daysOfWeek = [
  { id: 0, name: 'Domingo' },
  { id: 1, name: 'Segunda-feira' },
  { id: 2, name: 'Terça-feira' },
  { id: 3, name: 'Quarta-feira' },
  { id: 4, name: 'Quinta-feira' },
  { id: 5, name: 'Sexta-feira' },
  { id: 6, name: 'Sábado' },
];

export default function Horarios() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Horário de Funcionamento</h2>
        <p className="text-muted-foreground">
          Configure os horários de funcionamento da loja
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          {daysOfWeek.map((day) => (
            <div key={day.id} className="flex items-center gap-4 pb-4 border-b last:border-0">
              <div className="w-32">
                <Label>{day.name}</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch id={`day-${day.id}`} defaultChecked />
                <Label htmlFor={`day-${day.id}`} className="text-sm text-muted-foreground">
                  Aberto
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  defaultValue="11:00"
                  className="w-32"
                />
                <span className="text-muted-foreground">até</span>
                <Input
                  type="time"
                  defaultValue="23:00"
                  className="w-32"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-6">
          <Button>Salvar Horários</Button>
        </div>
      </Card>

      {/* Feriados */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Feriados e Exceções</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure horários especiais para datas específicas
        </p>
        <Button variant="outline">Adicionar Exceção</Button>
      </Card>
    </div>
  );
}
