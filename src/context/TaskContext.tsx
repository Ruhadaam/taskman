import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, TABLES } from "../config/lib";
import { Task, RecurringTask } from "../types";
import { useAuth } from "./AuthContext";
import { Alert, Platform, UIManager } from "react-native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TaskContextType {
    tasks: Task[];
    recurringTasks: RecurringTask[];
    loading: boolean;
    loadTasks: () => Promise<void>;
    addTask: (task: Omit<Task, "id" | "createdAt">) => Promise<void>;
    addRecurringTask: (title: string) => Promise<void>;
    completeRecurringTask: (taskId: string) => Promise<void>;
    uncompleteRecurringTask: (taskId: string) => Promise<void>;
    updateTaskStatus: (taskId: string, status: Task["status"]) => Promise<void>;
    updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    updateRecurringTask: (taskId: string, title: string) => Promise<void>;
    deleteRecurringTask: (taskId: string) => Promise<void>;
    convertTaskToRecurring: (taskId: string, title: string) => Promise<void>;
    convertRecurringToTask: (taskId: string, title: string, date?: Date) => Promise<void>;
    getTurkeyDateKey: (date: Date) => string;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const toTurkeyISOString = (date: Date) => {
    return date.toISOString();
};

const getTurkeyDateKey = (date: Date) => {
    const parts = new Intl.DateTimeFormat("tr-TR", {
        timeZone: "Europe/Istanbul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date);

    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    const yyyy = get("year");
    const MM = get("month");
    const dd = get("day");
    return `${yyyy}-${MM}-${dd}`;
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
    const [loading, setLoading] = useState(false);

    const loadTasks = React.useCallback(async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const { data, error } = await supabase.from(TABLES.TASKS).select("*").eq("createdBy", user.id);
            if (error) throw error;

            const tasksList = data?.map((task) => ({
                ...task,
                status: task.status,
                createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
                createdBy: task.createdby || task.createdBy || "",
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

    const loadRecurringTasks = React.useCallback(async () => {
        if (!user?.id) return;
        try {
            const { data, error } = await supabase.from(TABLES.RECURRING_TASKS).select("*").eq("createdby", user.id);
            if (error) throw error;
            const recurringList = data?.map((task) => ({
                ...task,
                lastCompletedAt: task.lastcompletedat ? new Date(task.lastcompletedat) : undefined,
                createdAt: task.createdat ? new Date(task.createdat) : undefined,
            })) || [];
            setRecurringTasks(recurringList);
        } catch (error) {
            console.error("Sabit görevler yüklenirken hata:", error);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            loadTasks();
            loadRecurringTasks();
        } else {
            setTasks([]);
            setRecurringTasks([]);
        }
    }, [user, loadTasks, loadRecurringTasks]);


    const addTask = React.useCallback(async (newTask: Omit<Task, "id" | "createdAt">) => {
        if (!user?.id) return;

        if (newTask.title.length > 25) {
            Alert.alert("Hata", "Normal görev başlığı en fazla 25 karakter olabilir.");
            return;
        }

        const todayKey = getTurkeyDateKey(new Date());
        const activeTasksCount = tasks.filter(t =>
            !t.isArchived &&
            t.status !== "completed" &&
            t.createdAt instanceof Date &&
            getTurkeyDateKey(t.createdAt) === todayKey
        ).length;

        if (activeTasksCount >= 5) {
            Alert.alert("Hata", "En fazla 5 aktif görev ekleyebilirsiniz.");
            return;
        }

        const dateObj = (newTask as any).createdAt || new Date();
        const selectedDate = dateObj instanceof Date ? dateObj : new Date(dateObj);
        const tempId = Math.random().toString();
        const optimisticTask: Task = { ...newTask, id: tempId, createdAt: selectedDate, status: 'waiting', createdBy: user.id };
        setTasks(prev => [...prev, optimisticTask]);

        try {
            const { data, error } = await supabase.from(TABLES.TASKS).insert([{
                title: newTask.title, status: "waiting", createdAt: toTurkeyISOString(selectedDate), createdBy: user.id
            }]).select().single();
            if (error) throw error;
            setTasks(prev => prev.map(t => t.id === tempId ? { ...data, createdAt: selectedDate, createdBy: data.createdby || data.createdBy || "" } : t));
        } catch (error) {
            console.error("Görev ekleme hatası:", error);
            setTasks(prev => prev.filter(t => t.id !== tempId));
        }
    }, [user?.id, tasks]);

    const updateTaskStatus = React.useCallback(async (taskId: string, status: Task["status"]) => {
        const updateDate = toTurkeyISOString(new Date());
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status, updatedAt: updateDate } : t));
        try {
            const { error } = await supabase.from(TABLES.TASKS).update({ status, updatedAt: updateDate }).eq("id", taskId);
            if (error) throw error;
        } catch (error) {
            console.error("Status update error", error);
            loadTasks();
        }
    }, [loadTasks]);

    const updateTask = React.useCallback(async (taskId: string, updates: Partial<Task>) => {
        if (updates.title && updates.title.length > 25) {
            Alert.alert("Hata", "Görev başlığı en fazla 25 karakter olabilir.");
            return;
        }
        const updateDate = toTurkeyISOString(new Date());
        const dbUpdates: any = { ...updates, updatedAt: updateDate };
        if (updates.createdAt) {
            const d = updates.createdAt instanceof Date ? updates.createdAt : new Date(updates.createdAt);
            dbUpdates.createdAt = toTurkeyISOString(d);
        }
        
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates, updatedAt: updateDate } : t));
        try {
            const { error } = await supabase.from(TABLES.TASKS).update(dbUpdates).eq("id", taskId);
            if (error) throw error;
        } catch (error) {
            console.error("Update error", error);
            loadTasks();
        }
    }, [loadTasks]);

    const deleteTask = React.useCallback(async (taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        try {
            const { error } = await supabase.from(TABLES.TASKS).delete().eq("id", taskId);
            if (error) throw error;
        } catch (error) {
            console.error("Delete error", error);
            loadTasks();
        }
    }, [loadTasks]);

    const addRecurringTask = React.useCallback(async (title: string) => {
        if (!user?.id) return;
        if (title.length > 15) {
            Alert.alert("Hata", "Sabit görev başlığı en fazla 15 karakter olabilir.");
            return;
        }
        if (recurringTasks.length >= 5) {
            Alert.alert("Hata", "En fazla 5 sabit görev ekleyebilirsiniz.");
            return;
        }
        try {
            const trNow = new Date();
            const { data, error } = await supabase.from(TABLES.RECURRING_TASKS).insert([{ title, createdby: user.id, createdat: toTurkeyISOString(trNow) }]).select().single();
            if (error) throw error;
            setRecurringTasks(prev => [...prev, { ...data, lastCompletedAt: undefined, createdAt: data.createdat ? new Date(data.createdat) : new Date() }]);
        } catch (error) {
            console.error("Sabit görev ekleme hatası:", error);
        }
    }, [user?.id, recurringTasks.length]);

    const completeRecurringTask = React.useCallback(async (taskId: string) => {
        const now = new Date();
        setRecurringTasks(prev => prev.map(t => t.id === taskId ? { ...t, lastCompletedAt: now } : t));
        try {
            const { error } = await supabase.from(TABLES.RECURRING_TASKS).update({ lastcompletedat: toTurkeyISOString(now) }).eq("id", taskId);
            if (error) throw error;
        } catch (error) {
            console.error("Sabit görev tamamlama hatası:", error);
            loadRecurringTasks();
        }
    }, [loadRecurringTasks]);

    const uncompleteRecurringTask = React.useCallback(async (taskId: string) => {
        setRecurringTasks(prev => prev.map(t => t.id === taskId ? { ...t, lastCompletedAt: undefined } : t));
        try {
            const { error } = await supabase.from(TABLES.RECURRING_TASKS).update({ lastcompletedat: null }).eq("id", taskId);
            if (error) throw error;
        } catch (error) {
            console.error("Sabit görev geri alma hatası:", error);
            loadRecurringTasks();
        }
    }, [loadRecurringTasks]);

    const updateRecurringTask = React.useCallback(async (taskId: string, title: string) => {
        if (title.length > 15) {
            Alert.alert("Hata", "Sabit görev başlığı en fazla 15 karakter olabilir.");
            return;
        }
        setRecurringTasks(prev => prev.map(t => t.id === taskId ? { ...t, title } : t));
        try {
            const { error } = await supabase.from(TABLES.RECURRING_TASKS).update({ title }).eq("id", taskId);
            if (error) throw error;
        } catch (error) {
            console.error("Sabit görev güncelleme hatası:", error);
            loadRecurringTasks();
        }
    }, [loadRecurringTasks]);

    const deleteRecurringTask = React.useCallback(async (taskId: string) => {
        setRecurringTasks(prev => prev.filter(t => t.id !== taskId));
        try {
            const { error } = await supabase.from(TABLES.RECURRING_TASKS).delete().eq("id", taskId);
            if (error) throw error;
        } catch (error) {
            console.error("Sabit görev silme hatası:", error);
            loadRecurringTasks();
        }
    }, [loadRecurringTasks]);

    const convertTaskToRecurring = React.useCallback(async (taskId: string, title: string) => {
        if (title.length > 15) {
            Alert.alert("Hata", "Sabit görev başlığı en fazla 15 karakter olabilir.");
            return;
        }
        if (recurringTasks.length >= 5) {
            Alert.alert("Hata", "Sürekli görevleriniz zaten 5 adet.");
            return;
        }
        setTasks(prev => prev.filter(t => t.id !== taskId));
        const tempId = "temp-rec-" + Math.random().toString();
        const trNow = new Date();
        setRecurringTasks(prev => [...prev, { id: tempId, title, createdBy: user?.id || "", createdAt: trNow }]);
        try {
            await supabase.from(TABLES.TASKS).delete().eq("id", taskId);
            const { data, error } = await supabase.from(TABLES.RECURRING_TASKS).insert([{ title, createdby: user?.id, createdat: toTurkeyISOString(trNow) }]).select().single();
            if (error) throw error;
            setRecurringTasks(prev => prev.map(t => t.id === tempId ? { ...data, lastCompletedAt: undefined, createdAt: data.createdat ? new Date(data.createdat) : new Date() } : t));
        } catch (error) {
            loadTasks();
            loadRecurringTasks();
        }
    }, [tasks, recurringTasks.length, user?.id, loadTasks, loadRecurringTasks]);

    const convertRecurringToTask = React.useCallback(async (taskId: string, title: string, date?: Date) => {
        if (title.length > 25) {
            Alert.alert("Hata", "Normal görev başlığı en fazla 25 karakter olabilir.");
            return;
        }
        const todayKey = getTurkeyDateKey(new Date());
        const activeTasksCount = tasks.filter(t => !t.isArchived && t.status !== "completed" && t.createdAt instanceof Date && getTurkeyDateKey(t.createdAt) === todayKey).length;
        if (activeTasksCount >= 5) {
            Alert.alert("Hata", "Normal görevleriniz zaten 5 adet.");
            return;
        }
        setRecurringTasks(prev => prev.filter(t => t.id !== taskId));
        const tempId = "temp-task-" + Math.random().toString();
        const selectedDate = date || new Date();
        setTasks(prev => [...prev, { id: tempId, title, status: "waiting", createdAt: selectedDate, createdBy: user?.id || "" }]);
        try {
            await supabase.from(TABLES.RECURRING_TASKS).delete().eq("id", taskId);
            const { data, error } = await supabase.from(TABLES.TASKS).insert([{ title, status: "waiting", createdAt: toTurkeyISOString(selectedDate), createdBy: user?.id }]).select().single();
            if (error) throw error;
            setTasks(prev => prev.map(t => t.id === tempId ? { ...data, createdAt: selectedDate, createdBy: data.createdby || data.createdBy || "" } : t));
        } catch (error) {
            loadTasks();
            loadRecurringTasks();
        }
    }, [tasks, user?.id, loadTasks, loadRecurringTasks]);

    const value = React.useMemo(() => ({
        tasks, recurringTasks, loading, loadTasks, addTask, addRecurringTask, completeRecurringTask, uncompleteRecurringTask, updateTaskStatus, updateTask, deleteTask, updateRecurringTask, deleteRecurringTask, convertTaskToRecurring, convertRecurringToTask, getTurkeyDateKey
    }), [tasks, recurringTasks, loading, loadTasks, addTask, addRecurringTask, completeRecurringTask, uncompleteRecurringTask, updateTaskStatus, updateTask, deleteTask, updateRecurringTask, deleteRecurringTask, convertTaskToRecurring, convertRecurringToTask, getTurkeyDateKey]);

    return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTasks = () => {
    const context = useContext(TaskContext);
    if (context === undefined) throw new Error("useTasks must be used within a TaskProvider");
    return context;
};
