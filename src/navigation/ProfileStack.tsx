import React from "react";
import { createStackNavigator, CardStyleInterpolators } from "@react-navigation/stack";
import ProfileScreen from "../screens/ProfileScreen";
import AccountScreen from "../screens/profile/AccountScreen";
import GeneralScreen from "../screens/profile/GeneralScreen";
import ThemeScreen from "../screens/profile/ThemeScreen";
import { useTheme } from "../context/ThemeContext";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

const Stack = createStackNavigator();

export default function ProfileStack() {
    const { colors } = useTheme();

    return (
        <Stack.Navigator
            screenOptions={({ navigation }) => ({
                headerStyle: {
                    backgroundColor: colors.card,
                    borderBottomColor: colors.border,
                    borderBottomWidth: 1,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                headerTintColor: colors.text,
                headerBackTitle: "",
                cardStyle: { backgroundColor: colors.background },
                detachPreviousScreen: false, // Prevents white flash on back
                presentation: "card",
                cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
                headerLeft: ({ canGoBack }) =>
                    canGoBack ? (
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 16 }}>
                            <Icon name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                    ) : null
            })}
        >
            <Stack.Screen
                name="ProfileMain"
                component={ProfileScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Account"
                component={AccountScreen}
                options={{ title: "Hesap" }}
            />
            <Stack.Screen
                name="General"
                component={GeneralScreen}
                options={{ title: "Genel" }}
            />
            <Stack.Screen
                name="Theme"
                component={ThemeScreen}
                options={{ title: "Tema" }}
            />
        </Stack.Navigator>
    );
}
