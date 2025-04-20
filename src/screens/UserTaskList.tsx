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
import Icon from "react-native-vector-icons/MaterialIcons";
import TaskCard from "../components/tasks/TaskCard";
import TaskDetailModal from "../components/tasks/TaskDetailModal";
import CreateTaskModal from "../components/tasks/CreateTaskModal";
import { useAuth } from "../context/AuthContext";
import { sendNewTaskNotification } from "../services/notificationService";

const UserTaskList = () => {
  const { user: currentUser } = useAuth();
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
    createdBy: currentUser?.id || "",
  });
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
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
    if (!currentUser?.id) return;

    try {
      // Kullanıcının oluşturduğu görevler
      const { data: createdTasks, error: createdError } = await supabase
        .from(TABLES.TASKS)
        .select("*")
        .eq("createdBy", currentUser.id);

      if (createdError) throw createdError;

      // Kullanıcıya atanan görevler
      const { data: assignedTasks, error: assignedError } = await supabase
        .from(TABLES.TASKS)
        .select("*")
        .contains("assignedTo", [currentUser.id]);

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
    loadUsers();
    loadTasks();
  }, []);

  useEffect(() => {
    if (hideCompleted) {
      setFilteredTasks(tasks.filter((task) => task.status !== "completed"));
    } else {
      setFilteredTasks(tasks);
    }
  }, [tasks, hideCompleted]);

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
    if (!currentUser?.id) {
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
            createdBy: currentUser.id,
          },
        ])
        .select()
        .single();
      sendNewTaskNotification(data);
      if (error) throw error;

      setNewTask({
        title: "",
        description: "",
        dueDate: new Date(),
        assignedTo: [],
        status: "waiting",
        createdAt: new Date(),
        createdBy: currentUser.id,
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Görevlerim</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.hideCompletedButton}
            onPress={() => setHideCompleted(!hideCompleted)}
          >
            <Icon
              name={hideCompleted ? "check-box" : "check-box-outline-blank"}
              size={24}
              color="#4CD964"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Icon name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={({ item }) => (
          <TaskCard
            item={item}
            users={users}
            onPress={() => {
              setSelectedTask(item);
              setDetailModalVisible(true);
            }}
            getInitials={getInitials}
            getRandomColor={getRandomColor}
          />
        )}
        keyExtractor={(item) => item.id || ""}
        contentContainerStyle={styles.listContainer}
      />

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
    elevation: 5,
    zIndex: 1000,
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
