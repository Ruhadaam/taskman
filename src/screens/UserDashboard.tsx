import React, { useState, useMemo } from "react";
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
import { useTasks } from "../context/TaskContext";
import { Task, RecurringTask } from "../types";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import TaskDetailModal from "../components/tasks/TaskDetailModal";
import CreateTaskModal from "../components/tasks/CreateTaskModal";
import TaskItem from "../components/tasks/TaskItem";

type RootStackParamList = {
  LoginScreen: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Combined type for both regular and recurring tasks
type DisplayTask = (Task & { isRecurringTask?: false }) | (RecurringTask & { isRecurringTask: true; status: 'waiting' });

export default function UserDashboard() {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  // Use Global Task Context
  const { tasks, recurringTasks, addTask, addRecurringTask, completeRecurringTask, updateTaskStatus, updateTask, deleteTask } = useTasks();

  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState<Task>({
    title: "",
    status: "waiting",
    createdAt: new Date(),
    createdBy: user?.id || "",
  });
  const [completingTaskIds, setCompletingTaskIds] = useState<Set<string>>(new Set());

  // Memoize filtered tasks (combining regular + recurring)
  const filteredTasks = useMemo(() => {
    if (!user?.id) return [];

    const today = new Date();
    const todayStr = today.toDateString();

    // Filter regular tasks for today
    const todayTasks: DisplayTask[] = tasks.filter(task => {
      if (task.isArchived) return false;
      if (task.status === 'completed') return false;

      const taskDate = task.createdAt ? new Date(task.createdAt) : new Date();
      return taskDate.toDateString() === todayStr;
    }).map(t => ({ ...t, isRecurringTask: false as const }));

    // Filter recurring tasks (show if not completed today)
    const visibleRecurring: DisplayTask[] = recurringTasks.filter(task => {
      if (!task.lastCompletedAt) return true;
      const completedDate = new Date(task.lastCompletedAt);
      return completedDate.toDateString() !== todayStr;
    }).map(t => ({ ...t, isRecurringTask: true as const, status: 'waiting' as const }));

    // Combine and sort by createdAt
    const combined = [...todayTasks, ...visibleRecurring];
    return combined.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return aTime - bTime;
    });
  }, [tasks, recurringTasks, user?.id]);

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
      await addTask({
        title: newTask.title,
        status: "waiting",
        // @ts-ignore
        createdAt: newTask.createdAt || new Date(),
        createdBy: user.id,
      });

      setNewTask({
        title: "",
        status: "waiting",
        createdAt: new Date(),
        createdBy: user.id,
      });
      setModalVisible(false);
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
      await updateTaskStatus(selectedTask.id, newStatus);
      setSelectedTask({ ...selectedTask, status: newStatus });
    } catch (error) {
      console.error("Durum güncellenirken hata:", error);
      Alert.alert("Hata", "Durum güncellenirken bir hata oluştu");
    }
  };

  const toggleTaskDone = (task: DisplayTask) => {
    if (!task.id) return;

    // Optimistic toggle logic
    if (completingTaskIds.has(task.id)) {
      setCompletingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id!);
        return next;
      });
      return; // Abort
    }

    // Handle recurring tasks differently
    if (task.isRecurringTask) {
      setCompletingTaskIds((prev) => new Set(prev).add(task.id!));

      setTimeout(() => {
        setCompletingTaskIds((currentSet) => {
          if (currentSet.has(task.id!)) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            completeRecurringTask(task.id!);
            const next = new Set(currentSet);
            next.delete(task.id!);
            return next;
          }
          return currentSet;
        });
      }, 1000);
      return;
    }

    // Regular task logic
    if (task.status === "completed") {
      updateContextTaskStatus(task as Task, "waiting");
      return;
    }

    setCompletingTaskIds((prev) => new Set(prev).add(task.id!));

    setTimeout(() => {
      setCompletingTaskIds((currentSet) => {
        if (currentSet.has(task.id!)) {
          updateContextTaskStatus(task as Task, "completed");
          const next = new Set(currentSet);
          next.delete(task.id!);
          return next;
        }
        return currentSet;
      });
    }, 1000);
  };

  const updateContextTaskStatus = async (task: Task, newStatus: Task["status"]) => {
    if (newStatus === "completed") {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }

    if (selectedTask && selectedTask.id === task.id) {
      setSelectedTask({ ...selectedTask, status: newStatus });
    }

    if (task.id) {
      await updateTaskStatus(task.id, newStatus);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask?.id) return;
    try {
      await deleteTask(selectedTask.id);
      setDetailModalVisible(false);
    } catch (error) {
      console.error("Görev silinirken hata:", error);
    }
  };

  const handleSaveTask = async (title: string, date: Date) => {
    if (!selectedTask?.id) return;
    try {
      await updateTask(selectedTask.id, {
        title,
        createdAt: date
      });
      setSelectedTask({
        ...selectedTask,
        title,
        createdAt: date
      });
      setDetailModalVisible(false);
    } catch (error) {
      console.error("Görev güncellenirken hata:", error);
      Alert.alert("Hata", "Görev güncellenirken bir hata oluştu");
    }
  };

  const getBorderColor = (status: Task["status"]) => {
    switch (status) {
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

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setDetailModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.userName}>Bugün</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
        </View>
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={({ item }) => (
          <TaskItem
            item={item as Task}
            onToggle={() => toggleTaskDone(item)}
            onPress={() => !item.isRecurringTask && handleTaskPress(item as Task)}
            isCompleting={item.id ? completingTaskIds.has(item.id) : false}
            borderLeftColor={item.isRecurringTask ? '#9C27B0' : getBorderColor(item.status)}
          />
        )}
        keyExtractor={(item) => (item.isRecurringTask ? `recurring-${item.id}` : item.id) || ""}
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
        onCreateRecurringTask={(title) => {
          addRecurringTask(title);
          setNewTask({ ...newTask, title: '' });
          setModalVisible(false);
        }}
      />

      <TaskDetailModal
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        selectedTask={selectedTask}
        onStatusChange={handleStatusChange}
        onDeleteTask={handleDeleteTask}
        onSave={handleSaveTask}
      />
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
