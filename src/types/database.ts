export type UserRole = 'gerente' | 'pizzaiolo' | 'entregador';

export type OrderStatus = 
  | 'Pendente' 
  | 'Em preparo' 
  | 'Pronto' 
  | 'Em rota de entrega' 
  | 'Entregue' 
  | 'Cancelado';

export interface User {
  id: string;
  nome: string;
  email: string;
  cargo: UserRole;
  ativo: boolean;
  ultimo_login?: string;
  ponto_em_aberto?: boolean;
  created_at?: string;
}

export interface Order {
  id: string;
  numero_pedido: string;
  nome: string;
  telefone: string;
  itens: any;
  total: number;
  status: string;
  forma_pagamento: string;
  rua: string;
  numero: string;
  bairro: string;
  cep: string;
  estado: string;
  complemento?: string;
  cupom?: string;
  desconto?: number;
  subtotal: number;
  taxa_entrega: number;
  user_id?: string;
  pizzaiolo_id?: string;
  entregador_id?: string;
  inicio_preparo?: string;
  inicio_rota?: string;
  fim_rota?: string;
  latitude_entregador?: number;
  longitude_entregador?: number;
  distancia_km?: number;
  tempo_estimado_minutos?: number;
  created_at: string;
  updated_at: string;
}

export interface TimeTrack {
  id: string;
  usuario_id: string;
  hora_entrada: string;
  hora_saida?: string;
  data: string;
  usuario?: User;
}

export interface MenuItem {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  categoria: string;
  ativo: boolean;
  imagem_url?: string;
  created_at?: string;
}

export interface Escala {
  id: string;
  usuario_id: string;
  data: string;
  turno: 'manha' | 'tarde' | 'noite';
  hora_inicio: string;
  hora_fim: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  usuario?: User;
}

export interface MensagemInterna {
  id: string;
  titulo: string;
  mensagem: string;
  remetente_id: string;
  destinatario_cargo?: 'gerente' | 'pizzaiolo' | 'entregador' | 'todos';
  prioridade: 'baixa' | 'normal' | 'alta';
  lida: boolean;
  expira_em?: string;
  created_at: string;
  remetente?: User;
}

export interface FuncionarioMes {
  id: string;
  usuario_id: string;
  mes: number;
  ano: number;
  pontuacao: number;
  metricas: any;
  created_at: string;
  usuario?: User;
}
