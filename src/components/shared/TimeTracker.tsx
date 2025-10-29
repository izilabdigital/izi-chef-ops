import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Clock, Play, Square } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';

const TimeTracker = () => {
  const { user, refreshUser } = useAuth();
  const [isWorking, setIsWorking] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkActiveTimeTrack();
  }, [user]);

  const checkActiveTimeTrack = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('ponto_funcionarios')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('data', today)
        .is('hora_saida', null)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setIsWorking(true);
        setCurrentTrack(data);
      } else {
        setIsWorking(false);
        setCurrentTrack(null);
      }
    } catch (error: any) {
      console.error('Error checking time track:', error);
    }
  };

  const handleClockIn = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const { error } = await supabase
        .from('ponto_funcionarios')
        .insert({
          usuario_id: user!.id,
          hora_entrada: now.toISOString(),
          data: now.toISOString().split('T')[0],
        });

      if (error) throw error;

      await refreshUser();
      await checkActiveTimeTrack();
      toast.success('Ponto registrado com sucesso!');
    } catch (error: any) {
      console.error('Clock in error:', error);
      toast.error('Erro ao registrar entrada');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!currentTrack) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('ponto_funcionarios')
        .update({ hora_saida: new Date().toISOString() })
        .eq('id', currentTrack.id);

      if (error) throw error;

      await refreshUser();
      await checkActiveTimeTrack();
      toast.success('Saída registrada com sucesso!');
    } catch (error: any) {
      console.error('Clock out error:', error);
      toast.error('Erro ao registrar saída');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <Clock className="w-5 h-5 text-primary" />
        {isWorking ? (
          <Button
            onClick={handleClockOut}
            disabled={loading}
            variant="destructive"
            size="sm"
            className="gap-2"
          >
            <Square className="w-4 h-4" />
            Encerrar Turno
          </Button>
        ) : (
          <Button
            onClick={handleClockIn}
            disabled={loading}
            size="sm"
            className="gap-2 bg-primary hover:bg-primary-hover"
          >
            <Play className="w-4 h-4" />
            Iniciar Turno
          </Button>
        )}
      </div>
    </Card>
  );
};

export default TimeTracker;
