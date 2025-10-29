import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, CreditCard } from 'lucide-react';

const FinancesDashboard = () => {
  const [finances, setFinances] = useState({
    today: 0,
    week: 0,
    month: 0,
  });

  useEffect(() => {
    fetchFinances();
  }, []);

  const fetchFinances = async () => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      // Vendas de hoje
      const { data: todayData, error: todayError } = await supabase
        .from('pedidos')
        .select('total')
        .eq('status', 'Entregue')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      if (todayError) throw todayError;

      // Vendas da semana
      const { data: weekData, error: weekError } = await supabase
        .from('pedidos')
        .select('total')
        .eq('status', 'Entregue')
        .gte('created_at', weekAgo.toISOString());

      if (weekError) throw weekError;

      // Vendas do mês
      const { data: monthData, error: monthError } = await supabase
        .from('pedidos')
        .select('total')
        .eq('status', 'Entregue')
        .gte('created_at', monthAgo.toISOString());

      if (monthError) throw monthError;

      setFinances({
        today: todayData?.reduce((sum, order) => sum + order.total, 0) || 0,
        week: weekData?.reduce((sum, order) => sum + order.total, 0) || 0,
        month: monthData?.reduce((sum, order) => sum + order.total, 0) || 0,
      });
    } catch (error: any) {
      console.error('Error fetching finances:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {finances.today.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Semana</CardTitle>
            <TrendingUp className="h-4 w-4 text-status-ready" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {finances.week.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mês</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {finances.month.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancesDashboard;
