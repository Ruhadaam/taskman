import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet, TextInput, Platform } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../../context/ThemeContext";
import { Task } from "../../types";

interface TaskDetailModalProps {
  visible: boolean;
  onClose: () => void;
  selectedTask: Task | null;
  onStatusChange: (
    status: "waiting" | "completed"
  ) => void;
  onDeleteTask: () => void;
  onSave: (title: string, date: Date) => void;
  onConvertToRecurring?: (title: string) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  visible,
  onClose,
  selectedTask,
  onDeleteTask,
  onSave,
  onConvertToRecurring
}) => {
  if (!selectedTask) return null;

  const [editTitle, setEditTitle] = useState(selectedTask.title);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const { colors, isDark } = useTheme();

  useEffect(() => {
    if (selectedTask) {
      setEditTitle(selectedTask.title);
      setSelectedDate(selectedTask.createdAt ? new Date(selectedTask.createdAt) : new Date());
      setIsRecurring(false);
    }
  }, [selectedTask]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#34C759";
      case "past_due":
        return "#FF3B30";
      default:
        return "#007AFF";
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Europe/Istanbul",
    }).format(date);
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.primary }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Görevi Düzenle</Text>
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

          <View style={styles.dateSection}>
            <TouchableOpacity
              style={[styles.datePickerButton, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}
              onPress={() => setShowDatePicker(true)}
            >
              <View style={styles.datePickerContent}>
                <Icon name="calendar-today" size={20} color={colors.primary} />
                <Text style={[styles.datePickerText, { color: colors.text }]}>
                  {formatDate(selectedDate)}
                </Text>
              </View>
            </TouchableOpacity>

            {showDatePicker && (
              <>
                {Platform.OS === "ios" && (
                  <View style={styles.iosPickerContainer}>
                    <View style={[styles.iosPickerHeader, { borderBottomColor: colors.border }]}>
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                        style={styles.iosPickerDoneButton}
                      >
                        <Text style={[styles.iosPickerDoneText, { color: colors.primary }]}>Tamam</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display="spinner"
                      onChange={handleDateChange}
                      themeVariant={isDark ? "dark" : "light"}
                    />
                  </View>
                )}
                {Platform.OS === "android" && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}
              </>
            )}
          </View>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setIsRecurring(!isRecurring)}
          >
            <View style={[styles.checkbox, isRecurring && styles.checkboxChecked]}>
              {isRecurring && <Icon name="check" size={16} color="#fff" />}
            </View>
            <Text style={[styles.checkboxLabel, { color: colors.text }]}>Sabit Görev</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: isRecurring ? '#9C27B0' : colors.primary }]}
            onPress={() => {
              if (isRecurring && onConvertToRecurring) {
                onConvertToRecurring(editTitle);
              } else {
                onSave(editTitle, selectedDate);
              }
            }}
          >
            <Text style={styles.submitButtonText}>
              {isRecurring ? "Sabit Görev Olarak Kaydet" : "Kaydet"}
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
    borderColor: "#007AFF",
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
  dateSection: {
    marginBottom: 15, // Adjusted to match CreateTaskModal logic (wrapper might not be needed but helps structure)
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    // marginBottom: 15, // handled by dateSection or directly
    backgroundColor: "#fff",
  },
  datePickerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  datePickerText: {
    fontSize: 16,
    color: "#333",
  },
  submitButton: {
    backgroundColor: "#007AFF",
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
  iosPickerContainer: {
    marginBottom: 15,
  },
  iosPickerHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  iosPickerDoneButton: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  iosPickerDoneText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
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

export default TaskDetailModal;
