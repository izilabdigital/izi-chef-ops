import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Package, Truck } from 'lucide-react';
import { toast } from 'sonner';

interface Employee {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  ativo: boolean;
  created_at: string;
  ultimo_login: string | null;
}

interface WorkStats {
  pizzasProduced: number;
  deliveriesCompleted: number;
  hoursToday: number;
  hoursMonth: number;
}

interface WorkHistory {
  data: string;
  hora_entrada: string;
  hora_saida: string | null;
}

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [stats, setStats] = useState<WorkStats>({
    pizzasProduced: 0,
    deliveriesCompleted: 0,
    hoursToday: 0,
    hoursMonth: 0,
  });
  const [workHistory, setWorkHistory] = useState<WorkHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchEmployeeData();
    }
  }, [id]);

  const fetchEmployeeData = async () => {
    try {
      // Fetch employee info
      const { data: empData, error: empError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', id)
        .single();

      if (empError) throw empError;
      setEmployee(empData);

      // Fetch work history
      const { data: historyData, error: historyError } = await supabase
        .from('ponto_funcionarios')
        .select('*')
        .eq('usuario_id', id)
        .order('data', { ascending: false })
        .limit(10);

      if (historyError) throw historyError;
      setWorkHistory(historyData || []);

      // Calculate hours
      const today = new Date().toISOString().split('T')[0];
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const todayWork = historyData?.filter(h => h.data === today) || [];
      const monthWork = historyData?.filter(h => h.data >= monthAgo) || [];

      const calculateHours = (records: WorkHistory[]) => {
        return records.reduce((total, record) => {
          if (record.hora_saida) {
            const entrada = new Date(record.hora_entrada);
            const saida = new Date(record.hora_saida);
            const hours = (saida.getTime() - entrada.getTime()) / (1000 * 60 * 60);
            return total + hours;
          }
          return total;
        }, 0);
      };

      // Fetch production stats based on role
      if (empData.cargo === 'pizzaiolo') {
        const { data: pizzaData } = await supabase
          .from('pedidos')
          .select('id')
          .eq('pizzaiolo_id', id)
          .eq('status', 'entregue');
        
        setStats({
          ...stats,
          pizzasProduced: pizzaData?.length || 0,
          hoursToday: calculateHours(todayWork),
          hoursMonth: calculateHours(monthWork),
        });
      } else if (empData.cargo === 'entregador') {
        const { data: deliveryData } = await supabase
          .from('pedidos')
          .select('id')
          .eq('entregador_id', id)
          .eq('status', 'entregue');
        
        setStats({
          ...stats,
          deliveriesCompleted: deliveryData?.length || 0,
          hoursToday: calculateHours(todayWork),
          hoursMonth: calculateHours(monthWork),
        });
      }

    } catch (error: any) {
      console.error('Error fetching employee data:', error);
      toast.error('Erro ao carregar dados do funcionário');
    } finally {
      setLoading(false);
    }
  };

  const deactivateEmployee = async () => {
    if (!employee || !confirm('Tem certeza que deseja desativar este funcionário?')) return;

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ ativo: false })
        .eq('id', employee.id);

      if (error) throw error;
      toast.success('Funcionário desativado com sucesso');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error deactivating employee:', error);
      toast.error('Erro ao desativar funcionário');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!employee) {
    return <div className="min-h-screen flex items-center justify-center">Funcionário não encontrado</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold">Perfil do Funcionário</h1>
        </div>

        {/* Employee Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{employee.nome}</CardTitle>
                <p className="text-muted-foreground mt-1">{employee.email}</p>
              </div>
              <div className="flex gap-2">
                <Badge className={employee.ativo ? 'bg-status-ready' : 'bg-muted'}>
                  {employee.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
                <Badge className="bg-primary">
                  {employee.cargo.charAt(0).toUpperCase() + employee.cargo.slice(1)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Data de Cadastro</p>
                <p className="font-medium">{new Date(employee.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              {employee.ultimo_login && (
                <div>
                  <p className="text-sm text-muted-foreground">Último Login</p>
                  <p className="font-medium">{new Date(employee.ultimo_login).toLocaleString('pt-BR')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {employee.cargo === 'pizzaiolo' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pizzas Produzidas</CardTitle>
                <Package className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.pizzasProduced}</div>
              </CardContent>
            </Card>
          )}

          {employee.cargo === 'entregador' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entregas Realizadas</CardTitle>
                <Truck className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.deliveriesCompleted}</div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Horas Hoje</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.hoursToday.toFixed(1)}h</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Horas no Mês</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.hoursMonth.toFixed(1)}h</div>
            </CardContent>
          </Card>
        </div>

        {/* Work History */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Ponto</CardTitle>
          </CardHeader>
          <CardContent>
            {workHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Nenhum registro de ponto</p>
            ) : (
              <div className="space-y-2">
                {workHistory.map((record, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">{new Date(record.data).toLocaleDateString('pt-BR')}</p>
                      <p className="text-sm text-muted-foreground">
                        Entrada: {new Date(record.hora_entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      {record.hora_saida ? (
                        <>
                          <p className="text-sm text-muted-foreground">
                            Saída: {new Date(record.hora_saida).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-sm font-medium">
                            {((new Date(record.hora_saida).getTime() - new Date(record.hora_entrada).getTime()) / (1000 * 60 * 60)).toFixed(1)}h
                          </p>
                        </>
                      ) : (
                        <Badge className="bg-status-preparing">Em andamento</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        {employee.ativo && (
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={deactivateEmployee}>
                Desativar Funcionário
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EmployeeProfile;
