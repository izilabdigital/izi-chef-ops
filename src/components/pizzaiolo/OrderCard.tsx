import { Order } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ChefHat, Check, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface OrderCardProps {
  order: Order & { inicio_preparo?: string };
  onUpdateStatus: (orderId: string, newStatus: 'em preparo' | 'pronto') => void;
  hasActiveShift: boolean;
  avgPrepTime: number;
  tvMode?: boolean;
}

const OrderCard = ({ order, onUpdateStatus, hasActiveShift, avgPrepTime, tvMode = false }: OrderCardProps) => {
  const timeSinceCreation = new Date().getTime() - new Date(order.created_at).getTime();
  const minutesSinceCreation = Math.floor(timeSinceCreation / 1000 / 60);
  const isDelayed = avgPrepTime > 0 && minutesSinceCreation > avgPrepTime / 60;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-status-pending text-white';
      case 'em preparo':
        return 'bg-status-preparing text-white';
      case 'pronto':
        return 'bg-status-ready text-white';
      default:
        return 'bg-muted';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'em preparo':
        return 'Em Preparo';
      case 'pronto':
        return 'Pronto';
      default:
        return status;
    }
  };

  return (
    <Card className={cn(
      "transition-all duration-300",
      isDelayed && "ring-2 ring-destructive",
      tvMode && "text-lg"
    )}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className={cn("flex items-center gap-2", tvMode && "text-3xl")}>
            <span>Pedido #{order.numero_pedido}</span>
            <Badge className={getStatusColor(order.status)}>
              {getStatusLabel(order.status)}
            </Badge>
            {isDelayed && (
              <AlertCircle className="w-5 h-5 text-destructive animate-pulse" />
            )}
          </CardTitle>
          <div className={cn("flex items-center gap-2 text-muted-foreground", tvMode ? "text-xl" : "text-sm")}>
            <Clock className={cn(tvMode ? "w-6 h-6" : "w-4 h-4")} />
            {formatDistanceToNow(new Date(order.created_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!tvMode && (
          <>
            <div>
              <p className="font-semibold">{order.nome}</p>
              <p className="text-sm text-muted-foreground">{order.telefone}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium">Itens:</p>
              {Array.isArray(order.itens) && order.itens.map((item: any, idx: number) => (
                <p key={idx} className="text-sm text-muted-foreground">
                  {item.quantity}x {item.name} {item.size ? `(${item.size})` : ''}
                </p>
              ))}
            </div>

            {order.complemento && (
              <div>
                <p className="text-sm font-medium">Observações:</p>
                <p className="text-sm text-muted-foreground">{order.complemento}</p>
              </div>
            )}
          </>
        )}

        {tvMode && (
          <div className="space-y-2">
            {Array.isArray(order.itens) && order.itens.map((item: any, idx: number) => (
              <p key={idx} className="text-2xl font-semibold">
                {item.quantity}x {item.name} {item.size ? `(${item.size})` : ''}
              </p>
            ))}
          </div>
        )}

        {!tvMode && (
          <div className="flex gap-2">
            {order.status === 'pendente' && (
              <Button
                onClick={() => onUpdateStatus(order.id, 'em preparo')}
                className="gap-2 bg-primary hover:bg-primary-hover"
              >
                <ChefHat className="w-4 h-4" />
                {!hasActiveShift ? 'Iniciar Turno e Preparo' : 'Iniciar Preparo'}
              </Button>
            )}
            {order.status === 'em preparo' && (
              <Button
                onClick={() => onUpdateStatus(order.id, 'pronto')}
                className="gap-2 bg-status-ready hover:opacity-90 text-white"
              >
                <Check className="w-4 h-4" />
                Marcar como Pronto
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderCard;