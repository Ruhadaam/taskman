import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet, TextInput } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { RecurringTask } from "../../types";

interface RecurringTaskDetailModalProps {
    visible: boolean;
    onClose: () => void;
    selectedTask: RecurringTask | null;
    onDeleteTask: () => void;
    onSave: (title: string) => void;
    onConvertToNormal?: (title: string) => void;
}

const RecurringTaskDetailModal: React.FC<RecurringTaskDetailModalProps> = ({
    visible,
    onClose,
    selectedTask,
    onDeleteTask,
    onSave,
    onConvertToNormal
}) => {
    if (!selectedTask) return null;

    const [editTitle, setEditTitle] = useState(selectedTask.title);
    const [isRecurring, setIsRecurring] = useState(true);
    const { colors } = useTheme();

    useEffect(() => {
        if (selectedTask) {
            setEditTitle(selectedTask.title);
            setIsRecurring(true);
        }
    }, [selectedTask]);

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: '#9C27B0' }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Sürekli Görevi Düzenle</Text>
                        <View style={styles.headerIcons}>
                            <TouchableOpacity
                                onPress={() => {
                                    try {
                                        onDeleteTask();
                                    } catch (e) {
                                        console.error("Error calling onDeleteTask:", e);
                                    }
                                }}
                            >
                                <Icon name="delete" size={24} color={colors.danger} style={{ marginRight: 15 }} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onClose}>
                                <Icon name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
                        placeholder="Görev Başlığı"
                        placeholderTextColor={colors.textSecondary}
                        value={editTitle}
                        onChangeText={setEditTitle}
                    />

                    <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => setIsRecurring(!isRecurring)}
                    >
                        <View style={[styles.checkbox, isRecurring && styles.checkboxChecked]}>
                            {isRecurring && <Icon name="check" size={16} color="#fff" />}
                        </View>
                        <Text style={[styles.checkboxLabel, { color: colors.text }]}>Sürekli Görev</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: isRecurring ? '#9C27B0' : '#007AFF' }]}
                        onPress={() => {
                            if (!isRecurring && onConvertToNormal) {
                                onConvertToNormal(editTitle);
                            } else {
                                onSave(editTitle);
                            }
                        }}
                    >
                        <Text style={styles.submitButtonText}>
                            {!isRecurring ? "Normal Görev Olarak Kaydet" : "Kaydet"}
                        </Text>
                    </TouchableOpacity>

                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 20,
        width: "90%",
        maxHeight: "80%",
        borderWidth: 2,
        borderColor: "#9C27B0",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 2,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
        flex: 1,
    },
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 10,
        marginBottom: 15,
        fontSize: 16,
    },
    submitButton: {
        backgroundColor: "#9C27B0",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10,
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    checkboxContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: "#ccc",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },
    checkboxChecked: {
        backgroundColor: "#9C27B0",
        borderColor: "#9C27B0",
    },
    checkboxLabel: {
        fontSize: 16,
    },
});

export default RecurringTaskDetailModal;
