-- Remover o trigger e a função problemática que causam erro
DROP TRIGGER IF EXISTS on_order_status_change ON pedidos;
DROP FUNCTION IF EXISTS public.notify_order_status_change();

-- Verificar e garantir que a tabela pedidos tem as colunas necessárias
-- (não fazemos nada se já existir)
DO $$ 
BEGIN
    -- Verificar se pizzaiolo_id existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pedidos' 
        AND column_name = 'pizzaiolo_id'
    ) THEN
        ALTER TABLE pedidos ADD COLUMN pizzaiolo_id uuid REFERENCES usuarios(id);
    END IF;
    
    -- Verificar se entregador_id existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pedidos' 
        AND column_name = 'entregador_id'
    ) THEN
        ALTER TABLE pedidos ADD COLUMN entregador_id uuid REFERENCES usuarios(id);
    END IF;
END $$;

-- Garantir que o trigger de updated_at funciona corretamente
DROP TRIGGER IF EXISTS update_pedidos_updated_at ON pedidos;
CREATE TRIGGER update_pedidos_updated_at
    BEFORE UPDATE ON pedidos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();