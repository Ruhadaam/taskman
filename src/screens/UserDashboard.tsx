import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
} from "react-native";

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useTasks } from "../context/TaskContext";
import { useTheme } from "../context/ThemeContext";
import { Task, RecurringTask } from "../types";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import TaskDetailModal from "../components/tasks/TaskDetailModal";
import RecurringTaskDetailModal from "../components/tasks/RecurringTaskDetailModal";
import CreateTaskModal from "../components/tasks/CreateTaskModal";
import TaskItem from "../components/tasks/TaskItem";
import ScreenHeader from "../components/layout/ScreenHeader";

type RootStackParamList = {
  LoginScreen: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Combined type for both regular and recurring tasks
type DisplayTask =
  | (Task & { isRecurringTask?: false })
  | (RecurringTask & {
      isRecurringTask: true;
      status: "waiting" | "completed";
    });

export default function UserDashboard() {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const {
    tasks,
    recurringTasks,
    addTask,
    addRecurringTask,
    completeRecurringTask,
    uncompleteRecurringTask,
    updateTaskStatus,
    updateTask,
    deleteTask,
    updateRecurringTask,
    deleteRecurringTask,
    convertTaskToRecurring,
    convertRecurringToTask,
  } = useTasks();

  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [recurringModalVisible, setRecurringModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedRecurringTask, setSelectedRecurringTask] =
    useState<RecurringTask | null>(null);
  const [newTask, setNewTask] = useState<Task>({
    title: "",
    status: "waiting",
    createdAt: new Date(),
    createdBy: user?.id || "",
  });
  const [completingTaskIds, setCompletingTaskIds] = useState<Set<string>>(
    new Set(),
  );

  // Memoize filtered tasks (combining regular + recurring)
  const { getTurkeyDateKey, getTurkeyDayOfWeek } = useTasks();

  const filteredTasks = useMemo(() => {
    if (!user?.id) return [];

    const todayStr = getTurkeyDateKey(new Date());
    const todayDayOfWeek = getTurkeyDayOfWeek(new Date());

    const todayTasks: DisplayTask[] = tasks
      .filter((task) => {
        if (task.isArchived) return false;
        const taskDate = task.createdAt ? new Date(task.createdAt) : new Date();
        return getTurkeyDateKey(taskDate) === todayStr;
      })
      .map((t) => ({ ...t, isRecurringTask: false as const }));

    const visibleRecurring: DisplayTask[] = recurringTasks
      .filter((task) => {
        // Eğer gün kısıtlaması yoksa her gün göster
        if (!task.daysOfWeek || task.daysOfWeek.length === 0) return true;
        
        // Veritabanından string veya number gelebildiği için hepsini sayıya çevirip kontrol ediyoruz
        const taskDays = task.daysOfWeek.map(d => Number(d));
        return taskDays.includes(todayDayOfWeek);
      })
      .map((task) => {
        const isCompletedToday =
          task.lastCompletedAt &&
          getTurkeyDateKey(new Date(task.lastCompletedAt)) === todayStr;
        return {
          ...task,
          isRecurringTask: true as const,
          status: (isCompletedToday ? "completed" : "waiting") as
            | "completed"
            | "waiting",
        };
      });

    const combined = [...todayTasks, ...visibleRecurring];
    return combined.sort((a, b) => {
      if (a.status !== b.status) {
        if (a.status === "completed") return 1;
        if (b.status === "completed") return -1;
      }
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return aTime - bTime;
    });
  }, [tasks, recurringTasks, user?.id, getTurkeyDateKey, getTurkeyDayOfWeek]);

  const handleCreateTask = async () => {
    if (!newTask.title) {
      Alert.alert("Hata", "Başlık zorunludur");
      return;
    }

    if (!user?.id) return;

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
    newStatus: "waiting" | "completed" | "past_due",
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

    if (completingTaskIds.has(task.id)) {
      setCompletingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id!);
        return next;
      });
      return;
    }

    if (task.isRecurringTask) {
      if (task.status === "completed") {
        uncompleteRecurringTask(task.id!);
        return;
      }

      setCompletingTaskIds((prev) => new Set(prev).add(task.id!));

      setTimeout(() => {
        setCompletingTaskIds((currentSet) => {
          if (currentSet.has(task.id!)) {
            completeRecurringTask(task.id!);
            const next = new Set(currentSet);
            next.delete(task.id!);
            return next;
          }
          return currentSet;
        });
      }, 400); // Synchronized with TaskItem exit animation
      return;
    }

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
    }, 400); // Synchronized with TaskItem exit animation
  };

  const updateContextTaskStatus = async (
    task: Task,
    newStatus: Task["status"],
  ) => {
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
      await updateTask(selectedTask.id, { title, createdAt: date });
      setSelectedTask({ ...selectedTask, title, createdAt: date });
      setDetailModalVisible(false);
    } catch (error) {
      console.error("Görev güncellenirken hata:", error);
      Alert.alert("Hata", "Görev güncellenirken bir hata oluştu");
    }
  };

  const handleConvertToRecurring = async (title: string, daysOfWeek?: number[]) => {
    if (!selectedTask?.id) return;
    try {
      await convertTaskToRecurring(selectedTask.id, title, daysOfWeek);
      setDetailModalVisible(false);
    } catch (error) {
      console.error("Dönüştürme hatası:", error);
      Alert.alert("Hata", "Görev dönüştürülürken bir hata oluştu");
    }
  };

  const handleConvertToNormal = async (title: string) => {
    if (!selectedRecurringTask?.id) return;
    try {
      await convertRecurringToTask(selectedRecurringTask.id, title);
      setRecurringModalVisible(false);
    } catch (error) {
      console.error("Dönüştürme hatası:", error);
      Alert.alert("Hata", "Görev dönüştürülürken bir hata oluştu");
    }
  };

  const getBorderColor = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return "#34C759";
      case "waiting":
        return "#FFCC00";
      case "past_due":
        return "#FF3B30";
      default:
        return "#FFCC00";
    }
  };

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setDetailModalVisible(true);
  };

  const handleRecurringTaskPress = (task: RecurringTask) => {
    setSelectedRecurringTask(task);
    setRecurringModalVisible(true);
  };

  const handleSaveRecurringTask = async (title: string, daysOfWeek?: number[]) => {
    if (!selectedRecurringTask?.id) return;
    try {
      await updateRecurringTask(selectedRecurringTask.id, title, daysOfWeek);
      setRecurringModalVisible(false);
    } catch (error) {
      console.error("Tekrarlanan görev güncellenirken hata:", error);
      Alert.alert("Hata", "Tekrarlanan görev güncellenirken bir hata oluştu");
    }
  };

  const handleDeleteRecurringTask = async () => {
    if (!selectedRecurringTask?.id) return;
    try {
      await deleteRecurringTask(selectedRecurringTask.id);
      setRecurringModalVisible(false);
    } catch (error) {
      console.error("Sabit görev silinirken hata:", error);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScreenHeader title="Bugün" />

      <FlatList
        data={filteredTasks}
        renderItem={({ item }) => (
          <TaskItem
            item={item as Task}
            onToggle={() => toggleTaskDone(item)}
            onPress={() =>
              item.isRecurringTask
                ? handleRecurringTaskPress(item as unknown as RecurringTask)
                : handleTaskPress(item as Task)
            }
            isCompleting={item.id ? completingTaskIds.has(item.id) : false}
            borderLeftColor={
              item.isRecurringTask ? "#9C27B0" : getBorderColor(item.status)
            }
            themeColors={colors}
          />
        )}
        keyExtractor={(item) => item.clientId || item.id || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
      />

      <TouchableOpacity
        style={[styles.fab, { bottom: 20 + insets.bottom }]}
        onPress={() => {
          setNewTask((prev) => ({ ...prev, createdAt: new Date() }));
          setModalVisible(true);
        }}
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
        onCreateRecurringTask={(title, daysOfWeek) => {
          addRecurringTask(title, daysOfWeek);
          setNewTask({ ...newTask, title: "" });
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
        onConvertToRecurring={handleConvertToRecurring}
      />

      <RecurringTaskDetailModal
        visible={recurringModalVisible}
        onClose={() => setRecurringModalVisible(false)}
        selectedTask={selectedRecurringTask}
        onDeleteTask={handleDeleteRecurringTask}
        onSave={handleSaveRecurringTask}
        onConvertToNormal={handleConvertToNormal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  fab: {
    position: "absolute",
    right: 20,
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
});
