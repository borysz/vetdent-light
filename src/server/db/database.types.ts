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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      clinic_members: {
        Row: {
          clinic_id: string
          created_at: string
          display_name: string
          title: string | null
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          display_name: string
          title?: string | null
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          display_name?: string
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_members_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          city: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          postal_code: string | null
          street: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          postal_code?: string | null
          street?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          postal_code?: string | null
          street?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          breed: string | null
          clinic_id: string
          created_at: string
          created_by: string | null
          estimated_birth_month: string | null
          id: string
          last_weight_kg: number | null
          name: string
          owner_email: string | null
          owner_name: string
          owner_phone: string | null
          phone_digits: string | null
          search_text: string | null
          sex: string | null
          species: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          breed?: string | null
          clinic_id: string
          created_at?: string
          created_by?: string | null
          estimated_birth_month?: string | null
          id?: string
          last_weight_kg?: number | null
          name: string
          owner_email?: string | null
          owner_name: string
          owner_phone?: string | null
          phone_digits?: string | null
          search_text?: string | null
          sex?: string | null
          species: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          breed?: string | null
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          estimated_birth_month?: string | null
          id?: string
          last_weight_kg?: number | null
          name?: string
          owner_email?: string | null
          owner_name?: string
          owner_phone?: string | null
          phone_digits?: string | null
          search_text?: string | null
          sex?: string | null
          species?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_sheets: {
        Row: {
          age_months: number | null
          age_years: number | null
          asa: string | null
          clinic_id: string
          content: Json
          created_at: string
          created_by: string | null
          id: string
          patient_id: string
          schema_version: number
          treating_vet: string | null
          treatment_date: string
          updated_at: string
          updated_by: string | null
          version: number
          weight_kg: number | null
        }
        Insert: {
          age_months?: number | null
          age_years?: number | null
          asa?: string | null
          clinic_id: string
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id: string
          schema_version?: number
          treating_vet?: string | null
          treatment_date: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          weight_kg?: number | null
        }
        Update: {
          age_months?: number | null
          age_years?: number | null
          asa?: string | null
          clinic_id?: string
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id?: string
          schema_version?: number
          treating_vet?: string | null
          treatment_date?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_sheets_patient_id_clinic_id_fkey"
            columns: ["patient_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_patient_with_sheet: {
        Args: { p_clinic_id: string; p_patient: Json; p_sheet: Json }
        Returns: Json
      }
      immutable_unaccent: { Args: { value: string }; Returns: string }
      is_clinic_member: { Args: { p_clinic_id: string }; Returns: boolean }
      save_sheet: {
        Args: {
          p_expected_version: number
          p_patient: Json
          p_sheet: Json
          p_sheet_id: string
        }
        Returns: Json
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
