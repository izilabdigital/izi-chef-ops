-- Add pizzaiolo_id and entregador_id columns to pedidos table
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS pizzaiolo_id UUID REFERENCES public.usuarios(id),
ADD COLUMN IF NOT EXISTS entregador_id UUID REFERENCES public.usuarios(id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pedidos_pizzaiolo_id ON public.pedidos(pizzaiolo_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_entregador_id ON public.pedidos(entregador_id);