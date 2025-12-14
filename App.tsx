import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
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
    setupNotifications();
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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        {/* Simple loading indicator or splash screen */}
      </View>
    );
  }

  return (
    <NavigationContainer>
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
});
