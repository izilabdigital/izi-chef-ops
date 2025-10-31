import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, ShoppingCart, XCircle } from 'lucide-react';

interface FinancialStats {
  totalVendas: number;
  pedidosConcluidos: number;
  pedidosCancelados: number;
  pedidosEmAndamento: number;
  receitaTotal: number;
}

const FinancesDashboard = () => {
  const [statsDay, setStatsDay] = useState<FinancialStats>({
    totalVendas: 0,
    pedidosConcluidos: 0,
    pedidosCancelados: 0,
    pedidosEmAndamento: 0,
    receitaTotal: 0,
  });
  const [statsWeek, setStatsWeek] = useState<FinancialStats>({
    totalVendas: 0,
    pedidosConcluidos: 0,
    pedidosCancelados: 0,
    pedidosEmAndamento: 0,
    receitaTotal: 0,
  });
  const [statsMonth, setStatsMonth] = useState<FinancialStats>({
    totalVendas: 0,
    pedidosConcluidos: 0,
    pedidosCancelados: 0,
    pedidosEmAndamento: 0,
    receitaTotal: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
    
    const channel = supabase
      .channel('financial-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        fetchFinancialData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const calculateStats = (data: any[]): FinancialStats => {
    const concluidos = data.filter(o => o.status === 'entregue');
    const cancelados = data.filter(o => o.status === 'cancelado');
    const emAndamento = data.filter(o => !['entregue', 'cancelado'].includes(o.status));
    
    return {
      totalVendas: data.length,
      pedidosConcluidos: concluidos.length,
      pedidosCancelados: cancelados.length,
      pedidosEmAndamento: emAndamento.length,
      receitaTotal: concluidos.reduce((sum, o) => sum + Number(o.total), 0),
    };
  };

  const fetchFinancialData = async () => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data: dayData, error: dayError } = await supabase
        .from('pedidos')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      if (dayError) throw dayError;
      setStatsDay(calculateStats(dayData || []));

      const { data: weekData, error: weekError } = await supabase
        .from('pedidos')
        .select('*')
        .gte('created_at', weekAgo);

      if (weekError) throw weekError;
      setStatsWeek(calculateStats(weekData || []));

      const { data: monthData, error: monthError } = await supabase
        .from('pedidos')
        .select('*')
        .gte('created_at', monthAgo);

      if (monthError) throw monthError;
      setStatsMonth(calculateStats(monthData || []));

    } catch (error: any) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatsCards = ({ stats }: { stats: FinancialStats }) => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            R$ {stats.receitaTotal.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            De pedidos concluídos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalVendas}</div>
          <div className="flex gap-2 mt-2">
            <Badge className="bg-status-ready text-xs">
              {stats.pedidosConcluidos} concluídos
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
          <TrendingUp className="h-4 w-4 text-status-preparing" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-status-preparing">
            {stats.pedidosEmAndamento}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Pedidos ativos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
          <XCircle className="h-4 w-4 text-status-cancelled" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-status-cancelled">
            {stats.pedidosCancelados}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Pedidos cancelados
          </p>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return <div className="text-center py-8">Carregando dados financeiros...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Controle Financeiro</h2>
      
      <Tabs defaultValue="day" className="space-y-4">
        <TabsList>
          <TabsTrigger value="day">Hoje</TabsTrigger>
          <TabsTrigger value="week">Última Semana</TabsTrigger>
          <TabsTrigger value="month">Último Mês</TabsTrigger>
        </TabsList>

        <TabsContent value="day">
          <StatsCards stats={statsDay} />
        </TabsContent>

        <TabsContent value="week">
          <StatsCards stats={statsWeek} />
        </TabsContent>

        <TabsContent value="month">
          <StatsCards stats={statsMonth} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancesDashboard;
