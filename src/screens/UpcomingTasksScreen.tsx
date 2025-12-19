import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    Platform,
    UIManager,
    SafeAreaView,
} from "react-native";
import { Agenda, AgendaSchedule } from "react-native-calendars";
import { useAuth } from "../context/AuthContext";
import { useTasks } from "../context/TaskContext";
import { Task } from "../types";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

type RootStackParamList = {
    UserTaskList: undefined;
    Notifications: undefined;
    LoginScreen: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function UpcomingTasksScreen() {
    const { user } = useAuth();
    const navigation = useNavigation<NavigationProp>();
    const { tasks, loadTasks } = useTasks();

    const [items, setItems] = useState<AgendaSchedule>({});

    useFocusEffect(
        React.useCallback(() => {
            loadTasks();
        }, [])
    );

    useEffect(() => {
        const newItems: AgendaSchedule = {};

        // Fill with tasks
        tasks.forEach(task => {
            if (!task.createdAt) return;
            const date = new Date(task.createdAt);
            const dateString = date.toISOString().split('T')[0];

            if (!newItems[dateString]) {
                newItems[dateString] = [];
            }
            newItems[dateString].push({
                ...task,
                height: 80, // Approximate height for agenda
                day: dateString
            });
        });
        setItems(newItems);
    }, [tasks]);

    const renderItem = (item: any, firstItemInDay: boolean) => {
        const task = item as Task;
        const isCompleted = task.status === 'completed';

        return (
            <View style={[styles.item, isCompleted && styles.itemCompleted]}>
                <View style={styles.itemContent}>
                    <Text style={[styles.itemTitle, isCompleted && styles.itemTextCompleted]}>{task.title}</Text>
                </View>
                <View style={styles.statusIndicator}>
                    {/* Only Visual Indicator */}
                    {isCompleted ? (
                        <Icon name="check-circle" size={16} color="#34C759" />
                    ) : (
                        <Icon name="schedule" size={16} color="#007AFF" />
                    )}
                </View>
            </View>
        );
    };

    const renderEmptyDate = () => {
        return (
            <View style={styles.emptyDate}>
                <Text style={styles.emptyDateText}>Bu tarihte görev yok</Text>
            </View>
        );
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <SafeAreaView style={styles.container}>
            <Agenda
                items={items}
                selected={today}
                renderItem={renderItem}
                renderEmptyDate={renderEmptyDate}
                rowHasChanged={(r1: any, r2: any) => {
                    return r1.id !== r2.id || r1.status !== r2.status || r1.title !== r2.title;
                }}
                showClosingKnob={true}
                theme={{
                    agendaDayTextColor: '#888',
                    agendaDayNumColor: '#333',
                    agendaTodayColor: '#007AFF',
                    agendaKnobColor: '#007AFF',
                    selectedDayBackgroundColor: '#007AFF',
                    dotColor: '#007AFF',
                    todayTextColor: '#007AFF',
                    // Ensure centered today
                    calendarBackground: '#ffffff',
                }}
            // Force refresh on mount by key if needed, or rely on 'selected' prop
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        
    },
    item: {
        backgroundColor: "white",
        flex: 1,
        borderRadius: 8,
        padding: 12,
        marginRight: 10,
        marginTop: 17,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
    },
    itemCompleted: {
        opacity: 0.7,
        borderLeftColor: '#34C759',
    },
    itemContent: {
        flex: 1,
        marginRight: 10,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    itemTextCompleted: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    statusIndicator: {
        padding: 0,
    },
    emptyDate: {
        height: 15,
        flex: 1,
        paddingTop: 30,
        alignItems: 'center',
    },
    emptyDateText: {
        color: '#ccc',
        fontSize: 12,
    }
});
