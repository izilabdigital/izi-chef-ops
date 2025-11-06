import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DeliveryQueue from '@/components/delivery/DeliveryQueue';
import TimeTracker from '@/components/shared/TimeTracker';
import DeliveryStats from '@/components/delivery/DeliveryStats';

const DeliveryDriverDashboard = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Painel do Entregador</h1>
            <p className="text-muted-foreground mt-1">Olá, {user?.nome}!</p>
          </div>
          <TimeTracker />
        </div>

        <DeliveryStats />
        <DeliveryQueue />
      </div>
    </DashboardLayout>
  );
};

export default DeliveryDriverDashboard;
