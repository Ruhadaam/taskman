import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import UserDashboard from "../screens/UserDashboard";
import UpcomingTasksScreen from "../screens/UpcomingTasksScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function UserTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#007AFF",
                tabBarInactiveTintColor: "gray",
                tabBarStyle: {
                    paddingBottom: 5,
                    height: 60,
                },
            }}
        >
            <Tab.Screen
                name="Duties"
                component={UserDashboard}
                options={{
                    tabBarLabel: "Görevler",
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
                name="Profile"
                component={ProfileScreen}
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
