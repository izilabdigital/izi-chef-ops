import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Order } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Truck, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const DeliveryQueue = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('delivery-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos',
          filter: `status=in.(Pronto,Em rota de entrega)`,
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

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .in('status', ['Pronto', 'Em rota de entrega'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error('Erro ao carregar entregas');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: 'Em rota de entrega' | 'Entregue') => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'Em rota de entrega' && user) {
        updates.entregador_id = user.id;
      }

      const { error } = await supabase
        .from('pedidos')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;
      toast.success(`Pedido atualizado para: ${newStatus}`);
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast.error('Erro ao atualizar entrega');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pronto':
        return 'bg-status-ready';
      case 'Em rota de entrega':
        return 'bg-status-delivering';
      default:
        return 'bg-muted';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando entregas...</div>;
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhuma entrega disponível no momento
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground">Entregas Disponíveis</h2>
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
                <div className="text-lg font-semibold text-primary">
                  R$ {order.total.toFixed(2)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold">{order.cliente_nome}</p>
                <p className="text-sm text-muted-foreground">{order.cliente_telefone}</p>
              </div>

              {order.endereco_entrega && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                  <p className="text-sm">{order.endereco_entrega}</p>
                </div>
              )}
              
              <div className="space-y-1">
                <p className="text-sm font-medium">Itens:</p>
                {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                  <p key={idx} className="text-sm text-muted-foreground">
                    {item.quantidade}x {item.nome}
                  </p>
                ))}
              </div>

              {order.metodo_pagamento && (
                <div>
                  <p className="text-sm font-medium">Pagamento:</p>
                  <p className="text-sm text-muted-foreground">{order.metodo_pagamento}</p>
                </div>
              )}

              <div className="flex gap-2">
                {order.status === 'Pronto' && (
                  <Button
                    onClick={() => updateOrderStatus(order.id, 'Em rota de entrega')}
                    className="gap-2 bg-status-delivering hover:opacity-90"
                  >
                    <Truck className="w-4 h-4" />
                    Iniciar Entrega
                  </Button>
                )}
                {order.status === 'Em rota de entrega' && (
                  <Button
                    onClick={() => updateOrderStatus(order.id, 'Entregue')}
                    className="gap-2 bg-status-completed hover:opacity-90"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Confirmar Entrega
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DeliveryQueue;
