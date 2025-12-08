import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { supabase, TABLES } from "../config/lib";
import { Notification } from "../types";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons as Icon } from "@expo/vector-icons";

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user, setUser } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    loadNotifications();
  }, [user]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={clearNotifications}
          style={{ marginRight: 16 }}
        >
          <Icon name="delete" size={24} color="#007AFF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, user]);

  const loadNotifications = async () => {
    if (!user) return setNotifications([]);

    const allNotificationIds = [...(user.unseen || []), ...(user.seen || [])];

    if (allNotificationIds.length === 0) {
      return setNotifications([]);
    }

    try {
      const { data: notificationList, error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .select("*")
        .in("id", allNotificationIds);

      if (error) throw error;

      const sortedNotifications =
        notificationList
          ?.map((notification) => ({
            ...notification,
            createdAt: new Date(notification.createdAt),
          }))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) || [];

      setNotifications(sortedNotifications);
    } catch (error) {
      console.error("Bildirimler yüklenirken hata:", error);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!user) return;
    if (!user.unseen.includes(notification.id.toString())) return;

    const update = {
      unseen: user.unseen.filter((id) => id !== notification.id.toString()),
      seen: [...user.seen, notification.id.toString()],
    };

    try {
      // Supabase'de güncelle
      const { error: updateError } = await supabase
        .from(TABLES.PROFILES)
        .update(update)
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Local olarak da güncelle
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id.toString() ? { ...n } : n))
      );

      // User state'ini güncelle
      const updatedUser = {
        ...user,
        ...update,
      };
      setUser(updatedUser);
    } catch (error) {
      console.error("Bildirim güncellenirken hata:", error);
    }
  };

  const clearNotifications = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from(TABLES.PROFILES)
        .update({
          unseen: [],
          seen: [],
        })
        .eq("id", user.id);

      if (error) throw error;

      setNotifications([]);
      const updatedUser = {
        ...user,
        unseen: [],
        seen: [],
      };
      setUser(updatedUser);
    } catch (error) {
      console.error("Bildirimler temizlenirken hata:", error);
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const isUnseen = user?.unseen.includes(item.id.toString());

    return (
      <TouchableOpacity
        style={[styles.notificationItem, isUnseen && styles.unreadNotification]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <Text style={styles.notificationDate}>
            {new Date(item.createdAt).toLocaleDateString("tr-TR")}
          </Text>
        </View>
        {isUnseen && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  listContainer: {
    padding: 16,
  },
  notificationItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  notificationDate: {
    fontSize: 12,
    color: "#999",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007AFF",
    marginLeft: 8,
  },
});

export default NotificationsScreen;
