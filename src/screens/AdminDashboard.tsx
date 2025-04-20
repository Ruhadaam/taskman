import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import Icon from "react-native-vector-icons/MaterialIcons";
import { sendAdminNotification } from "../services/notificationService";
import { supabase, TABLES } from "../config/lib";

type RootStackParamList = {
  AdminDashboard: undefined;
  UserList: undefined;
  TaskList: undefined;
};

type AdminDashboardNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AdminDashboard"
>;

const AdminDashboard = () => {
  const navigation = useNavigation<AdminDashboardNavigationProp>();
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    waitingTasks: 0,
    pastDueTasks: 0,
  });

  const loadStats = async () => {
    try {
      // Kullanıcı istatistikleri
      const { data: profiles, error: profilesError } = await supabase
        .from(TABLES.PROFILES)
        .select("*");

      if (profilesError) throw profilesError;

      // Görev istatistikleri
      const { data: tasks, error: tasksError } = await supabase
        .from(TABLES.TASKS)
        .select("*");

      if (tasksError) throw tasksError;

      setStats({
        totalUsers: profiles?.length || 0,
        totalTasks: tasks?.length || 0,
        completedTasks:
          tasks?.filter((task) => task.status === "completed").length || 0,
        inProgressTasks:
          tasks?.filter((task) => task.status === "in-progress").length || 0,
        waitingTasks:
          tasks?.filter((task) => task.status === "waiting").length || 0,
        pastDueTasks:
          tasks?.filter((task) => task.status === "past_due").length || 0,
      });
    } catch (error) {
      console.error("İstatistikler yüklenirken hata:", error);
      Alert.alert("Hata", "İstatistikler yüklenirken bir hata oluştu");
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadStats();
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Paneli</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: "#5856D6" }]}
          onPress={() => setAdminModalVisible(true)}
        >
          <Icon name="notifications" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Admin Bildirim Modalı */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={adminModalVisible}
        onRequestClose={() => setAdminModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Toplu Bildirim Gönder</Text>
              <TouchableOpacity onPress={() => setAdminModalVisible(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Bildirim Başlığı"
              value={notificationTitle}
              onChangeText={setNotificationTitle}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Bildirim Mesajı"
              value={notificationMessage}
              onChangeText={setNotificationMessage}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={async () => {
                await sendAdminNotification(
                  notificationTitle,
                  notificationMessage
                );
                setAdminModalVisible(false);
                setNotificationTitle("");
                setNotificationMessage("");
              }}
            >
              <Text style={styles.submitButtonText}>Gönder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.statsContainer}
        contentContainerStyle={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalUsers}</Text>
          <Text style={styles.statLabel}>Toplam Kullanıcı</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalTasks}</Text>
          <Text style={styles.statLabel}>Toplam Görev</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.completedTasks}</Text>
          <Text style={styles.statLabel}>Tamamlanan</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.inProgressTasks}</Text>
          <Text style={styles.statLabel}>Devam Eden</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.waitingTasks}</Text>
          <Text style={styles.statLabel}>Bekleyen</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.pastDueTasks}</Text>
          <Text style={styles.statLabel}>Geçmiş</Text>
        </View>
      </ScrollView>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("UserList")}
        >
          <Text style={styles.actionButtonText}>Kullanıcıları Yönet</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("TaskList")}
        >
          <Text style={styles.actionButtonText}>Görevleri Yönet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 16,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  addButton: {
    backgroundColor: "#007AFF",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  statsContainer: {
    padding: 10,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  actionsContainer: {
    padding: 20,
  },
  actionButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AdminDashboard;
