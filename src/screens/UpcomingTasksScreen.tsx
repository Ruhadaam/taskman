import React, { useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { useTasks } from "../context/TaskContext";
import { useTheme } from "../context/ThemeContext";
import { Task } from "../types";
import TaskItem from "../components/tasks/TaskItem";
import TaskDetailModal from "../components/tasks/TaskDetailModal";
import ScreenHeader from "../components/layout/ScreenHeader";

// Locale Config: Türkçe Ayarları
LocaleConfig.locales["tr"] = {
  monthNames: [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ],
  monthNamesShort: [
    "Oca.",
    "Şub.",
    "Mar.",
    "Nis.",
    "May.",
    "Haz.",
    "Tem.",
    "Ağu.",
    "Eyl.",
    "Eki.",
    "Kas.",
    "Ara.",
  ],
  dayNames: [
    "Pazar",
    "Pazartesi",
    "Salı",
    "Çarşamba",
    "Perşembe",
    "Cuma",
    "Cumartesi",
  ],
  dayNamesShort: ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"],
  today: "Bugün",
};
LocaleConfig.defaultLocale = "tr";

// Okunaklı tarih başlığı üretir (Örn: 30 Mart Pazartesi)
const formatDisplayDateTR = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "long",
    weekday: "long",
  }).format(date);
};

export default function UpcomingTasksScreen() {
  const { tasks, updateTaskStatus, updateTask, deleteTask, getTurkeyDateKey } =
    useTasks();
  const { colors, isDark } = useTheme();

  const today = useMemo(() => getTurkeyDateKey(new Date()), [getTurkeyDateKey]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [completingTaskIds, setCompletingTaskIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Takvimde işaretlenecek günleri hesapla
  const markedDates = useMemo(() => {
    const marked: { [key: string]: any } = {};

    tasks
      .filter((t) => !t.isArchived)
      .forEach((task) => {
        if (!task.createdAt) return;
        const date = new Date(task.createdAt);
        const dateKey = getTurkeyDateKey(date);

        if (!marked[dateKey]) {
          marked[dateKey] = {
            marked: true,
            dotColor: colors.primary,
          };
        }
      });

    marked[selectedDate] = {
      ...marked[selectedDate],
      selected: true,
      selectedColor: colors.primary,
      selectedTextColor: "#ffffff",
    };

    return marked;
  }, [tasks, selectedDate, colors.primary]);

  // Seçili güne ait görevleri filtrele
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.createdAt || task.isArchived) return false;
      const dateKey = getTurkeyDateKey(new Date(task.createdAt));
      return dateKey === selectedDate;
    });
  }, [tasks, selectedDate, getTurkeyDateKey]);

  const toggleTaskDone = useCallback(
    (task: Task) => {
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
            updateTaskStatus(task.id!, "completed");
            const next = new Set(currentSet);
            next.delete(task.id!);
            return next;
          }
          return currentSet;
        });
      }, 400); // Synchronized with TaskItem Animated transition
    },
    [completingTaskIds, updateTaskStatus],
  );

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
      console.error("Status update error:", error);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask?.id) return;
    try {
      await deleteTask(selectedTask.id);
      setDetailModalVisible(false);
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleSaveTask = async (title: string, date: Date) => {
    if (!selectedTask?.id) return;
    try {
      await updateTask(selectedTask.id, { title, createdAt: date });
      setDetailModalVisible(false);
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: Task }) => (
      <TaskItem
        item={item}
        onToggle={() => toggleTaskDone(item)}
        onPress={handleTaskPress}
        isCompleting={item.id ? completingTaskIds.has(item.id) : false}
        borderLeftColor={
          item.status === "completed" ? colors.success : colors.primary
        }
        themeColors={colors}
      />
    ),
    [colors, completingTaskIds, toggleTaskDone],
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScreenHeader title="Takvim Planı" />

      <View
        style={[styles.calendarContainer, { backgroundColor: colors.card }]}
      >
        <Calendar
          theme={{
            backgroundColor: colors.card,
            calendarBackground: colors.card,
            textSectionTitleColor: colors.textSecondary,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: "#ffffff",
            todayTextColor: colors.primary,
            dayTextColor: colors.text,
            textDisabledColor: isDark ? "#444" : "#d9e1e8",
            dotColor: colors.primary,
            selectedDotColor: "#ffffff",
            arrowColor: colors.primary,
            monthTextColor: colors.text,
            textMonthFontWeight: "bold",
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14,
          }}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          monthFormat={"MMMM yyyy"}
          firstDay={1}
        />
      </View>

      <View style={[styles.listHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.listHeaderTitle, { color: colors.textSecondary }]}>
          {formatDisplayDateTR(selectedDate)}
        </Text>
      </View>

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id || Math.random().toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Planlanmış görev yok
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendarContainer: {
    paddingBottom: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 0.5,
  },
  listHeaderTitle: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
