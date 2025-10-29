import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<User[]>([]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('nome');

      if (error) throw error;
      setEmployees((data || []) as User[]);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'gerente':
        return <Badge className="bg-primary">Gerente</Badge>;
      case 'pizzaiolo':
        return <Badge className="bg-status-preparing">Pizzaiolo</Badge>;
      case 'entregador':
        return <Badge className="bg-status-delivering">Entregador</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Gerenciamento de Funcionários
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {employees.map((employee) => (
            <div key={employee.id} className="flex items-center justify-between border-b pb-4 last:border-0">
              <div className="space-y-1">
                <p className="font-semibold">{employee.nome}</p>
                <p className="text-sm text-muted-foreground">{employee.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {getRoleBadge(employee.cargo)}
                {employee.ativo ? (
                  <Badge variant="outline" className="bg-status-ready/10 text-status-ready">
                    Ativo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-muted">
                    Inativo
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeManagement;
