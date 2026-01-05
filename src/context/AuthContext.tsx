import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase, TABLES } from "../config/lib";
import { User } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User | null>;
  signUp: (email: string, password: string) => Promise<User | null>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  resetPasswordRequest: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
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
        const Linking = require('expo-linking');
        const initialUrl = await Linking.getInitialURL();

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
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("AuthContext - onAuthStateChange Event:", event, "User:", session?.user?.id);

      if (!isMounted) return;

      // Sadece sessionChecked true olduktan sonra otomatik transform yap
      if (sessionChecked && session?.user) {
        console.log("AuthContext - transformSupabaseUser tetikleniyor (detached)...");
        // Deadlock'ı önlemek için tamamen ayırıyoruz
        setTimeout(() => {
          if (isMounted) {
            transformSupabaseUser(session.user).catch(err => {
              console.error("AuthContext - Background transform error:", err);
            });
          }
        }, 0);
      } else if (sessionChecked && !session && isMounted) {
        console.log("AuthContext - Oturum kapandı.");
        setUser(null);
        AsyncStorage.removeItem("user").catch(() => { });
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
    console.log("transformSupabaseUser - Başladı, id:", supabaseUser?.id);
    try {
      if (!supabaseUser?.id) {
        console.error("Geçersiz kullanıcı bilgisi");
        setUser(null);
        await AsyncStorage.removeItem("user");
        return null;
      }

      console.log("transformSupabaseUser - DB sorgusu atılıyor...");
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .select("*")
        .eq("id", supabaseUser.id)
        .single();

      if (error) {
        console.log("transformSupabaseUser - DB hatası alındı:", error.message);

        // PGRST116: no rows found
        if (error.code === 'PGRST116' || error.message?.includes('single JSON object')) {
          console.log("transformSupabaseUser - Profil bulunamadı, geçici obje kuruluyor.");
          const tempUser = { id: supabaseUser.id, email: supabaseUser.email || "" } as any;
          setUser(tempUser);
          return tempUser;
        }

        console.error("transformSupabaseUser - Profil getirme kritik hatası:", error.message);
        return null;
      }

      if (data) {
        console.log("transformSupabaseUser - Profil başarıyla getirildi.");
        const normalizedUser = { ...data };
        setUser(normalizedUser);
        try {
          await AsyncStorage.setItem("user", JSON.stringify(normalizedUser));
        } catch (storageError) {
          console.error("AsyncStorage kayıt hatası:", storageError);
        }
        return normalizedUser as User;
      }

      return null;
    } catch (error) {
      console.error("transformSupabaseUser - Genel hata:", error);
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
      }

      return profile;
    } catch (error) {
      console.error("Kayıt hatası:", error);
      throw error;
    }
  };

  const resetPasswordRequest = async (email: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'vzbel://forget-password',
      });
      if (error) throw error;
    } catch (error) {
      console.error("Şifre sıfırlama hatası:", error);
      throw error;
    }
  };

  const updatePassword = async (newPassword: string): Promise<void> => {
    console.log("updatePassword - Başladı");

    try {
      // Session bekleme döngüsü (Eğer setSession henüz bitmediyse)
      let session = null;
      for (let i = 0; i < 5; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          session = data.session;
          break;
        }
        console.log(`updatePassword - Session bekleniyor... (${i + 1}/5)`);
        await new Promise(r => setTimeout(r, 500));
      }

      if (!session) {
        console.error("updatePassword - Hata: Oturum bulunamadı!");
        throw new Error("Oturum bulunamadı. Lütfen tekrar linke tıklayın.");
      }

      console.log("updatePassword - Supabase updateUser çağrılıyor...");
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("updatePassword - Supabase hatası:", error.message);
        throw error;
      }

      console.log("updatePassword - Başarıyla tamamlandı", data.user?.id);
    } catch (error: any) {
      console.error("updatePassword - Yakalanan Hata:", error.message || error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    setUser,
    resetPasswordRequest,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
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
