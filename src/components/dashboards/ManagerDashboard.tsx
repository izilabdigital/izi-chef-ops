import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Pizza, DollarSign, Package } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmployeeManagement from '@/components/manager/EmployeeManagement';
import MenuManagement from '@/components/manager/MenuManagement';
import FinancesDashboard from '@/components/manager/FinancesDashboard';
import OrdersOverview from '@/components/manager/OrdersOverview';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Painel do Gerente</h1>
          <p className="text-muted-foreground mt-1">Bem-vindo, {user?.nome}!</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <Package className="w-4 h-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="employees" className="gap-2">
              <Users className="w-4 h-4" />
              Funcionários
            </TabsTrigger>
            <TabsTrigger value="menu" className="gap-2">
              <Pizza className="w-4 h-4" />
              Cardápio
            </TabsTrigger>
            <TabsTrigger value="finances" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Finanças
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OrdersOverview />
          </TabsContent>

          <TabsContent value="employees">
            <EmployeeManagement />
          </TabsContent>

          <TabsContent value="menu">
            <MenuManagement />
          </TabsContent>

          <TabsContent value="finances">
            <FinancesDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ManagerDashboard;
