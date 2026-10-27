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
          confirmado_profissional_em: string | null
          divergencia_resolvida_em: string | null
          motivo_divergencia: string | null
          status_taxa: string | null
          taxa_paga_em: string | null
          codigo_gerado_em: string | null
          confirmado_por_codigo: boolean
          codigo_confirmado_em: string | null
          codigo_tentativas: number
          valor_confirmado_profissional: boolean
          valor_contestado: number | null
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
          confirmado_profissional_em?: string | null
          divergencia_resolvida_em?: string | null
          motivo_divergencia?: string | null
          status_taxa?: string | null
          taxa_paga_em?: string | null
          codigo_gerado_em?: string | null
          confirmado_por_codigo?: boolean
          codigo_confirmado_em?: string | null
          codigo_tentativas?: number
          valor_confirmado_profissional?: boolean
          valor_contestado?: number | null
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
          confirmado_profissional_em?: string | null
          divergencia_resolvida_em?: string | null
          motivo_divergencia?: string | null
          status_taxa?: string | null
          taxa_paga_em?: string | null
          codigo_gerado_em?: string | null
          confirmado_por_codigo?: boolean
          codigo_confirmado_em?: string | null
          codigo_tentativas?: number
          valor_confirmado_profissional?: boolean
          valor_contestado?: number | null
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
      creditos_taxas: {
        Row: {
          created_at: string
          descricao: string | null
          empresa_id: string
          id: string
          indicacao_id: string | null
          origem: string
          saldo: number
          valor: number
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          empresa_id: string
          id?: string
          indicacao_id?: string | null
          origem?: string
          saldo: number
          valor: number
        }
        Update: {
          created_at?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          indicacao_id?: string | null
          origem?: string
          saldo?: number
          valor?: number
        }
        Relationships: []
      }
      empresa_dados: {
        Row: {
          cnpj: string | null
          endereco: string | null
          nome_empresa: string | null
          profile_id: string
          ramo: string | null
          bio: string | null
          latitude: number | null
          longitude: number | null
        }
        Insert: {
          cnpj?: string | null
          endereco?: string | null
          nome_empresa?: string | null
          profile_id: string
          ramo?: string | null
          bio?: string | null
          latitude?: number | null
          longitude?: number | null
        }
        Update: {
          cnpj?: string | null
          endereco?: string | null
          nome_empresa?: string | null
          profile_id?: string
          ramo?: string | null
          bio?: string | null
          latitude?: number | null
          longitude?: number | null
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
      indicacoes: {
        Row: {
          codigo: string
          created_at: string
          id: string
          indicado_id: string
          indicador_id: string
          recompensa_valor: number | null
          recompensado_em: string | null
          status: string
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          id?: string
          indicado_id: string
          indicador_id: string
          recompensa_valor?: number | null
          recompensado_em?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          id?: string
          indicado_id?: string
          indicador_id?: string
          recompensa_valor?: number | null
          recompensado_em?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          latitude: number | null
          longitude: number | null
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
          latitude?: number | null
          longitude?: number | null
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
          latitude?: number | null
          longitude?: number | null
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
      portfolio_fotos: {
        Row: {
          created_at: string
          id: string
          legenda: string | null
          profile_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          legenda?: string | null
          profile_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          legenda?: string | null
          profile_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_fotos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suporte_mensagens: {
        Row: {
          autor_id: string
          created_at: string
          id: string
          lida_admin: boolean
          lida_usuario: boolean
          texto: string
          user_id: string
        }
        Insert: {
          autor_id: string
          created_at?: string
          id?: string
          lida_admin?: boolean
          lida_usuario?: boolean
          texto: string
          user_id: string
        }
        Update: {
          autor_id?: string
          created_at?: string
          id?: string
          lida_admin?: boolean
          lida_usuario?: boolean
          texto?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          latitude: number | null
          longitude: number | null
          localizacao_em: string | null
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
          is_admin: boolean
          is_demo: boolean
          verificado: boolean
          codigo_indicacao: string | null
          destaque: boolean
          indicacao_recompensa_em: string | null
          indicacao_recompensa_liberada: boolean
          indicado_por: string | null
          meta_ajuste_trabalhos: number
          selos_extras: string[]
        }
        Insert: {
          latitude?: number | null
          longitude?: number | null
          localizacao_em?: string | null
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
          is_admin?: boolean
          is_demo?: boolean
          verificado?: boolean
          codigo_indicacao?: string | null
          destaque?: boolean
          indicacao_recompensa_em?: string | null
          indicacao_recompensa_liberada?: boolean
          indicado_por?: string | null
          meta_ajuste_trabalhos?: number
          selos_extras?: string[]
        }
        Update: {
          latitude?: number | null
          longitude?: number | null
          localizacao_em?: string | null
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
          is_admin?: boolean
          is_demo?: boolean
          verificado?: boolean
          codigo_indicacao?: string | null
          destaque?: boolean
          indicacao_recompensa_em?: string | null
          indicacao_recompensa_liberada?: boolean
          indicado_por?: string | null
          meta_ajuste_trabalhos?: number
          selos_extras?: string[]
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
      taxas_saldo_empresas: {
        Row: {
          a_confirmar: number
          confirmado: number
          creditos: number
          em_divergencia: number
          empresa_id: string
          pago: number
          saldo: number
        }
        Relationships: []
      }
    }
    Functions: {
      minhas_indicacoes: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          id: string
          indicado_nome: string | null
          indicado_tipo: string
          recompensa_valor: number | null
          recompensado_em: string | null
          status: string
        }[]
      }
      recomendadas_empresas: {
        Args: { p_limite?: number }
        Returns: {
          avaliacao_media: number
          cidade: string | null
          contratacoes: number
          destaque: boolean
          endereco: string | null
          foto_url: string | null
          id: string
          nome_empresa: string
          ramo: string | null
          relevancia: number
          top_avaliada: boolean
          total_avaliacoes: number
          vagas_abertas: number
          verificado: boolean
        }[]
      }
      recomendados_profissionais: {
        Args: { p_limite?: number }
        Returns: {
          avaliacao_media: number
          cidade: string | null
          destaque: boolean
          disponibilidade: string | null
          foto_url: string | null
          id: string
          indicado: boolean
          nome: string | null
          profissoes: string[] | null
          relevancia: number
          top_avaliado: boolean
          total_avaliacoes: number
          trabalhos: number
          verificado: boolean
        }[]
      }
      validar_codigo_indicacao: {
        Args: { p_codigo: string }
        Returns: string | null
      }
      admin_ajustar_meta: {
        Args: { p_id: string; p_ajuste: number }
        Returns: undefined
      }
      admin_crescimento: {
        Args: { p_semanas?: number; p_incluir_demo?: boolean }
        Returns: {
          semana: string
          empresas: number
          profissionais: number
          contratacoes: number
        }[]
      }
      admin_indicacoes: {
        Args: { p_incluir_demo?: boolean }
        Returns: {
          indicado_id: string
          indicado_nome: string | null
          indicado_tipo: string
          indicado_email: string
          cadastrado_em: string
          perfil_completo: boolean
          pagou: boolean
          recompensa_liberada: boolean
          recompensa_em: string | null
          indicador_id: string
          indicador_nome: string | null
          indicador_codigo: string | null
        }[]
      }
      admin_liberar_recompensa: {
        Args: { p_indicado: string; p_liberada?: boolean }
        Returns: undefined
      }
      admin_listar_contratacoes: {
        Args: { p_incluir_demo?: boolean }
        Returns: {
          id: string
          vaga: string
          empresa_id: string
          empresa: string
          profissional_id: string
          profissional: string | null
          valor: number
          status: string
          status_taxa: string | null
          taxa: number | null
          taxa_cobrada: boolean
          valor_contestado: number | null
          criada_em: string
          finalizada_em: string | null
          taxa_paga_em: string | null
          is_demo: boolean
        }[]
      }
      admin_listar_empresas: {
        Args: { p_incluir_demo?: boolean }
        Returns: {
          id: string
          nome_empresa: string
          responsavel: string | null
          email: string
          telefone: string | null
          ramo: string | null
          cidade: string | null
          endereco: string | null
          cnpj: string | null
          assinatura_status: string
          assinatura_fim: string | null
          assinante: boolean
          vagas: number
          vagas_abertas: number
          contratacoes: number
          contratacoes_finalizadas: number
          movimentado: number
          saldo_taxas: number
          taxas_abertas: number
          taxa_aberta_desde: string | null
          em_divergencia: number
          taxas_pagas: number
          travada: boolean
          perto_teto: boolean
          inadimplente: boolean
          avaliacao_media: number
          total_avaliacoes: number
          verificado: boolean
          destaque: boolean
          selos_extras: string[]
          ultima_atividade: string
          ativo: boolean
          created_at: string
          is_demo: boolean
          creditos: number
          indicacoes: number
        }[]
      }
      admin_listar_profissionais: {
        Args: { p_incluir_demo?: boolean }
        Returns: {
          id: string
          nome: string | null
          email: string
          telefone: string | null
          profissoes: string[] | null
          cidade: string | null
          disponibilidade: string | null
          assinatura_status: string
          assinatura_fim: string | null
          assinante: boolean
          avaliacao_media: number
          total_avaliacoes: number
          candidaturas: number
          trabalhos: number
          meta_ajuste_trabalhos: number
          meta_trabalhos: number
          ganhos: number
          fotos_portfolio: number
          verificado: boolean
          destaque: boolean
          selos_extras: string[]
          indicado_por: string | null
          codigo_indicacao: string | null
          ultima_atividade: string
          ativo: boolean
          created_at: string
          is_demo: boolean
        }[]
      }
      admin_listar_vagas: {
        Args: { p_incluir_demo?: boolean }
        Returns: {
          id: string
          titulo: string
          empresa_id: string
          empresa: string
          categoria: string
          funcao: string
          data: string
          horario: string
          valor: number
          bairro: string
          status: string
          candidaturas: number
          candidaturas_pendentes: number
          profissional: string | null
          status_contratacao: string | null
          created_at: string
          is_demo: boolean
        }[]
      }
      admin_promover: {
        Args: { p_id: string; p_verificado?: boolean; p_destaque?: boolean; p_selos_extras?: string[] }
        Returns: undefined
      }
      admin_receita_mensal: {
        Args: { p_meses?: number; p_incluir_demo?: boolean }
        Returns: {
          mes: string
          taxas: number
          movimentado: number
          contratacoes: number
        }[]
      }
      admin_usuario_detalhe: {
        Args: { p_id: string }
        Returns: Json
      }
      admin_visao_geral: {
        Args: { p_incluir_demo?: boolean }
        Returns: Json
      }
      admin_registrar_pagamento_taxas: {
        Args: { p_empresa: string; p_referencia?: string }
        Returns: number
      }
      admin_resolver_divergencia: {
        Args: { p_id: string; p_valor_final: number }
        Returns: undefined
      }
      admin_saldos_taxas: {
        Args: Record<PropertyKey, never>
        Returns: {
          a_confirmar: number
          bloqueado: boolean
          em_divergencia: number
          empresa_id: string
          nome_empresa: string
          pago: number
          saldo: number
        }[]
      }
      gerar_codigo_confirmacao: {
        Args: { p_id: string; p_valor: number }
        Returns: string
      }
      meu_codigo_confirmacao: {
        Args: { p_id: string }
        Returns: string | null
      }
      confirmar_codigo_contratacao: {
        Args: { p_id: string; p_codigo: string; p_valor_confere?: boolean; p_valor_recebido?: number; p_motivo?: string }
        Returns: string
      }
      admin_encerrar_contratacao: {
        Args: { p_id: string; p_valor: number }
        Returns: undefined
      }
      minhas_pendencias: {
        Args: Record<PropertyKey, never>
        Returns: { tipo: string; contratacao_id: string; titulo: string; data: string; bloqueia: boolean }[]
      }
      frela_curriculo_completo: {
        Args: { p_id: string }
        Returns: boolean
      }
      confirmar_valor_contratacao: {
        Args: { p_id: string; p_confirma: boolean; p_valor_recebido?: number; p_motivo?: string }
        Returns: string
      }
      minhas_taxas_resumo: {
        Args: Record<PropertyKey, never>
        Returns: {
          a_confirmar: number
          bloqueado: boolean
          confirmado: number
          em_divergencia: number
          pago: number
          pode_renovar: boolean
          saldo: number
          teto: number
          creditos: number
          bruto: number
        }[]
      }
      pode_renovar_assinatura: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      saldo_taxas_empresa: {
        Args: { p_empresa: string }
        Returns: number
      }
      admin_set_verificado: {
        Args: { p_id: string; p_valor: boolean }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
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
