import React, { useEffect, useState } from "react";
import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, ActivityIndicator, Text, AppState } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { TaskProvider } from "./src/context/TaskContext";
import { supabase } from "./src/config/lib";
import * as Linking from 'expo-linking';
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";

// Ekranlar
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import ResetPasswordScreen from "./src/screens/ResetPasswordScreen";
import UserTabNavigator from "./src/navigation/UserTabNavigator";

type RootStackParamList = {
  LoginScreen: undefined;
  RegisterScreen: undefined;
  ResetPasswordScreen: undefined;
  UserTabNavigator: undefined;
  UserDashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppContent = () => {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <AuthProvider>
        <TaskProvider>
          <RootNavigator />
        </TaskProvider>
      </AuthProvider>
    </View>
  );
};

const App = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

const RootNavigator = () => {
  const { user, loading, signOut } = useAuth();
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  // Deep link üzerinden gelen PASSWORD_RECOVERY event'ini dinle
  useEffect(() => {
    const handleDeepLink = async (url: string | null) => {
      console.log("handleDeepLink - Başladı:", url);
      if (!url) return;

      const isRecoveryFlow = url.includes('forget-password') || url.includes('reset-password');

      if (isRecoveryFlow) {
        console.log("handleDeepLink - Recovery akışı tespit edildi.");
        setIsPasswordRecovery(true); // Hemen set et ki user dashboard'a gitmesin

        // Token parse etme işlemleri
        const urlObj = Linking.parse(url);
        const params = urlObj.queryParams || {};

        let accessToken = params.access_token as string;
        let refreshToken = params.refresh_token as string;

        if (url.includes('#')) {
          const hash = url.split('#')[1];
          const hashParams = Object.fromEntries(new URLSearchParams(hash));
          accessToken = accessToken || hashParams.access_token;
          refreshToken = refreshToken || hashParams.refresh_token;
        }

        if (accessToken) {
          console.log("handleDeepLink - Token bulundu, session kuruluyor...");
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || accessToken,
            });

            if (error) {
              console.error("handleDeepLink - Session hatası:", error.message);
            } else {
              console.log("handleDeepLink - Session başarıyla kuruldu, kullanıcı:", data.user?.id);
            }
          } catch (e) {
            console.error("handleDeepLink - Kritik hata:", e);
          }
        } else {
          console.warn("handleDeepLink - Token bulunamadı.");
        }
      }
    };

    // Uygulama açıkken gelen deep link'leri dinle
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Uygulama kapalıyken gelen deep link'i kontrol et
    Linking.getInitialURL().then(handleDeepLink);

    // Supabase auth state değişikliklerini dinle
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("onAuthStateChange (App) - Event:", event, "User:", session?.user?.id);
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
        }
        if (event === 'SIGNED_OUT') {
          setIsPasswordRecovery(false);
        }
      }
    );

    return () => {
      subscription.remove();
      authSubscription.unsubscribe();
    };
  }, []);

  const linking = {
    prefixes: ['vzbel://'],
    config: {
      screens: {
        LoginScreen: 'login',
        ResetPasswordScreen: 'forget-password',
      },
    },
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isPasswordRecovery ? (
          <Stack.Screen name="ResetPasswordScreen">
            {(props: any) => (
              <ResetPasswordScreen
                {...props}
                onComplete={() => setIsPasswordRecovery(false)}
              />
            )}
          </Stack.Screen>
        ) : !user ? (
          <Stack.Group>
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
            <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
            <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} />
          </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="UserDashboard" component={UserTabNavigator} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});

export default App;