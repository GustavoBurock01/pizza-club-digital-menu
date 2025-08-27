import {
  Calendar,
  Home,
  Inbox,
  Search,
  Settings,
  ShoppingCart,
  User,
  CreditCard,
  BarChart3,
  Users,
  Package,
  LogOut,
  Crown,
  Sparkles,
  ChefHat,
  Bell,
  FileText,
  Star,
  Clock,
  Heart,
  Headphones,
  Settings2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUnifiedStore } from '@/stores/simpleStore';
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/useRole";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Menu items for customers
const customerItems = [
  { title: "Início", url: "/dashboard", icon: Home },
  { title: "Cardápio", url: "/menu", icon: Package },
  { title: "Meus Pedidos", url: "/orders", icon: FileText },
  { title: "Minha Conta", url: "/account", icon: User },
];

// Menu items for attendants  
const attendantItems = [
  { title: "Dashboard", url: "/attendant", icon: BarChart3 },
  { title: "Pedidos", url: "/attendant/orders", icon: FileText },
  { title: "Clientes", url: "/attendant/customers", icon: Users },
];

// Menu items for admins
const adminItems = [
  { title: "Dashboard", url: "/admin", icon: BarChart3 },
  { title: "Pedidos", url: "/admin/orders", icon: ShoppingCart },
  { title: "Clientes", url: "/admin/customers", icon: Users },
  { title: "Produtos", url: "/admin/products", icon: Package },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
];

export function AppSidebar() {
  const { signOut, user } = useAuth();
  const { getItemCount } = useUnifiedStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useRole();
  const itemCount = getItemCount();

  // Auto-navigate based on role when accessing root paths
  useEffect(() => {
    if (location.pathname === '/') {
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'attendant') {
        navigate('/attendant');
      } else {
        navigate('/dashboard');
      }
    }
  }, [role, location.pathname, navigate]);

  // Get menu items based on role
  const getMenuItems = () => {
    switch (role) {
      case 'admin':
        return adminItems;
      case 'attendant':
        return attendantItems;
      default:
        return customerItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="border-b border-border/50 p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">🍕</span>
          </div>
          <div className="flex flex-col">
            <h2 className="font-semibold text-sm">PizzaExpress</h2>
            <span className="text-xs text-muted-foreground capitalize">{role || 'Cliente'}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={item.title}
                    isActive={location.pathname === item.url}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate(item.url)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.title === "Cardápio" && itemCount > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          {itemCount}
                        </Badge>
                      )}
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {/* Show cart for customers */}
              {role === 'customer' && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    tooltip="Carrinho"
                    isActive={location.pathname === '/cart'}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/cart')}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>Carrinho</span>
                      {itemCount > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                          {itemCount}
                        </Badge>
                      )}
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src="" />
            <AvatarFallback className="text-xs">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.email?.split('@')[0] || 'Usuário'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || ''}
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}