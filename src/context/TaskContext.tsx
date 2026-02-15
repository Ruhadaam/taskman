import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, TABLES } from "../config/lib";
import { Task, RecurringTask } from "../types";
import { useAuth } from "./AuthContext";
import { Alert } from "react-native";

interface TaskContextType {
    tasks: Task[];
    recurringTasks: RecurringTask[];
    loading: boolean;
    loadTasks: () => Promise<void>;
    addTask: (task: Omit<Task, "id" | "createdAt">) => Promise<void>;
    addRecurringTask: (title: string) => Promise<void>;
    completeRecurringTask: (taskId: string) => Promise<void>;
    updateTaskStatus: (taskId: string, status: Task["status"]) => Promise<void>;
    updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    updateRecurringTask: (taskId: string, title: string) => Promise<void>;
    deleteRecurringTask: (taskId: string) => Promise<void>;
    convertTaskToRecurring: (taskId: string, title: string) => Promise<void>;
    convertRecurringToTask: (taskId: string, title: string, date?: Date) => Promise<void>;
    getTurkeyDayRange: () => { start: string; end: string };
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            loadTasks();
            loadRecurringTasks();
        } else {
            setTasks([]);
            setRecurringTasks([]);
        }
    }, [user]);

    const loadTasks = React.useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            let query = supabase.from(TABLES.TASKS).select("*").eq("createdBy", user.id);



            const { data, error } = await query;

            if (error) throw error;

            const tasksList = data?.map((task) => {
                const rawDate = task.createdAt ? new Date(task.createdAt) : new Date();

                return {
                    ...task,
                    status: task.status,
                    createdAt: rawDate,
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

    const loadRecurringTasks = React.useCallback(async () => {
        if (!user?.id) return;

        try {
            const { data, error } = await supabase
                .from(TABLES.RECURRING_TASKS)
                .select("*")
                .eq("createdby", user.id);

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
            const { data, error } = await supabase
                .from(TABLES.TASKS)
                .insert([
                    {
                        title: newTask.title,
                        status: "waiting",
                        createdAt: selectedDate.toISOString(),
                        createdBy: user.id,
                    },
                ])
                .select()
                .single();

            if (error) throw error;

            const createdTask = {
                ...data,
                createdAt: selectedDate,
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

    const addRecurringTask = React.useCallback(async (title: string) => {
        if (!user?.id) return;

        try {
            const { data, error } = await supabase
                .from(TABLES.RECURRING_TASKS)
                .insert([
                    {
                        title,
                        createdby: user.id,
                    },
                ])
                .select()
                .single();

            if (error) throw error;

            const newRecurringTask: RecurringTask = {
                ...data,
                lastCompletedAt: undefined,
                createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            };

            setRecurringTasks(prev => [...prev, newRecurringTask]);
        } catch (error) {
            console.error("Sabit görev ekleme hatası:", error);
            Alert.alert("Hata", "Sabit görev eklenirken bir hata oluştu");
        }
    }, [user]);

    const completeRecurringTask = React.useCallback(async (taskId: string) => {
        const now = new Date();

        // Optimistic update
        setRecurringTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, lastCompletedAt: now } : t
        ));

        try {
            const { error } = await supabase
                .from(TABLES.RECURRING_TASKS)
                .update({ lastcompletedat: now.toISOString() })
                .eq("id", taskId);

            if (error) throw error;
        } catch (error) {
            console.error("Sabit görev tamamlama hatası:", error);
            loadRecurringTasks();
        }
    }, [loadRecurringTasks]);

    const updateRecurringTask = React.useCallback(async (taskId: string, title: string) => {
        setRecurringTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, title } : t
        ));

        try {
            const { error } = await supabase
                .from(TABLES.RECURRING_TASKS)
                .update({ title })
                .eq("id", taskId);

            if (error) throw error;
        } catch (error) {
            console.error("Sabit görev güncelleme hatası:", error);
            loadRecurringTasks();
        }
    }, [loadRecurringTasks]);

    const deleteRecurringTask = React.useCallback(async (taskId: string) => {
        setRecurringTasks(prev => prev.filter(t => t.id !== taskId));

        try {
            const { error } = await supabase
                .from(TABLES.RECURRING_TASKS)
                .delete()
                .eq("id", taskId);

            if (error) throw error;
        } catch (error) {
            console.error("Sabit görev silme hatası:", error);
            loadRecurringTasks();
        }
    }, [loadRecurringTasks]);

    const convertTaskToRecurring = React.useCallback(async (taskId: string, title: string) => {
        // 1. Remove from tasks (optimistic)
        const taskToDelete = tasks.find(t => t.id === taskId);
        setTasks(prev => prev.filter(t => t.id !== taskId));

        // 2. Add to recurring tasks (optimistic)
        const tempId = "temp-rec-" + Math.random().toString();
        const optimisticRecurring: RecurringTask = {
            id: tempId,
            title,
            createdBy: user?.id || "",
            createdAt: new Date(),
        };
        setRecurringTasks(prev => [...prev, optimisticRecurring]);

        try {
            // 3. Delete from tasks DB
            const { error: deleteError } = await supabase
                .from(TABLES.TASKS)
                .delete()
                .eq("id", taskId);

            if (deleteError) throw deleteError;

            // 4. Add to recurring tasks DB
            const { data, error: insertError } = await supabase
                .from(TABLES.RECURRING_TASKS)
                .insert([{
                    title,
                    createdby: user?.id,
                }])
                .select()
                .single();

            if (insertError) throw insertError;

            // 5. Update optimistic recurring task with real data
            const newRecurringTask: RecurringTask = {
                ...data,
                lastCompletedAt: undefined,
                createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            };
            setRecurringTasks(prev => prev.map(t => t.id === tempId ? newRecurringTask : t));

        } catch (error) {
            console.error("Task conversion error:", error);
            // Revert changes on error would be ideal, but for now strict reloading is safer
            loadTasks();
            loadRecurringTasks();
            Alert.alert("Hata", "Görev dönüştürülürken bir hata oluştu");
        }
    }, [tasks, user?.id, loadTasks, loadRecurringTasks]);

    const convertRecurringToTask = React.useCallback(async (taskId: string, title: string, date?: Date) => {
        // 1. Remove from recurring tasks (optimistic)
        setRecurringTasks(prev => prev.filter(t => t.id !== taskId));

        // 2. Add to tasks (optimistic)
        const tempId = "temp-task-" + Math.random().toString();
        const selectedDate = date || new Date();
        const optimisticTask: Task = {
            id: tempId,
            title,
            status: "waiting",
            createdAt: selectedDate,
            createdBy: user?.id || "",
        };
        setTasks(prev => [...prev, optimisticTask]);

        try {
            // 3. Delete from recurring tasks DB
            const { error: deleteError } = await supabase
                .from(TABLES.RECURRING_TASKS)
                .delete()
                .eq("id", taskId);

            if (deleteError) throw deleteError;

            // 4. Add to tasks DB
            const { data, error: insertError } = await supabase
                .from(TABLES.TASKS)
                .insert([{
                    title,
                    status: "waiting",
                    createdAt: selectedDate.toISOString(),
                    createdBy: user?.id,
                }])
                .select()
                .single();

            if (insertError) throw insertError;

            // 5. Update optimistic task with real data
            const createdTask = {
                ...data,
                createdAt: selectedDate,
                createdBy: data.createdby || data.createdBy || ""
            };
            setTasks(prev => prev.map(t => t.id === tempId ? createdTask : t));

        } catch (error) {
            console.error("Recurring conversion error:", error);
            loadTasks();
            loadRecurringTasks();
            Alert.alert("Hata", "Görev dönüştürülürken bir hata oluştu");
        }
    }, [user?.id, loadTasks, loadRecurringTasks]);

    const value = React.useMemo(() => ({
        tasks, recurringTasks, loading, loadTasks, addTask, addRecurringTask, completeRecurringTask, updateTaskStatus, updateTask, deleteTask, updateRecurringTask, deleteRecurringTask, convertTaskToRecurring, convertRecurringToTask, getTurkeyDayRange
    }), [tasks, recurringTasks, loading, loadTasks, addTask, addRecurringTask, completeRecurringTask, updateTaskStatus, updateTask, deleteTask, updateRecurringTask, deleteRecurringTask, convertTaskToRecurring, convertRecurringToTask]);

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
