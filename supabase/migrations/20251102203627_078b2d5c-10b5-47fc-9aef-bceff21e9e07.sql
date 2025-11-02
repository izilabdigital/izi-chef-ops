-- Remove a política de UPDATE existente que está muito restritiva
DROP POLICY IF EXISTS "Usuários podem cancelar seus próprios pedidos" ON pedidos;

-- Política para clientes cancelarem seus próprios pedidos
CREATE POLICY "Clientes podem cancelar seus próprios pedidos"
ON pedidos
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND status = 'cancelado'
);

-- Política para pizzaiolos atualizarem status dos pedidos
CREATE POLICY "Pizzaiolos podem atualizar status dos pedidos"
ON pedidos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE usuarios.id = auth.uid() 
    AND usuarios.cargo = 'pizzaiolo'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE usuarios.id = auth.uid() 
    AND usuarios.cargo = 'pizzaiolo'
  )
  AND status IN ('em preparo', 'pronto')
);

-- Política para entregadores atualizarem status dos pedidos
CREATE POLICY "Entregadores podem atualizar status dos pedidos"
ON pedidos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE usuarios.id = auth.uid() 
    AND usuarios.cargo = 'entregador'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE usuarios.id = auth.uid() 
    AND usuarios.cargo = 'entregador'
  )
  AND status IN ('em rota de entrega', 'entregue')
);

-- Política para gerentes atualizarem qualquer pedido
CREATE POLICY "Gerentes podem atualizar qualquer pedido"
ON pedidos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE usuarios.id = auth.uid() 
    AND usuarios.cargo = 'gerente'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE usuarios.id = auth.uid() 
    AND usuarios.cargo = 'gerente'
  )
);