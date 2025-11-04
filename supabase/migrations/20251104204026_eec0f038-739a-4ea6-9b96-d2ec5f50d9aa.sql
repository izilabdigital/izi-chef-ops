-- Tabela para métricas de produção dos pedidos
CREATE TABLE IF NOT EXISTS public.metricas_producao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  pizzaiolo_id UUID NOT NULL,
  tempo_preparo_segundos INTEGER NOT NULL,
  inicio_preparo TIMESTAMP WITH TIME ZONE NOT NULL,
  fim_preparo TIMESTAMP WITH TIME ZONE NOT NULL,
  categoria_pizza TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.metricas_producao ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Pizzaiolos podem inserir suas próprias métricas"
ON public.metricas_producao
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'pizzaiolo'::app_role) AND pizzaiolo_id = auth.uid());

CREATE POLICY "Pizzaiolos podem ver suas próprias métricas"
ON public.metricas_producao
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'pizzaiolo'::app_role) AND pizzaiolo_id = auth.uid());

CREATE POLICY "Gerentes podem ver todas as métricas"
ON public.metricas_producao
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'gerente'::app_role));

-- Índices para performance
CREATE INDEX idx_metricas_producao_pedido ON public.metricas_producao(pedido_id);
CREATE INDEX idx_metricas_producao_pizzaiolo ON public.metricas_producao(pizzaiolo_id);
CREATE INDEX idx_metricas_producao_created_at ON public.metricas_producao(created_at);

-- Função para calcular tempo médio de preparo
CREATE OR REPLACE FUNCTION public.get_avg_prep_time_by_pizzaiolo(pizzaiolo_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(AVG(tempo_preparo_segundos)::INTEGER, 0)
  FROM public.metricas_producao
  WHERE pizzaiolo_id = pizzaiolo_uuid
    AND created_at >= CURRENT_DATE;
$$;

-- Função para calcular tempo médio geral do dia
CREATE OR REPLACE FUNCTION public.get_avg_prep_time_today()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(AVG(tempo_preparo_segundos)::INTEGER, 0)
  FROM public.metricas_producao
  WHERE created_at >= CURRENT_DATE;
$$;