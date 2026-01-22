import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    isDark: boolean;
    colors: {
        background: string;
        text: string;
        card: string;
        border: string;
        primary: string;
        textSecondary: string;
    };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemScheme = useColorScheme();
    const [theme, setTheme] = useState<Theme>(systemScheme === "dark" ? "dark" : "light");

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem("theme");
            if (savedTheme) {
                setTheme(savedTheme as Theme);
            } else if (systemScheme) {
                setTheme(systemScheme === "dark" ? "dark" : "light");
            }
        } catch (error) {
            console.error("Error loading theme:", error);
        }
    };

    const toggleTheme = async () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        try {
            await AsyncStorage.setItem("theme", newTheme);
        } catch (error) {
            console.error("Error saving theme:", error);
        }
    };

    const isDark = theme === "dark";

    const colors = {
        background: isDark ? "#121212" : "#f5f5f5",
        text: isDark ? "#ffffff" : "#333333",
        textSecondary: isDark ? "#aaaaaa" : "#666666",
        card: isDark ? "#1e1e1e" : "#ffffff",
        border: isDark ? "#333333" : "#dddddd",
        primary: "#007AFF",
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isDark, colors }}>
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
