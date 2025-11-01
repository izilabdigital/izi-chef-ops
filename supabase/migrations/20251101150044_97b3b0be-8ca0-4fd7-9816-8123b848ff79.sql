-- Adicionar campos para suportar produtos dinâmicos por categoria
ALTER TABLE public.produtos 
ADD COLUMN ingredientes jsonb DEFAULT '[]'::jsonb,
ADD COLUMN tamanhos jsonb DEFAULT '[]'::jsonb,
ADD COLUMN itens_combo jsonb DEFAULT '[]'::jsonb,
ADD COLUMN tipo_embalagem text,
ADD COLUMN e_sobremesa boolean DEFAULT false;

COMMENT ON COLUMN public.produtos.ingredientes IS 'Array de ingredientes para pizzas: ["calabresa", "mussarela", "catupiry"]';
COMMENT ON COLUMN public.produtos.tamanhos IS 'Array de tamanhos com preços: [{"tamanho": "P", "preco": 25.00}, {"tamanho": "M", "preco": 35.00}]';
COMMENT ON COLUMN public.produtos.itens_combo IS 'Array de IDs de produtos incluídos no combo: ["uuid1", "uuid2"]';
COMMENT ON COLUMN public.produtos.tipo_embalagem IS 'Tipo de embalagem para bebidas: "Lata 350ml", "Garrafa 1L", etc';
COMMENT ON COLUMN public.produtos.e_sobremesa IS 'Indica se o produto também é uma sobremesa';