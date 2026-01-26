import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    Platform,
    UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Agenda, AgendaSchedule } from "react-native-calendars";
import { useAuth } from "../context/AuthContext";
import { useTasks } from "../context/TaskContext";
import { useTheme } from "../context/ThemeContext";
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
    LoginScreen: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function UpcomingTasksScreen() {
    const { user } = useAuth();
    const navigation = useNavigation<NavigationProp>();
    const { tasks } = useTasks();
    const { colors, isDark } = useTheme();

    const [items, setItems] = useState<AgendaSchedule>({});

    useEffect(() => {
        const newItems: AgendaSchedule = {};

        // Fill with tasks
        tasks.forEach(task => {
            if (!task.createdAt || task.isArchived) return;
            const date = new Date(task.createdAt);
            const dateString = date.toISOString().split('T')[0];

            if (!newItems[dateString]) {
                newItems[dateString] = [];
            }
            newItems[dateString].push({
                ...task,
                name: task.title,
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
            <View style={[styles.item, { backgroundColor: colors.card, borderLeftColor: colors.primary }, isCompleted && { borderLeftColor: colors.success, opacity: 0.7 }]}>
                <View style={styles.itemContent}>
                    <Text style={[styles.itemTitle, { color: colors.text }, isCompleted && styles.itemTextCompleted]}>{task.title}</Text>
                </View>
                <View style={styles.statusIndicator}>
                    {/* Only Visual Indicator */}
                    {isCompleted ? (
                        <Icon name="check-circle" size={16} color={colors.success} />
                    ) : (
                        <Icon name="schedule" size={16} color={colors.primary} />
                    )}
                </View>
            </View>
        );
    };

    const renderEmptyDate = () => {
        return (
            <View style={styles.emptyDate}>
                <Text style={[styles.emptyDateText, { color: colors.textSecondary }]}>Bu tarihte görev yok</Text>
            </View>
        );
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Agenda
                items={items}
                selected={today}
                renderItem={renderItem}
                renderEmptyDate={renderEmptyDate}
                renderEmptyData={() => {
                    return (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Yüklenecek veri yok</Text>
                        </View>
                    );
                }}
                rowHasChanged={(r1: any, r2: any) => {
                    return r1.id !== r2.id || r1.status !== r2.status || r1.title !== r2.title;
                }}
                showClosingKnob={true}
                theme={{
                    // Agenda Theme
                    agendaDayTextColor: colors.textSecondary,
                    agendaDayNumColor: colors.text,
                    agendaTodayColor: colors.primary,
                    agendaKnobColor: colors.primary,

                    // Calendar Theme
                    calendarBackground: colors.card,
                    backgroundColor: colors.background,

                    dayTextColor: colors.text,
                    monthTextColor: colors.text,
                    textSectionTitleColor: colors.textSecondary,
                    textDisabledColor: isDark ? '#444' : '#d9e1e8',

                    selectedDayBackgroundColor: colors.primary,
                    selectedDayTextColor: '#ffffff',

                    todayTextColor: colors.primary,
                    dotColor: colors.primary,
                    selectedDotColor: '#ffffff',
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
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
    }
});
