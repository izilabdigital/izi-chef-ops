import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, UserX, Eye } from 'lucide-react';
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

const EmployeeManagement = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cargo: 'pizzaiolo',
    senha: '',
    ativo: true,
  });

  useEffect(() => {
    fetchEmployees();
    
    const channel = supabase
      .channel('employees-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, () => {
        fetchEmployees();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      toast.error('Erro ao carregar funcionários');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingEmployee) {
        const { error } = await supabase
          .from('usuarios')
          .update({
            nome: formData.nome,
            email: formData.email,
            cargo: formData.cargo,
            ativo: formData.ativo,
          })
          .eq('id', editingEmployee.id);
        
        if (error) throw error;
        toast.success('Funcionário atualizado com sucesso');
      } else {
        const { error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.senha,
          options: {
            data: {
              nome: formData.nome,
              cargo: formData.cargo,
            },
          },
        });
        
        if (authError) throw authError;
        toast.success('Funcionário adicionado com sucesso');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving employee:', error);
      toast.error(error.message || 'Erro ao salvar funcionário');
    }
  };

  const toggleStatus = async (employee: Employee) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ ativo: !employee.ativo })
        .eq('id', employee.id);
      
      if (error) throw error;
      toast.success(`Funcionário ${!employee.ativo ? 'ativado' : 'desativado'}`);
    } catch (error: any) {
      console.error('Error toggling status:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      nome: employee.nome,
      email: employee.email,
      cargo: employee.cargo,
      senha: '',
      ativo: employee.ativo,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingEmployee(null);
    setFormData({
      nome: '',
      email: '',
      cargo: 'pizzaiolo',
      senha: '',
      ativo: true,
    });
  };

  const getCargoLabel = (cargo: string) => {
    const labels: Record<string, string> = {
      gerente: 'Gerente',
      pizzaiolo: 'Pizzaiolo',
      entregador: 'Entregador',
    };
    return labels[cargo] || cargo;
  };

  const getCargoColor = (cargo: string) => {
    const colors: Record<string, string> = {
      gerente: 'bg-primary',
      pizzaiolo: 'bg-status-preparing',
      entregador: 'bg-status-delivering',
    };
    return colors[cargo] || 'bg-muted';
  };

  if (loading) {
    return <div className="text-center py-8">Carregando funcionários...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gerenciamento de Funcionários</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Funcionário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEmployee ? 'Editar' : 'Adicionar'} Funcionário</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={!!editingEmployee}
                />
              </div>

              {!editingEmployee && (
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha *</Label>
                  <Input
                    id="senha"
                    type="password"
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo *</Label>
                <Select value={formData.cargo} onValueChange={(value) => setFormData({ ...formData, cargo: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="pizzaiolo">Pizzaiolo</SelectItem>
                    <SelectItem value="entregador">Entregador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editingEmployee && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                  />
                  <Label htmlFor="ativo">Funcionário ativo</Label>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingEmployee ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {employees.map((employee) => (
          <Card key={employee.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{employee.nome}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{employee.email}</p>
                </div>
                <Badge className={employee.ativo ? 'bg-status-ready' : 'bg-muted'}>
                  {employee.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={getCargoColor(employee.cargo)}>
                  {getCargoLabel(employee.cargo)}
                </Badge>
              </div>

              {employee.ultimo_login && (
                <p className="text-xs text-muted-foreground">
                  Último login: {new Date(employee.ultimo_login).toLocaleString('pt-BR')}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/dashboard/employee/${employee.id}`)}
                  className="flex-1 gap-1"
                >
                  <Eye className="w-4 h-4" />
                  Ver Perfil
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditDialog(employee)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleStatus(employee)}
                  className={!employee.ativo ? 'text-status-ready' : 'text-muted-foreground'}
                >
                  {employee.ativo ? <UserX className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {employees.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum funcionário cadastrado
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeeManagement;
