-- Tabela de escalas/turnos
CREATE TABLE public.escalas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  turno TEXT NOT NULL CHECK (turno IN ('manha', 'tarde', 'noite')),
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de mensagens internas
CREATE TABLE public.mensagens_internas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  remetente_id UUID NOT NULL REFERENCES public.usuarios(id),
  destinatario_cargo TEXT CHECK (destinatario_cargo IN ('gerente', 'pizzaiolo', 'entregador', 'todos')),
  prioridade TEXT NOT NULL DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta')),
  lida BOOLEAN NOT NULL DEFAULT false,
  expira_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de funcionário do mês
CREATE TABLE public.funcionario_mes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id),
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL,
  pontuacao NUMERIC NOT NULL,
  metricas JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mes, ano)
);

-- Enable RLS
ALTER TABLE public.escalas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens_internas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionario_mes ENABLE ROW LEVEL SECURITY;

-- RLS Policies para escalas
CREATE POLICY "Funcionários podem ver suas próprias escalas"
ON public.escalas FOR SELECT
USING (usuario_id = auth.uid());

CREATE POLICY "Gerentes podem gerenciar todas as escalas"
ON public.escalas FOR ALL
USING (has_role(auth.uid(), 'gerente'::app_role))
WITH CHECK (has_role(auth.uid(), 'gerente'::app_role));

-- RLS Policies para mensagens
CREATE POLICY "Funcionários podem ver mensagens para seu cargo"
ON public.mensagens_internas FOR SELECT
USING (
  destinatario_cargo = 'todos' OR 
  destinatario_cargo = (SELECT cargo FROM public.usuarios WHERE id = auth.uid()) OR
  remetente_id = auth.uid()
);

CREATE POLICY "Gerentes podem criar mensagens"
ON public.mensagens_internas FOR INSERT
WITH CHECK (has_role(auth.uid(), 'gerente'::app_role));

CREATE POLICY "Funcionários podem marcar mensagens como lidas"
ON public.mensagens_internas FOR UPDATE
USING (
  destinatario_cargo = 'todos' OR 
  destinatario_cargo = (SELECT cargo FROM public.usuarios WHERE id = auth.uid())
);

-- RLS Policies para funcionário do mês
CREATE POLICY "Todos podem ver funcionário do mês"
ON public.funcionario_mes FOR SELECT
USING (true);

CREATE POLICY "Gerentes podem gerenciar funcionário do mês"
ON public.funcionario_mes FOR ALL
USING (has_role(auth.uid(), 'gerente'::app_role))
WITH CHECK (has_role(auth.uid(), 'gerente'::app_role));

-- Trigger para atualizar updated_at em escalas
CREATE TRIGGER update_escalas_updated_at
BEFORE UPDATE ON public.escalas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX idx_escalas_usuario_data ON public.escalas(usuario_id, data);
CREATE INDEX idx_mensagens_destinatario ON public.mensagens_internas(destinatario_cargo);
CREATE INDEX idx_funcionario_mes_periodo ON public.funcionario_mes(ano, mes);

-- Adicionar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.escalas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens_internas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.funcionario_mes;