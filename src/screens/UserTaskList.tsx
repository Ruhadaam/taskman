import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { supabase, TABLES } from "../config/lib";
import { Task, User } from "../types";
import { MaterialIcons as Icon } from "@expo/vector-icons";
// Todo görünümü için TaskCard kaldırıldı
import TaskDetailModal from "../components/tasks/TaskDetailModal";
import CreateTaskModal from "../components/tasks/CreateTaskModal";
import { useAuth } from "../context/AuthContext";
import { sendNewTaskNotification } from "../services/notificationService";

const UserTaskList = () => {
  const { user: currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);  // User dropdown functionality removed for non-admin users
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState<Omit<Task, 'id'>>({
    title: "",
    status: "waiting",
    createdAt: new Date(),
    createdBy: currentUser?.id || "",
  });
  const [hideCompleted, setHideCompleted] = useState(false);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  const loadTasks = async () => {
    if (!currentUser?.id) return;

    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // Get today's tasks
      const { data: todayTasks, error: todayError } = await supabase
        .from(TABLES.TASKS)
        .select("*")
        .eq("createdBy", currentUser.id)
        .gte('createdAt', todayStart.toISOString())
        .lte('createdAt', todayEnd.toISOString());

      if (todayError) throw todayError;

      // Get waiting tasks from previous days
      const { data: waitingTasks, error: waitingError } = await supabase
        .from(TABLES.TASKS)
        .select("*")
        .eq("createdBy", currentUser.id)
        .eq('status', 'waiting')
        .lt('createdAt', todayStart.toISOString());

      if (waitingError) throw waitingError;

      // Combine and deduplicate tasks
      const allTasks = [...(todayTasks || []), ...(waitingTasks || [])];
      const uniqueTasks = Array.from(new Map(allTasks.map(task => [task.id, task])).values());

      const tasksList = uniqueTasks.map((task) => ({
        ...task,
        createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
        createdBy: (task as any).createdby || (task as any).createdBy || "",
      }));

      setTasks(tasksList);
    } catch (error) {
      console.error("Görevler yüklenirken hata:", error);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    const sortTasks = (list: Task[]) => {
      return [...list].sort((a, b) => {
        if (a.status === "completed" && b.status !== "completed") return 1;
        if (a.status !== "completed" && b.status === "completed") return -1;


        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (aTime !== bTime) return aTime - bTime;

        const aId = a.id || "";
        const bId = b.id || "";
        return aId.localeCompare(bId);
      });
    };

    if (hideCompleted) {
      setFilteredTasks(sortTasks(tasks.filter((task) => task.status !== "completed")));
    } else {
      setFilteredTasks(sortTasks(tasks));
    }
  }, [tasks, hideCompleted]);

  const handleCreateTask = async () => {
    if (!newTask.title) {
      Alert.alert("Hata", "Başlık zorunludur");
      return;
    }
    if (!currentUser?.id) {
      Alert.alert("Hata", "Kullanıcı bilgisi bulunamadı");
      return;
    }

    try {
      const selectedDate = newTask.createdAt || new Date();
      const taskToCreate = {
        ...newTask,
        createdAt: selectedDate,
        createdBy: currentUser.id,
      };

      const { data, error } = await supabase
        .from(TABLES.TASKS)
        .insert([taskToCreate])
        .select()
        .single();

      if (error) throw error;

      // Only pass necessary data to avoid circular references
      if (data) {
        await sendNewTaskNotification({
          id: data.id,
          title: data.title,
          status: data.status,
          createdAt: data.createdAt,
          createdBy: data.createdBy
        });
      }

      setNewTask({
        title: "",
        status: "waiting",
        createdAt: new Date(),
        createdBy: currentUser.id,
      });
      setModalVisible(false);
      loadTasks();
    } catch (error) {
      console.error("Görev oluşturma hatası:", (error as any).message);
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
      loadTasks();
    } catch (error) {
      console.error("Durum güncellenirken hata:", error);
      Alert.alert("Hata", "Durum güncellenirken bir hata oluştu");
    }
  };

  const toggleTaskDone = async (task: Task) => {
    const nextStatus: Task["status"] = task.status === "completed" ? "waiting" : "completed";
    const previousTasks = tasks;

    const optimisticallyUpdated = tasks.map((t) =>
      t.id === task.id ? { ...t, status: nextStatus } : t
    );
    setTasks(optimisticallyUpdated);
    if (selectedTask && selectedTask.id === task.id) {
      setSelectedTask({ ...selectedTask, status: nextStatus });
    }

    try {
      const { error } = await supabase
        .from(TABLES.TASKS)
        .update({ status: nextStatus })
        .eq("id", task.id);
      if (error) throw error;
    } catch (error) {
      console.error("Durum değiştirilirken hata:", error);
      setTasks(previousTasks);
      if (selectedTask && selectedTask.id === task.id) {
        setSelectedTask({ ...selectedTask, status: task.status });
      }
      Alert.alert("Hata", "Durum değiştirilirken bir hata oluştu");
    }
  };

  const handleDeleteTask = async () => {
    console.log("Attempting to delete task:", selectedTask?.id);
    if (!selectedTask?.id) {
      console.error("No task ID selected");
      return;
    }

    try {
      const { error, count, data } = await supabase
        .from(TABLES.TASKS)
        .delete()
        .eq("id", selectedTask.id)
        .select();

      console.log("Delete result:", { error, count, data });

      if (error) throw error;
      if (count === 0) {
        throw new Error("Görev silinemedi (bulunamadı veya yetki yok).");
      }

      setDetailModalVisible(false);
      loadTasks();
    } catch (error) {
      console.error("Görev silinirken hata (catch):", error);
      Alert.alert("Hata", "Görev silinemedi: " + (error as any).message);
    }
  };

  const handleSaveTask = async (title: string) => {
    if (!selectedTask?.id) return;
    try {
      const { error } = await supabase
        .from(TABLES.TASKS)
        .update({ title })
        .eq("id", selectedTask.id);
      if (error) throw error;

      setSelectedTask({ ...selectedTask, title });
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
      { value: "waiting", color: "#007AFF" },
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Görevlerim</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={({ item }) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const borderLeftColor = "#34C759";

          return (
            <View style={[
              styles.todoItem,
              { borderLeftColor: borderLeftColor },
            ]}>
              <TouchableOpacity
                style={[styles.checkbox, item.status === "completed" && styles.checkboxChecked]}
                onPress={() => toggleTaskDone(item)}
              >
                {item.status === "completed" && (
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
                    item.status === "completed" && styles.todoTitleCompleted,
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <View style={styles.todoMetaRow}>
                  <View
                    style={[
                      styles.statusDot,
                      item.status === "waiting" && { backgroundColor: "#007AFF" },
                      item.status === "completed" && { backgroundColor: "#34C759" },
                      item.status === "past_due" && { backgroundColor: "#FF3B30" },
                    ]}
                  />
                  <Text style={styles.todoMeta}>
                    {item.status === "waiting" && "Beklemede"}
                    {item.status === "completed" && "Tamamlanmış"}
                    {item.status === "past_due" && "Dünden Kalan"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          );
        }}
        keyExtractor={(item) => item.id || ""}
        contentContainerStyle={styles.listContainer}
      />

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
        onSave={handleSaveTask}
        isAdmin={false}
      />
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  hideCompletedButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hideCompletedText: {
    color: "#007AFF",
    fontSize: 14,
  },
  addButton: {
    backgroundColor: "#007AFF",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
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
    borderWidth: 1,
    borderColor: "#eee",
    overflow: "hidden",
    borderLeftWidth: 5, // Keep borderLeftWidth, color will be dynamic
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
  overdueItem: {
    position: "relative",
  },
  overdueIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: "#FF3B30",
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    zIndex: 1,
  },
  statusDropdown: {
    position: "absolute",
    top: 40,
    right: 40,
    backgroundColor: "#fff",
    borderRadius: 8,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.2)",
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
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
});

export default UserTaskList;
