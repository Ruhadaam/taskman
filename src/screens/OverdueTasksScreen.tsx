import React, { useState, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Platform,
    UIManager,
    LayoutAnimation,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTasks } from "../context/TaskContext";
import { Task } from "../types";
import TaskDetailModal from "../components/tasks/TaskDetailModal";
import TaskItem from "../components/tasks/TaskItem";

if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function OverdueTasksScreen() {
    const navigation = useNavigation();
    const { tasks, updateTaskStatus, updateTask, deleteTask, getTurkeyDayRange } = useTasks();

    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [completingTaskIds, setCompletingTaskIds] = useState<Set<string>>(new Set());

    // Memoize filtered tasks
    const filteredTasks = useMemo(() => {
        const range = getTurkeyDayRange();
        const todayStart = new Date(range.start);

        const overdue = tasks.filter((task) => {
            const taskDate = task.createdAt ? new Date(task.createdAt) : new Date();
            // Filter for tasks created BEFORE today and NOT completed
            return task.status === "waiting" && taskDate < todayStart;
        });

        // Consistent sorting
        return overdue.sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return aTime - bTime;
        });
    }, [tasks]);

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

    const handleTaskPress = (task: Task) => {
        setSelectedTask(task);
        setDetailModalVisible(true);
    };

    const handleStatusChange = async (
        newStatus: "waiting" | "completed"
    ) => {
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

    const handleSaveTask = async (title: string) => {
        if (!selectedTask?.id) return;
        try {
            await updateTask(selectedTask.id, { title });
            setSelectedTask({ ...selectedTask, title });
            setDetailModalVisible(false);
        } catch (error) {
            console.error("Görev güncellenirken hata:", error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Kalan Görevler</Text>
            </View>
            <FlatList
                data={filteredTasks}
                renderItem={({ item }) => (
                    <TaskItem
                        item={item}
                        onToggle={toggleTaskDone}
                        onPress={handleTaskPress}
                        isCompleting={item.id ? completingTaskIds.has(item.id) : false}
                        borderLeftColor="#FF3B30"
                        date={item.createdAt ? new Date(item.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }) : ''}
                    />
                )}
                keyExtractor={(item) => item.id || ""}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
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
        padding: 20,
        paddingTop: 60,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#333",
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
    dateText: {
        fontSize: 12,
        color: "#666",
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 50
    },
    emptyText: {
        fontSize: 16,
        color: '#999'
    }
});
