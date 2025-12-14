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

            const tasksList = data?.map((task) => ({
                ...task,
                createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
                createdBy: (task as any).createdby || (task as any).createdBy || "",
            })) || [];

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

    const addTask = React.useCallback(async (newTask: Omit<Task, "id" | "createdAt">) => {
        if (!user?.id) return;

        const tempId = Math.random().toString();
        const optimisticTask: Task = {
            ...newTask,
            id: tempId,
            createdAt: new Date(),
            status: 'waiting',
            createdBy: user.id
        };

        setTasks(prev => [...prev, optimisticTask]);

        try {
            const selectedDate = (newTask as any).createdAt || new Date();
            const { data, error } = await supabase
                .from(TABLES.TASKS)
                .insert([
                    {
                        title: newTask.title,
                        description: newTask.description || "",
                        status: "waiting",
                        createdAt: selectedDate instanceof Date ? selectedDate.toISOString() : selectedDate,
                        createdBy: user.id,
                    },
                ])
                .select()
                .single();

            if (error) throw error;

            const createdTask = {
                ...data,
                createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
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
        tasks, loading, loadTasks, addTask, updateTaskStatus, updateTask, deleteTask
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
