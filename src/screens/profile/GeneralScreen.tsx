import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { MaterialIcons as Icon } from "@expo/vector-icons";

export default function GeneralScreen() {
    const { colors, isDark } = useTheme();

    const SettingItem = ({ icon, title, onPress }: any) => (
        <TouchableOpacity
            style={[
                styles.settingItem,
                { backgroundColor: colors.card, borderBottomColor: colors.border }
            ]}
            onPress={onPress}
        >
            <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: isDark ? "#333" : "#f0f0f0" }]}>
                    <Icon name={icon} size={22} color={colors.text} />
                </View>
                <Text style={[styles.settingText, { color: colors.text }]}>{title}</Text>
            </View>
            <View style={styles.settingRight}>
                <Icon name="chevron-right" size={24} color={colors.textSecondary} />
            </View>
        </TouchableOpacity>
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>UYGULAMA</Text>
                <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
                    <SettingItem
                        icon="settings"
                        title="Uygulama Ayarları"
                        onPress={() => Alert.alert("Bilgi", "Bu özellik yakında eklenecek.")}
                    />
                </View>
            </View>

            <View style={styles.versionContainer}>
                <Text style={[styles.versionText, { color: colors.textSecondary }]}>Sürüm 1.0.0</Text>
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
    settingItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    settingLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    settingRight: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    settingText: {
        fontSize: 16,
        fontWeight: "500",
    },
    versionContainer: {
        alignItems: "center",
        padding: 20,
        marginBottom: 20,
    },
    versionText: {
        fontSize: 12,
    },
});
