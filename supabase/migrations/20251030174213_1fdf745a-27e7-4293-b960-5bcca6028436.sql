-- Drop existing problematic policies
DROP POLICY IF EXISTS "Apenas gerentes podem gerenciar funcionários" ON public.usuarios;
DROP POLICY IF EXISTS "Funcionários autenticados podem ver outros funcionários" ON public.usuarios;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cargo FROM public.usuarios WHERE id = _user_id LIMIT 1;
$$;

-- Create new policies using the security definer function
CREATE POLICY "Gerentes podem gerenciar todos os usuários"
ON public.usuarios
FOR ALL
TO authenticated
USING (public.get_user_role(auth.uid()) = 'gerente')
WITH CHECK (public.get_user_role(auth.uid()) = 'gerente');

CREATE POLICY "Usuários podem ver todos os funcionários"
ON public.usuarios
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);