import React, { useEffect, useState, useRef } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  StyleSheet, 
  TextInput, 
  Platform, 
  Pressable, 
  Animated, 
  Dimensions,
  Keyboard,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons as Icon } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../../context/ThemeContext";
import { Task } from "../../types";
import { isToday, format } from "date-fns";
import { tr } from "date-fns/locale";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface TaskDetailModalProps {
  visible: boolean;
  onClose: () => void;
  selectedTask: Task | null;
  onStatusChange: (status: "waiting" | "completed") => void;
  onDeleteTask: () => void;
  onSave: (title: string, date: Date) => void;
  onConvertToRecurring?: (title: string, daysOfWeek?: number[]) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  visible,
  onClose,
  selectedTask,
  onDeleteTask,
  onSave,
  onConvertToRecurring
}) => {
  const [editTitle, setEditTitle] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const keyboardHeightAnim = useRef(new Animated.Value(0)).current;
  const { colors, isDark } = useTheme();
  const { bottom: safeBottom } = useSafeAreaInsets();

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardVisible(true);
        Animated.timing(keyboardHeightAnim, {
          toValue: e.endCoordinates.height,
          duration: Platform.OS === "ios" ? e.duration ?? 250 : 0,
          useNativeDriver: true,
        }).start();
      }
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      (e) => {
        setKeyboardVisible(false);
        Animated.timing(keyboardHeightAnim, {
          toValue: 0,
          duration: Platform.OS === "ios" ? e.duration ?? 250 : 0,
          useNativeDriver: true,
        }).start();
      }
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const RECURRING_PURPLE = "#9C27B0";
  const activeColor = colors.primary;

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const toggleAnim = useRef(new Animated.Value(0)).current;
  // Combined: slideAnim for entry/exit + keyboard offset (negative = move up)
  const cardTranslateY = useRef(
    Animated.add(slideAnim, Animated.multiply(keyboardHeightAnim, -1))
  ).current;
  const [isModalVisible, setIsModalVisible] = useState(visible);

  useEffect(() => {
    Animated.timing(toggleAnim, {
      toValue: isRecurring ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isRecurring]);

  const daysList = [
    { id: 1, label: "P" },
    { id: 2, label: "S" },
    { id: 3, label: "Ç" },
    { id: 4, label: "P" },
    { id: 5, label: "C" },
    { id: 6, label: "C" },
    { id: 0, label: "P" },
  ];

  useEffect(() => {
    if (visible) {
      setIsModalVisible(true);
      if (selectedTask) {
        setEditTitle(selectedTask.title);
        setSelectedDate(selectedTask.createdAt ? new Date(selectedTask.createdAt) : new Date());
        setIsRecurring(false);
        setSelectedDays([]);
      }
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 50,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setIsModalVisible(false);
      });
    }
  }, [visible, selectedTask]);

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Bugün";
    return format(date, "dd MMMM yyyy", { locale: tr });
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  const toggleDay = (dayId: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  if (!isModalVisible && !visible) return null;

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={isModalVisible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      {/* Dark backdrop */}
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)' }]}
        onPress={onClose}
      />

      {/* Card: single Animated.View, bottom fixed, keyboard offset via transform */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{ translateY: cardTranslateY }],
        }}
      >
        <View
          style={{
            width: '100%',
            maxHeight: SCREEN_HEIGHT * 0.85,
            backgroundColor: colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: keyboardVisible ? 16 : safeBottom + 16,
            shadowColor: isDark ? '#000' : '#888',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 20,
          }}
        >
            <View style={styles.sheetHandleContainer}>
              <View style={[styles.sheetHandle, { backgroundColor: isDark ? '#444' : colors.border }]} />
            </View>
            
            <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#333' : colors.border, justifyContent: 'flex-end' }]}>
              <View style={styles.headerIcons}>
                <TouchableOpacity
                  onPress={onDeleteTask}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ marginRight: 0 }}
                >
                  <Icon name="delete-outline" size={24} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={{ paddingBottom: 8 }}
            >
            <View style={styles.minimalInputContainer}>
              <TextInput
                style={[
                  styles.minimalInput,
                  { color: colors.text }
                ]}
                placeholder="Görev başlığı"
                placeholderTextColor={colors.textSecondary}
                value={editTitle}
                maxLength={isRecurring ? 15 : 30}
                onChangeText={setEditTitle}
              />
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.pillsContainer}
            >
              <TouchableOpacity
                style={[
                  styles.actionPill,
                  { 
                    borderColor: isRecurring ? colors.border : activeColor,
                    backgroundColor: isRecurring ? colors.inputBackground : activeColor + "15",
                    opacity: isRecurring ? 0.5 : 1
                  }
                ]}
                disabled={isRecurring}
                onPress={() => setShowDatePicker(true)}
              >
                <Icon name="calendar-today" size={16} color={isRecurring ? colors.textSecondary : activeColor} />
                <Text style={[styles.actionPillText, { color: isRecurring ? colors.textSecondary : activeColor }]}>
                  {selectedDate ? getDateLabel(selectedDate) : "Bugün"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionPill,
                  { 
                    borderColor: isRecurring ? activeColor : colors.border,
                    backgroundColor: isRecurring ? activeColor + "15" : colors.inputBackground,
                  }
                ]}
                onPress={() => {
                  setIsRecurring(!isRecurring);
                  if (!isRecurring) setShowDatePicker(false);
                }}
              >
                <Icon name={isRecurring ? "repeat-on" : "repeat"} size={16} color={isRecurring ? activeColor : colors.textSecondary} />
                <Text style={[styles.actionPillText, { color: isRecurring ? activeColor : colors.text }]}>
                  Tekrarla
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {showDatePicker && (
              <Animated.View style={{
                opacity: toggleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                maxHeight: toggleAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }),
                overflow: 'hidden'
              }}>
                <View style={[styles.iosPickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.iosPickerHeader, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(false)}
                      style={styles.iosPickerDoneButton}
                    >
                      <Text style={[styles.iosPickerDoneText, { color: activeColor }]}>Tamam</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? "spinner" : "default"}
                    onChange={handleDateChange}
                    themeVariant={isDark ? "dark" : "light"}
                  />
                </View>
              </Animated.View>
            )}



            <Animated.View style={{
              opacity: toggleAnim,
              maxHeight: toggleAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 200] }),
              transform: [{
                translateY: toggleAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] })
              }],
              overflow: 'hidden'
            }}>
              <View style={styles.daysContainer}>
                <View style={styles.daysHeader}>
                  <Text style={[styles.daysTitle, { color: colors.textSecondary }]}>Tekrarlanacak Günler</Text>
                </View>
                
                <View style={styles.daysRow}>
                  {daysList.map((day) => {
                    const isSelected = selectedDays.includes(day.id);
                    return (
                      <TouchableOpacity
                        key={day.id}
                        style={[
                          styles.dayButton,
                          { 
                            backgroundColor: isSelected ? activeColor : colors.inputBackground,
                            borderColor: isSelected ? activeColor : isDark ? '#444' : colors.border
                          }
                        ]}
                        onPress={() => toggleDay(day.id)}
                      >
                        <Text style={[styles.dayButtonText, { color: isSelected ? "#fff" : colors.text }]}>
                          {day.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

              </View>
            </Animated.View>

            <TouchableOpacity
              style={[
                styles.submitButton, 
                { 
                  backgroundColor: activeColor,
                  opacity: editTitle.trim() ? 1 : 0.6,
                  shadowColor: activeColor,
                }
              ]}
              disabled={!editTitle.trim()}
              onPress={() => {
                if (isRecurring && onConvertToRecurring) {
                  onConvertToRecurring(editTitle, selectedDays);
                } else {
                  onSave(editTitle, selectedDate);
                }
              }}
            >
              <Icon name={isRecurring ? "repeat" : "save"} size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitButtonText}>Değişiklikleri Kaydet</Text>
            </TouchableOpacity>
            </ScrollView>
          </View>
        </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    width: "100%",
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    elevation: 20,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  sheetHandleContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    marginRight: 16,
  },
  minimalInputContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  minimalInput: {
    fontSize: 24,
    fontWeight: "600",
    paddingVertical: 8,
  },
  pillsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    marginRight: 8,
  },
  actionPillText: {
    fontSize: 14,
    fontWeight: "600",
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    paddingRight: 65,
    fontSize: 16,
    fontWeight: '500',
  },
  charCount: {
    position: 'absolute',
    right: 12,
    bottom: 16,
    fontSize: 11,
    fontWeight: '600',
  },
  datePickerButton: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelHint: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  datePickerText: {
    fontSize: 15,
    fontWeight: "600",
  },
  iosPickerContainer: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
  },
  iosPickerHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 8,
    borderBottomWidth: 1,
  },
  iosPickerDoneButton: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  iosPickerDoneText: {
    fontSize: 16,
    fontWeight: "700",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  checkboxSubLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  daysContainer: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  daysTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginLeft: 4,
  },
  everyDayChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  everyDayText: {
    fontSize: 11,
    fontWeight: "700",
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  daysHint: {
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 4,
    opacity: 0.8,
  },
  dayButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  submitButton: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: 'row',
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});

export default TaskDetailModal;
