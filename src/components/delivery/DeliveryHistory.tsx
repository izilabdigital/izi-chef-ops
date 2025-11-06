import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Order } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Clock, Package, DollarSign, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DeliveryHistory = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    totalValue: 0,
    avgTime: 0,
    avgDistance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;

    try {
      // Buscar entregas concluídas
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('entregador_id', user.id)
        .eq('status', 'entregue')
        .order('fim_rota', { ascending: false })
        .limit(50);

      if (error) throw error;

      setDeliveries(data || []);

      // Calcular estatísticas
      if (data && data.length > 0) {
        const totalValue = data.reduce((sum, order) => sum + order.total, 0);
        
        const deliveriesWithTime = data.filter(d => d.inicio_rota && d.fim_rota);
        const avgTime = deliveriesWithTime.length > 0
          ? deliveriesWithTime.reduce((sum, order) => {
              const start = new Date(order.inicio_rota!).getTime();
              const end = new Date(order.fim_rota!).getTime();
              return sum + (end - start) / 60000; // converter para minutos
            }, 0) / deliveriesWithTime.length
          : 0;

        const deliveriesWithDistance = data.filter(d => d.distancia_km);
        const avgDistance = deliveriesWithDistance.length > 0
          ? deliveriesWithDistance.reduce((sum, order) => sum + (order.distancia_km || 0), 0) / deliveriesWithDistance.length
          : 0;

        setStats({
          totalDeliveries: data.length,
          totalValue,
          avgTime,
          avgDistance,
        });
      }
    } catch (error: any) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDeliveryTime = (order: Order) => {
    if (!order.inicio_rota || !order.fim_rota) return 'N/A';
    const start = new Date(order.inicio_rota).getTime();
    const end = new Date(order.fim_rota).getTime();
    const minutes = Math.round((end - start) / 60000);
    return `${minutes} min`;
  };

  if (loading) {
    return <div className="text-center py-8">Carregando histórico...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Entregas</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDeliveries}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-status-ready" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgTime.toFixed(0)} min</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distância Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDistance.toFixed(1)} km</div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Entregas */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Entregas</CardTitle>
        </CardHeader>
        <CardContent>
          {deliveries.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Nenhuma entrega concluída ainda
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Distância</TableHead>
                    <TableHead>Tempo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        #{order.numero_pedido}
                      </TableCell>
                      <TableCell>{order.nome}</TableCell>
                      <TableCell className="text-sm">
                        {order.bairro}, {order.cep}
                      </TableCell>
                      <TableCell>
                        {order.distancia_km ? `${order.distancia_km.toFixed(1)} km` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getDeliveryTime(order)}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        R$ {order.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {order.fim_rota && format(new Date(order.fim_rota), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryHistory;
