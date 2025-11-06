import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DeliveryQueue from '@/components/delivery/DeliveryQueue';
import TimeTracker from '@/components/shared/TimeTracker';
import DeliveryStats from '@/components/delivery/DeliveryStats';
import DeliveryMap from '@/components/delivery/DeliveryMap';
import DeliveryHistory from '@/components/delivery/DeliveryHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

        <Tabs defaultValue="entregas" className="space-y-6">
          <TabsList>
            <TabsTrigger value="entregas">Entregas</TabsTrigger>
            <TabsTrigger value="mapa">Mapa</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="entregas" className="space-y-6">
            <DeliveryQueue />
          </TabsContent>

          <TabsContent value="mapa" className="space-y-6">
            <DeliveryMap />
          </TabsContent>

          <TabsContent value="historico" className="space-y-6">
            <DeliveryHistory />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DeliveryDriverDashboard;
