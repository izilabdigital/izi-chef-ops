import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { TimeTrack, User } from '@/types/database';

interface AttendanceWithUser extends TimeTrack {
  usuario: User;
}

export const AttendanceReport = () => {
  const [attendance, setAttendance] = useState<AttendanceWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('ponto_funcionarios')
        .select(`
          *,
          usuario:usuarios(*)
        `)
        .order('data', { ascending: false })
        .order('hora_entrada', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAttendance(data as AttendanceWithUser[]);
    } catch (error) {
      console.error('Erro ao buscar registros de ponto:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStatus = (record: AttendanceWithUser) => {
    const entryTime = parseISO(record.hora_entrada);
    const expectedStart = new Date(entryTime);
    expectedStart.setHours(8, 0, 0, 0); // Assuming 8 AM start time
    
    const delayMinutes = differenceInMinutes(entryTime, expectedStart);
    
    if (delayMinutes > 15) {
      return { label: 'Atraso', color: 'destructive', icon: AlertTriangle };
    } else if (delayMinutes > 0) {
      return { label: 'Leve Atraso', color: 'warning', icon: Clock };
    }
    return { label: 'No Horário', color: 'success', icon: CheckCircle };
  };

  const calculateWorkHours = (record: AttendanceWithUser) => {
    if (!record.hora_saida) return 'Em andamento';
    
    const entrada = parseISO(record.hora_entrada);
    const saida = parseISO(record.hora_saida);
    const minutes = differenceInMinutes(saida, entrada);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    return `${hours}h ${mins}min`;
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatório de Pontualidade</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Funcionário</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Entrada</TableHead>
              <TableHead>Saída</TableHead>
              <TableHead>Horas Trabalhadas</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendance.map((record) => {
              const status = getAttendanceStatus(record);
              const StatusIcon = status.icon;
              
              return (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.usuario.nome}</TableCell>
                  <TableCell className="capitalize">{record.usuario.cargo}</TableCell>
                  <TableCell>
                    {format(parseISO(record.data), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    {format(parseISO(record.hora_entrada), 'HH:mm', { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    {record.hora_saida
                      ? format(parseISO(record.hora_saida), 'HH:mm', { locale: ptBR })
                      : '-'}
                  </TableCell>
                  <TableCell>{calculateWorkHours(record)}</TableCell>
                  <TableCell>
                    <Badge variant={status.color as any} className="flex items-center gap-1 w-fit">
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
