import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import UserDashboard from "../screens/UserDashboard";
import UpcomingTasksScreen from "../screens/UpcomingTasksScreen";
import OverdueTasksScreen from "../screens/OverdueTasksScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { useTasks } from "../context/TaskContext";

const Tab = createBottomTabNavigator();

export default function UserTabNavigator() {
    const { tasks, getTurkeyDayRange } = useTasks();

    const getOverdueCount = () => {
        const range = getTurkeyDayRange();
        const todayStart = new Date(range.start);

        return tasks.filter(task => {
            const taskDate = task.createdAt ? new Date(task.createdAt) : new Date();
            return task.status === 'waiting' && taskDate < todayStart;
        }).length;
    };

    const overdueCount = getOverdueCount();

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
                name="Overdue"
                component={OverdueTasksScreen}
                options={{
                    tabBarLabel: "Kalanlar",
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="history" size={size} color={color} />
                    ),
                    tabBarBadge: overdueCount > 0 ? overdueCount : undefined,
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
