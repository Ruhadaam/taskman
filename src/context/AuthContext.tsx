import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, TABLES } from "../config/lib";
import { User } from "../types";
import { registerForPushNotificationsAsync } from "../services/notificationService";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User | null>;
  signUp: (email: string, password: string) => Promise<User | null>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let sessionChecked = false;

    // AsyncStorage'dan kullanıcı bilgisini yükle
    const loadStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser && isMounted) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Kullanıcı bilgisi yüklenirken hata:", error);
      }
    };

    loadStoredUser();

    // Mevcut oturumu kontrol et
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session kontrol hatası:", error);
          if (isMounted) {
            setLoading(false);
            sessionChecked = true;
          }
          return;
        }

        if (session?.user && isMounted) {
          await transformSupabaseUser(session.user);
        }
        
        if (isMounted) {
          setLoading(false);
          sessionChecked = true;
        }
      } catch (error) {
        console.error("Session kontrol hatası:", error);
        if (isMounted) {
          setLoading(false);
          sessionChecked = true;
        }
      }
    };

    checkSession();

    // Auth state değişikliklerini dinle
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // İlk yükleme sırasında getSession zaten çalıştıysa, sadece değişiklikleri dinle
      if (!sessionChecked) return;

      try {
        if (session?.user && isMounted) {
          await transformSupabaseUser(session.user);
        } else if (isMounted) {
          setUser(null);
          await AsyncStorage.removeItem("user");
        }
      } catch (error) {
        console.error("Auth state change hatası:", error);
      }
    });

    // Timeout: 5 saniye sonra loading'i false yap (fallback)
    const timeout = setTimeout(() => {
      if (isMounted && !sessionChecked) {
        console.warn("Auth yükleme timeout - loading false yapılıyor");
        setLoading(false);
        sessionChecked = true;
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const transformSupabaseUser = async (
    supabaseUser: any
  ): Promise<User | null> => {
    try {
      if (!supabaseUser?.id) {
        console.error("Geçersiz kullanıcı bilgisi");
        setUser(null);
        await AsyncStorage.removeItem("user");
        return null;
      }

      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .select("*")
        .eq("id", supabaseUser.id)
        .single();

      if (error) {
        console.error("Profil getirme hatası:", error);
        setUser(null);
        await AsyncStorage.removeItem("user");
        return null;
      }

      if (data) {
        const normalizedUser = {
          ...data,
          // Uygulamada beklenen alanlar yoksa varsayılanlara düş
          isAdmin: (data as any).isAdmin ?? false,
          unseen: (data as any).unseen ?? [],
          seen: (data as any).seen ?? [],
        };
        setUser(normalizedUser);
        try {
          await AsyncStorage.setItem("user", JSON.stringify(normalizedUser));
        } catch (storageError) {
          console.error("AsyncStorage kayıt hatası:", storageError);
          // Storage hatası kritik değil, devam et
        }
        return normalizedUser as User;
      }
      
      return null;
    } catch (error) {
      console.error("Kullanıcı dönüştürme hatası:", error);
      setUser(null);
      try {
        await AsyncStorage.removeItem("user");
      } catch (storageError) {
        console.error("AsyncStorage silme hatası:", storageError);
      }
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

  const signUp = async (
    email: string,
    password: string
  ): Promise<User | null> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) return null;

      const generatedName = email.split("@")[0];

      // Create profile for new user
      const { data: profile, error: profileError } = await supabase
        .from(TABLES.PROFILES)
        .insert({
          id: data.user.id,
          email: email,
          name: generatedName,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Transform and set user
      if (profile) {
        setUser(profile);
        await AsyncStorage.setItem("user", JSON.stringify(profile));

        // Register for notifications
        await registerForPushNotificationsAsync(profile.id);
      }

      return profile;
    } catch (error) {
      console.error("Kayıt hatası:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, setUser }}>
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
