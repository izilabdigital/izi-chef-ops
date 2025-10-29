import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Clock, CheckCircle, Truck } from 'lucide-react';

const OrdersOverview = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    preparing: 0,
    delivering: 0,
  });

  useEffect(() => {
    fetchOrders();
    
    const channel = supabase
      .channel('all-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos',
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
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const pending = data?.filter(o => o.status === 'Pendente').length || 0;
      const preparing = data?.filter(o => o.status === 'Em preparo').length || 0;
      const delivering = data?.filter(o => o.status === 'Em rota de entrega').length || 0;
      
      setStats({ total, pending, preparing, delivering });
    } catch (error: any) {
      console.error('Error fetching orders:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente':
        return 'bg-status-pending';
      case 'Em preparo':
        return 'bg-status-preparing';
      case 'Pronto':
        return 'bg-status-ready';
      case 'Em rota de entrega':
        return 'bg-status-delivering';
      case 'Entregue':
        return 'bg-status-completed';
      case 'Cancelado':
        return 'bg-status-cancelled';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-status-pending" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Preparo</CardTitle>
            <CheckCircle className="h-4 w-4 text-status-preparing" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.preparing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Entrega</CardTitle>
            <Truck className="h-4 w-4 text-status-delivering" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivering}</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhum pedido hoje
              </p>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">#{order.numero_pedido}</span>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{order.nome}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">R$ {order.total.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersOverview;
