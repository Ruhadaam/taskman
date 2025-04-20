import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, TABLES } from "../config/lib";
import { User } from "../types";
import { registerForPushNotificationsAsync } from "../services/notificationService";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User | null>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // AsyncStorage'dan kullanıcı bilgisini yükle
    const loadStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Kullanıcı bilgisi yüklenirken hata:", error);
      }
    };

    loadStoredUser();

    // Mevcut oturumu kontrol et
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        transformSupabaseUser(session.user);
      }
      setLoading(false);
    });

    // Auth state değişikliklerini dinle
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await transformSupabaseUser(session.user);
      } else {
        setUser(null);
        await AsyncStorage.removeItem("user");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const transformSupabaseUser = async (
    supabaseUser: any
  ): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .select("*")
        .eq("email", supabaseUser.email)
        .single();

      if (data) {
        setUser(data);
        await AsyncStorage.setItem("user", JSON.stringify(data));
      }
      return data;
    } catch (error) {
      console.error("Kullanıcı dönüştürme hatası:", error);
      setUser(null);
      await AsyncStorage.removeItem("user");
      return null;
    }
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<User | null> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) return null;

      const transformedUser = await transformSupabaseUser(data.user);
      setUser(transformedUser);

      // Push bildirim token'ını kaydet
      if (transformedUser) {
        await registerForPushNotificationsAsync(transformedUser.id);
      }

      return transformedUser;
    } catch (error) {
      console.error("Giriş hatası:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      await AsyncStorage.removeItem("user");
    } catch (error) {
      console.error("Çıkış hatası:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
