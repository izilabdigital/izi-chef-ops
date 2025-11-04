import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Maximize2, X } from 'lucide-react';
import OrderCard from './OrderCard';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface TVModeProps {
  avgPrepTime: number;
}

const TVMode = ({ avgPrepTime }: TVModeProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
      
      const channel = supabase
        .channel('tv-mode-orders')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pedidos',
          },
          () => {
            fetchOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen]);

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
                <div className="space-y-4">
                  {groupedOrders.pendente.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onUpdateStatus={() => {}}
                      hasActiveShift={false}
                      avgPrepTime={avgPrepTime}
                      tvMode
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-status-preparing">
                  Em Preparo ({groupedOrders['em preparo'].length})
                </h2>
                <div className="space-y-4">
                  {groupedOrders['em preparo'].map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onUpdateStatus={() => {}}
                      hasActiveShift={false}
                      avgPrepTime={avgPrepTime}
                      tvMode
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-status-ready">
                  Prontos ({groupedOrders.pronto.length})
                </h2>
                <div className="space-y-4">
                  {groupedOrders.pronto.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onUpdateStatus={() => {}}
                      hasActiveShift={false}
                      avgPrepTime={avgPrepTime}
                      tvMode
                    />
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