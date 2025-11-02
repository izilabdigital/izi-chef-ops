import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Order } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ChefHat, Check } from 'lucide-react';
import { toast } from 'sonner';

const OrderQueue = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasActiveShift, setHasActiveShift] = useState(false);

  useEffect(() => {
    fetchOrders();
    checkActiveShift();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('pizzaiolo-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos',
          filter: `status=in.(pendente,em preparo)`,
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
    if (!hasActiveShift && newStatus === 'em preparo') {
      toast.error('Você precisa iniciar seu turno antes de começar a preparar pedidos');
      return;
    }

    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'em preparo' && user) {
        updates.pizzaiolo_id = user.id;
      }

      const { error } = await supabase
        .from('pedidos')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;
      toast.success(`Pedido atualizado para: ${newStatus}`);
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast.error('Erro ao atualizar pedido');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-status-pending';
      case 'em preparo':
        return 'bg-status-preparing';
      default:
        return 'bg-muted';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando pedidos...</div>;
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhum pedido pendente no momento
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground">Fila de Pedidos</h2>
      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span>Pedido #{order.numero_pedido}</span>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {new Date(order.created_at).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold">{order.nome}</p>
                <p className="text-sm text-muted-foreground">{order.telefone}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium">Itens:</p>
                {Array.isArray(order.itens) && order.itens.map((item: any, idx: number) => (
                  <p key={idx} className="text-sm text-muted-foreground">
                    {item.quantidade}x {item.nome}
                  </p>
                ))}
              </div>

              {order.complemento && (
                <div>
                  <p className="text-sm font-medium">Observações:</p>
                  <p className="text-sm text-muted-foreground">{order.complemento}</p>
                </div>
              )}

              <div className="flex gap-2">
                {order.status === 'pendente' && (
                  <Button
                    onClick={() => updateOrderStatus(order.id, 'em preparo')}
                    disabled={!hasActiveShift}
                    className="gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50"
                  >
                    <ChefHat className="w-4 h-4" />
                    Iniciar Preparo
                  </Button>
                )}
                {order.status === 'em preparo' && (
                  <Button
                    onClick={() => updateOrderStatus(order.id, 'pronto')}
                    className="gap-2 bg-status-ready hover:opacity-90"
                  >
                    <Check className="w-4 h-4" />
                    Marcar como Pronto
                  </Button>
                )}
              </div>
              {!hasActiveShift && order.status === 'pendente' && (
                <p className="text-sm text-amber-500 mt-2">
                  ⚠️ Inicie seu turno para começar a preparar pedidos
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OrderQueue;
