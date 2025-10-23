import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Calendar, TrendingUp, Clock, DollarSign } from 'lucide-react';

const orderStats = [
  { label: 'Total de Pedidos', value: '1.249', icon: TrendingUp, color: 'text-blue-500' },
  { label: 'Tempo Médio', value: '28 min', icon: Clock, color: 'text-purple-500' },
  { label: 'Ticket Médio', value: 'R$ 36,25', icon: DollarSign, color: 'text-green-500' },
  { label: 'Taxa de Cancelamento', value: '3.2%', icon: TrendingUp, color: 'text-red-500' },
];

const mockOrders = [
  { date: '23/10/2025', orders: 45, revenue: 'R$ 1.890', avgTicket: 'R$ 42,00', canceled: 2 },
  { date: '22/10/2025', orders: 52, revenue: 'R$ 2.080', avgTicket: 'R$ 40,00', canceled: 1 },
  { date: '21/10/2025', orders: 38, revenue: 'R$ 1.520', avgTicket: 'R$ 40,00', canceled: 3 },
  { date: '20/10/2025', orders: 48, revenue: 'R$ 1.920', avgTicket: 'R$ 40,00', canceled: 2 },
  { date: '19/10/2025', orders: 41, revenue: 'R$ 1.640', avgTicket: 'R$ 40,00', canceled: 1 },
];

export default function Pedidos() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select defaultValue="30days">
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Últimos 7 dias</SelectItem>
              <SelectItem value="30days">Últimos 30 dias</SelectItem>
              <SelectItem value="90days">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Período Personalizado
          </Button>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {orderStats.map((stat, index) => {
          const Icon = stat.icon;
          
          return (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 bg-secondary rounded-lg`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Gráfico de Pedidos por Dia */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Pedidos por Dia</h3>
        <div className="h-64 flex items-end justify-between gap-2">
          {mockOrders.reverse().map((day, i) => {
            const maxOrders = 52;
            const height = (day.orders / maxOrders) * 100;
            
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full group">
                  <div 
                    className="w-full bg-primary rounded-t transition-all hover:opacity-80"
                    style={{ height: `${height * 2}px` }}
                  />
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-popover border rounded px-2 py-1 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {day.orders} pedidos
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {day.date.split('/')[0]}/{day.date.split('/')[1]}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Tabela Detalhada */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Detalhamento por Dia</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Pedidos</TableHead>
              <TableHead>Receita</TableHead>
              <TableHead>Ticket Médio</TableHead>
              <TableHead>Cancelados</TableHead>
              <TableHead>Taxa Cancel.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockOrders.reverse().map((day, index) => {
              const cancelRate = ((day.canceled / day.orders) * 100).toFixed(1);
              
              return (
                <TableRow key={index}>
                  <TableCell className="font-medium">{day.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{day.orders}</Badge>
                  </TableCell>
                  <TableCell className="font-bold">{day.revenue}</TableCell>
                  <TableCell>{day.avgTicket}</TableCell>
                  <TableCell>
                    <Badge variant="destructive">{day.canceled}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">{cancelRate}%</span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
