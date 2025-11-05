import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Pizza, Truck, Clock } from 'lucide-react';
import { User } from '@/types/database';

interface PerformanceStats {
  usuario: User;
  totalPedidos: number;
  mediaTempoSegundos: number;
  rating: number;
}

export const PerformanceRanking = () => {
  const [pizzaioloRanking, setPizzaioloRanking] = useState<PerformanceStats[]>([]);
  const [entregadorRanking, setEntregadorRanking] = useState<PerformanceStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      // Buscar métricas de pizzaiolos
      const { data: pizzaioloData } = await supabase
        .from('metricas_producao')
        .select(`
          pizzaiolo_id,
          tempo_preparo_segundos,
          usuarios!metricas_producao_pizzaiolo_id_fkey(*)
        `)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Agrupar por pizzaiolo
      const pizzaioloStats: { [key: string]: PerformanceStats } = {};
      
      pizzaioloData?.forEach((metric: any) => {
        const id = metric.pizzaiolo_id;
        if (!pizzaioloStats[id]) {
          pizzaioloStats[id] = {
            usuario: metric.usuarios,
            totalPedidos: 0,
            mediaTempoSegundos: 0,
            rating: 0,
          };
        }
        pizzaioloStats[id].totalPedidos++;
        pizzaioloStats[id].mediaTempoSegundos += metric.tempo_preparo_segundos;
      });

      // Calcular médias e rating
      const pizzaioloRank = Object.values(pizzaioloStats).map(stat => ({
        ...stat,
        mediaTempoSegundos: stat.mediaTempoSegundos / stat.totalPedidos,
        rating: stat.totalPedidos * 10 - (stat.mediaTempoSegundos / stat.totalPedidos) / 60,
      })).sort((a, b) => b.rating - a.rating);

      setPizzaioloRanking(pizzaioloRank);

      // Buscar entregas
      const { data: entregadorData } = await supabase
        .from('pedidos')
        .select(`
          entregador_id,
          created_at,
          updated_at,
          usuarios!pedidos_entregador_id_fkey(*)
        `)
        .eq('status', 'entregue')
        .not('entregador_id', 'is', null)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const entregadorStats: { [key: string]: PerformanceStats } = {};
      
      entregadorData?.forEach((pedido: any) => {
        const id = pedido.entregador_id;
        if (!entregadorStats[id]) {
          entregadorStats[id] = {
            usuario: pedido.usuarios,
            totalPedidos: 0,
            mediaTempoSegundos: 0,
            rating: 0,
          };
        }
        entregadorStats[id].totalPedidos++;
        
        const tempo = new Date(pedido.updated_at).getTime() - new Date(pedido.created_at).getTime();
        entregadorStats[id].mediaTempoSegundos += tempo / 1000;
      });

      const entregadorRank = Object.values(entregadorStats).map(stat => ({
        ...stat,
        mediaTempoSegundos: stat.mediaTempoSegundos / stat.totalPedidos,
        rating: stat.totalPedidos * 10 - (stat.mediaTempoSegundos / stat.totalPedidos) / 60,
      })).sort((a, b) => b.rating - a.rating);

      setEntregadorRanking(entregadorRank);
    } catch (error) {
      console.error('Erro ao buscar rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}min`;
  };

  const RankingCard = ({ title, icon: Icon, data }: { title: string; icon: any; data: PerformanceStats[] }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.slice(0, 5).map((stat, index) => (
            <div key={stat.usuario.id} className="flex items-center gap-4">
              <div className="flex items-center gap-2 min-w-[50px]">
                {index === 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
                {index === 1 && <Trophy className="h-5 w-5 text-gray-400" />}
                {index === 2 && <Trophy className="h-5 w-5 text-amber-600" />}
                <span className="font-bold text-lg">#{index + 1}</span>
              </div>
              
              <Avatar>
                <AvatarFallback>
                  {stat.usuario.nome.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <p className="font-medium">{stat.usuario.nome}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Pizza className="h-3 w-3" />
                    {stat.totalPedidos} pedidos
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(stat.mediaTempoSegundos)}
                  </span>
                </div>
              </div>
              
              <Badge variant="outline">
                {Math.round(stat.rating)} pts
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <RankingCard
        title="Top Pizzaiolos"
        icon={Pizza}
        data={pizzaioloRanking}
      />
      <RankingCard
        title="Top Entregadores"
        icon={Truck}
        data={entregadorRanking}
      />
    </div>
  );
};
