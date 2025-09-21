// ===== HEADER PROFISSIONAL - PADRÃO WABIZ =====

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Settings, 
  LogOut,
  Bell,
  Store
} from "lucide-react";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";

interface WABizHeaderProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onRefresh: () => void;
  onSearch: (query: string) => void;
  notificationCount?: number;
}

export const WABizHeader = ({ 
  soundEnabled, 
  onToggleSound, 
  onRefresh, 
  onSearch,
  notificationCount = 0 
}: WABizHeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user, signOut } = useUnifiedAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo e Nome do Estabelecimento */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Store className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">PizzaDelivery</h1>
                <p className="text-sm text-gray-500">Sistema de Gestão</p>
              </div>
            </div>
            
            {/* Status do Estabelecimento */}
            <Badge className="bg-green-100 text-green-800 border-green-300">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Online
            </Badge>
          </div>

          {/* Busca por Número do Pedido */}
          <div className="flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por número do pedido..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </form>
          </div>

          {/* Controles e Informações */}
          <div className="flex items-center space-x-4">
            {/* Horário */}
            <div className="text-sm text-gray-600">
              <div className="font-medium">{getCurrentTime()}</div>
              <div className="text-xs">{getGreeting()}</div>
            </div>

            {/* Notificações */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-red-500 text-white text-xs">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </Badge>
              )}
            </Button>

            {/* Controle de Som */}
            <Button
              variant={soundEnabled ? "default" : "outline"}
              size="sm"
              onClick={onToggleSound}
              className="flex items-center gap-2"
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
              Som
            </Button>

            {/* Atualizar */}
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>

            {/* Configurações */}
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Informações do Usuário */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <span>Usuário:</span>
            <span className="font-medium text-gray-900">
              {user?.email?.split('@')[0] || 'Atendente'}
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-gray-600">
            <span>Status do som: {soundEnabled ? "Ativado" : "Desativado"}</span>
            <span>Última atualização: {getCurrentTime()}</span>
          </div>
        </div>
      </div>
    </header>
  );
};