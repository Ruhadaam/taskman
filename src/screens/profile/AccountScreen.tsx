import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { MaterialIcons as Icon } from "@expo/vector-icons";

export default function AccountScreen() {
    const { user, signOut } = useAuth();
    const { colors } = useTheme();

    const handleSignOut = async () => {
        Alert.alert(
            "Çıkış Yap",
            "Çıkış yapmak istediğinize emin misiniz?",
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Çıkış Yap",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await signOut();
                        } catch (error) {
                            console.error("Çıkış yapılırken hata oluştu:", error);
                            Alert.alert("Hata", "Çıkış yapılırken bir hata oluştu");
                        }
                    },
                },
            ]
        );
    };

    const SettingItem = ({ icon, title, onPress, danger = false }: any) => (
        <TouchableOpacity
            style={[
                styles.settingItem,
                { backgroundColor: colors.card, borderBottomColor: colors.border }
            ]}
            onPress={onPress}
        >
            <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: danger ? "rgba(255, 59, 48, 0.1)" : colors.background }]}>
                    <Icon name={icon} size={22} color={danger ? "#FF3B30" : colors.text} />
                </View>
                <Text style={[styles.settingText, { color: danger ? "#FF3B30" : colors.text }]}>{title}</Text>
            </View>
            <View style={styles.settingRight}>
                <Icon name="chevron-right" size={24} color={colors.textSecondary} />
            </View>
        </TouchableOpacity>
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.section}>
                <View style={styles.userInfoContainer}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>E-POSTA</Text>
                    <Text style={[styles.value, { color: colors.text }]}>{user?.email}</Text>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>HESAP İŞLEMLERİ</Text>
                <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
                    <SettingItem
                        icon="logout"
                        title="Çıkış Yap"
                        onPress={handleSignOut}
                        danger={true}
                    />
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
    userInfoContainer: {
        padding: 20,
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 5,
    },
    value: {
        fontSize: 16,
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
});
