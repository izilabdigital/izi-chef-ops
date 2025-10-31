-- Criar tabela de produtos (pizzas, combos, promoções)
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC NOT NULL,
  imagem_url TEXT,
  categoria TEXT NOT NULL CHECK (categoria IN ('pizza', 'combo', 'bebida', 'sobremesa')),
  disponivel BOOLEAN NOT NULL DEFAULT true,
  desconto_percentual INTEGER DEFAULT 0,
  validade_promocao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para produtos
CREATE POLICY "Qualquer pessoa pode ver produtos disponíveis"
ON public.produtos
FOR SELECT
USING (disponivel = true);

CREATE POLICY "Gerentes podem gerenciar produtos"
ON public.produtos
FOR ALL
TO authenticated
USING (public.get_user_role(auth.uid()) = 'gerente')
WITH CHECK (public.get_user_role(auth.uid()) = 'gerente');

-- Trigger para atualizar updated_at
CREATE TRIGGER update_produtos_updated_at
BEFORE UPDATE ON public.produtos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar índices para melhor performance
CREATE INDEX idx_produtos_categoria ON public.produtos(categoria);
CREATE INDEX idx_produtos_disponivel ON public.produtos(disponivel);