import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Order } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import OrderCard from './OrderCard';
import CategoryFilter from './CategoryFilter';
import OrderHistory from './OrderHistory';
import TVMode from './TVMode';

const OrderQueue = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasActiveShift, setHasActiveShift] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [avgPrepTime, setAvgPrepTime] = useState(0);

  useEffect(() => {
    fetchOrders();
    checkActiveShift();
    fetchAvgPrepTime();
    
    // Subscribe to real-time updates for new and updated orders
    const channel = supabase
      .channel('pizzaiolo-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos',
        },
        (payload) => {
          console.log('Real-time update:', payload);
          // Recarrega apenas quando há novos pedidos ou atualizações relevantes
          if (payload.eventType === 'INSERT' || 
              (payload.eventType === 'UPDATE' && 
               ['pendente', 'em preparo'].includes((payload.new as any)?.status))) {
            fetchOrders();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAvgPrepTime = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_avg_prep_time_today');

      if (error) throw error;
      setAvgPrepTime(data || 0);
    } catch (error: any) {
      console.error('Error fetching avg prep time:', error);
    }
  };

  const checkActiveShift = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('ponto_em_aberto')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setHasActiveShift(data?.ponto_em_aberto || false);
    } catch (error: any) {
      console.error('Error checking shift status:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .in('status', ['pendente', 'em preparo'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: 'em preparo' | 'pronto') => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const inicioPreparo = newStatus === 'em preparo' ? new Date().toISOString() : order.inicio_preparo;

      // Se não tiver turno ativo e está tentando iniciar preparo, inicia o turno primeiro
      if (!hasActiveShift && newStatus === 'em preparo' && user) {
        const now = new Date();
        
        // Registrar ponto
        const { error: pontoError } = await supabase
          .from('ponto_funcionarios')
          .insert({
            usuario_id: user.id,
            hora_entrada: now.toISOString(),
            data: now.toISOString().split('T')[0],
          });

        if (pontoError) throw pontoError;

        // Atualizar ponto_em_aberto
        const { error: updateUserError } = await supabase
          .from('usuarios')
          .update({ ponto_em_aberto: true })
          .eq('id', user.id);

        if (updateUserError) throw updateUserError;

        setHasActiveShift(true);
        toast.success('Turno iniciado automaticamente');
      }

      const updates: any = { status: newStatus };
      if (newStatus === 'em preparo' && user) {
        updates.pizzaiolo_id = user.id;
        updates.inicio_preparo = inicioPreparo;
      }

      const { error } = await supabase
        .from('pedidos')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;

      // Se está marcando como pronto, registrar métrica de produção
      if (newStatus === 'pronto' && user && inicioPreparo) {
        const fimPreparo = new Date();
        const tempoPreparoSegundos = Math.floor(
          (fimPreparo.getTime() - new Date(inicioPreparo).getTime()) / 1000
        );

        // Extrair categoria da pizza do primeiro item
        const categoriaPizza = Array.isArray(order.itens) && order.itens[0]?.category;

        await supabase.from('metricas_producao').insert({
          pedido_id: orderId,
          pizzaiolo_id: user.id,
          tempo_preparo_segundos: tempoPreparoSegundos,
          inicio_preparo: inicioPreparo,
          fim_preparo: fimPreparo.toISOString(),
          categoria_pizza: categoriaPizza,
        });

        // Atualizar tempo médio
        fetchAvgPrepTime();
      }
      
      // Atualização otimista - remove o pedido da lista imediatamente
      if (newStatus === 'pronto') {
        setOrders(orders.filter(order => order.id !== orderId));
      } else {
        // Atualiza o status no estado local
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus, pizzaiolo_id: user?.id, inicio_preparo: inicioPreparo } : order
        ));
      }
      
      toast.success(`Pedido atualizado para: ${newStatus}`);
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast.error('Erro ao atualizar pedido: ' + error.message);
      // Em caso de erro, recarrega os pedidos
      fetchOrders();
    }
  };

  // Filtrar pedidos por categoria
  const getCategoryFromItems = (items: any[]): string | null => {
    if (!Array.isArray(items) || items.length === 0) return null;
    
    const firstItem = items[0];
    if (firstItem?.category) return firstItem.category;
    
    // Se não tiver categoria, tentar inferir do nome
    const name = firstItem?.name?.toLowerCase() || '';
    if (name.includes('doce') || name.includes('chocolate') || name.includes('brigadeiro')) {
      return 'doce';
    }
    if (name.includes('especial') || name.includes('premium')) {
      return 'especial';
    }
    if (items.length > 1) {
      return 'meio-a-meio';
    }
    return 'classica';
  };

  const filteredOrders = selectedCategory
    ? orders.filter(order => getCategoryFromItems(order.itens) === selectedCategory)
    : orders;

  if (loading) {
    return <div className="text-center py-8">Carregando pedidos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Gestão de Pedidos</h2>
        <TVMode avgPrepTime={avgPrepTime} />
      </div>

      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="queue">Fila de Pedidos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />

          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {selectedCategory 
                  ? 'Nenhum pedido encontrado nesta categoria'
                  : 'Nenhum pedido pendente no momento'
                }
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={updateOrderStatus}
                  hasActiveShift={hasActiveShift}
                  avgPrepTime={avgPrepTime}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <OrderHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderQueue;
