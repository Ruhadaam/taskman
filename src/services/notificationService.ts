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

// Yeni görev oluşturulduğunda, görevi oluşturan kullanıcıya bildirim gönder
export const sendNewTaskNotification = async (task: Task | null | undefined) => {
  try {
    if (!task) {
      console.log("Bildirim gönderilemedi: task verisi yok");
      return;
    }

    if (!task.createdBy) {
      console.log("Bildirim gönderilemedi: createdBy alanı yok");
      return;
    }

    const hasPermission = await setupNotifications();
    if (!hasPermission) {
      console.log("Bildirim izni yok");
      return;
    }

    // Görevi oluşturan kullanıcıyı getir
    const { data: users, error: usersError } = await supabase
      .from(TABLES.PROFILES)
      .select("id, expoPushToken, unseen")
      .eq("id", task.createdBy);

    if (usersError) {
      console.error("Kullanıcı getirme hatası:", usersError);
      throw usersError;
    }

    if (!users || users.length === 0) {
      console.log("Kullanıcı bulunamadı");
      return;
    }

    console.log("Bulunan kullanıcılar:", users);

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

    if (notificationError) {
      console.error("Bildirim oluşturma hatası:", notificationError);
      throw notificationError;
    }

    console.log("Bildirim oluşturuldu:", notification);

    // Kullanıcının unseen array'ine bildirim ID'sini ekle
    const updatePromises = users.map(async (user) => {
      console.log(`Kullanıcı ${user.id} için bildirim gönderiliyor...`);

      const { error: updateError } = await supabase
        .from(TABLES.PROFILES)
        .update({
          unseen: [...(user.unseen || []), notification.id],
        })
        .eq("id", user.id);

      if (updateError) {
        console.error(`Kullanıcı ${user.id} güncelleme hatası:`, updateError);
        throw updateError;
      }

      // Push bildirimi gönder
      if (user.expoPushToken) {
        console.log(
          `Push bildirimi gönderiliyor (token: ${user.expoPushToken})`
        );
        await sendExpoPushNotification(
          user.expoPushToken,
          "Yeni Görev",
          `${task.title} görevi size atandı!`
        );
      } else {
        console.log(`Kullanıcı ${user.id} için push token bulunamadı`);
      }
    });

    await Promise.all(updatePromises);
    console.log("Tüm bildirimler başarıyla gönderildi");
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

  try {
    console.log("Push bildirim token alma işlemi başlatılıyor...");

    if (!Device.isDevice) {
      console.log("Hata: Fiziksel cihaz bulunamadı");
      return null;
    }

    console.log("Cihaz kontrolü başarılı, izinler kontrol ediliyor...");

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    console.log("Mevcut izin durumu:", existingStatus);

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      console.log("İzin isteniyor...");
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log("Yeni izin durumu:", finalStatus);
    }

    if (finalStatus !== "granted") {
      console.log("Hata: Bildirim izni reddedildi");
      return null;
    }

    console.log("Token alınıyor...");

    // Build sürecinde farklı bir yaklaşım kullanıyoruz
    const expoPushToken = await Notifications.getExpoPushTokenAsync({
      projectId: "fd987b21-0a48-4b47-941a-c3fb349e6198",
      development: __DEV__, // Geliştirme modunda farklı davranması için
    });

    token = expoPushToken.data;
    console.log("Token alındı:", token);

    if (!token) {
      console.log("Hata: Token alınamadı");
      return null;
    }

    console.log("Token Supabase'e kaydediliyor...");
    const { error } = await supabase
      .from(TABLES.PROFILES)
      .update({ expoPushToken: token })
      .eq("id", userId);

    if (error) {
      console.error("Supabase token güncelleme hatası:", error);
      return null;
    }

    console.log("Token başarıyla kaydedildi");
    return token;
  } catch (error) {
    console.error("Push bildirim token alma hatası:", error);
    return null;
  }
};
