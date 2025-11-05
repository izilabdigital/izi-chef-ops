-- Adicionar coluna inicio_preparo à tabela pedidos para rastrear quando o preparo começou
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS inicio_preparo TIMESTAMP WITH TIME ZONE;