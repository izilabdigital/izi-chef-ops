-- Habilitar a extensão pg_net para funções HTTP
-- Esta extensão é necessária para o trigger de notificações funcionar
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Garantir que a extensão seja utilizável
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Recriar a função de notificação com referência correta ao schema
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload jsonb;
BEGIN
  -- Só notifica se o status mudou
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Monta o payload para o Edge Function
    payload := jsonb_build_object(
      'pedido_id', NEW.id,
      'numero_pedido', NEW.numero_pedido,
      'status_novo', NEW.status,
      'telefone_cliente', NEW.telefone,
      'nome_cliente', NEW.nome
    );
    
    -- Chama o Edge Function de forma assíncrona usando a extensão pg_net
    PERFORM extensions.http_post(
      url := 'https://dufbtyqoxhhpomgirrsv.supabase.co/functions/v1/notify-order-status',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1ZmJ0eXFveGhocG9tZ2lycnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNzY4NzQsImV4cCI6MjA3Njc1Mjg3NH0.RsyZ-LUq1WCiKHVTo4ZHx_dmyczFvMtGOFkeUY-p_zM'
      ),
      body := payload::text
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recriar o trigger se não existir
DROP TRIGGER IF EXISTS on_order_status_change ON pedidos;
CREATE TRIGGER on_order_status_change
  AFTER UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_change();