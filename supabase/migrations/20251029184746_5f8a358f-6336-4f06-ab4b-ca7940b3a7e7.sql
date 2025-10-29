-- Create usuarios table for employees
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  cargo TEXT NOT NULL CHECK (cargo IN ('gerente', 'pizzaiolo', 'entregador')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  ultimo_login TIMESTAMP WITH TIME ZONE,
  ponto_em_aberto BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on usuarios
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Create policy for usuarios - authenticated users can read all employees
CREATE POLICY "Funcionários autenticados podem ver outros funcionários"
ON public.usuarios
FOR SELECT
TO authenticated
USING (true);

-- Create policy for usuarios - only managers can insert/update
CREATE POLICY "Apenas gerentes podem gerenciar funcionários"
ON public.usuarios
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND cargo = 'gerente'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND cargo = 'gerente'
  )
);

-- Create ponto_funcionarios table for time tracking
CREATE TABLE IF NOT EXISTS public.ponto_funcionarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  hora_entrada TIMESTAMP WITH TIME ZONE NOT NULL,
  hora_saida TIMESTAMP WITH TIME ZONE,
  data DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ponto_funcionarios
ALTER TABLE public.ponto_funcionarios ENABLE ROW LEVEL SECURITY;

-- Create policy for ponto_funcionarios - users can see their own records
CREATE POLICY "Funcionários podem ver seus próprios registros de ponto"
ON public.ponto_funcionarios
FOR SELECT
TO authenticated
USING (usuario_id = auth.uid());

-- Create policy for ponto_funcionarios - users can insert their own records
CREATE POLICY "Funcionários podem registrar seu próprio ponto"
ON public.ponto_funcionarios
FOR INSERT
TO authenticated
WITH CHECK (usuario_id = auth.uid());

-- Create policy for ponto_funcionarios - users can update their own records
CREATE POLICY "Funcionários podem atualizar seu próprio ponto"
ON public.ponto_funcionarios
FOR UPDATE
TO authenticated
USING (usuario_id = auth.uid());

-- Create policy for ponto_funcionarios - managers can see all records
CREATE POLICY "Gerentes podem ver todos os registros de ponto"
ON public.ponto_funcionarios
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND cargo = 'gerente'
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ponto_funcionarios_usuario_id ON public.ponto_funcionarios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ponto_funcionarios_data ON public.ponto_funcionarios(data);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_cargo ON public.usuarios(cargo);