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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          created_at: string
          id: string
          job_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes: {
        Row: {
          comentario: string | null
          contratacao_id: string
          created_at: string
          de_id: string
          id: string
          nota: number
          para_id: string
        }
        Insert: {
          comentario?: string | null
          contratacao_id: string
          created_at?: string
          de_id: string
          id?: string
          nota: number
          para_id: string
        }
        Update: {
          comentario?: string | null
          contratacao_id?: string
          created_at?: string
          de_id?: string
          id?: string
          nota?: number
          para_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_contratacao_id_fkey"
            columns: ["contratacao_id"]
            isOneToOne: false
            referencedRelation: "contratacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      contratacoes: {
        Row: {
          created_at: string
          empresa_id: string
          finalizada_em: string | null
          id: string
          job_id: string
          profissional_id: string
          status: string
          taxa_5pct: number | null
          taxa_cobrada: boolean | null
          valor: number
        }
        Insert: {
          created_at?: string
          empresa_id: string
          finalizada_em?: string | null
          id?: string
          job_id: string
          profissional_id: string
          status?: string
          taxa_5pct?: number | null
          taxa_cobrada?: boolean | null
          valor: number
        }
        Update: {
          created_at?: string
          empresa_id?: string
          finalizada_em?: string | null
          id?: string
          job_id?: string
          profissional_id?: string
          status?: string
          taxa_5pct?: number | null
          taxa_cobrada?: boolean | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contratacoes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_dados: {
        Row: {
          cnpj: string | null
          endereco: string | null
          nome_empresa: string | null
          profile_id: string
          ramo: string | null
        }
        Insert: {
          cnpj?: string | null
          endereco?: string | null
          nome_empresa?: string | null
          profile_id: string
          ramo?: string | null
        }
        Update: {
          cnpj?: string | null
          endereco?: string | null
          nome_empresa?: string | null
          profile_id?: string
          ramo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empresa_dados_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          address: string
          category: string
          company_name: string
          created_at: string
          date: string
          description: string
          id: string
          neighborhood: string
          payment: number
          skill: string
          slots: number
          slots_remaining: number
          status: string
          time_end: string
          time_start: string
          title: string
          user_id: string
        }
        Insert: {
          address?: string
          category: string
          company_name: string
          created_at?: string
          date: string
          description?: string
          id?: string
          neighborhood?: string
          payment?: number
          skill: string
          slots?: number
          slots_remaining?: number
          status?: string
          time_end: string
          time_start: string
          title: string
          user_id: string
        }
        Update: {
          address?: string
          category?: string
          company_name?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          neighborhood?: string
          payment?: number
          skill?: string
          slots?: number
          slots_remaining?: number
          status?: string
          time_end?: string
          time_start?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      mensagens: {
        Row: {
          contratacao_id: string | null
          created_at: string
          de_id: string
          id: string
          lida: boolean | null
          para_id: string
          texto: string
        }
        Insert: {
          contratacao_id?: string | null
          created_at?: string
          de_id: string
          id?: string
          lida?: boolean | null
          para_id: string
          texto: string
        }
        Update: {
          contratacao_id?: string | null
          created_at?: string
          de_id?: string
          id?: string
          lida?: boolean | null
          para_id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_contratacao_id_fkey"
            columns: ["contratacao_id"]
            isOneToOne: false
            referencedRelation: "contratacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string
          id: string
          lida: boolean | null
          link: string | null
          texto: string
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lida?: boolean | null
          link?: string | null
          texto: string
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lida?: boolean | null
          link?: string | null
          texto?: string
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          contratacao_id: string | null
          created_at: string
          id: string
          status: string
          stripe_id: string | null
          tipo: string
          user_id: string
          valor: number
        }
        Insert: {
          contratacao_id?: string | null
          created_at?: string
          id?: string
          status?: string
          stripe_id?: string | null
          tipo: string
          user_id: string
          valor: number
        }
        Update: {
          contratacao_id?: string | null
          created_at?: string
          id?: string
          status?: string
          stripe_id?: string | null
          tipo?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_contratacao_id_fkey"
            columns: ["contratacao_id"]
            isOneToOne: false
            referencedRelation: "contratacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avaliacao_media: number | null
          cartao_cadastrado: boolean | null
          cidade: string | null
          created_at: string
          email: string
          foto_url: string | null
          id: string
          nome: string | null
          stripe_customer_id: string | null
          subscription_end: string | null
          subscription_status: string | null
          telefone: string | null
          tipo: string
          total_avaliacoes: number | null
        }
        Insert: {
          avaliacao_media?: number | null
          cartao_cadastrado?: boolean | null
          cidade?: string | null
          created_at?: string
          email: string
          foto_url?: string | null
          id: string
          nome?: string | null
          stripe_customer_id?: string | null
          subscription_end?: string | null
          subscription_status?: string | null
          telefone?: string | null
          tipo: string
          total_avaliacoes?: number | null
        }
        Update: {
          avaliacao_media?: number | null
          cartao_cadastrado?: boolean | null
          cidade?: string | null
          created_at?: string
          email?: string
          foto_url?: string | null
          id?: string
          nome?: string | null
          stripe_customer_id?: string | null
          subscription_end?: string | null
          subscription_status?: string | null
          telefone?: string | null
          tipo?: string
          total_avaliacoes?: number | null
        }
        Relationships: []
      }
      profissional_dados: {
        Row: {
          bio: string | null
          disponibilidade: string | null
          experiencia: string | null
          instagram: string | null
          linkedin: string | null
          profile_id: string
          profissoes: string[] | null
        }
        Insert: {
          bio?: string | null
          disponibilidade?: string | null
          experiencia?: string | null
          instagram?: string | null
          linkedin?: string | null
          profile_id: string
          profissoes?: string[] | null
        }
        Update: {
          bio?: string | null
          disponibilidade?: string | null
          experiencia?: string | null
          instagram?: string | null
          linkedin?: string | null
          profile_id?: string
          profissoes?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "profissional_dados_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      contratacoes_finalizadas_empresa: {
        Args: { p_id: string }
        Returns: number
      }
      historico_profissional: {
        Args: { p_id: string }
        Returns: {
          comentario: string | null
          contratacao_id: string
          data: string
          empresa: string
          finalizada_em: string | null
          nota: number | null
          titulo: string
        }[]
      }
      trabalhos_finalizados: {
        Args: { p_ids: string[] }
        Returns: {
          profissional_id: string
          total: number
        }[]
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
