import { Button } from '@/components/ui/button';
import { Upload, Save } from 'lucide-react';
import { ProdutoCard } from './ProdutoCard';
import { ModalImportar } from './ModalImportar';
import { ModalEditarProduto } from './ModalEditarProduto';
import { useState } from 'react';

interface Props {
  categoryId: string | null;
  subcategoryId: string | null;
}

// Mock data - substituir por dados reais do Supabase
const mockProducts = [
  {
    id: '1',
    code: 'P001',
    name: 'Pizza Margherita',
    description: 'Molho de tomate, mussarela, manjericão',
    price: 45.90,
    image: '/placeholder.svg',
    isActive: true,
  },
  {
    id: '2',
    code: 'P002',
    name: 'Pizza Calabresa',
    description: 'Molho de tomate, mussarela, calabresa, cebola',
    price: 48.90,
    image: '/placeholder.svg',
    isActive: true,
  },
  {
    id: '3',
    code: 'P003',
    name: 'Pizza Portuguesa',
    description: 'Molho de tomate, mussarela, presunto, ovos, cebola',
    price: 52.90,
    image: '/placeholder.svg',
    isActive: false,
  },
];

export function PainelProdutos({ categoryId, subcategoryId }: Props) {
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setEditModalOpen(true);
  };

  const handleSaveAndPublish = () => {
    console.log('Publicando alterações...');
    // Implementar lógica de publicação
  };

  return (
    <div>
      {/* Header com ações */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Produtos</h2>
          <p className="text-muted-foreground text-sm">
            {categoryId
              ? `Categoria selecionada: ${categoryId}`
              : 'Selecione uma categoria'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button onClick={handleSaveAndPublish}>
            <Save className="h-4 w-4 mr-2" />
            Salvar e Publicar
          </Button>
        </div>
      </div>

      {/* Grid de produtos */}
      {categoryId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockProducts.map((product) => (
            <ProdutoCard
              key={product.id}
              product={product}
              onEdit={handleEdit}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Selecione uma categoria para visualizar os produtos
        </div>
      )}

      {/* Modais */}
      <ModalImportar open={importModalOpen} onClose={() => setImportModalOpen(false)} />
      <ModalEditarProduto
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
}
