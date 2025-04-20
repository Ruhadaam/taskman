import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { supabase, TABLES } from "../config/lib";
import { Task, User } from "../types";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import TaskDetailModal from "../components/tasks/TaskDetailModal";
import CreateTaskModal from "../components/tasks/CreateTaskModal";
import { sendAdminNotification } from "../services/notificationService";

type RootStackParamList = {
  UserTaskList: undefined;
  Notifications: undefined;
  LoginScreen: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function UserDashboard() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState<Task>({
    title: "",
    description: "",
    assignedTo: [],
    dueDate: new Date(),
    status: "waiting",
    createdAt: new Date(),
    createdBy: user?.id || "",
  });
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadTasks();
      loadUsers();
    }, [])
  );

  useEffect(() => {
    if (user?.unseen) {
      setUnreadNotifications(user.unseen.length);
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from(TABLES.PROFILES)
        .select("*");

      if (error) throw error;

      const usersList =
        profiles?.map((profile) => ({
          id: profile.id,
          name: profile.name || "",
          email: profile.email || "",
          uid: profile.uid || "",
          isAdmin: profile.isAdmin || false,
          unseen: profile.unseen || [],
          seen: profile.seen || [],
        })) || [];

      setUsers(usersList);
    } catch (error) {
      console.error("Kullanıcılar yüklenirken hata:", error);
    }
  };

  const loadTasks = async () => {
    if (!user?.id) return;

    try {
      // Kullanıcının oluşturduğu görevler
      const { data: createdTasks, error: createdError } = await supabase
        .from(TABLES.TASKS)
        .select("*")
        .eq("createdBy", user.id);

      if (createdError) throw createdError;

      // Kullanıcıya atanan görevler
      const { data: assignedTasks, error: assignedError } = await supabase
        .from(TABLES.TASKS)
        .select("*")
        .contains("assignedTo", [user.id]);

      if (assignedError) throw assignedError;

      // Tüm görevleri birleştir ve tekrarları kaldır
      const allTasks = new Map();

      createdTasks?.forEach((task) => {
        allTasks.set(task.id, {
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : new Date(),
          createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
        });
      });

      assignedTasks?.forEach((task) => {
        allTasks.set(task.id, {
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : new Date(),
          createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
        });
      });

      const tasksList = Array.from(allTasks.values());
      setTasks(tasksList);
    } catch (error) {
      console.error("Görevler yüklenirken hata:", error);
    }
  };

  useEffect(() => {
    if (hideCompleted) {
      setFilteredTasks(tasks.filter((task) => task.status !== "completed"));
    } else {
      setFilteredTasks(tasks);
    }
  }, [tasks, hideCompleted]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const getRandomColor = (name: string) => {
    const colors = [
      "#FF3B30", // Kırmızı
      "#FF9500", // Turuncu
      "#FFCC00", // Sarı
      "#34C759", // Yeşil
      "#5AC8FA", // Açık Mavi
      "#007AFF", // Mavi
      "#5856D6", // Mor
      "#FF2D55", // Pembe
      "#8E8E93", // Gri
      "#4CD964", // Parlak Yeşil
    ];

    const sum = name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = sum % colors.length;
    return colors[index];
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigation.navigate("LoginScreen");
    } catch (error) {
      console.error("Çıkış yapılırken hata oluştu:", error);
    }
  };

  const toggleUserSelection = (userId: string, isNewTask: boolean = true) => {
    if (isNewTask) {
      if (!newTask) return;
      const isSelected = newTask.assignedTo.includes(userId);
      const updatedAssignedTo = isSelected
        ? newTask.assignedTo.filter((id) => id !== userId)
        : [...newTask.assignedTo, userId];

      setNewTask({
        ...newTask,
        assignedTo: updatedAssignedTo,
      });
    } else {
      if (!selectedTask) return;
      const isSelected = selectedTask.assignedTo.includes(userId);
      const updatedAssignedTo = isSelected
        ? selectedTask.assignedTo.filter((id) => id !== userId)
        : [...selectedTask.assignedTo, userId];

      setSelectedTask({
        ...selectedTask,
        assignedTo: updatedAssignedTo,
      });
    }
  };

  const handleAssignUsers = async () => {
    if (!selectedTask?.id) return;

    try {
      const { error } = await supabase
        .from(TABLES.TASKS)
        .update({
          assignedTo: selectedTask.assignedTo,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", selectedTask.id);

      if (error) throw error;

      setShowUserDropdown(false);
      loadTasks();
    } catch (error) {
      console.error("Kullanıcı atama hatası:", error);
      Alert.alert("Hata", "Kullanıcı atanırken bir hata oluştu");
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.dueDate) {
      Alert.alert("Hata", "Başlık ve son tarih zorunludur");
      return;
    }

    if (!user?.id) {
      Alert.alert("Hata", "Kullanıcı bilgisi bulunamadı");
      return;
    }

    try {
      const { data, error } = await supabase
        .from(TABLES.TASKS)
        .insert([
          {
            title: newTask.title,
            description: newTask.description,
            assignedTo: newTask.assignedTo || [],
            dueDate: newTask.dueDate.toISOString(),
            status: "waiting",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setNewTask({
        title: "",
        description: "",
        dueDate: new Date(),
        assignedTo: [],
        status: "waiting",
        createdAt: new Date(),
        createdBy: user.id,
      });
      setModalVisible(false);
      loadTasks();
    } catch (error) {
      console.error("Görev oluşturma hatası:", error);
      Alert.alert("Hata", "Görev oluşturulurken bir hata oluştu");
    }
  };

  const handleStatusChange = async (
    newStatus: "waiting" | "in-progress" | "completed" | "past_due"
  ) => {
    if (!selectedTask?.id) return;

    try {
      const { error } = await supabase
        .from(TABLES.TASKS)
        .update({
          status: newStatus,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", selectedTask.id);

      if (error) throw error;

      setSelectedTask({ ...selectedTask, status: newStatus });
      setShowStatusDropdown(false);
      loadTasks();
    } catch (error) {
      console.error("Durum güncellenirken hata:", error);
      Alert.alert("Hata", "Durum güncellenirken bir hata oluştu");
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask?.id) return;
    try {
      const { error } = await supabase
        .from(TABLES.TASKS)
        .delete()
        .eq("id", selectedTask.id);

      if (error) throw error;

      setDetailModalVisible(false);
      loadTasks();
    } catch (error) {
      console.error("Görev silinirken hata:", error);
    }
  };

  const renderStatusDropdown = () => {
    if (!showStatusDropdown) return null;

    const statuses = [
      { value: "waiting", color: "#007AFF" },
      { value: "in-progress", color: "#FF9500" },
      { value: "completed", color: "#34C759" },
      { value: "past_due", color: "#FF3B30" },
    ];

    return (
      <View style={styles.statusDropdown}>
        {statuses.map((status) => (
          <TouchableOpacity
            key={status.value}
            style={[
              styles.statusDropdownItem,
              { backgroundColor: status.color },
            ]}
            onPress={() =>
              handleStatusChange(
                status.value as
                  | "waiting"
                  | "in-progress"
                  | "completed"
                  | "past_due"
              )
            }
          >
            <Text style={styles.statusText}>{status.value}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const handleSendNotification = async () => {
    if (!notificationTitle || !notificationMessage) {
      Alert.alert("Hata", "Başlık ve mesaj alanları boş olamaz");
      return;
    }

    try {
      await sendAdminNotification(notificationTitle, notificationMessage);
      setAdminModalVisible(false);
      setNotificationTitle("");
      setNotificationMessage("");
      Alert.alert("Başarılı", "Bildirim gönderildi");
    } catch (error) {
      console.error("Bildirim gönderme hatası:", error);
      Alert.alert("Hata", "Bildirim gönderilemedi");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.tasksButton}
          onPress={() => navigation.navigate("UserTaskList")}
        >
          <Icon name="list" size={24} color="#007AFF" />
          <Text style={styles.tasksButtonText}>Görevlerim</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate("Notifications")}
          >
            <Icon name="notifications" size={24} color="#007AFF" />
            {unreadNotifications > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
            <Icon name="logout" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: "#007AFF" }]}>
          <Text style={styles.statNumber}>{tasks.length}</Text>
          <Text style={styles.statLabel}>Toplam Görev</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#007AFF" }]}>
          <Text style={styles.statNumber}>
            {tasks.filter((t) => t.status === "completed").length}
          </Text>
          <Text style={styles.statLabel}>Tamamlanan</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#007AFF" }]}>
          <Text style={styles.statNumber}>
            {tasks.filter((t) => t.status === "in-progress").length}
          </Text>
          <Text style={styles.statLabel}>Devam Eden</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#007AFF" }]}>
          <Text style={styles.statNumber}>
            {tasks.filter((t) => t.status === "waiting").length}
          </Text>
          <Text style={styles.statLabel}>Bekleyen</Text>
        </View>
      </View>

      <CreateTaskModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        newTask={newTask}
        users={users}
        showUserDropdown={showUserDropdown}
        onUserDropdownToggle={() => setShowUserDropdown(!showUserDropdown)}
        onUserSelect={(userId) => toggleUserSelection(userId)}
        onTaskChange={(field, value) =>
          setNewTask({ ...newTask, [field]: value })
        }
        onCreateTask={handleCreateTask}
      />

      <TaskDetailModal
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        selectedTask={selectedTask}
        users={users}
        showUserDropdown={showUserDropdown}
        showStatusDropdown={showStatusDropdown}
        onStatusDropdownToggle={() =>
          setShowStatusDropdown(!showStatusDropdown)
        }
        onUserDropdownToggle={() => setShowUserDropdown(!showUserDropdown)}
        onUserSelect={(userId) => toggleUserSelection(userId, false)}
        onSaveUsers={handleAssignUsers}
        onStatusChange={handleStatusChange}
        getInitials={getInitials}
        getRandomColor={getRandomColor}
        renderStatusDropdown={renderStatusDropdown}
        onDeleteTask={handleDeleteTask}
      />

      {/* Admin bildirim modalı */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={adminModalVisible}
        onRequestClose={() => setAdminModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Bildirim Gönder</Text>

            <TextInput
              style={styles.input}
              placeholder="Başlık"
              value={notificationTitle}
              onChangeText={setNotificationTitle}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Mesaj"
              value={notificationMessage}
              onChangeText={setNotificationMessage}
              multiline
              numberOfLines={4}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setAdminModalVisible(false)}
              >
                <Text style={styles.buttonText}>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={handleSendNotification}
              >
                <Text style={styles.buttonText}>Gönder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  notificationButton: {
    position: "relative",
    padding: 10,
  },
  logoutButton: {
    padding: 10,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    padding: 20,
    borderRadius: 10,
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
  listContainer: {
    padding: 10,
  },
  statusDropdown: {
    flexDirection: "row",
    padding: 10,
  },
  statusDropdownItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
  },
  textArea: {
    height: 100,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#007AFF",
  },
  cancelButton: {
    backgroundColor: "#ddd",
  },
  confirmButton: {
    backgroundColor: "#4CD964",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  badge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  tasksButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    padding: 10,
  },
  tasksButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
  },
});
