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
  ingredientes?: string[];
  tamanhos?: { tamanho: string; preco: number }[];
  itens_combo?: string[];
  tipo_embalagem?: string;
  e_sobremesa?: boolean;
}

interface FormDataType {
  nome: string;
  descricao: string;
  preco: string;
  imagem_url: string;
  categoria: string;
  disponivel: boolean;
  desconto_percentual: string;
  validade_promocao: string;
  ingredientes: string[];
  tamanhos: { tamanho: string; preco: string }[];
  itens_combo: string[];
  tipo_embalagem: string;
  e_sobremesa: boolean;
}

const MenuManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<FormDataType>({
    nome: '',
    descricao: '',
    preco: '',
    imagem_url: '',
    categoria: 'pizza',
    disponivel: true,
    desconto_percentual: '0',
    validade_promocao: '',
    ingredientes: [],
    tamanhos: [{ tamanho: 'M', preco: '' }],
    itens_combo: [],
    tipo_embalagem: '',
    e_sobremesa: false,
  });
  const [newIngredient, setNewIngredient] = useState('');
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

  // Resetar campos específicos quando categoria mudar
  useEffect(() => {
    if (!editingProduct) {
      setFormData(prev => ({
        ...prev,
        ingredientes: [],
        tamanhos: [{ tamanho: 'M', preco: '' }],
        itens_combo: [],
        tipo_embalagem: '',
        e_sobremesa: false,
      }));
    }
  }, [formData.categoria, editingProduct]);

  useEffect(() => {
    fetchProducts();
    fetchAvailableProducts();
    
    const channel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' }, () => {
        fetchProducts();
        fetchAvailableProducts();
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
      setProducts((data || []) as unknown as Product[]);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('disponivel', true)
        .order('nome', { ascending: true });

      if (error) throw error;
      setAvailableProducts((data || []) as unknown as Product[]);
    } catch (error: any) {
      console.error('Error fetching available products:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const productData: any = {
        nome: formData.nome,
        descricao: formData.descricao || null,
        imagem_url: formData.imagem_url || null,
        categoria: formData.categoria,
        disponivel: formData.disponivel,
        desconto_percentual: parseInt(formData.desconto_percentual) || 0,
        validade_promocao: formData.validade_promocao || null,
        ingredientes: [],
        tamanhos: [],
        itens_combo: [],
        tipo_embalagem: null,
        e_sobremesa: false,
      };

      // Adicionar campos específicos por categoria
      if (formData.categoria === 'pizza') {
        productData.ingredientes = formData.ingredientes || [];
        const tamanhosValidos = formData.tamanhos.filter(t => t.preco && parseFloat(t.preco) > 0);
        if (tamanhosValidos.length > 0) {
          productData.tamanhos = tamanhosValidos.map(t => ({
            tamanho: t.tamanho,
            preco: parseFloat(t.preco)
          }));
          productData.preco = 0;
        } else {
          productData.preco = parseFloat(formData.preco) || 0;
        }
      } else if (formData.categoria === 'combo') {
        productData.itens_combo = formData.itens_combo || [];
        productData.preco = parseFloat(formData.preco) || 0;
      } else if (formData.categoria === 'bebida') {
        productData.tipo_embalagem = formData.tipo_embalagem || null;
        const tamanhosValidos = formData.tamanhos.filter(t => t.preco && parseFloat(t.preco) > 0);
        if (tamanhosValidos.length > 0) {
          productData.tamanhos = tamanhosValidos.map(t => ({
            tamanho: t.tamanho,
            preco: parseFloat(t.preco)
          }));
          productData.preco = 0;
        } else {
          productData.preco = parseFloat(formData.preco) || 0;
        }
      } else if (formData.categoria === 'sobremesa') {
        productData.e_sobremesa = true;
        productData.preco = parseFloat(formData.preco) || 0;
      } else {
        productData.preco = parseFloat(formData.preco) || 0;
      }

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
      ingredientes: product.ingredientes || [],
      tamanhos: product.tamanhos?.map(t => ({ tamanho: t.tamanho, preco: t.preco.toString() })) || [{ tamanho: 'M', preco: '' }],
      itens_combo: product.itens_combo || [],
      tipo_embalagem: product.tipo_embalagem || '',
      e_sobremesa: product.e_sobremesa || false,
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
      ingredientes: [],
      tamanhos: [{ tamanho: 'M', preco: '' }],
      itens_combo: [],
      tipo_embalagem: '',
      e_sobremesa: false,
    });
    setNewIngredient('');
  };

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setFormData({ ...formData, ingredientes: [...formData.ingredientes, newIngredient.trim()] });
      setNewIngredient('');
    }
  };

  const removeIngredient = (index: number) => {
    setFormData({ 
      ...formData, 
      ingredientes: formData.ingredientes.filter((_, i) => i !== index) 
    });
  };

  const addTamanho = () => {
    setFormData({ 
      ...formData, 
      tamanhos: [...formData.tamanhos, { tamanho: '', preco: '' }] 
    });
  };

  const removeTamanho = (index: number) => {
    if (formData.tamanhos.length > 1) {
      setFormData({ 
        ...formData, 
        tamanhos: formData.tamanhos.filter((_, i) => i !== index) 
      });
    }
  };

  const updateTamanho = (index: number, field: 'tamanho' | 'preco', value: string) => {
    const newTamanhos = [...formData.tamanhos];
    newTamanhos[index] = { ...newTamanhos[index], [field]: value };
    setFormData({ ...formData, tamanhos: newTamanhos });
  };

  const toggleComboItem = (productId: string) => {
    if (formData.itens_combo.includes(productId)) {
      setFormData({ 
        ...formData, 
        itens_combo: formData.itens_combo.filter(id => id !== productId) 
      });
    } else {
      setFormData({ 
        ...formData, 
        itens_combo: [...formData.itens_combo, productId] 
      });
    }
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
                  <Label htmlFor="preco">
                    Preço Base (R$) {(formData.categoria === 'pizza' || formData.categoria === 'bebida') && formData.tamanhos.length > 0 ? '(Opcional)' : '*'}
                  </Label>
                  <Input
                    id="preco"
                    type="number"
                    step="0.01"
                    value={formData.preco}
                    onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                    required={!(formData.categoria === 'pizza' || formData.categoria === 'bebida') || formData.tamanhos.length === 0}
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

              {/* Campos específicos por categoria */}
              
              {/* PIZZA: Ingredientes e Tamanhos */}
              {formData.categoria === 'pizza' && (
                <>
                  <div className="space-y-2">
                    <Label>Ingredientes</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newIngredient}
                        onChange={(e) => setNewIngredient(e.target.value)}
                        placeholder="Ex: Mussarela, Calabresa..."
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
                      />
                      <Button type="button" onClick={addIngredient} size="sm">
                        Adicionar
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.ingredientes.map((ing, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {ing}
                          <button
                            type="button"
                            onClick={() => removeIngredient(index)}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tamanhos e Preços</Label>
                    {formData.tamanhos.map((tamanho, index) => (
                      <div key={index} className="flex gap-2">
                        <Select
                          value={tamanho.tamanho}
                          onValueChange={(value) => updateTamanho(index, 'tamanho', value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Tamanho" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="P">P</SelectItem>
                            <SelectItem value="M">M</SelectItem>
                            <SelectItem value="G">G</SelectItem>
                            <SelectItem value="GG">GG</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Preço"
                          value={tamanho.preco}
                          onChange={(e) => updateTamanho(index, 'preco', e.target.value)}
                          className="flex-1"
                        />
                        {formData.tamanhos.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeTamanho(index)}
                          >
                            Remover
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addTamanho}>
                      + Adicionar Tamanho
                    </Button>
                  </div>
                </>
              )}

              {/* COMBO: Seleção de Produtos */}
              {formData.categoria === 'combo' && (
                <div className="space-y-2">
                  <Label>Produtos no Combo</Label>
                  <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                    {availableProducts
                      .filter(p => p.id !== editingProduct?.id)
                      .map((product) => (
                        <div key={product.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`combo-${product.id}`}
                            checked={formData.itens_combo.includes(product.id)}
                            onChange={() => toggleComboItem(product.id)}
                            className="rounded"
                          />
                          <Label htmlFor={`combo-${product.id}`} className="flex-1 cursor-pointer">
                            {product.nome} - {product.categoria} - R$ {product.preco.toFixed(2)}
                          </Label>
                        </div>
                      ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formData.itens_combo.length} produto(s) selecionado(s)
                  </p>
                </div>
              )}

              {/* BEBIDA: Tipo de Embalagem e Tamanhos */}
              {formData.categoria === 'bebida' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="tipo_embalagem">Tipo de Embalagem</Label>
                    <Select
                      value={formData.tipo_embalagem}
                      onValueChange={(value) => setFormData({ ...formData, tipo_embalagem: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Lata 350ml">Lata 350ml</SelectItem>
                        <SelectItem value="Garrafa 600ml">Garrafa 600ml</SelectItem>
                        <SelectItem value="Garrafa 1L">Garrafa 1L</SelectItem>
                        <SelectItem value="Garrafa 2L">Garrafa 2L</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Variações de Tamanho (Opcional)</Label>
                    {formData.tamanhos.map((tamanho, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Ex: 350ml, 1L..."
                          value={tamanho.tamanho}
                          onChange={(e) => updateTamanho(index, 'tamanho', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Preço"
                          value={tamanho.preco}
                          onChange={(e) => updateTamanho(index, 'preco', e.target.value)}
                          className="w-32"
                        />
                        {formData.tamanhos.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeTamanho(index)}
                          >
                            Remover
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addTamanho}>
                      + Adicionar Variação
                    </Button>
                  </div>
                </>
              )}

              {/* SOBREMESA: Toggle */}
              {formData.categoria === 'sobremesa' && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="e_sobremesa"
                    checked={formData.e_sobremesa}
                    onCheckedChange={(checked) => setFormData({ ...formData, e_sobremesa: checked })}
                  />
                  <Label htmlFor="e_sobremesa">
                    Este produto também pode ser usado como sobremesa
                  </Label>
                </div>
              )}

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
