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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      comments: {
        Row: {
          body: string
          created_at: string
          id: string
          route_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          route_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          route_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          created_at: string
          event_id: string
          status: Database["public"]["Enums"]["rsvp_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          status?: Database["public"]["Enums"]["rsvp_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          status?: Database["public"]["Enums"]["rsvp_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number | null
          created_at: string
          description: string | null
          event_type: Database["public"]["Enums"]["route_type"]
          host_id: string
          id: string
          location: string
          meet_point: unknown
          province: string
          route_id: string | null
          starts_at: string
          title: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          event_type: Database["public"]["Enums"]["route_type"]
          host_id: string
          id?: string
          location: string
          meet_point?: unknown
          province: string
          route_id?: string | null
          starts_at: string
          title: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          event_type?: Database["public"]["Enums"]["route_type"]
          host_id?: string
          id?: string
          location?: string
          meet_point?: unknown
          province?: string
          route_id?: string | null
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower: string
          following: string
        }
        Insert: {
          created_at?: string | null
          follower: string
          following: string
        }
        Update: {
          created_at?: string | null
          follower?: string
          following?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string | null
          route_id: number
          username: string
        }
        Insert: {
          created_at?: string | null
          route_id: number
          username: string
        }
        Update: {
          created_at?: string | null
          route_id?: number
          username?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string | null
          from_side: string | null
          id: string
          owner: string
          read: boolean | null
          text: string
          time: number | null
          with_user: string
        }
        Insert: {
          created_at?: string | null
          from_side?: string | null
          id: string
          owner: string
          read?: boolean | null
          text: string
          time?: number | null
          with_user: string
        }
        Update: {
          created_at?: string | null
          from_side?: string | null
          id?: string
          owner?: string
          read?: boolean | null
          text?: string
          time?: number | null
          with_user?: string
        }
        Relationships: []
      }
      moderation_actions: {
        Row: {
          action: string
          created_at: string
          created_by: string | null
          id: number
          reason: string
          target_author: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          created_at?: string
          created_by?: string | null
          id?: number
          reason?: string
          target_author?: string | null
          target_id?: string
          target_type: string
        }
        Update: {
          action?: string
          created_at?: string
          created_by?: string | null
          id?: number
          reason?: string
          target_author?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          owner: string
          read: boolean | null
          text: string
          time: number | null
          title: string
        }
        Insert: {
          created_at?: string | null
          id: string
          owner: string
          read?: boolean | null
          text: string
          time?: number | null
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          owner?: string
          read?: boolean | null
          text?: string
          time?: number | null
          title?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          author: string
          comments: Json | null
          created_at: string | null
          id: string
          liked_by: Json | null
          likes: number | null
          loc_sub: string | null
          location: string | null
          photo: string | null
          text: string | null
          time: number | null
        }
        Insert: {
          author: string
          comments?: Json | null
          created_at?: string | null
          id: string
          liked_by?: Json | null
          likes?: number | null
          loc_sub?: string | null
          location?: string | null
          photo?: string | null
          text?: string | null
          time?: number | null
        }
        Update: {
          author?: string
          comments?: Json | null
          created_at?: string | null
          id?: string
          liked_by?: Json | null
          likes?: number | null
          loc_sub?: string | null
          location?: string | null
          photo?: string | null
          text?: string | null
          time?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          username?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string
          id: number
          item_id: string
          item_type: string
          reason: string
          reporter: string | null
          reporter_id: string | null
          status: string
          target_author: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          details?: string
          id?: number
          item_id: string
          item_type: string
          reason?: string
          reporter?: string | null
          reporter_id?: string | null
          status?: string
          target_author?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          details?: string
          id?: number
          item_id?: string
          item_type?: string
          reason?: string
          reporter?: string | null
          reporter_id?: string | null
          status?: string
          target_author?: string | null
          title?: string | null
        }
        Relationships: []
      }
      route_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          route_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          route_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          route_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_comments_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      route_likes: {
        Row: {
          created_at: string
          route_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          route_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          route_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_likes_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      route_saves: {
        Row: {
          created_at: string
          route_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          route_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          route_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_saves_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          created_at: string
          description: string | null
          difficulty: Database["public"]["Enums"]["difficulty"]
          distance_m: number
          duration_min: number
          elevation_gain_m: number
          gpx_url: string | null
          id: string
          likes_count: number
          path: unknown
          province: string
          route_type: Database["public"]["Enums"]["route_type"]
          saves_count: number
          start_point: unknown
          thumbnail_url: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty: Database["public"]["Enums"]["difficulty"]
          distance_m?: number
          duration_min?: number
          elevation_gain_m?: number
          gpx_url?: string | null
          id?: string
          likes_count?: number
          path: unknown
          province: string
          route_type: Database["public"]["Enums"]["route_type"]
          saves_count?: number
          start_point?: unknown
          thumbnail_url?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty"]
          distance_m?: number
          duration_min?: number
          elevation_gain_m?: number
          gpx_url?: string | null
          id?: string
          likes_count?: number
          path?: unknown
          province?: string
          route_type?: Database["public"]["Enums"]["route_type"]
          saves_count?: number
          start_point?: unknown
          thumbnail_url?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "weekly_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_routes: {
        Row: {
          created_at: string | null
          id: number
          route_id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          route_id: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          route_id?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      weekly_leaderboard: {
        Row: {
          avatar_url: string | null
          id: string | null
          route_count: number | null
          total_distance_m: number | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_route: {
        Args: {
          p_coords: Json
          p_description: string
          p_difficulty: string
          p_distance_m: number
          p_duration_min: number
          p_elevation_gain_m: number
          p_gpx_url?: string
          p_province: string
          p_route_type: string
          p_title: string
        }
        Returns: string
      }
      routes_nearby: {
        Args: { lat: number; lng: number; radius_m?: number }
        Returns: {
          created_at: string
          description: string | null
          difficulty: Database["public"]["Enums"]["difficulty"]
          distance_m: number
          duration_min: number
          elevation_gain_m: number
          gpx_url: string | null
          id: string
          likes_count: number
          path: unknown
          province: string
          route_type: Database["public"]["Enums"]["route_type"]
          saves_count: number
          start_point: unknown
          thumbnail_url: string | null
          title: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "routes"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      difficulty: "kolay" | "orta" | "zor" | "uzman"
      route_type: "yol" | "mtb" | "moto" | "kamp"
      rsvp_status: "gidiyor" | "belki" | "gitmiyor"
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
    Enums: {
      difficulty: ["kolay", "orta", "zor", "uzman"],
      route_type: ["yol", "mtb", "moto", "kamp"],
      rsvp_status: ["gidiyor", "belki", "gitmiyor"],
    },
  },
} as const
