import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  imagem_url: string | null;
  categoria: string;
  disponivel: boolean;
  desconto_percentual: number;
  validade_promocao: string | null;
}

const MenuManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: '',
    imagem_url: '',
    categoria: 'pizza',
    disponivel: true,
    desconto_percentual: '0',
    validade_promocao: '',
  });

  useEffect(() => {
    fetchProducts();
    
    const channel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('categoria', { ascending: true })
        .order('nome', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const productData = {
        nome: formData.nome,
        descricao: formData.descricao || null,
        preco: parseFloat(formData.preco),
        imagem_url: formData.imagem_url || null,
        categoria: formData.categoria,
        disponivel: formData.disponivel,
        desconto_percentual: parseInt(formData.desconto_percentual) || 0,
        validade_promocao: formData.validade_promocao || null,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('produtos')
          .update(productData)
          .eq('id', editingProduct.id);
        
        if (error) throw error;
        toast.success('Produto atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('produtos')
          .insert([productData]);
        
        if (error) throw error;
        toast.success('Produto adicionado com sucesso');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error('Erro ao salvar produto');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    try {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Produto excluído com sucesso');
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error('Erro ao excluir produto');
    }
  };

  const toggleAvailability = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('produtos')
        .update({ disponivel: !product.disponivel })
        .eq('id', product.id);
      
      if (error) throw error;
      toast.success(`Produto ${!product.disponivel ? 'ativado' : 'desativado'}`);
    } catch (error: any) {
      console.error('Error toggling availability:', error);
      toast.error('Erro ao alterar disponibilidade');
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      nome: product.nome,
      descricao: product.descricao || '',
      preco: product.preco.toString(),
      imagem_url: product.imagem_url || '',
      categoria: product.categoria,
      disponivel: product.disponivel,
      desconto_percentual: product.desconto_percentual.toString(),
      validade_promocao: product.validade_promocao || '',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      nome: '',
      descricao: '',
      preco: '',
      imagem_url: '',
      categoria: 'pizza',
      disponivel: true,
      desconto_percentual: '0',
      validade_promocao: '',
    });
  };

  if (loading) {
    return <div className="text-center py-8">Carregando produtos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gerenciamento de Cardápio</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Editar' : 'Adicionar'} Produto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pizza">Pizza</SelectItem>
                      <SelectItem value="combo">Combo</SelectItem>
                      <SelectItem value="bebida">Bebida</SelectItem>
                      <SelectItem value="sobremesa">Sobremesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="preco">Preço (R$) *</Label>
                  <Input
                    id="preco"
                    type="number"
                    step="0.01"
                    value={formData.preco}
                    onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desconto">Desconto (%)</Label>
                  <Input
                    id="desconto"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.desconto_percentual}
                    onChange={(e) => setFormData({ ...formData, desconto_percentual: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imagem_url">URL da Imagem</Label>
                <Input
                  id="imagem_url"
                  value={formData.imagem_url}
                  onChange={(e) => setFormData({ ...formData, imagem_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validade_promocao">Validade da Promoção</Label>
                <Input
                  id="validade_promocao"
                  type="datetime-local"
                  value={formData.validade_promocao}
                  onChange={(e) => setFormData({ ...formData, validade_promocao: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="disponivel"
                  checked={formData.disponivel}
                  onCheckedChange={(checked) => setFormData({ ...formData, disponivel: checked })}
                />
                <Label htmlFor="disponivel">Produto disponível</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProduct ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{product.nome}</CardTitle>
                  <Badge variant="outline" className="mt-1">{product.categoria}</Badge>
                </div>
                <Badge className={product.disponivel ? 'bg-status-ready' : 'bg-muted'}>
                  {product.disponivel ? 'Disponível' : 'Indisponível'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {product.descricao && (
                <p className="text-sm text-muted-foreground">{product.descricao}</p>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  {product.desconto_percentual > 0 ? (
                    <div>
                      <span className="text-sm line-through text-muted-foreground">
                        R$ {product.preco.toFixed(2)}
                      </span>
                      <p className="text-lg font-bold text-primary">
                        R$ {(product.preco * (1 - product.desconto_percentual / 100)).toFixed(2)}
                      </p>
                      <Badge className="bg-status-ready text-xs">-{product.desconto_percentual}%</Badge>
                    </div>
                  ) : (
                    <p className="text-lg font-bold text-primary">R$ {product.preco.toFixed(2)}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditDialog(product)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleAvailability(product)}
                  className="flex-1"
                >
                  {product.disponivel ? 'Desativar' : 'Ativar'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(product.id)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum produto cadastrado
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MenuManagement;
