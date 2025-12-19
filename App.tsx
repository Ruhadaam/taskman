import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { TaskProvider } from "./src/context/TaskContext";
import { setupNotifications } from "./src/services/notificationService";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import AdminDashboard from "./src/screens/AdminDashboard";
import UserDashboard from "./src/screens/UserDashboard";
import UserList from "./src/screens/UserList";
import TaskList from "./src/screens/TaskList";
import UserTaskList from "./src/screens/UserTaskList";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import UserTabNavigator from "./src/navigation/UserTabNavigator";

const Stack = createStackNavigator();

const App = () => {
  useEffect(() => {
    // Global error handler (React Native'de ErrorUtils global olarak mevcuttur)
    const errorHandler = (error: Error, isFatal?: boolean) => {
      console.error("Global error:", error, "isFatal:", isFatal);
      // Fatal hatalar için log tut, ama uygulama çökmesin
      if (isFatal) {
        console.error("Fatal error yakalandı");
      }
    };

    // React Native error handler
    try {
      const ErrorUtils = (global as any).ErrorUtils;
      if (ErrorUtils && typeof ErrorUtils.getGlobalHandler === 'function') {
        const originalHandler = ErrorUtils.getGlobalHandler();
        ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
          errorHandler(error, isFatal);
          if (originalHandler) {
            originalHandler(error, isFatal);
          }
        });
      }
    } catch (e) {
      console.error("Error handler setup hatası:", e);
    }

    // Notification setup hatası uygulamayı durdurmamalı
    setupNotifications().catch((error) => {
      console.error("Notification setup hatası:", error);
      // Hata olsa bile uygulama devam etsin
    });
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="dark" />
        <AuthProvider>
          <TaskProvider>
            <RootNavigator />
          </TaskProvider>
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
};

const RootNavigator = () => {
  const { user, loading } = useAuth();
  const [navigationError, setNavigationError] = useState<string | null>(null);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (navigationError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Bir hata oluştu</Text>
        <Text style={styles.errorSubtext}>{navigationError}</Text>
        <Text style={styles.errorSubtext}>Lütfen uygulamayı yeniden başlatın</Text>
      </View>
    );
  }

  return (
    <NavigationContainer
      onReady={() => {
        setNavigationError(null);
      }}
      onStateChange={() => {
        setNavigationError(null);
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerTintColor: "#000",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerShown: false,
        }}
      >
        {!user ? (
          <>
            <Stack.Screen
              name="LoginScreen"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="RegisterScreen"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            {user.isAdmin ? (
              <Stack.Screen
                name="AdminDashboard"
                component={AdminDashboard}
                options={{ title: "Admin Paneli" }}
              />
            ) : (
              <Stack.Screen
                name="UserDashboard"
                component={UserTabNavigator}
                options={{ title: "Kullanıcı Paneli" }}
              />
            )}
            <Stack.Screen
              name="UserList"
              component={UserList}
              options={{ title: "Kullanıcı Listesi" }}
            />
            <Stack.Screen
              name="TaskList"
              component={TaskList}
              options={{ title: "Görev Listesi" }}
            />
            <Stack.Screen
              name="UserTaskList"
              component={UserTaskList}
              options={{ title: "Kullanıcı Görev Listesi" }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ title: "Bildirimler" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF3B30",
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
  },
});
