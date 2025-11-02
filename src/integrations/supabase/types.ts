export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cliente: {
        Row: {
          created_at: string
          id: string
          nome: string | null
          telefone: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome?: string | null
          telefone: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string | null
          telefone?: string
        }
        Relationships: []
      }
      cupons: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          descricao: string | null
          id: string
          minimo_pedido: number | null
          tipo: string
          usos_atuais: number
          usos_maximos: number | null
          validade: string | null
          valor: number
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          descricao?: string | null
          id?: string
          minimo_pedido?: number | null
          tipo: string
          usos_atuais?: number
          usos_maximos?: number | null
          validade?: string | null
          valor: number
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          descricao?: string | null
          id?: string
          minimo_pedido?: number | null
          tipo?: string
          usos_atuais?: number
          usos_maximos?: number | null
          validade?: string | null
          valor?: number
        }
        Relationships: []
      }
      favoritos: {
        Row: {
          created_at: string
          id: string
          produto_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          produto_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          produto_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          bairro: string
          cep: string
          complemento: string | null
          created_at: string
          cupom: string | null
          desconto: number | null
          entregador_id: string | null
          estado: string
          forma_pagamento: string
          id: string
          itens: Json
          nome: string
          numero: string
          numero_pedido: string
          pizzaiolo_id: string | null
          rua: string
          status: string
          subtotal: number
          taxa_entrega: number
          telefone: string
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bairro: string
          cep: string
          complemento?: string | null
          created_at?: string
          cupom?: string | null
          desconto?: number | null
          entregador_id?: string | null
          estado: string
          forma_pagamento: string
          id?: string
          itens: Json
          nome: string
          numero: string
          numero_pedido: string
          pizzaiolo_id?: string | null
          rua: string
          status?: string
          subtotal: number
          taxa_entrega: number
          telefone: string
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bairro?: string
          cep?: string
          complemento?: string | null
          created_at?: string
          cupom?: string | null
          desconto?: number | null
          entregador_id?: string | null
          estado?: string
          forma_pagamento?: string
          id?: string
          itens?: Json
          nome?: string
          numero?: string
          numero_pedido?: string
          pizzaiolo_id?: string | null
          rua?: string
          status?: string
          subtotal?: number
          taxa_entrega?: number
          telefone?: string
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_entregador_id_fkey"
            columns: ["entregador_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_pizzaiolo_id_fkey"
            columns: ["pizzaiolo_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      ponto_funcionarios: {
        Row: {
          created_at: string
          data: string
          hora_entrada: string
          hora_saida: string | null
          id: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          data: string
          hora_entrada: string
          hora_saida?: string | null
          id?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          data?: string
          hora_entrada?: string
          hora_saida?: string | null
          id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ponto_funcionarios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          categoria: string
          created_at: string
          desconto_percentual: number | null
          descricao: string | null
          disponivel: boolean
          e_sobremesa: boolean | null
          id: string
          imagem_url: string | null
          ingredientes: Json | null
          itens_combo: Json | null
          nome: string
          preco: number
          tamanhos: Json | null
          tipo_embalagem: string | null
          updated_at: string
          validade_promocao: string | null
        }
        Insert: {
          categoria: string
          created_at?: string
          desconto_percentual?: number | null
          descricao?: string | null
          disponivel?: boolean
          e_sobremesa?: boolean | null
          id?: string
          imagem_url?: string | null
          ingredientes?: Json | null
          itens_combo?: Json | null
          nome: string
          preco: number
          tamanhos?: Json | null
          tipo_embalagem?: string | null
          updated_at?: string
          validade_promocao?: string | null
        }
        Update: {
          categoria?: string
          created_at?: string
          desconto_percentual?: number | null
          descricao?: string | null
          disponivel?: boolean
          e_sobremesa?: boolean | null
          id?: string
          imagem_url?: string | null
          ingredientes?: Json | null
          itens_combo?: Json | null
          nome?: string
          preco?: number
          tamanhos?: Json | null
          tipo_embalagem?: string | null
          updated_at?: string
          validade_promocao?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bairro: string | null
          cep: string | null
          complemento: string | null
          created_at: string | null
          estado: string | null
          id: string
          nome: string
          numero: string | null
          rua: string | null
          telefone: string
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          complemento?: string | null
          created_at?: string | null
          estado?: string | null
          id: string
          nome: string
          numero?: string | null
          rua?: string | null
          telefone: string
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          complemento?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string
          nome?: string
          numero?: string | null
          rua?: string | null
          telefone?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          ativo: boolean
          cargo: string
          created_at: string
          email: string
          id: string
          nome: string
          ponto_em_aberto: boolean | null
          ultimo_login: string | null
        }
        Insert: {
          ativo?: boolean
          cargo: string
          created_at?: string
          email: string
          id?: string
          nome: string
          ponto_em_aberto?: boolean | null
          ultimo_login?: string | null
        }
        Update: {
          ativo?: boolean
          cargo?: string
          created_at?: string
          email?: string
          id?: string
          nome?: string
          ponto_em_aberto?: boolean | null
          ultimo_login?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_number: { Args: never; Returns: string }
      get_user_role: { Args: { _user_id: string }; Returns: string }
      increment_cupom_uso: { Args: { cupom_code: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
