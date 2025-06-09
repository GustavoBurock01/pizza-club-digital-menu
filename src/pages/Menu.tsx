
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MenuCategory } from "@/components/MenuCategory";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter } from "lucide-react";
import { useState } from "react";

const Menu = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const menuData = {
    pizzasGrandes: {
      title: "Pizza Grande (35cm)",
      icon: "🍕",
      items: [
        {
          id: "1",
          name: "Margherita",
          description: "Molho de tomate, mussarela, manjericão fresco e azeite",
          price: 35.90,
          image: "",
          ingredients: ["Molho de tomate", "Mussarela", "Manjericão", "Azeite"]
        },
        {
          id: "2",
          name: "Calabresa",
          description: "Molho de tomate, mussarela, calabresa e cebola",
          price: 38.90,
          image: "",
          ingredients: ["Molho de tomate", "Mussarela", "Calabresa", "Cebola"]
        },
        {
          id: "3",
          name: "Portuguesa",
          description: "Molho de tomate, mussarela, presunto, ovos, cebola e azeitona",
          price: 42.90,
          image: "",
          ingredients: ["Molho de tomate", "Mussarela", "Presunto", "Ovos", "Cebola", "Azeitona"]
        },
        {
          id: "4",
          name: "Quatro Queijos",
          description: "Mussarela, gorgonzola, parmesão e provolone",
          price: 45.90,
          image: "",
          ingredients: ["Mussarela", "Gorgonzola", "Parmesão", "Provolone"]
        }
      ]
    },
    pizzasBrotos: {
      title: "Pizza Broto (25cm)",
      icon: "🍕",
      items: [
        {
          id: "5",
          name: "Margherita Broto",
          description: "Molho de tomate, mussarela, manjericão fresco e azeite",
          price: 18.90,
          image: "",
          ingredients: ["Molho de tomate", "Mussarela", "Manjericão", "Azeite"]
        },
        {
          id: "6",
          name: "Calabresa Broto",
          description: "Molho de tomate, mussarela, calabresa e cebola",
          price: 21.90,
          image: "",
          ingredients: ["Molho de tomate", "Mussarela", "Calabresa", "Cebola"]
        }
      ]
    },
    pizzasDoces: {
      title: "Pizzas Doces",
      icon: "🍰",
      items: [
        {
          id: "7",
          name: "Chocolate com Morango",
          description: "Chocolate ao leite, morangos frescos e açúcar de confeiteiro",
          price: 32.90,
          image: "",
          ingredients: ["Chocolate ao leite", "Morangos", "Açúcar de confeiteiro"]
        },
        {
          id: "8",
          name: "Banana com Canela",
          description: "Banana, canela, açúcar mascavo e leite condensado",
          price: 28.90,
          image: "",
          ingredients: ["Banana", "Canela", "Açúcar mascavo", "Leite condensado"]
        }
      ]
    },
    bebidas: {
      title: "Bebidas",
      icon: "🥤",
      items: [
        {
          id: "9",
          name: "Coca-Cola 2L",
          description: "Refrigerante de cola gelado",
          price: 8.90,
          image: "",
          ingredients: []
        },
        {
          id: "10",
          name: "Água Mineral 500ml",
          description: "Água mineral natural",
          price: 3.50,
          image: "",
          ingredients: []
        },
        {
          id: "11",
          name: "Suco de Laranja 300ml",
          description: "Suco natural de laranja",
          price: 6.90,
          image: "",
          ingredients: []
        }
      ]
    }
  };

  const categories = [
    { id: "all", name: "Todos", count: 11 },
    { id: "pizzasGrandes", name: "Pizza Grande", count: 4 },
    { id: "pizzasBrotos", name: "Pizza Broto", count: 2 },
    { id: "pizzasDoces", name: "Pizzas Doces", count: 2 },
    { id: "bebidas", name: "Bebidas", count: 3 }
  ];

  const filteredData = selectedCategory === "all" 
    ? menuData 
    : { [selectedCategory]: menuData[selectedCategory as keyof typeof menuData] };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-pizza-dark mb-2">
                Cardápio Exclusivo 🍕
              </h1>
              <p className="text-muted-foreground">
                Deliciosas pizzas artesanais feitas especialmente para você
              </p>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar pizza ou ingrediente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
            </div>

            {/* Categorias */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 ${
                    selectedCategory === category.id 
                      ? "gradient-pizza text-white" 
                      : "hover:bg-pizza-cream"
                  }`}
                >
                  {category.name}
                  <Badge variant="secondary" className="text-xs">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Menu Categories */}
          <div className="space-y-12">
            {Object.entries(filteredData).map(([key, category]) => (
              <MenuCategory
                key={key}
                title={category.title}
                items={category.items}
                icon={category.icon}
              />
            ))}
          </div>

          {/* Informações Adicionais */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-pizza-cream p-6 rounded-lg text-center">
              <div className="text-3xl mb-2">🚚</div>
              <h3 className="font-semibold mb-1">Entrega Grátis</h3>
              <p className="text-sm text-muted-foreground">
                Para assinantes em toda a cidade
              </p>
            </div>
            <div className="bg-pizza-cream p-6 rounded-lg text-center">
              <div className="text-3xl mb-2">⏰</div>
              <h3 className="font-semibold mb-1">Entrega Rápida</h3>
              <p className="text-sm text-muted-foreground">
                Em até 45 minutos na sua casa
              </p>
            </div>
            <div className="bg-pizza-cream p-6 rounded-lg text-center">
              <div className="text-3xl mb-2">🍕</div>
              <h3 className="font-semibold mb-1">Meio a Meio</h3>
              <p className="text-sm text-muted-foreground">
                Combine dois sabores em uma pizza
              </p>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Menu;
