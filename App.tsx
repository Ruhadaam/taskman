import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { setupNotifications } from "./src/services/notificationService";
import LoginScreen from "./src/screens/LoginScreen";
import AdminDashboard from "./src/screens/AdminDashboard";
import UserDashboard from "./src/screens/UserDashboard";
import UserList from "./src/screens/UserList";
import TaskList from "./src/screens/TaskList";
import UserTaskList from "./src/screens/UserTaskList";
import NotificationsScreen from "./src/screens/NotificationsScreen";

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
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="LoginScreen"
              screenOptions={{
                headerStyle: {
                  backgroundColor: "#fff",
                },
                headerTintColor: "#000",
                headerTitleStyle: {
                  fontWeight: "bold",
                },
              }}
            >
              <Stack.Screen
                name="LoginScreen"
                component={LoginScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="AdminDashboard"
                component={AdminDashboard}
                options={{ title: "Admin Paneli" }}
              />
              <Stack.Screen
                name="UserDashboard"
                component={UserDashboard}
                options={{ title: "Kullanıcı Paneli" }}
              />
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
            </Stack.Navigator>
          </NavigationContainer>
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
