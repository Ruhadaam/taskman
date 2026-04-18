import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import UserDashboard from "../screens/UserDashboard";
import UpcomingTasksScreen from "../screens/UpcomingTasksScreen";
import OverdueTasksScreen from "../screens/OverdueTasksScreen";
import ProfileStack from "./ProfileStack";
import { useTasks } from "../context/TaskContext";
import { useTheme } from "../context/ThemeContext";

const Tab = createBottomTabNavigator();

export default function UserTabNavigator() {
  const { tasks, getTurkeyDateKey } = useTasks();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const getOverdueCount = () => {
    const todayKey = getTurkeyDateKey(new Date());

    return tasks.filter((task) => {
      if (!task.createdAt || task.isArchived) return false;
      return (
        task.status === "waiting" &&
        getTurkeyDateKey(new Date(task.createdAt)) < todayKey
      );
    }).length;
  };

  const overdueCount = getOverdueCount();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          // Tab bar'ı ekranın altına sabitle, içerik altında kalmasın.
          paddingBottom: insets.bottom,
          height: 65 + insets.bottom,
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          position: "relative",
        },
        tabBarLabelStyle: {
          fontSize: 10,
          marginBottom: 3,
        },
      }}
    >
      <Tab.Screen
        name="Duties"
        component={UserDashboard}
        options={{
          tabBarLabel: "Bugün",
          tabBarIcon: ({ color, size }) => (
            <Icon name="check-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Upcoming"
        component={UpcomingTasksScreen}
        options={{
          tabBarLabel: "Yaklaşan",
          tabBarIcon: ({ color, size }) => (
            <Icon name="event" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Overdue"
        component={OverdueTasksScreen}
        options={{
          tabBarLabel: ({ color }) => (
            <Text
              style={{
                color,
                fontSize: 10,
                textAlign: "center",
                marginBottom: 3,
              }}
            >
              {overdueCount > 0 ? `Kalanlar\n(${overdueCount})` : "Kalanlar"}
            </Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <Icon name="history" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Icon name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
