import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import ManagerDashboard from '@/components/dashboards/ManagerDashboard';
import PizzaioloChefDashboard from '@/components/dashboards/PizzaioloDashboard';
import DeliveryDriverDashboard from '@/components/dashboards/DeliveryDriverDashboard';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Render dashboard based on user role
  switch (user.cargo) {
    case 'gerente':
      return <ManagerDashboard />;
    case 'pizzaiolo':
      return <PizzaioloChefDashboard />;
    case 'entregador':
      return <DeliveryDriverDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default Dashboard;
