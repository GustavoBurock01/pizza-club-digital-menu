import { Home, ShoppingCart, Package, Users, BarChart3, Settings, LogOut, Headphones, Archive } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const items = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: Home,
  },
  {
    title: "Pedidos",
    url: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    title: "Produtos",
    url: "/admin/products", 
    icon: Package,
  },
  {
    title: "Estoque",
    url: "/admin/stock",
    icon: Archive,
  },
  {
    title: "Clientes",
    url: "/admin/customers",
    icon: Users,
  },
  {
    title: "Analytics",
    url: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Configurações",
    url: "/admin/settings",
    icon: Settings,
  },
  {
    title: "Atendimento",
    url: "/attendant",
    icon: Headphones,
  },
];

export function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  
  const isActive = (url: string) => {
    return location.pathname === url;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Sidebar>
      <SidebarTrigger className="m-2" />
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Administração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive(item.url)}
                  >
                    <button 
                      onClick={() => navigate(item.url)}
                      className="w-full flex items-center gap-2"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button 
                    onClick={() => navigate("/dashboard")}
                    className="w-full flex items-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    <span>Dashboard Cliente</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button 
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}