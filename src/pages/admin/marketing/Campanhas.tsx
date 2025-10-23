import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageSquare, Send, TrendingUp, Users, DollarSign } from 'lucide-react';

const campaigns = [
  {
    id: 1,
    name: 'Black Friday 2024',
    type: 'email',
    status: 'sent',
    sent: 487,
    opened: 356,
    clicked: 189,
    converted: 67,
    revenue: 2340.00,
    date: '2024-01-20',
  },
  {
    id: 2,
    name: 'Promoção de Verão',
    type: 'whatsapp',
    status: 'scheduled',
    sent: 0,
    opened: 0,
    clicked: 0,
    converted: 0,
    revenue: 0,
    date: '2024-02-01',
  },
  {
    id: 3,
    name: 'Cupom Fidelidade',
    type: 'email',
    status: 'sent',
    sent: 342,
    opened: 287,
    clicked: 156,
    converted: 89,
    revenue: 3120.00,
    date: '2024-01-18',
  },
];

export default function Campanhas() {
  const getTotalRevenue = () => {
    return campaigns.reduce((acc, c) => acc + c.revenue, 0);
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary rounded-lg">
              <Send className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Campanhas Enviadas</p>
              <p className="text-2xl font-bold">2</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary rounded-lg">
              <Users className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Alcançado</p>
              <p className="text-2xl font-bold">829</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
              <p className="text-2xl font-bold">18.8%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary rounded-lg">
              <DollarSign className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receita Gerada</p>
              <p className="text-2xl font-bold">R$ {(getTotalRevenue() / 1000).toFixed(1)}k</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Lista de Campanhas */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Campanhas de Marketing</h3>
          <Button>
            <Send className="h-4 w-4 mr-2" />
            Nova Campanha
          </Button>
        </div>

        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold">{campaign.name}</h4>
                    <Badge variant={campaign.status === 'sent' ? 'default' : 'secondary'}>
                      {campaign.status === 'sent' ? 'Enviada' : 'Agendada'}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      {campaign.type === 'email' ? (
                        <><Mail className="h-3 w-3" /> Email</>
                      ) : (
                        <><MessageSquare className="h-3 w-3" /> WhatsApp</>
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Enviada em {campaign.date}</p>
                </div>
              </div>

              {campaign.status === 'sent' && (
                <div className="grid grid-cols-5 gap-4 pt-3 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Enviados</p>
                    <p className="text-xl font-bold">{campaign.sent}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Abertos</p>
                    <p className="text-xl font-bold text-blue-500">
                      {campaign.opened}
                      <span className="text-sm ml-1">
                        ({((campaign.opened / campaign.sent) * 100).toFixed(0)}%)
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Cliques</p>
                    <p className="text-xl font-bold text-purple-500">
                      {campaign.clicked}
                      <span className="text-sm ml-1">
                        ({((campaign.clicked / campaign.sent) * 100).toFixed(0)}%)
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Conversões</p>
                    <p className="text-xl font-bold text-green-500">
                      {campaign.converted}
                      <span className="text-sm ml-1">
                        ({((campaign.converted / campaign.sent) * 100).toFixed(0)}%)
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Receita</p>
                    <p className="text-xl font-bold text-yellow-500">
                      R$ {campaign.revenue.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
