// Minimal hand-written types so the app type-checks before you generate the real ones.
// Regenerate after running the migration:
//   npx supabase gen types typescript --project-id <id> > src/types/database.types.ts

export type RouteType = "yol" | "mtb" | "moto" | "kamp";
export type Difficulty = "kolay" | "orta" | "zor" | "uzman";
export type RsvpStatus = "gidiyor" | "belki" | "gitmiyor";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          city: string | null;
          created_at: string;
        };
        Insert: { id: string; username: string; full_name?: string | null };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      routes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          route_type: RouteType;
          difficulty: Difficulty;
          province: string;
          distance_m: number;
          elevation_gain_m: number;
          duration_min: number;
          path: unknown; // GeoJSON LineString
          start_point: unknown;
          gpx_url: string | null;
          thumbnail_url: string | null;
          likes_count: number;
          saves_count: number;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["routes"]["Row"],
          "id" | "start_point" | "likes_count" | "saves_count" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["routes"]["Insert"]>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          host_id: string;
          route_id: string | null;
          title: string;
          description: string | null;
          event_type: RouteType;
          province: string;
          location: string;
          meet_point: unknown;
          starts_at: string;
          capacity: number | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["events"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      weekly_leaderboard: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          route_count: number;
          total_distance_m: number;
        };
      };
    };
    Functions: {
      routes_nearby: {
        Args: { lat: number; lng: number; radius_m?: number };
        Returns: Database["public"]["Tables"]["routes"]["Row"][];
      };
    };
    Enums: {
      route_type: RouteType;
      difficulty: Difficulty;
      rsvp_status: RsvpStatus;
    };
  };
}
