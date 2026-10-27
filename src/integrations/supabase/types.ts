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
          {
            foreignKeyName: "avaliacoes_de_id_fkey"
            columns: ["de_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_para_id_fkey"
            columns: ["para_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          taxa_5pct: number
          taxa_cobrada: boolean
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
          taxa_5pct?: number
          taxa_cobrada?: boolean
          valor?: number
        }
        Update: {
          created_at?: string
          empresa_id?: string
          finalizada_em?: string | null
          id?: string
          job_id?: string
          profissional_id?: string
          status?: string
          taxa_5pct?: number
          taxa_cobrada?: boolean
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contratacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratacoes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratacoes_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_dados: {
        Row: {
          bio: string | null
          cnpj: string | null
          created_at: string
          endereco: string
          id: string
          is_demo: boolean
          nome_empresa: string
          profile_id: string
          ramo: string | null
        }
        Insert: {
          bio?: string | null
          cnpj?: string | null
          created_at?: string
          endereco?: string
          id?: string
          is_demo?: boolean
          nome_empresa?: string
          profile_id: string
          ramo?: string | null
        }
        Update: {
          bio?: string | null
          cnpj?: string | null
          created_at?: string
          endereco?: string
          id?: string
          is_demo?: boolean
          nome_empresa?: string
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
          contratacao_id: string
          created_at: string
          de_id: string
          id: string
          lida: boolean
          para_id: string
          texto: string
        }
        Insert: {
          contratacao_id: string
          created_at?: string
          de_id: string
          id?: string
          lida?: boolean
          para_id: string
          texto: string
        }
        Update: {
          contratacao_id?: string
          created_at?: string
          de_id?: string
          id?: string
          lida?: boolean
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
          {
            foreignKeyName: "mensagens_de_id_fkey"
            columns: ["de_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_para_id_fkey"
            columns: ["para_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string
          id: string
          lida: boolean
          link: string | null
          texto: string
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lida?: boolean
          link?: string | null
          texto: string
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lida?: boolean
          link?: string | null
          texto?: string
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          valor?: number
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
          {
            foreignKeyName: "pagamentos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avaliacao_media: number
          bio: string | null
          cidade: string
          created_at: string
          email: string
          foto_url: string | null
          id: string
          jobs_completed: number | null
          neighborhood: string | null
          nome: string | null
          phone: string | null
          rating: number | null
          skills: string[] | null
          subscription_end: string | null
          subscription_status: string
          telefone: string
          tipo: string
          total_avaliacoes: number
        }
        Insert: {
          avaliacao_media?: number
          bio?: string | null
          cidade?: string
          created_at?: string
          email: string
          foto_url?: string | null
          id: string
          jobs_completed?: number | null
          neighborhood?: string | null
          nome?: string | null
          phone?: string | null
          rating?: number | null
          skills?: string[] | null
          subscription_end?: string | null
          subscription_status?: string
          telefone?: string
          tipo: string
          total_avaliacoes?: number
        }
        Update: {
          avaliacao_media?: number
          bio?: string | null
          cidade?: string
          created_at?: string
          email?: string
          foto_url?: string | null
          id?: string
          jobs_completed?: number | null
          neighborhood?: string | null
          nome?: string | null
          phone?: string | null
          rating?: number | null
          skills?: string[] | null
          subscription_end?: string | null
          subscription_status?: string
          telefone?: string
          tipo?: string
          total_avaliacoes?: number
        }
        Relationships: []
      }
      profissional_dados: {
        Row: {
          bio: string
          created_at: string
          disponibilidade: string
          experiencia: string
          id: string
          is_demo: boolean
          profile_id: string
          profissoes: string[]
        }
        Insert: {
          bio?: string
          created_at?: string
          disponibilidade?: string
          experiencia?: string
          id?: string
          is_demo?: boolean
          profile_id: string
          profissoes?: string[]
        }
        Update: {
          bio?: string
          created_at?: string
          disponibilidade?: string
          experiencia?: string
          id?: string
          is_demo?: boolean
          profile_id?: string
          profissoes?: string[]
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
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
