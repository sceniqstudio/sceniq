// lib/supabase/types.ts
//
// Types TypeScript du schéma Supabase ScenIQ (project ref: lawmjbyhqmuxalxqraxz).
// Reflète exactement les 7 migrations dans supabase/migrations/.
//
// Pour régénérer automatiquement depuis le cloud (après changement de schéma) :
//   npx supabase gen types typescript --project-id lawmjbyhqmuxalxqraxz > lib/supabase/types.ts
//
// Note : le `npm run db:types` historique pointait vers `--local` (Supabase Docker local).
// On peut le mettre à jour pour pointer vers `--project-id` dans package.json.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ProjectStatus  = 'brief' | 'production' | 'generation' | 'export' | 'archived'
export type ProjectFormat  = '16:9' | '9:16' | '1:1' | '4:3'
export type AgentId        = 'director' | 'scriptwriter' | 'storyboarder' | 'music' | 'visual'
export type SceneStatus    = 'idle' | 'generating' | 'done' | 'failed'
export type ClipStatus     = 'pending' | 'processing' | 'done' | 'failed'
export type AssetType      = 'logo' | 'image' | 'video' | 'color' | 'font'
export type SubPlan        = 'free' | 'studio' | 'agency' | 'white_label'
export type SubStatus      = 'active' | 'past_due' | 'canceled' | 'trialing'

