import { supabase, TABLES } from "../config/lib";
import * as Notifications from "expo-notifications";
import { Task, User } from "../types";
import { Alert } from "react-native";
import * as Device from "expo-device";

export const setupNotifications = async () => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const { status: newStatus } =
        await Notifications.requestPermissionsAsync();
      if (newStatus !== "granted") {
        console.log("Bildirim izni reddedildi");
        return false;
      }
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    return true;
  } catch (error) {
    console.error("Bildirim ayarları hatası:", error);
    return false;
  }
};

// Yeni görev oluşturulduğunda bildirim gönder
export const sendNewTaskNotification = async (task: Task) => {
  try {
    const hasPermission = await setupNotifications();
    if (!hasPermission) return;

    // Atanan kullanıcı yoksa bildirim gönderme
    if (!task.assignedTo || task.assignedTo.length === 0) {
      console.log("Göreve atanan kullanıcı yok, bildirim gönderilmedi");
      return;
    }

    // Atanan kullanıcıları getir
    const { data: users, error: usersError } = await supabase
      .from(TABLES.PROFILES)
      .select("*")
      .in("id", task.assignedTo);

    if (usersError) throw usersError;

    // Bildirimi oluştur
    const { data: notification, error: notificationError } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .insert([
        {
          title: "Yeni Görev",
          message: `${task.title} görevi size atandı!`,
          type: "task",
          createdAt: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (notificationError) throw notificationError;

    // Her kullanıcının unseen array'ine bildirim ID'sini ekle
    const updatePromises = users?.map(async (user) => {
      const { error: updateError } = await supabase
        .from(TABLES.PROFILES)
        .update({
          unseen: [...(user.unseen || []), notification.id],
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Push bildirimi gönder
      if (user.expoPushToken) {
        await sendExpoPushNotification(
          user.expoPushToken,
          "Yeni Görev",
          `${task.title} görevi size atandı!`
        );
      }
    });

    await Promise.all(updatePromises || []);
  } catch (error) {
    console.error("Yeni görev bildirimi hatası:", error);
  }
};

export const sendAdminNotification = async (title: string, message: string) => {
  try {
    const hasPermission = await setupNotifications();
    if (!hasPermission) {
      Alert.alert("Hata", "Bildirim izni verilmedi");
      return;
    }

    // Önce bildirimi oluştur
    const { data: notification, error: notificationError } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .insert([
        {
          title,
          message,
          type: "system",
          createdAt: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (notificationError) throw notificationError;

    // Tüm kullanıcıları getir
    const { data: users, error: usersError } = await supabase
      .from(TABLES.PROFILES)
      .select("*");

    if (usersError) throw usersError;

    // Her kullanıcının unseen array'ine bildirim ID'sini ekle
    const updatePromises = users?.map(async (user) => {
      const { error: updateError } = await supabase
        .from(TABLES.PROFILES)
        .update({
          unseen: [...(user.unseen || []), notification.id],
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Push bildirimi gönder
      if (user.expoPushToken) {
        await sendExpoPushNotification(user.expoPushToken, title, message);
      }
    });

    await Promise.all(updatePromises || []);
    Alert.alert("Başarılı", "Bildirim tüm kullanıcılara gönderildi");
  } catch (error) {
    console.error("Toplu bildirim hatası:", error);
    Alert.alert("Hata", "Bildirimler gönderilemedi");
  }
};

export const markAsSeen = async (userId: string, notificationId: string) => {
  try {
    const { data: user, error: userError } = await supabase
      .from(TABLES.PROFILES)
      .select("*")
      .eq("id", userId)
      .single();

    if (userError) throw userError;
    if (!user) return;

    if (user.unseen?.includes(notificationId)) {
      const { error: updateError } = await supabase
        .from(TABLES.PROFILES)
        .update({
          unseen: user.unseen.filter((id: string) => id !== notificationId),
          seen: [...(user.seen || []), notificationId],
        })
        .eq("id", userId);

      if (updateError) throw updateError;
    }
  } catch (error) {
    console.error("Bildirim güncellenirken hata oluştu:", error);
    throw error;
  }
};

export const sendExpoPushNotification = async (
  expoPushToken: string,
  title: string,
  message: string
) => {
  const messageBody = {
    to: expoPushToken,
    sound: "default",
    title: title,
    body: message,
    data: {},
  };

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messageBody),
  });
};

export const registerForPushNotificationsAsync = async (userId: string) => {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      Alert.alert("Hata", "Push bildirim izni verilmedi!");
      return;
    }

    try {
      token = (await Notifications.getExpoPushTokenAsync()).data;

      // Supabase'e kaydet
      const { error } = await supabase
        .from(TABLES.PROFILES)
        .update({ expoPushToken: token })
        .eq("id", userId);

      if (error) throw error;
    } catch (error) {
      console.error("Push token alınırken hata:", error);
      Alert.alert("Hata", "Push bildirim token'ı alınamadı!");
    }
  } else {
    Alert.alert("Hata", "Fiziksel cihaz gerekli!");
  }
  return token;
};
