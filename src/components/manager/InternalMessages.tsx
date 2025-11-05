import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Megaphone, AlertCircle } from 'lucide-react';
import { MensagemInterna } from '@/types/database';

export const InternalMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MensagemInterna[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    mensagem: '',
    destinatario_cargo: 'todos',
    prioridade: 'normal' as 'baixa' | 'normal' | 'alta',
    expira_em: '',
  });

  useEffect(() => {
    fetchMessages();
    
    const channel = supabase
      .channel('mensagens-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mensagens_internas',
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('mensagens_internas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) setMessages(data as MensagemInterna[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    const { error } = await supabase.from('mensagens_internas').insert({
      titulo: formData.titulo,
      mensagem: formData.mensagem,
      remetente_id: user.id,
      destinatario_cargo: formData.destinatario_cargo === 'todos' ? null : formData.destinatario_cargo,
      prioridade: formData.prioridade,
      expira_em: formData.expira_em || null,
    });

    if (error) {
      toast.error('Erro ao enviar mensagem');
      return;
    }

    toast.success('Mensagem enviada!');
    setDialogOpen(false);
    setFormData({
      titulo: '',
      mensagem: '',
      destinatario_cargo: 'todos',
      prioridade: 'normal',
      expira_em: '',
    });
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta':
        return 'destructive';
      case 'normal':
        return 'default';
      case 'baixa':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Mensagens Internas
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Mensagem
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Mensagem</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ex: Promoção de hoje"
                  required
                />
              </div>

              <div>
                <Label>Mensagem</Label>
                <Textarea
                  value={formData.mensagem}
                  onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                  placeholder="Digite a mensagem..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label>Destinatário</Label>
                <Select
                  value={formData.destinatario_cargo}
                  onValueChange={(value) => setFormData({ ...formData, destinatario_cargo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pizzaiolo">Pizzaiolos</SelectItem>
                    <SelectItem value="entregador">Entregadores</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Prioridade</Label>
                <Select
                  value={formData.prioridade}
                  onValueChange={(value: any) => setFormData({ ...formData, prioridade: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Expira em (opcional)</Label>
                <Input
                  type="datetime-local"
                  value={formData.expira_em}
                  onChange={(e) => setFormData({ ...formData, expira_em: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full">Enviar Mensagem</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className="p-4 rounded-lg border"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{message.titulo}</h4>
                  <Badge variant={getPrioridadeColor(message.prioridade) as any}>
                    {message.prioridade}
                  </Badge>
                  {message.prioridade === 'alta' && (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(message.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{message.mensagem}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Para: {message.destinatario_cargo || 'Todos'}</span>
                {message.expira_em && (
                  <span>
                    • Expira em: {format(parseISO(message.expira_em), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
