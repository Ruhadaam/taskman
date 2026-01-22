import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, ScrollView, Image } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons as Icon } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { toggleTheme, isDark, colors } = useTheme();
  const navigation = useNavigation<any>();

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const SettingItem = ({ icon, title, onPress, value, type = "link", danger = false }: any) => (
    <TouchableOpacity
      style={[
        styles.settingItem,
        { backgroundColor: colors.card, borderBottomColor: colors.border }
      ]}
      onPress={onPress}
      disabled={type === "switch"}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: danger ? "rgba(255, 59, 48, 0.1)" : isDark ? "#333" : "#f0f0f0" }]}>
          <Icon name={icon} size={22} color={danger ? "#FF3B30" : colors.text} />
        </View>
        <Text style={[styles.settingText, { color: danger ? "#FF3B30" : colors.text }]}>{title}</Text>
      </View>

      {type === "switch" && (
        <Switch
          value={value}
          onValueChange={onPress}
          trackColor={{ false: "#767577", true: "#34C759" }}
          thumbColor={isDark ? "#fff" : "#f4f3f4"}
        />
      )}

      {type === "link" && (
        <Icon name="chevron-right" size={24} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { borderColor: colors.border }]}>
            <Text style={styles.avatarText}>
              {user?.name ? getInitials(user.name) : "?"}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.name || "Kullanıcı"}</Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email || ""}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>HESAP AYARLARI</Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
          <SettingItem
            icon="settings"
            title="Genel Ayarlar"
            onPress={() => Alert.alert("Bilgi", "Bu özellik yakında eklenecek.")}
          />
          <SettingItem
            icon="logout"
            title="Çıkış Yap"
            onPress={handleSignOut}
            danger={true}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>TEMA AYARLARI</Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
          <SettingItem
            icon={isDark ? "dark-mode" : "light-mode"}
            title={isDark ? "Koyu Tema" : "Açık Tema"}
            type="switch"
            value={isDark}
            onPress={toggleTheme}
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
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  userInfo: {
    marginLeft: 15,
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
  },
  userEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
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
  },
  versionText: {
    fontSize: 12,
  }
});
