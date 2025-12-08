import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useAuth } from "../context/AuthContext";
import { supabase, TABLES } from "../config/lib";
import { Task, User } from "../types";
import { MaterialIcons as Icon } from "@expo/vector-icons";
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
  // User dropdown functionality removed for non-admin users
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState<Task>({
    title: "",
    description: "",
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
  const [completingTaskIds, setCompletingTaskIds] = useState<Set<string>>(new Set());

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
      // Bugünün başlangıcı ve sonu
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      let tasksList: Task[] = [];

      if (user.isAdmin) {
        // Admin: Bugün eklenen tüm taskler VEYA önceki günlerden waiting olanlar

        // 1. Bugün eklenen tüm taskler
        const { data: todayTasks, error: todayError } = await supabase
          .from(TABLES.TASKS)
          .select("*")
          .gte("createdAt", todayStart.toISOString())
          .lte("createdAt", todayEnd.toISOString())
          .neq("status", "completed");

        if (todayError) throw todayError;

        // 2. Önceki günlerden status="waiting" olan taskler
        const { data: waitingTasks, error: waitingError } = await supabase
          .from(TABLES.TASKS)
          .select("*")
          .eq("status", "waiting")
          .lt("createdAt", todayStart.toISOString());

        if (waitingError) throw waitingError;

        // Birleştir ve tekrarları kaldır
        const allTasks = [...(todayTasks || []), ...(waitingTasks || [])];
        const uniqueTasks = Array.from(
          new Map(allTasks.map((task) => [task.id, task])).values()
        );

        tasksList =
          uniqueTasks.map((task) => ({
            ...task,
            createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
            createdBy: (task as any).createdby || (task as any).createdBy || "",
          })) || [];
      } else {
        // Normal kullanıcı: Sadece kendi görevlerinde aynı filtre

        // 1. Bugün eklenen tüm taskler (kendi taskleri)
        const { data: todayTasks, error: todayError } = await supabase
          .from(TABLES.TASKS)
          .select("*")
          .eq("createdBy", user.id)
          .gte("createdAt", todayStart.toISOString())
          .lte("createdAt", todayEnd.toISOString())
          .neq("status", "completed");

        if (todayError) throw todayError;

        // 2. Önceki günlerden status="waiting" olan taskler (kendi taskleri)
        const { data: waitingTasks, error: waitingError } = await supabase
          .from(TABLES.TASKS)
          .select("*")
          .eq("createdBy", user.id)
          .eq("status", "waiting")
          .lt("createdAt", todayStart.toISOString());

        if (waitingError) throw waitingError;

        // Birleştir ve tekrarları kaldır
        const allTasks = [...(todayTasks || []), ...(waitingTasks || [])];
        const uniqueTasks = Array.from(
          new Map(allTasks.map((task) => [task.id, task])).values()
        );

        tasksList =
          uniqueTasks.map((task) => ({
            ...task,
            createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
            createdBy: (task as any).createdby || (task as any).createdBy || "",
          })) || [];
      }

      setTasks(tasksList);
    } catch (error) {
      console.error("Görevler yüklenirken hata:", error);
    }
  };

  useEffect(() => {
    const sortTasks = (list: Task[]) => {
      return [...list].sort((a, b) => {
        // Önce tamamlanan durumuna göre sırala (tamamlanan altta)
        if (a.status === "completed" && b.status !== "completed") return 1;
        if (a.status !== "completed" && b.status === "completed") return -1;

        // Tamamlanan olmayan görevler için created date'e göre sırala (eski tarihler üstte)
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (aTime !== bTime) return aTime - bTime; // Eski oluşturulan üstte

        // Son olarak ID'ye göre stabil sıralama
        const aId = a.id || "";
        const bId = b.id || "";
        return aId.localeCompare(bId);
      });
    };

    // Backend'den zaten filtrelenmiş data geliyor, sadece sıralama uygula
    // Completed taskler loadTasks ile gelmez, ama runtime'da tamamlanınca listeden düşmeli.
    // Bu filter runtime'da tamamlananları gizler.
    setFilteredTasks(sortTasks(tasks.filter((task) => task.status !== "completed")));
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

  const handleCreateTask = async () => {
    if (!newTask.title) {
      Alert.alert("Hata", "Başlık zorunludur");
      return;
    }

    if (!user?.id) {
      Alert.alert("Hata", "Kullanıcı bilgisi bulunamadı");
      return;
    }

    try {
      const selectedDate = newTask.createdAt || new Date();
      const { data, error } = await supabase
        .from(TABLES.TASKS)
        .insert([
          {
            title: newTask.title,
            description: newTask.description || "",
            status: "waiting",
            createdAt: selectedDate.toISOString(),
            createdBy: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setNewTask({
        title: "",
        description: "",
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
    newStatus: "waiting" | "completed" | "past_due"
  ) => {
    if (!selectedTask?.id) return;

    try {
      const { error } = await supabase
        .from(TABLES.TASKS)
        .update({
          status: newStatus,
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

  const toggleTaskDone = (task: Task) => {
    if (!task.id) return;

    // 1. If currently pending completion (user clicked check), cancel it.
    if (completingTaskIds.has(task.id)) {
      setCompletingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id!);
        return next;
      });
      return; // Abort, no DB call.
    }

    // 2. If already completed, this is an "Undo". Update immediately (no wait needed for restoring).
    if (task.status === "completed") {
      updateTaskStatus(task, "waiting");
      return;
    }

    // 3. New completion action: Add to pending and wait.
    setCompletingTaskIds((prev) => new Set(prev).add(task.id!));

    setTimeout(() => {
      setCompletingTaskIds((currentSet) => {
        // Re-check if it's still there (hasn't been cancelled by user unchecking)
        if (currentSet.has(task.id!)) {
          // Perform the actual DB update
          updateTaskStatus(task, "completed");

          // Cleanup ID
          const next = new Set(currentSet);
          next.delete(task.id!);
          return next;
        }
        return currentSet;
      });
    }, 1000); // 1 second delay as requested
  };

  const updateTaskStatus = async (task: Task, newStatus: Task["status"]) => {
    if (newStatus === "completed") {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }

    setTasks((prevTasks) => {
      return prevTasks.map((t) =>
        t.id === task.id ? { ...t, status: newStatus } : t
      );
    });

    if (selectedTask && selectedTask.id === task.id) {
      setSelectedTask({ ...selectedTask, status: newStatus });
    }

    try {
      const { error } = await supabase
        .from(TABLES.TASKS)
        .update({ status: newStatus })
        .eq("id", task.id);

      if (error) throw error;
    } catch (error) {
      console.error("Durum güncellenirken hata:", error);
      Alert.alert("Hata", "Durum güncellenirken hata oluştu");
      // Revert optimism
      setTasks((prevTasks) => {
        return prevTasks.map((t) =>
          t.id === task.id ? { ...t, status: task.status } : t
        );
      });
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

  const handleSaveTask = async (title: string, description: string) => {
    if (!selectedTask?.id) return;
    try {
      const { error } = await supabase
        .from(TABLES.TASKS)
        .update({ title, description })
        .eq("id", selectedTask.id);
      if (error) throw error;

      setSelectedTask({ ...selectedTask, title, description });
      loadTasks();
      setDetailModalVisible(false);
    } catch (error) {
      console.error("Görev güncellenirken hata:", error);
      Alert.alert("Hata", "Görev güncellenirken bir hata oluştu");
    }
  };

  const renderStatusDropdown = () => {
    if (!showStatusDropdown) return null;

    const statuses = [
      { value: "waiting", color: "#FFCC00" },
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
        <View style={styles.headerLeft}>
          {/* Tarih kaldırıldı */}

          <View style={styles.welcomeContainer}>

            <Text style={styles.userName}>Bugün</Text>

          </View>


        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate("Notifications")}
          >

          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
            <Icon name="logout" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>



      <FlatList
        data={filteredTasks}
        renderItem={({ item }) => {
          // Önce task'in bugün mü yoksa önceki günden mi kaldığını kontrol et
          const isFromPreviousDay = () => {
            if (!item.createdAt) return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const taskDate = new Date(item.createdAt);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate < today;
          };

          // Border rengi belirle
          const getBorderColor = () => {
            // Önceki günden kalan taskler her zaman kırmızı
            if (isFromPreviousDay()) {
              return "#FF3B30"; // Kırmızı
            }

            // Bugün eklenen taskler için status'e göre renk
            switch (item.status) {
              case "completed":
                return "#34C759"; // Yeşil
              case "waiting":
                return "#FFCC00"; // Sarı
              case "past_due":
                return "#FF3B30"; // Kırmızı
              default:
                return "#FFCC00"; // Varsayılan sarı
            }
          };

          return (
            <View style={[
              styles.todoItem,
              { borderLeftColor: getBorderColor() }
            ]}>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  (item.status === "completed" || (item.id && completingTaskIds.has(item.id))) && styles.checkboxChecked
                ]}
                onPress={() => toggleTaskDone(item)}
              >
                {(item.status === "completed" || (item.id && completingTaskIds.has(item.id))) && (
                  <Icon name="check" size={16} color="#fff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.todoContent}
                onPress={() => {
                  setSelectedTask(item);
                  setDetailModalVisible(true);
                }}
              >
                <Text
                  style={[
                    styles.todoTitle,
                    (item.status === "completed" || (item.id && completingTaskIds.has(item.id))) && styles.todoTitleCompleted,
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                {!!item.description && (
                  <Text style={styles.todoDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}

              </TouchableOpacity>
            </View>
          );
        }}
        keyExtractor={(item) => item.id || ""}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Icon name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <CreateTaskModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        newTask={newTask}
        onTaskChange={(field, value) =>
          setNewTask({ ...newTask, [field]: value })
        }
        onCreateTask={handleCreateTask}
      />

      <TaskDetailModal
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        selectedTask={selectedTask}
        onStatusChange={handleStatusChange}
        onDeleteTask={handleDeleteTask}
        isAdmin={user?.isAdmin || false}
        onSave={handleSaveTask}
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
    paddingTop: 70,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  welcomeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  welcomeText: {
    fontSize: 16,
    color: "#666",
  },
  dateText: {
    fontSize: 32,
    color: "#333",
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  adminBadge: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  adminBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  notificationButton: {
    position: "relative",
    padding: 10,
  },
  logoutButton: {
    padding: 10,
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
  tasksHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  addButton: {
    backgroundColor: "#007AFF",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  listContainer: {
    padding: 16,
  },
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: "#eee",
    borderRightColor: "#eee",
    borderBottomColor: "#eee",
    borderLeftWidth: 5,
    overflow: "hidden",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#34C759",
    borderColor: "#34C759",
  },
  todoContent: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    marginBottom: 4,
  },
  todoTitleCompleted: {
    color: "#8E8E93",
    textDecorationLine: "line-through",
  },
  todoDescription: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  todoMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
    backgroundColor: "#ccc",
  },
  todoMeta: {
    fontSize: 12,
    color: "#666",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  statusDropdown: {
    position: "absolute",
    right: 0,
    top: 40,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10,
    zIndex: 9999,
  },
  statusDropdownItem: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
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
});
