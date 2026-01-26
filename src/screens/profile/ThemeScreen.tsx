import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useTheme, ThemePreference } from "../../context/ThemeContext";
import { MaterialIcons as Icon } from "@expo/vector-icons";

export default function ThemeScreen() {
    const { setThemePreference, themePreference, colors, isDark } = useTheme();

    const getThemeText = (pref: ThemePreference) => {
        switch (pref) {
            case "dark": return "Koyu";
            case "light": return "Açık";
            case "system": return "Sistem";
            default: return "";
        }
    };

    const ThemeOption = ({ mode }: { mode: ThemePreference }) => (
        <TouchableOpacity
            style={[
                styles.themeOption,
                {
                    backgroundColor: colors.card,
                    borderBottomColor: colors.border
                }
            ]}
            onPress={() => setThemePreference(mode)}
        >
            <Text style={[
                styles.themeOptionText,
                { color: colors.text },
                themePreference === mode && { color: colors.primary, fontWeight: "bold" }
            ]}>
                {getThemeText(mode)}
            </Text>
            {themePreference === mode && (
                <Icon name="check" size={20} color={colors.primary} />
            )}
        </TouchableOpacity>
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>TEMA SEÇİMİ</Text>
                <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
                    {(["light", "dark", "system"] as ThemePreference[]).map((mode) => (
                        <ThemeOption key={mode} mode={mode} />
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    section: {
        marginTop: 20,
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 8,
        paddingHorizontal: 20,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    sectionContent: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    themeOption: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    themeOptionText: {
        fontSize: 16,
    }
});
