import type { AnalyticsDailyRow } from "./repository";

export type Json =
  | boolean
  | number
  | string
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SupabaseAnalyticsDailyRow = {
  id: number;
  date: string;
  device: AnalyticsDailyRow["device"];
  category: string;
  product: string;
  traffic_source: string;
  region: string;
  customer_segment: string;
  campaign: string | null;
  revenue: number;
  orders: number;
  units_sold: number;
  customers: number;
  sessions: number;
  ad_spend: number;
  attributed_revenue: number;
  refunds: number;
};

export type SupabaseAnalyticsDailyInsert = Omit<
  SupabaseAnalyticsDailyRow,
  "id"
>;

export type SupabaseDatabase = {
  public: {
    Tables: {
      analytics_daily: {
        Row: SupabaseAnalyticsDailyRow;
        Insert: SupabaseAnalyticsDailyInsert;
        Update: Partial<SupabaseAnalyticsDailyInsert>;
        Relationships: [];
      };
      analytics_dataset_metadata: {
        Row: {
          dataset_key: string;
          version: string;
          min_date: string;
          max_date: string;
          row_count: number;
          updated_at: string;
        };
        Insert: {
          dataset_key: string;
          version: string;
          min_date: string;
          max_date: string;
          row_count: number;
          updated_at?: string;
        };
        Update: {
          version?: string;
          min_date?: string;
          max_date?: string;
          row_count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      analysis_history: {
        Row: {
          id: number;
          analysis_id: string;
          session_id: string;
          request_hash: string;
          context: Json;
          dashboard: Json;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          analysis_id: string;
          session_id: string;
          request_hash: string;
          context: Json;
          dashboard: Json;
          metadata: Json;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      analysis_operation_events: {
        Row: {
          id: number;
          event_type: "completed" | "failed" | "rate_limited";
          request_hash: string;
          data_source: "local" | "supabase";
          provider: "mock" | "gemini" | null;
          cache_hit: boolean;
          fallback_used: boolean;
          partial: boolean;
          duration_ms: number | null;
          error_code: string | null;
          created_at: string;
        };
        Insert: {
          event_type: "completed" | "failed" | "rate_limited";
          request_hash: string;
          data_source: "local" | "supabase";
          provider?: "mock" | "gemini" | null;
          cache_hit?: boolean;
          fallback_used?: boolean;
          partial?: boolean;
          duration_ms?: number | null;
          error_code?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
