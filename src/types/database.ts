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
  numero_pedido: number;
  cliente_nome: string;
  cliente_telefone: string;
  items: any[];
  total: number;
  status: OrderStatus;
  metodo_pagamento?: string;
  endereco_entrega?: string;
  observacoes?: string;
  pizzaiolo_id?: string;
  entregador_id?: string;
  created_at: string;
  tempo_preparo?: number;
  tempo_entrega?: number;
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
