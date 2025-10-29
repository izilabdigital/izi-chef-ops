import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pizza } from 'lucide-react';

const MenuManagement = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pizza className="w-5 h-5" />
          Gerenciamento de Cardápio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Funcionalidade em desenvolvimento. Aqui você poderá gerenciar todos os itens do cardápio.
        </p>
      </CardContent>
    </Card>
  );
};

export default MenuManagement;
