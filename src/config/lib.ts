import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ekpmgkfnaddawgbdbalo.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrcG1na2ZuYWRkYXdnYmRiYWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDgwOTc2NCwiZXhwIjoyMDYwMzg1NzY0fQ.nuTSYi7rqKhI_0ENe8atA4yV5DqTsLVCl4Lkf48x0tA";

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
