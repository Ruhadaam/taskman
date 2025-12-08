import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://djpsyonybshwtupenops.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqcHN5b255YnNod3R1cGVub3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMzUwNTMsImV4cCI6MjA3MDkxMTA1M30.C7Eb2vfEkUx6bW6TawBXxzSeO5ixV2KnAEI13iIRVes";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  db: {
    schema: "public",
  },
});

// Tablo isimleri için sabitler
export const TABLES = {
  PROFILES: "profiles",
  TASKS: "tasks",
  NOTIFICATIONS: "notifications",
} as const;

// Tablo şemaları için tipler
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          uid: string;
          name: string;
          email: string;
          isAdmin: boolean;
          createdAt: string;
          unseen: string[];
          seen: string[];
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email: string;
          isAdmin?: boolean;
          createdAt?: string;
          unseen?: string[];
          seen?: string[];
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          email?: string;
          isAdmin?: boolean;
          createdAt?: string;
          unseen?: string[];
          seen?: string[];
        };
      };
    };
  };
};
