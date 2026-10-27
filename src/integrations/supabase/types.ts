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
            referencedRelation: "frela_ultima_atividade"
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
            referencedRelation: "frela_ultima_atividade"
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
          confirmado_profissional_em: string | null
          created_at: string
          divergencia_resolvida_em: string | null
          empresa_id: string
          finalizada_em: string | null
          id: string
          job_id: string
          motivo_divergencia: string | null
          profissional_id: string
          status: string
          status_taxa: string | null
          taxa_5pct: number
          taxa_cobrada: boolean
          taxa_paga_em: string | null
          valor: number
          valor_confirmado_profissional: boolean
          valor_contestado: number | null
        }
        Insert: {
          confirmado_profissional_em?: string | null
          created_at?: string
          divergencia_resolvida_em?: string | null
          empresa_id: string
          finalizada_em?: string | null
          id?: string
          job_id: string
          motivo_divergencia?: string | null
          profissional_id: string
          status?: string
          status_taxa?: string | null
          taxa_5pct?: number
          taxa_cobrada?: boolean
          taxa_paga_em?: string | null
          valor?: number
          valor_confirmado_profissional?: boolean
          valor_contestado?: number | null
        }
        Update: {
          confirmado_profissional_em?: string | null
          created_at?: string
          divergencia_resolvida_em?: string | null
          empresa_id?: string
          finalizada_em?: string | null
          id?: string
          job_id?: string
          motivo_divergencia?: string | null
          profissional_id?: string
          status?: string
          status_taxa?: string | null
          taxa_5pct?: number
          taxa_cobrada?: boolean
          taxa_paga_em?: string | null
          valor?: number
          valor_confirmado_profissional?: boolean
          valor_contestado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contratacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "frela_ultima_atividade"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "frela_ultima_atividade"
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
        Relationships: [
          {
            foreignKeyName: "creditos_taxas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "frela_ultima_atividade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creditos_taxas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creditos_taxas_indicacao_id_fkey"
            columns: ["indicacao_id"]
            isOneToOne: false
            referencedRelation: "indicacoes"
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
          latitude: number | null
          longitude: number | null
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
          latitude?: number | null
          longitude?: number | null
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
          latitude?: number | null
          longitude?: number | null
          nome_empresa?: string
          profile_id?: string
          ramo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empresa_dados_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "frela_ultima_atividade"
            referencedColumns: ["id"]
          },
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
        Relationships: [
          {
            foreignKeyName: "indicacoes_indicado_id_fkey"
            columns: ["indicado_id"]
            isOneToOne: true
            referencedRelation: "frela_ultima_atividade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicacoes_indicado_id_fkey"
            columns: ["indicado_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicacoes_indicador_id_fkey"
            columns: ["indicador_id"]
            isOneToOne: false
            referencedRelation: "frela_ultima_atividade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicacoes_indicador_id_fkey"
            columns: ["indicador_id"]
            isOneToOne: false
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
            referencedRelation: "frela_ultima_atividade"
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
            referencedRelation: "frela_ultima_atividade"
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
            referencedRelation: "frela_ultima_atividade"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "frela_ultima_atividade"
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
            referencedRelation: "frela_ultima_atividade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_fotos_profile_id_fkey"
            columns: ["profile_id"]
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
          cartao_cadastrado: boolean
          cidade: string
          codigo_indicacao: string | null
          created_at: string
          destaque: boolean
          email: string
          foto_url: string | null
          id: string
          indicacao_recompensa_em: string | null
          indicacao_recompensa_liberada: boolean
          indicado_por: string | null
          is_admin: boolean
          is_demo: boolean
          jobs_completed: number | null
          meta_ajuste_trabalhos: number
          neighborhood: string | null
          nome: string | null
          phone: string | null
          rating: number | null
          selos_extras: string[]
          skills: string[] | null
          stripe_customer_id: string | null
          subscription_end: string | null
          subscription_status: string
          telefone: string
          tipo: string
          total_avaliacoes: number
          verificado: boolean
        }
        Insert: {
          avaliacao_media?: number
          bio?: string | null
          cartao_cadastrado?: boolean
          cidade?: string
          codigo_indicacao?: string | null
          created_at?: string
          destaque?: boolean
          email: string
          foto_url?: string | null
          id: string
          indicacao_recompensa_em?: string | null
          indicacao_recompensa_liberada?: boolean
          indicado_por?: string | null
          is_admin?: boolean
          is_demo?: boolean
          jobs_completed?: number | null
          meta_ajuste_trabalhos?: number
          neighborhood?: string | null
          nome?: string | null
          phone?: string | null
          rating?: number | null
          selos_extras?: string[]
          skills?: string[] | null
          stripe_customer_id?: string | null
          subscription_end?: string | null
          subscription_status?: string
          telefone?: string
          tipo: string
          total_avaliacoes?: number
          verificado?: boolean
        }
        Update: {
          avaliacao_media?: number
          bio?: string | null
          cartao_cadastrado?: boolean
          cidade?: string
          codigo_indicacao?: string | null
          created_at?: string
          destaque?: boolean
          email?: string
          foto_url?: string | null
          id?: string
          indicacao_recompensa_em?: string | null
          indicacao_recompensa_liberada?: boolean
          indicado_por?: string | null
          is_admin?: boolean
          is_demo?: boolean
          jobs_completed?: number | null
          meta_ajuste_trabalhos?: number
          neighborhood?: string | null
          nome?: string | null
          phone?: string | null
          rating?: number | null
          selos_extras?: string[]
          skills?: string[] | null
          stripe_customer_id?: string | null
          subscription_end?: string | null
          subscription_status?: string
          telefone?: string
          tipo?: string
          total_avaliacoes?: number
          verificado?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "profiles_indicado_por_fkey"
            columns: ["indicado_por"]
            isOneToOne: false
            referencedRelation: "frela_ultima_atividade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_indicado_por_fkey"
            columns: ["indicado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profissional_dados: {
        Row: {
          bio: string
          created_at: string
          disponibilidade: string
          experiencia: string
          id: string
          instagram: string | null
          is_demo: boolean
          linkedin: string | null
          profile_id: string
          profissoes: string[]
        }
        Insert: {
          bio?: string
          created_at?: string
          disponibilidade?: string
          experiencia?: string
          id?: string
          instagram?: string | null
          is_demo?: boolean
          linkedin?: string | null
          profile_id: string
          profissoes?: string[]
        }
        Update: {
          bio?: string
          created_at?: string
          disponibilidade?: string
          experiencia?: string
          id?: string
          instagram?: string | null
          is_demo?: boolean
          linkedin?: string | null
          profile_id?: string
          profissoes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "profissional_dados_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "frela_ultima_atividade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profissional_dados_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
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
      frela_ultima_atividade: {
        Row: {
          id: string | null
          ultima_atividade: string | null
        }
        Insert: {
          id?: string | null
          ultima_atividade?: never
        }
        Update: {
          id?: string | null
          ultima_atividade?: never
        }
        Relationships: []
      }
      taxas_saldo_empresas: {
        Row: {
          a_confirmar: number | null
          confirmado: number | null
          em_divergencia: number | null
          empresa_id: string | null
          pago: number | null
          saldo: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contratacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "frela_ultima_atividade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_ajustar_meta: {
        Args: { p_ajuste: number; p_id: string }
        Returns: undefined
      }
      admin_crescimento: {
        Args: { p_incluir_demo?: boolean; p_semanas?: number }
        Returns: {
          contratacoes: number
          empresas: number
          profissionais: number
          semana: string
        }[]
      }
      admin_indicacoes: {
        Args: { p_incluir_demo?: boolean }
        Returns: {
          cadastrado_em: string
          indicado_email: string
          indicado_id: string
          indicado_nome: string
          indicado_tipo: string
          indicador_codigo: string
          indicador_id: string
          indicador_nome: string
          pagou: boolean
          perfil_completo: boolean
          recompensa_em: string
          recompensa_liberada: boolean
        }[]
      }
      admin_liberar_recompensa: {
        Args: { p_indicado: string; p_liberada?: boolean }
        Returns: undefined
      }
      admin_listar_contratacoes: {
        Args: { p_incluir_demo?: boolean }
        Returns: {
          criada_em: string
          empresa: string
          empresa_id: string
          finalizada_em: string
          id: string
          is_demo: boolean
          profissional: string
          profissional_id: string
          status: string
          status_taxa: string
          taxa: number
          taxa_cobrada: boolean
          taxa_paga_em: string
          vaga: string
          valor: number
          valor_contestado: number
        }[]
      }
      admin_listar_empresas: {
        Args: { p_incluir_demo?: boolean }
        Returns: {
          assinante: boolean
          assinatura_fim: string
          assinatura_status: string
          ativo: boolean
          avaliacao_media: number
          cidade: string
          cnpj: string
          contratacoes: number
          contratacoes_finalizadas: number
          created_at: string
          destaque: boolean
          em_divergencia: number
          email: string
          endereco: string
          id: string
          inadimplente: boolean
          is_demo: boolean
          movimentado: number
          nome_empresa: string
          perto_teto: boolean
          ramo: string
          responsavel: string
          saldo_taxas: number
          selos_extras: string[]
          taxa_aberta_desde: string
          taxas_abertas: number
          taxas_pagas: number
          telefone: string
          total_avaliacoes: number
          travada: boolean
          ultima_atividade: string
          vagas: number
          vagas_abertas: number
          verificado: boolean
        }[]
      }
      admin_listar_profissionais: {
        Args: { p_incluir_demo?: boolean }
        Returns: {
          assinante: boolean
          assinatura_fim: string
          assinatura_status: string
          ativo: boolean
          avaliacao_media: number
          candidaturas: number
          cidade: string
          codigo_indicacao: string
          created_at: string
          destaque: boolean
          disponibilidade: string
          email: string
          fotos_portfolio: number
          ganhos: number
          id: string
          indicado_por: string
          is_demo: boolean
          meta_ajuste_trabalhos: number
          meta_trabalhos: number
          nome: string
          profissoes: string[]
          selos_extras: string[]
          telefone: string
          total_avaliacoes: number
          trabalhos: number
          ultima_atividade: string
          verificado: boolean
        }[]
      }
      admin_listar_vagas: {
        Args: { p_incluir_demo?: boolean }
        Returns: {
          bairro: string
          candidaturas: number
          candidaturas_pendentes: number
          categoria: string
          created_at: string
          data: string
          empresa: string
          empresa_id: string
          funcao: string
          horario: string
          id: string
          is_demo: boolean
          profissional: string
          status: string
          status_contratacao: string
          titulo: string
          valor: number
        }[]
      }
      admin_promover: {
        Args: {
          p_destaque?: boolean
          p_id: string
          p_selos_extras?: string[]
          p_verificado?: boolean
        }
        Returns: undefined
      }
      admin_receita_mensal: {
        Args: { p_incluir_demo?: boolean; p_meses?: number }
        Returns: {
          contratacoes: number
          mes: string
          movimentado: number
          taxas: number
        }[]
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
        Args: never
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
      admin_set_verificado: {
        Args: { p_id: string; p_valor: boolean }
        Returns: undefined
      }
      admin_usuario_detalhe: { Args: { p_id: string }; Returns: Json }
      admin_visao_geral: { Args: { p_incluir_demo?: boolean }; Returns: Json }
      confirmar_valor_contratacao: {
        Args: {
          p_confirma: boolean
          p_id: string
          p_motivo?: string
          p_valor_recebido?: number
        }
        Returns: string
      }
      contratacoes_finalizadas_empresa: {
        Args: { p_id: string }
        Returns: number
      }
      frela_autoconfirmar_valores: {
        Args: { p_dias?: number }
        Returns: number
      }
      frela_brl: { Args: { v: number }; Returns: string }
      frela_conceder_recompensa: {
        Args: { p_forcar?: boolean; p_indicacao: string }
        Returns: number
      }
      frela_eh_indicado: {
        Args: {
          p_ajuste: number
          p_media: number
          p_selos: string[]
          p_total_avaliacoes: number
          p_trabalhos: number
        }
        Returns: boolean
      }
      frela_exige_admin: { Args: never; Returns: undefined }
      frela_meta_trabalhos: { Args: never; Returns: number }
      frela_nota_minima_indicado: { Args: never; Returns: number }
      frela_preco_assinatura: { Args: { p_tipo: string }; Returns: number }
      frela_quitar_taxas: {
        Args: { p_empresa: string; p_referencia?: string }
        Returns: number
      }
      frela_recompensa_indicacao: { Args: never; Returns: number }
      frela_taxa_percentual: { Args: never; Returns: number }
      frela_teto_taxas: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      historico_profissional: {
        Args: { p_id: string }
        Returns: {
          comentario: string
          contratacao_id: string
          data: string
          empresa: string
          finalizada_em: string
          nota: number
          titulo: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      minhas_taxas_resumo: {
        Args: never
        Returns: {
          a_confirmar: number
          bloqueado: boolean
          confirmado: number
          em_divergencia: number
          pago: number
          pode_renovar: boolean
          saldo: number
          teto: number
        }[]
      }
      pode_renovar_assinatura: { Args: never; Returns: boolean }
      recomendadas_empresas: {
        Args: { p_limite?: number }
        Returns: {
          avaliacao_media: number
          cidade: string
          contratacoes: number
          destaque: boolean
          endereco: string
          foto_url: string
          id: string
          nome_empresa: string
          ramo: string
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
          cidade: string
          destaque: boolean
          disponibilidade: string
          foto_url: string
          id: string
          indicado: boolean
          nome: string
          profissoes: string[]
          relevancia: number
          top_avaliado: boolean
          total_avaliacoes: number
          trabalhos: number
          verificado: boolean
        }[]
      }
      saldo_taxas_empresa: { Args: { p_empresa: string }; Returns: number }
      trabalhos_finalizados: {
        Args: { p_ids: string[] }
        Returns: {
          profissional_id: string
          total: number
        }[]
      }
      validar_codigo_indicacao: { Args: { p_codigo: string }; Returns: string }
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
