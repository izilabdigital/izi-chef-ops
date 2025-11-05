import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, Star } from 'lucide-react';
import { FuncionarioMes, User } from '@/types/database';

interface FuncionarioMesWithUser extends FuncionarioMes {
  usuario: User;
}

export const EmployeeOfMonth = () => {
  const [currentMonth, setCurrentMonth] = useState<FuncionarioMesWithUser | null>(null);
  const [history, setHistory] = useState<FuncionarioMesWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployeeOfMonth();
  }, []);

  const fetchEmployeeOfMonth = async () => {
    try {
      const now = new Date();
      const currentMonthNum = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Buscar funcionário do mês atual
      const { data: current } = await supabase
        .from('funcionario_mes')
        .select(`
          *,
          usuario:usuarios(*)
        `)
        .eq('mes', currentMonthNum)
        .eq('ano', currentYear)
        .single();

      if (current) {
        setCurrentMonth(current as FuncionarioMesWithUser);
      }

      // Buscar histórico
      const { data: historyData } = await supabase
        .from('funcionario_mes')
        .select(`
          *,
          usuario:usuarios(*)
        `)
        .order('ano', { ascending: false })
        .order('mes', { ascending: false })
        .limit(6);

      if (historyData) {
        setHistory(historyData as FuncionarioMesWithUser[]);
      }
    } catch (error) {
      console.error('Erro ao buscar funcionário do mês:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {currentMonth && (
        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Funcionário do Mês - {getMonthName(currentMonth.mes)} {currentMonth.ano}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-yellow-400">
                <AvatarFallback className="text-2xl bg-yellow-100 dark:bg-yellow-900">
                  {currentMonth.usuario.nome.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-1">{currentMonth.usuario.nome}</h3>
                <p className="text-muted-foreground capitalize mb-3">{currentMonth.usuario.cargo}</p>
                
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-xl font-semibold">
                    {currentMonth.pontuacao.toFixed(1)} pontos
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(currentMonth.metricas).map(([key, value]: [string, any]) => (
                    <div key={key} className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground capitalize">
                        {key.replace('_', ' ')}
                      </p>
                      <p className="text-lg font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Histórico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {history.map((record) => (
              <div
                key={record.id}
                className="flex items-center gap-4 p-4 rounded-lg border"
              >
                <Avatar>
                  <AvatarFallback>
                    {record.usuario.nome.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <p className="font-medium">{record.usuario.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {getMonthName(record.mes)} {record.ano}
                  </p>
                </div>
                
                <Badge variant="outline" className="gap-1">
                  <Star className="h-3 w-3" />
                  {record.pontuacao.toFixed(1)} pts
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
