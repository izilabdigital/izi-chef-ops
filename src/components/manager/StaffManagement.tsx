import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttendanceReport } from './AttendanceReport';
import { PerformanceRanking } from './PerformanceRanking';
import { ShiftManagement } from './ShiftManagement';
import { InternalMessages } from './InternalMessages';
import { EmployeeOfMonth } from './EmployeeOfMonth';
import { Clock, TrendingUp, Calendar, MessageSquare, Award } from 'lucide-react';

export const StaffManagement = () => {
  return (
    <Tabs defaultValue="ranking" className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="ranking" className="gap-2">
          <TrendingUp className="w-4 h-4" />
          Ranking
        </TabsTrigger>
        <TabsTrigger value="attendance" className="gap-2">
          <Clock className="w-4 h-4" />
          Pontualidade
        </TabsTrigger>
        <TabsTrigger value="shifts" className="gap-2">
          <Calendar className="w-4 h-4" />
          Escalas
        </TabsTrigger>
        <TabsTrigger value="messages" className="gap-2">
          <MessageSquare className="w-4 h-4" />
          Mensagens
        </TabsTrigger>
        <TabsTrigger value="award" className="gap-2">
          <Award className="w-4 h-4" />
          Funcionário do Mês
        </TabsTrigger>
      </TabsList>

      <TabsContent value="ranking">
        <PerformanceRanking />
      </TabsContent>

      <TabsContent value="attendance">
        <AttendanceReport />
      </TabsContent>

      <TabsContent value="shifts">
        <ShiftManagement />
      </TabsContent>

      <TabsContent value="messages">
        <InternalMessages />
      </TabsContent>

      <TabsContent value="award">
        <EmployeeOfMonth />
      </TabsContent>
    </Tabs>
  );
};
