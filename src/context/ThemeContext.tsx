import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";

export type ThemePreference = "light" | "dark" | "system";

interface ThemeContextType {
    themePreference: ThemePreference;
    setThemePreference: (pref: ThemePreference) => void;
    isDark: boolean;
    colors: {
        background: string;
        text: string;
        card: string;
        border: string;
        primary: string;
        textSecondary: string;
        inputBackground: string;
        danger: string;
        success: string;
    };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemScheme = useColorScheme();
    const [themePreference, setPreference] = useState<ThemePreference>("system");

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem("themePreference");
            if (savedTheme) {
                setPreference(savedTheme as ThemePreference);
            }
        } catch (error) {
            console.error("Error loading theme preference:", error);
        }
    };

    const setThemePreference = async (pref: ThemePreference) => {
        setPreference(pref);
        try {
            await AsyncStorage.setItem("themePreference", pref);
        } catch (error) {
            console.error("Error saving theme preference:", error);
        }
    };

    const isDark =
        themePreference === "system"
            ? systemScheme === "dark"
            : themePreference === "dark";

    const colors = {
        background: isDark ? "#121212" : "#f5f5f5",
        text: isDark ? "#ffffff" : "#333333",
        textSecondary: isDark ? "#aaaaaa" : "#666666",
        card: isDark ? "#1e1e1e" : "#ffffff",
        border: isDark ? "#333333" : "#dddddd",
        inputBackground: isDark ? "#2c2c2c" : "#ffffff",
        primary: "#007AFF",
        danger: "#FF3B30",
        success: "#34C759",
    };

    return (
        <ThemeContext.Provider value={{ themePreference, setThemePreference, isDark, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
