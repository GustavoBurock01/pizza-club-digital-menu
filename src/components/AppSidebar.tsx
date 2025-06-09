
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  ShoppingCart, 
  BookOpen, 
  User, 
  CreditCard, 
  Clock,
  LogOut,
  Pizza
} from "lucide-react";

const menuItems = [
  {
    title: "Início",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Cardápio",
    url: "/menu",
    icon: BookOpen,
  },
  {
    title: "Novo Pedido",
    url: "/order",
    icon: ShoppingCart,
  },
  {
    title: "Meus Pedidos",
    url: "/orders",
    icon: Clock,
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
  const user = {
    name: "João Silva",
    email: "joao@email.com",
    avatar: "",
    plan: "Premium",
    daysLeft: 23
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <Pizza className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Pizza Premium</h1>
            <p className="text-sm text-muted-foreground">Cardápio exclusivo</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <div className="mb-6 p-4 bg-gradient-to-r from-pizza-red/10 to-pizza-orange/10 rounded-lg border border-pizza-orange/20">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-primary text-white">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{user.name}</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {user.plan}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {user.daysLeft} dias restantes
                </span>
              </div>
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent transition-colors">
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
