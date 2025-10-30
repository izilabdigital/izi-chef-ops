import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pizza, CheckCircle, Clock } from 'lucide-react';

const ProductionStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todayOrders: 0,
    completedOrders: 0,
    avgTime: 0,
  });

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Total de pedidos que o pizzaiolo pegou hoje
      const { data: todayData, error: todayError } = await supabase
        .from('pedidos')
        .select('id')
        .eq('pizzaiolo_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .returns<{ id: string }[]>();

      if (todayError) throw todayError;

      // Pedidos completados
      const { data: completedData, error: completedError } = await supabase
        .from('pedidos')
        .select('id')
        .eq('pizzaiolo_id', user.id)
        .eq('status', 'Pronto')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .returns<{ id: string }[]>();

      if (completedError) throw completedError;

      setStats({
        todayOrders: todayData?.length || 0,
        completedOrders: completedData?.length || 0,
        avgTime: 0, // Pode calcular baseado em tempo_preparo se disponível
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pedidos de Hoje</CardTitle>
          <Pizza className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.todayOrders}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
          <CheckCircle className="h-4 w-4 text-status-ready" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completedOrders}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgTime} min</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionStats;