// ─── Orders (Phase A — checkout V1 agence services) ─────────────────────────
export type OrderStatus = 'pending_payment' | 'paid' | 'cancelled' | 'refunded'
export type OrderFormat = '21:9' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16'
export type OrderDuration = 5 | 8 | 10 | 12 | 15

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id:         string
          clerk_id:   string
          email:      string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?:         string
          clerk_id:    string
          email:       string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['users']['Row']>
        Relationships: []
      }
      brands: {
        Row: {
          id:         string
          user_id:    string
          name:       string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?:         string
          user_id:     string
          name:        string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['brands']['Row']>
        Relationships: [
          { foreignKeyName: 'brands_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
        ]
      }
      brand_assets: {
        Row: {
          id:         string
          brand_id:   string
          type:       AssetType
          url:        string | null
          value:      string | null
          created_at: string
        }
        Insert: {
          id?:         string
          brand_id:    string
          type:        AssetType
          url?:        string | null
          value?:      string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['brand_assets']['Row']>
        Relationships: [
          { foreignKeyName: 'brand_assets_brand_id_fkey'; columns: ['brand_id']; referencedRelation: 'brands'; referencedColumns: ['id'] },
        ]
      }
      projects: {
        Row: {
          id:           string
          user_id:      string
          brand_id:     string | null
          name:         string
          brief:        string
          format:       ProjectFormat
          duration_sec: number
          tone:         string
          status:       ProjectStatus
          created_at:   string
          updated_at:   string
        }
        Insert: {
          id?:           string
          user_id:       string
          brand_id?:     string | null
          name:          string
          brief:         string
          format?:       ProjectFormat
          duration_sec?: number
          tone?:         string
          status?:       ProjectStatus
          created_at?:   string
          updated_at?:   string
        }
        Update: Partial<Database['public']['Tables']['projects']['Row']>
        Relationships: [
          { foreignKeyName: 'projects_user_id_fkey';  columns: ['user_id'];  referencedRelation: 'users';  referencedColumns: ['id'] },
          { foreignKeyName: 'projects_brand_id_fkey'; columns: ['brand_id']; referencedRelation: 'brands'; referencedColumns: ['id'] },
        ]
      }
      agent_outputs: {
        Row: {
          id:         string
          project_id: string
          agent:      AgentId
          content:    string
          accepted:   boolean
          version:    number
          created_at: string
        }
        Insert: {
          id?:         string
          project_id:  string
          agent:       AgentId
          content:     string
          accepted?:   boolean
          version?:    number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['agent_outputs']['Row']>
        Relationships: [
          { foreignKeyName: 'agent_outputs_project_id_fkey'; columns: ['project_id']; referencedRelation: 'projects'; referencedColumns: ['id'] },
        ]
      }
      scenes: {
        Row: {
          id:              string
          project_id:      string
          scene_index:     number
          duration_sec:    number
          seedance_prompt: string
          description_fr:  string
          status:          SceneStatus
          created_at:      string
        }
        Insert: {
          id?:              string
          project_id:       string
          scene_index:      number
          duration_sec:     number
          seedance_prompt:  string
          description_fr:   string
          status?:          SceneStatus
          created_at?:      string
        }
        Update: Partial<Database['public']['Tables']['scenes']['Row']>
        Relationships: [
          { foreignKeyName: 'scenes_project_id_fkey'; columns: ['project_id']; referencedRelation: 'projects'; referencedColumns: ['id'] },
        ]
      }
      clips: {
        Row: {
          id:          string
          scene_id:    string
          fal_job_id:  string | null
          video_url:   string | null
          duration_ms: number | null
          status:      ClipStatus
          error:       string | null
          created_at:  string
        }
        Insert: {
          id?:          string
          scene_id:     string
          fal_job_id?:  string | null
          video_url?:   string | null
          duration_ms?: number | null
          status?:      ClipStatus
          error?:       string | null
          created_at?:  string
        }
        Update: Partial<Database['public']['Tables']['clips']['Row']>
        Relationships: [
          { foreignKeyName: 'clips_scene_id_fkey'; columns: ['scene_id']; referencedRelation: 'scenes'; referencedColumns: ['id'] },
        ]
      }
      credits_ledger: {
        Row: {
          id:         string
          user_id:    string
          delta:      number
          reason:     string
          project_id: string | null
          scene_id:   string | null
          created_at: string
        }
        Insert: {
          id?:         string
          user_id:     string
          delta:       number
          reason:      string
          project_id?: string | null
          scene_id?:   string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['credits_ledger']['Row']>
        Relationships: [
          { foreignKeyName: 'credits_ledger_user_id_fkey';    columns: ['user_id'];    referencedRelation: 'users';    referencedColumns: ['id'] },
          { foreignKeyName: 'credits_ledger_project_id_fkey'; columns: ['project_id']; referencedRelation: 'projects'; referencedColumns: ['id'] },
          { foreignKeyName: 'credits_ledger_scene_id_fkey';   columns: ['scene_id'];   referencedRelation: 'scenes';   referencedColumns: ['id'] },
        ]
      }
      subscriptions: {
        Row: {
          id:                     string
          user_id:                string
          stripe_customer_id:     string
          stripe_subscription_id: string | null
          plan:                   SubPlan
          status:                 SubStatus
          current_period_end:     string | null
          created_at:             string
          updated_at:             string
        }
        Insert: {
          id?:                     string
          user_id:                 string
          stripe_customer_id:      string
          stripe_subscription_id?: string | null
          plan?:                   SubPlan
          status?:                 SubStatus
          current_period_end?:     string | null
          created_at?:             string
          updated_at?:             string
        }
        Update: Partial<Database['public']['Tables']['subscriptions']['Row']>
        Relationships: [
          { foreignKeyName: 'subscriptions_user_id_fkey'; columns: ['user_id']; referencedRelation: 'users'; referencedColumns: ['id'] },
        ]
      }
      orders: {
        Row: {
          id:                   string
          status:               OrderStatus
          format:               OrderFormat
          duration:             number
          price_ht:             number
          brief:                string
          client_name:          string
          client_email:         string
          client_phone:         string | null
          client_company:       string | null
          preferred_call_slot:  string | null
          ref_paths:            string[]
          stripe_session_id:    string | null
          stripe_payment_intent: string | null
          created_at:           string
          updated_at:           string
        }
        Insert: {
          id?:                   string
          status?:               OrderStatus
          format:                OrderFormat
          duration:              number
          price_ht:              number
          brief:                 string
          client_name:           string
          client_email:          string
          client_phone?:         string | null
          client_company?:       string | null
          preferred_call_slot?:  string | null
          ref_paths?:            string[]
          stripe_session_id?:    string | null
          stripe_payment_intent?: string | null
          created_at?:           string
          updated_at?:           string
        }
        Update: Partial<Database['public']['Tables']['orders']['Row']>
        Relationships: []
      }
    }
    Views: {
      user_credits: {
        Row: {
          user_id: string | null
          balance: number | null
        }
        Relationships: []
      }
    }
    Functions:      Record<string, never>
    Enums:          Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
