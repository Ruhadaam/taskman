import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, TABLES } from "../config/lib";
import { Task } from "../types";
import { useAuth } from "./AuthContext";
import { Alert } from "react-native";

interface TaskContextType {
    tasks: Task[];
    loading: boolean;
    loadTasks: () => Promise<void>;
    addTask: (task: Omit<Task, "id" | "createdAt">) => Promise<void>;
    updateTaskStatus: (taskId: string, status: Task["status"]) => Promise<void>;
    updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    getTurkeyDayRange: () => { start: string; end: string };
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            loadTasks();
        } else {
            setTasks([]);
        }
    }, [user]);

    const loadTasks = React.useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            let query = supabase.from(TABLES.TASKS).select("*");

            if (!user.isAdmin) {
                query = query.eq("createdBy", user.id);
            }

            const { data, error } = await query;

            if (error) throw error;

            const turkeyOffset = 3 * 60 * 60 * 1000;
            const tasksList = data?.map((task) => {
                const rawDate = task.createdAt ? new Date(task.createdAt) : new Date();
                // If we store TR time as UTC (Z), we must shift it BACK to true UTC
                // so the app's standard date logic treats it correctly.
                const trueUTCDate = new Date(rawDate.getTime() - turkeyOffset);

                return {
                    ...task,
                    createdAt: trueUTCDate,
                    createdBy: (task as any).createdby || (task as any).createdBy || "",
                };
            }) || [];

            tasksList.sort((a, b) => {
                const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return aTime - bTime;
            });

            setTasks(tasksList);
        } catch (error) {
            console.error("Görevler yüklenirken hata:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const toTurkeyISOString = (date: Date) => {
        const turkeyOffset = 3 * 60 * 60 * 1000;
        // Shift to TR time numbers but claim it's UTC ('Z')
        // This makes it show the TR numbers in the Supabase Dashboard
        const trTime = new Date(date.getTime() + turkeyOffset);

        const pad = (num: number) => num.toString().padStart(2, '0');
        const pad3 = (num: number) => num.toString().padStart(3, '0');

        const yyyy = trTime.getUTCFullYear();
        const MM = pad(trTime.getUTCMonth() + 1);
        const dd = pad(trTime.getUTCDate());
        const HH = pad(trTime.getUTCHours());
        const mm = pad(trTime.getUTCMinutes());
        const ss = pad(trTime.getUTCSeconds());
        const sss = pad3(trTime.getUTCMilliseconds());

        return `${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}.${sss}Z`;
    };

    const getTurkeyDayRange = () => {
        const turkeyOffset = 3 * 60 * 60 * 1000;
        const now = new Date();
        const trNow = new Date(now.getTime() + turkeyOffset);

        const pad = (num: number) => num.toString().padStart(2, '0');

        const yyyy = trNow.getUTCFullYear();
        const MM = pad(trNow.getUTCMonth() + 1);
        const dd = pad(trNow.getUTCDate());

        return {
            start: `${yyyy}-${MM}-${dd}T00:00:00.000Z`,
            end: `${yyyy}-${MM}-${dd}T23:59:59.999Z`
        };
    };

    const addTask = React.useCallback(async (newTask: Omit<Task, "id" | "createdAt">) => {
        if (!user?.id) return;

        const dateObj = (newTask as any).createdAt || new Date();
        const selectedDate = dateObj instanceof Date ? dateObj : new Date(dateObj);

        const tempId = Math.random().toString();
        const optimisticTask: Task = {
            ...newTask,
            id: tempId,
            createdAt: selectedDate,
            status: 'waiting',
            createdBy: user.id
        };

        setTasks(prev => [...prev, optimisticTask]);

        try {
            const turkeyDateString = toTurkeyISOString(selectedDate);

            const { data, error } = await supabase
                .from(TABLES.TASKS)
                .insert([
                    {
                        title: newTask.title,
                        status: "waiting",
                        createdAt: turkeyDateString,
                        createdBy: user.id,
                    },
                ])
                .select()
                .single();

            if (error) throw error;

            const rawDate = data.createdAt ? new Date(data.createdAt) : new Date();
            const turkeyOffset = 3 * 60 * 60 * 1000;
            const trueUTCDate = new Date(rawDate.getTime() - turkeyOffset);

            const createdTask = {
                ...data,
                createdAt: trueUTCDate,
                createdBy: data.createdby || data.createdBy || ""
            };

            setTasks(prev => prev.map(t => t.id === tempId ? createdTask : t));

        } catch (error) {
            console.error("Görev ekleme hatası:", error);
            Alert.alert("Hata", "Görev eklenirken bir hata oluştu");
            setTasks(prev => prev.filter(t => t.id !== tempId));
        }
    }, [user]);

    const updateTaskStatus = React.useCallback(async (taskId: string, status: Task["status"]) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));

        try {
            const { error } = await supabase
                .from(TABLES.TASKS)
                .update({ status })
                .eq("id", taskId);

            if (error) throw error;
        } catch (error) {
            console.error("Status update error", error);
            loadTasks();
        }
    }, [loadTasks]);

    const updateTask = React.useCallback(async (taskId: string, updates: Partial<Task>) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));

        try {
            const { error } = await supabase
                .from(TABLES.TASKS)
                .update(updates)
                .eq("id", taskId);

            if (error) throw error;
        } catch (error) {
            console.error("Update error", error);
            loadTasks();
        }
    }, [loadTasks]);

    const deleteTask = React.useCallback(async (taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        try {
            const { error } = await supabase
                .from(TABLES.TASKS)
                .delete()
                .eq("id", taskId);

            if (error) throw error;
        } catch (error) {
            console.error("Delete error", error);
            loadTasks();
        }
    }, [loadTasks]);

    const value = React.useMemo(() => ({
        tasks, loading, loadTasks, addTask, updateTaskStatus, updateTask, deleteTask, getTurkeyDayRange
    }), [tasks, loading, loadTasks, addTask, updateTaskStatus, updateTask, deleteTask]);

    return (
        <TaskContext.Provider value={value}>
            {children}
        </TaskContext.Provider>
    );
};

export const useTasks = () => {
    const context = useContext(TaskContext);
    if (context === undefined) {
        throw new Error("useTasks must be used within a TaskProvider");
    }
    return context;
};
