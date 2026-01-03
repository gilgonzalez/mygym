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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      exercises: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty: string | null
          duration: number | null
          equipment: string[] | null
          id: string
          is_public: boolean | null
          media_id: string | null
          muscle_group: string[] | null
          name: string
          reps: number | null
          rest: number | null
          sets: number | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration?: number | null
          equipment?: string[] | null
          id?: string
          is_public?: boolean | null
          media_id?: string | null
          muscle_group?: string[] | null
          name: string
          reps?: number | null
          rest?: number | null
          sets?: number | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          duration?: number | null
          equipment?: string[] | null
          id?: string
          is_public?: boolean | null
          media_id?: string | null
          muscle_group?: string[] | null
          name?: string
          reps?: number | null
          rest?: number | null
          sets?: number | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          bucket_path: string | null
          created_at: string | null
          filename: string | null
          id: string
          mime_type: string | null
          size_bytes: number | null
          type: string | null
          url: string
          user_id: string
        }
        Insert: {
          bucket_path?: string | null
          created_at?: string | null
          filename?: string | null
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          type?: string | null
          url: string
          user_id: string
        }
        Update: {
          bucket_path?: string | null
          created_at?: string | null
          filename?: string | null
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          type?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      section_exercises: {
        Row: {
          duration: number | null
          exercise_id: string
          id: string
          order_index: number
          reps: number | null
          rest: number | null
          section_id: string
          sets: number | null
          weight_kg: number | null
        }
        Insert: {
          duration?: number | null
          exercise_id: string
          id?: string
          order_index?: number
          reps?: number | null
          rest?: number | null
          section_id: string
          sets?: number | null
          weight_kg?: number | null
        }
        Update: {
          duration?: number | null
          exercise_id?: string
          id?: string
          order_index?: number
          reps?: number | null
          rest?: number | null
          section_id?: string
          sets?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "section_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "section_exercises_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          created_at: string | null
          id: string
          name: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          type?: string | null
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          attributes: Json | null
          created_at: string
          current_xp: number | null
          last_activity_date: string | null
          level: number | null
          next_level_xp: number | null
          rank_title: string | null
          streak_current: number | null
          streak_longest: number | null
          total_minutes: number | null
          total_workouts: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attributes?: Json | null
          created_at?: string
          current_xp?: number | null
          last_activity_date?: string | null
          level?: number | null
          next_level_xp?: number | null
          rank_title?: string | null
          streak_current?: number | null
          streak_longest?: number | null
          total_minutes?: number | null
          total_workouts?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attributes?: Json | null
          created_at?: string
          current_xp?: number | null
          last_activity_date?: string | null
          level?: number | null
          next_level_xp?: number | null
          rank_title?: string | null
          streak_current?: number | null
          streak_longest?: number | null
          total_minutes?: number | null
          total_workouts?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          id: string
          name: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          id: string
          name?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      workout_logs: {
        Row: {
          completed_at: string | null
          duration_seconds: number | null
          id: string
          notes: string | null
          rating: number | null
          started_at: string
          user_id: string | null
          workout_id: string | null
          xp_earned: number | null
        }
        Insert: {
          completed_at?: string | null
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          rating?: number | null
          started_at?: string
          user_id?: string | null
          workout_id?: string | null
          xp_earned?: number | null
        }
        Update: {
          completed_at?: string | null
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          rating?: number | null
          started_at?: string
          user_id?: string | null
          workout_id?: string | null
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sections: {
        Row: {
          created_at: string | null
          id: string
          order_index: number
          section_id: string
          workout_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_index?: number
          section_id: string
          workout_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          order_index?: number
          section_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sections_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sections_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          audio: string[] | null
          cover: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          estimated_time: number | null
          exp_earned: number | null
          id: string
          stats: Json | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          visibility: string | null
        }
        Insert: {
          audio?: string[] | null
          cover?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_time?: number | null
          exp_earned?: number | null
          id?: string
          stats?: Json | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          visibility?: string | null
        }
        Update: {
          audio?: string[] | null
          cover?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_time?: number | null
          exp_earned?: number | null
          id?: string
          stats?: Json | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_workout_session: {
        Args: {
          p_duration_minutes: number
          p_user_id: string
          p_workout_id: string
          p_xp_earned: number
        }
        Returns: Json
      }
      create_complete_workout: {
        Args: { p_user_id: string; p_workout_data: Json }
        Returns: string
      }
      update_complete_workout: {
        Args: { p_user_id: string; p_workout_data: Json; p_workout_id: string }
        Returns: boolean
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
