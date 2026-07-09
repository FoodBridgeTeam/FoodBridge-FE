export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "giver" | "receiver" | "both";
export type Species = "dog" | "cat" | "other";
export type TargetSpecies = "dog" | "cat" | "both" | "other" | "unknown";
export type ItemCategory =
  | "dry_food"
  | "wet_food"
  | "treat"
  | "prescription"
  | "supply"
  | "unknown";
export type ItemStatus = "available" | "reserved" | "completed";
export type Compatibility =
  | "suitable"
  | "conditional"
  | "unsuitable"
  | "not_applicable";
export type MatchStatus = "pending" | "accepted" | "completed" | "cancelled";

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          created_at: string;
          id: string;
          latitude: number | null;
          longitude: number | null;
          name: string;
          role: UserRole;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
          role?: UserRole;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          role?: UserRole;
          updated_at?: string;
        };
        Relationships: [];
      };
      pets: {
        Row: {
          age: number | null;
          allergies: string[];
          breed: string | null;
          condition_note: string | null;
          created_at: string;
          id: string;
          is_prescription_diet: boolean;
          name: string;
          owner_id: string | null;
          species: Species;
          updated_at: string;
          weight: number | null;
        };
        Insert: {
          age?: number | null;
          allergies?: string[];
          breed?: string | null;
          condition_note?: string | null;
          created_at?: string;
          id?: string;
          is_prescription_diet?: boolean;
          name: string;
          owner_id?: string | null;
          species: Species;
          updated_at?: string;
          weight?: number | null;
        };
        Update: {
          age?: number | null;
          allergies?: string[];
          breed?: string | null;
          condition_note?: string | null;
          created_at?: string;
          id?: string;
          is_prescription_diet?: boolean;
          name?: string;
          owner_id?: string | null;
          species?: Species;
          updated_at?: string;
          weight?: number | null;
        };
        Relationships: [];
      };
      items: {
        Row: {
          ai_analysis: Json;
          brand: string | null;
          category: ItemCategory;
          created_at: string;
          expiry_date: string | null;
          id: string;
          image_url: string | null;
          ingredient_image_url: string | null;
          ingredients: string[];
          latitude: number | null;
          life_stage: string | null;
          longitude: number | null;
          name: string;
          opened: boolean | null;
          opened_at: string | null;
          remaining_amount: string | null;
          status: ItemStatus;
          storage_note: string | null;
          supplier_id: string | null;
          target_species: TargetSpecies;
          updated_at: string;
        };
        Insert: {
          ai_analysis?: Json;
          brand?: string | null;
          category?: ItemCategory;
          created_at?: string;
          expiry_date?: string | null;
          id?: string;
          image_url?: string | null;
          ingredient_image_url?: string | null;
          ingredients?: string[];
          latitude?: number | null;
          life_stage?: string | null;
          longitude?: number | null;
          name: string;
          opened?: boolean | null;
          opened_at?: string | null;
          remaining_amount?: string | null;
          status?: ItemStatus;
          storage_note?: string | null;
          supplier_id?: string | null;
          target_species?: TargetSpecies;
          updated_at?: string;
        };
        Update: {
          ai_analysis?: Json;
          brand?: string | null;
          category?: ItemCategory;
          created_at?: string;
          expiry_date?: string | null;
          id?: string;
          image_url?: string | null;
          ingredient_image_url?: string | null;
          ingredients?: string[];
          latitude?: number | null;
          life_stage?: string | null;
          longitude?: number | null;
          name?: string;
          opened?: boolean | null;
          opened_at?: string | null;
          remaining_amount?: string | null;
          status?: ItemStatus;
          storage_note?: string | null;
          supplier_id?: string | null;
          target_species?: TargetSpecies;
          updated_at?: string;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          compatibility: Compatibility;
          compatibility_reason: string | null;
          compatibility_score: number;
          created_at: string;
          distance_km: number | null;
          id: string;
          item_id: string;
          match_score: number;
          pet_id: string | null;
          receiver_id: string | null;
          status: MatchStatus;
          updated_at: string;
          urgency_score: number | null;
        };
        Insert: {
          compatibility?: Compatibility;
          compatibility_reason?: string | null;
          compatibility_score?: number;
          created_at?: string;
          distance_km?: number | null;
          id?: string;
          item_id: string;
          match_score?: number;
          pet_id?: string | null;
          receiver_id?: string | null;
          status?: MatchStatus;
          updated_at?: string;
          urgency_score?: number | null;
        };
        Update: {
          compatibility?: Compatibility;
          compatibility_reason?: string | null;
          compatibility_score?: number;
          created_at?: string;
          distance_km?: number | null;
          id?: string;
          item_id?: string;
          match_score?: number;
          pet_id?: string | null;
          receiver_id?: string | null;
          status?: MatchStatus;
          updated_at?: string;
          urgency_score?: number | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<
  TableName extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][TableName]["Row"];

export type TablesInsert<
  TableName extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][TableName]["Insert"];

export type TablesUpdate<
  TableName extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][TableName]["Update"];
