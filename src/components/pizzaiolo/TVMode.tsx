import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Maximize2, X, ChefHat, Check } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface TVModeProps {
  avgPrepTime: number;
}

const TVMode = ({ avgPrepTime }: TVModeProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [hasActiveShift, setHasActiveShift] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
      checkActiveShift();
      
      const channel = supabase
        .channel('tv-mode-orders')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pedidos',
          },
          (payload) => {
            console.log('TV Mode - Real-time update:', payload);
            fetchOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen]);

  const checkActiveShift = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('ponto_em_aberto')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setHasActiveShift(data?.ponto_em_aberto || false);
    } catch (error: any) {
      console.error('Error checking shift status:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .in('status', ['pendente', 'em preparo', 'pronto'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: 'em preparo' | 'pronto') => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const inicioPreparo = newStatus === 'em preparo' ? new Date().toISOString() : order.inicio_preparo;

      if (!hasActiveShift && newStatus === 'em preparo' && user) {
        const now = new Date();
        
        const { error: pontoError } = await supabase
          .from('ponto_funcionarios')
          .insert({
            usuario_id: user.id,
            hora_entrada: now.toISOString(),
            data: now.toISOString().split('T')[0],
          });

        if (pontoError) throw pontoError;

        const { error: updateUserError } = await supabase
          .from('usuarios')
          .update({ ponto_em_aberto: true })
          .eq('id', user.id);

        if (updateUserError) throw updateUserError;

        setHasActiveShift(true);
        toast.success('Turno iniciado automaticamente');
      }

      const updates: any = { status: newStatus };
      if (newStatus === 'em preparo' && user) {
        updates.pizzaiolo_id = user.id;
        updates.inicio_preparo = inicioPreparo;
      }

      const { error } = await supabase
        .from('pedidos')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;

      if (newStatus === 'pronto' && user && inicioPreparo) {
        const fimPreparo = new Date();
        const tempoPreparoSegundos = Math.floor(
          (fimPreparo.getTime() - new Date(inicioPreparo).getTime()) / 1000
        );

        const categoriaPizza = Array.isArray(order.itens) && order.itens[0]?.category;

        await supabase.from('metricas_producao').insert({
          pedido_id: orderId,
          pizzaiolo_id: user.id,
          tempo_preparo_segundos: tempoPreparoSegundos,
          inicio_preparo: inicioPreparo,
          fim_preparo: fimPreparo.toISOString(),
          categoria_pizza: categoriaPizza,
        });
      }
      
      toast.success(`Pedido atualizado para: ${newStatus}`);
      fetchOrders();
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast.error('Erro ao atualizar pedido: ' + error.message);
    }
  };

  const groupedOrders = {
    pendente: orders.filter(o => o.status === 'pendente'),
    'em preparo': orders.filter(o => o.status === 'em preparo'),
    pronto: orders.filter(o => o.status === 'pronto'),
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary-hover"
      >
        <Maximize2 className="w-4 h-4" />
        Modo TV
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-8 bg-background">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-4xl font-bold text-foreground">Fila de Pedidos - Izi Chefe</h1>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="icon"
                className="h-12 w-12"
              >
                <X className="w-8 h-8" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-6 flex-1 overflow-auto">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-status-pending">
                  Pendentes ({groupedOrders.pendente.length})
                </h2>
                <div className="space-y-3">
                  {groupedOrders.pendente.map((order) => (
                    <Card key={order.id} className="bg-card border-2">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-xl font-bold">
                            #{order.numero_pedido}
                          </CardTitle>
                          <Badge variant="destructive" className="text-sm">
                            Pendente
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-sm font-medium">
                          {Array.isArray(order.itens) ? order.itens.map((item: any) => `${item.quantity}x ${item.name}`).join(', ') : 'Itens não disponíveis'}
                        </div>
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'em preparo')}
                          size="sm"
                          className="w-full gap-2 bg-primary hover:bg-primary-hover"
                        >
                          <ChefHat className="w-4 h-4" />
                          Iniciar
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-status-preparing">
                  Em Preparo ({groupedOrders['em preparo'].length})
                </h2>
                <div className="space-y-3">
                  {groupedOrders['em preparo'].map((order) => (
                    <Card key={order.id} className="bg-card border-2 border-primary/30">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-xl font-bold">
                            #{order.numero_pedido}
                          </CardTitle>
                          <Badge className="text-sm bg-status-preparing text-white">
                            Em Preparo
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-sm font-medium">
                          {Array.isArray(order.itens) ? order.itens.map((item: any) => `${item.quantity}x ${item.name}`).join(', ') : 'Itens não disponíveis'}
                        </div>
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'pronto')}
                          size="sm"
                          className="w-full gap-2 bg-status-ready hover:opacity-90 text-white"
                        >
                          <Check className="w-4 h-4" />
                          Finalizar
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-status-ready">
                  Prontos ({groupedOrders.pronto.length})
                </h2>
                <div className="space-y-3">
                  {groupedOrders.pronto.map((order) => (
                    <Card key={order.id} className="bg-card border-2 border-status-ready/30">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-xl font-bold">
                            #{order.numero_pedido}
                          </CardTitle>
                          <Badge className="text-sm bg-status-ready text-white">
                            Pronto
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-sm font-medium">
                          {Array.isArray(order.itens) ? order.itens.map((item: any) => `${item.quantity}x ${item.name}`).join(', ') : 'Itens não disponíveis'}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TVMode;