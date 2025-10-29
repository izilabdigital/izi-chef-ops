import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, CheckCircle, DollarSign } from 'lucide-react';

const DeliveryStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    completedDeliveries: 0,
    totalValue: 0,
  });

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Total de entregas do dia
      const { data: todayData, error: todayError } = await supabase
        .from('pedidos')
        .select('id, total')
        .eq('entregador_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      if (todayError) throw todayError;

      // Entregas concluídas
      const { data: completedData, error: completedError } = await supabase
        .from('pedidos')
        .select('id, total')
        .eq('entregador_id', user.id)
        .eq('status', 'Entregue')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      if (completedError) throw completedError;

      const totalValue = completedData?.reduce((sum, order) => sum + order.total, 0) || 0;

      setStats({
        todayDeliveries: todayData?.length || 0,
        completedDeliveries: completedData?.length || 0,
        totalValue,
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Entregas de Hoje</CardTitle>
          <Package className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.todayDeliveries}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
          <CheckCircle className="h-4 w-4 text-status-completed" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completedDeliveries}</div>
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
    </div>
  );
};

export default DeliveryStats;
