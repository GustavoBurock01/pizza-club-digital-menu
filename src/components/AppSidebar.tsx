
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Pizza, 
  ShoppingBag, 
  User, 
  CreditCard, 
  LogOut, 
  ShoppingCart 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { FastLink } from "@/components/FastLink";
import { smartPreload } from "@/utils/routePreloader";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Cardápio",
    url: "/menu",
    icon: Pizza,
  },
  {
    title: "Meus Pedidos",
    url: "/orders",
    icon: ShoppingBag,
  },
  {
    title: "Minha Conta",
    url: "/account",
    icon: User,
  },
  {
    title: "Assinatura",
    url: "/subscription",
    icon: CreditCard,
  },
];

export function AppSidebar() {
  const { signOut } = useAuth();
  const { getItemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Preload baseado na jornada do usuário
  useEffect(() => {
    smartPreload.userJourney(location.pathname);
  }, [location.pathname]);

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gradient-to-br from-pizza-red to-pizza-orange rounded-lg flex items-center justify-center">
            <Pizza className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">PizzaClub</h2>
            <p className="text-xs text-muted-foreground">Assinante Premium</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url}
                  >
                    <FastLink 
                      to={item.url}
                      className="flex items-center gap-3"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </FastLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Carrinho</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <FastLink 
                    to="/cart"
                    className="flex items-center gap-3"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Carrinho</span>
                    {getItemCount() > 0 && (
                      <Badge className="ml-auto h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {getItemCount()}
                      </Badge>
                    )}
                  </FastLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button 
          variant="outline" 
          onClick={signOut}
          className="w-full flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
