-- Adicionar campos de rastreamento de entregas na tabela pedidos
ALTER TABLE public.pedidos
ADD COLUMN IF NOT EXISTS inicio_rota timestamp with time zone,
ADD COLUMN IF NOT EXISTS fim_rota timestamp with time zone,
ADD COLUMN IF NOT EXISTS latitude_entregador numeric(10, 8),
ADD COLUMN IF NOT EXISTS longitude_entregador numeric(11, 8),
ADD COLUMN IF NOT EXISTS distancia_km numeric(10, 2),
ADD COLUMN IF NOT EXISTS tempo_estimado_minutos integer;

-- Criar índices para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS idx_pedidos_entregador_status 
ON public.pedidos(entregador_id, status) 
WHERE status IN ('em rota de entrega', 'entregue');

CREATE INDEX IF NOT EXISTS idx_pedidos_entregador_data 
ON public.pedidos(entregador_id, created_at DESC);