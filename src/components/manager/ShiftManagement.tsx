import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Trash2 } from 'lucide-react';
import { Escala, User } from '@/types/database';

interface EscalaWithUser extends Escala {
  usuario: User;
}

export const ShiftManagement = () => {
  const [escalas, setEscalas] = useState<EscalaWithUser[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    usuario_id: '',
    turno: 'manha' as 'manha' | 'tarde' | 'noite',
    hora_inicio: '08:00',
    hora_fim: '14:00',
  });

  useEffect(() => {
    fetchUsuarios();
    fetchEscalas();
  }, [selectedDate]);

  const fetchUsuarios = async () => {
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('ativo', true)
      .order('nome');
    
    if (data) setUsuarios(data as User[]);
  };

  const fetchEscalas = async () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const { data } = await supabase
      .from('escalas')
      .select(`
        *,
        usuario:usuarios(*)
      `)
      .eq('data', dateStr)
      .eq('ativo', true)
      .order('hora_inicio');
    
    if (data) setEscalas(data as EscalaWithUser[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.from('escalas').insert({
      usuario_id: formData.usuario_id,
      data: format(selectedDate, 'yyyy-MM-dd'),
      turno: formData.turno,
      hora_inicio: formData.hora_inicio,
      hora_fim: formData.hora_fim,
    });

    if (error) {
      toast.error('Erro ao criar escala');
      return;
    }

    toast.success('Escala criada com sucesso!');
    setDialogOpen(false);
    fetchEscalas();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('escalas')
      .update({ ativo: false })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao remover escala');
      return;
    }

    toast.success('Escala removida!');
    fetchEscalas();
  };

  const getTurnoHorarios = (turno: string) => {
    switch (turno) {
      case 'manha':
        return { inicio: '08:00', fim: '14:00' };
      case 'tarde':
        return { inicio: '14:00', fim: '20:00' };
      case 'noite':
        return { inicio: '20:00', fim: '02:00' };
      default:
        return { inicio: '08:00', fim: '14:00' };
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Selecionar Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            locale={ptBR}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Escalas - {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Escala
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Escala</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Funcionário</Label>
                  <Select
                    value={formData.usuario_id}
                    onValueChange={(value) => setFormData({ ...formData, usuario_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {usuarios.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.nome} - {user.cargo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Turno</Label>
                  <Select
                    value={formData.turno}
                    onValueChange={(value: any) => {
                      const horarios = getTurnoHorarios(value);
                      setFormData({
                        ...formData,
                        turno: value,
                        hora_inicio: horarios.inicio,
                        hora_fim: horarios.fim,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manha">Manhã (08:00 - 14:00)</SelectItem>
                      <SelectItem value="tarde">Tarde (14:00 - 20:00)</SelectItem>
                      <SelectItem value="noite">Noite (20:00 - 02:00)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Início</Label>
                    <Input
                      type="time"
                      value={formData.hora_inicio}
                      onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Fim</Label>
                    <Input
                      type="time"
                      value={formData.hora_fim}
                      onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">Criar Escala</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {escalas.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma escala para este dia
              </p>
            ) : (
              escalas.map((escala) => (
                <div
                  key={escala.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{escala.usuario.nome}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {escala.turno} • {escala.hora_inicio} - {escala.hora_fim}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(escala.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
