import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import OrderQueue from '@/components/pizzaiolo/OrderQueue';
import TimeTracker from '@/components/shared/TimeTracker';
import ProductionStats from '@/components/pizzaiolo/ProductionStats';

const PizzaioloDashboard = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Painel do Pizzaiolo</h1>
            <p className="text-muted-foreground mt-1">Olá, {user?.nome}!</p>
          </div>
          <TimeTracker />
        </div>

        <ProductionStats />
        <OrderQueue />
      </div>
    </DashboardLayout>
  );
};

export default PizzaioloDashboard;
