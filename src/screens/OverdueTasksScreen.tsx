import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTasks } from "../context/TaskContext";
import { useTheme } from "../context/ThemeContext";
import { Task } from "../types";
import TaskDetailModal from "../components/tasks/TaskDetailModal";
import TaskItem from "../components/tasks/TaskItem";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import ScreenHeader from "../components/layout/ScreenHeader";

// LayoutAnimation functionality is replaced by the Animated API inside TaskItem for New Architecture compatibility.

export default function OverdueTasksScreen() {
  const navigation = useNavigation();
  const { tasks, updateTaskStatus, updateTask, deleteTask } = useTasks();
  const { colors } = useTheme();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [completingTaskIds, setCompletingTaskIds] = useState<Set<string>>(
    new Set(),
  );

  // Action Modal State
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionTask, setActionTask] = useState<Task | null>(null);

  // Memoize filtered tasks
  const { getTurkeyDateKey } = useTasks();

  const filteredTasks = useMemo(() => {
    const todayKey = getTurkeyDateKey(new Date());

    const overdue = tasks.filter((task) => {
      if (!task.createdAt || task.isArchived) return false;
      // Filter for tasks created in Turkey days BEFORE today and NOT completed
      return (
        task.status === "waiting" &&
        getTurkeyDateKey(new Date(task.createdAt)) < todayKey
      );
    });

    // Consistent sorting
    return overdue.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return aTime - bTime;
    });
  }, [tasks, getTurkeyDateKey]);

  const toggleTaskDone = (task: Task) => {
    if (!task.id) return;

    if (completingTaskIds.has(task.id)) {
      setCompletingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id!);
        return next;
      });
      return;
    }

    setCompletingTaskIds((prev) => new Set(prev).add(task.id!));

    setTimeout(() => {
      setCompletingTaskIds((currentSet) => {
        if (currentSet.has(task.id!)) {
          updateContextTaskStatus(task, "completed");
          const next = new Set(currentSet);
          next.delete(task.id!);
          return next;
        }
        return currentSet;
      });
    }, 400); // Wait for Animated.View fade-out in TaskItem
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

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setDetailModalVisible(true);
  };

  const handleStatusChange = async (newStatus: "waiting" | "completed") => {
    if (!selectedTask?.id) return;

    try {
      await updateTaskStatus(selectedTask.id, newStatus);
      setSelectedTask({ ...selectedTask, status: newStatus });
    } catch (error) {
      console.error("Durum güncellenirken hata:", error);
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
        createdAt: date,
      });
      setSelectedTask({
        ...selectedTask,
        title,
        createdAt: date,
      });
      setDetailModalVisible(false);
    } catch (error) {
      console.error("Görev güncellenirken hata:", error);
    }
  };

  const handleAddToToday = async (task: Task) => {
    if (!task.id) return;
    try {
      await updateTask(task.id, { createdAt: new Date() });
    } catch (error) {
      console.error("Bugüne eklenirken hata:", error);
    }
  };

  const handleArchive = async (task: Task) => {
    if (!task.id) return;
    try {
      await updateTask(task.id, { isArchived: true });
    } catch (error) {
      console.error("Archive error:", error);
    }
  };

  const handleOpenActionModal = (task: Task) => {
    setActionTask(task);
    setActionModalVisible(true);
  };

  const handleCloseActionModal = () => {
    setActionModalVisible(false);
    setActionTask(null);
  };

  const executeAddToToday = () => {
    if (actionTask) handleAddToToday(actionTask);
    handleCloseActionModal();
  };

  const executeArchive = () => {
    if (actionTask) handleArchive(actionTask);
    handleCloseActionModal();
  };

  const renderOverdueItem = useCallback(
    ({ item }: { item: Task }) => (
      <TaskItem
        item={item}
        onToggle={toggleTaskDone}
        onPress={handleTaskPress}
        isCompleting={item.id ? completingTaskIds.has(item.id) : false}
        borderLeftColor="#FF3B30"
        date={
          item.createdAt
            ? new Date(item.createdAt).toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                weekday: "long",
              })
            : ""
        }
        rightContent={
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleOpenActionModal(item)}
          >
            <Icon name="edit" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        }
        themeColors={colors}
      />
    ),
    [colors, completingTaskIds],
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScreenHeader title="Kalan Görevler" />
      <FlatList
        data={filteredTasks}
        renderItem={renderOverdueItem}
        keyExtractor={(item) => item.id || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
      />

      <TaskDetailModal
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        selectedTask={selectedTask}
        onStatusChange={handleStatusChange}
        onDeleteTask={handleDeleteTask}
        onSave={handleSaveTask}
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={actionModalVisible}
        onRequestClose={handleCloseActionModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseActionModal}
        >
          <View
            style={[
              styles.actionModalContent,
              { backgroundColor: colors.card },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Seçenekler
            </Text>

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.modalActionButton,
                  styles.todayButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={executeAddToToday}
              >
                <Icon name="today" size={20} color="#fff" />
                <Text style={styles.modalActionButtonText}>Bugüne Ekle</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionButton, styles.archiveButton]}
                onPress={executeArchive}
              >
                <Icon name="archive" size={20} color="#fff" />
                <Text style={styles.modalActionButtonText}>Arşivle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  editButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionModalContent: {
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 340,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 8,
  },
  todayButton: {
    backgroundColor: "#007AFF",
  },
  archiveButton: {
    backgroundColor: "#8E8E93",
  },
  modalActionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
