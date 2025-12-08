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
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { sendAdminNotification } from "../services/notificationService";
import { supabase, TABLES } from "../config/lib";

type RootStackParamList = {
  AdminDashboard: undefined;
  UserList: undefined;
  TaskList: undefined;
  UserDashboard: undefined;
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
        inProgressTasks: 0,
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
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Admin Paneli</Text>
          <Text style={styles.subtitle}>Hoşgeldin, Admin</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => setAdminModalVisible(true)}
        >
          
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: "#007AFF" }]}>
            <View style={styles.statIconContainer}>
              <Icon name="people" size={32} color="#fff" />
            </View>
            <Text style={styles.statNumber}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Toplam Kullanıcı</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#6a706c" }]}>
            <View style={styles.statIconContainer}>
              <Icon name="assignment" size={32} color="#fff" />
            </View>
            <Text style={styles.statNumber}>{stats.totalTasks}</Text>
            <Text style={styles.statLabel}>Toplam Görev</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#34C759" }]}>
            <View style={styles.statIconContainer}>
              <Icon name="check-circle" size={32} color="#fff" />
            </View>
            <Text style={styles.statNumber}>{stats.completedTasks}</Text>
            <Text style={styles.statLabel}>Tamamlanan</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#FF9500" }]}>
            <View style={styles.statIconContainer}>
              <Icon name="hourglass-empty" size={32} color="#fff" />
            </View>
            <Text style={styles.statNumber}>{stats.inProgressTasks}</Text>
            <Text style={styles.statLabel}>Devam Eden</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#5856D6" }]}>
            <View style={styles.statIconContainer}>
              <Icon name="schedule" size={32} color="#fff" />
            </View>
            <Text style={styles.statNumber}>{stats.waitingTasks}</Text>
            <Text style={styles.statLabel}>Bekleyen</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#FF3B30" }]}>
            <View style={styles.statIconContainer}>
              <Icon name="warning" size={32} color="#fff" />
            </View>
            <Text style={styles.statNumber}>{stats.pastDueTasks}</Text>
            <Text style={styles.statLabel}>Geçmiş</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("UserList")}
          >
            <View style={styles.actionButtonContent}>
              <Icon name="people" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Kullanıcıları Yönet</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("TaskList")}
          >
            <View style={styles.actionButtonContent}>
              <Icon name="assignment" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Görevleri Yönet</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#34C759" }]}
            onPress={() => navigation.navigate("UserDashboard")}
          >
            <View style={styles.actionButtonContent}>
              <Icon name="list" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Kendi Panelime git</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  notificationButton: {
    padding: 10,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 15,
    gap: 15,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  statLabel: {
    fontSize: 14,
    color: "#fff",
    marginTop: 5,
  },
  actionsContainer: {
    padding: 15,
  },
  actionButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
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
    borderBottomColor: "#007AFF",
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
    borderRadius: 10,
    padding: 15,
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
    borderRadius: 10,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AdminDashboard;
