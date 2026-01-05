import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    SafeAreaView,
    ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useAuth } from "../context/AuthContext";
import { MaterialIcons as Icon } from "@expo/vector-icons";

type RootStackParamList = {
    LoginScreen: undefined;
    RegisterScreen: undefined;
    ResetPasswordScreen: undefined;
    UserDashboard: undefined;
};

type ResetPasswordScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    "ResetPasswordScreen"
>;

interface ResetPasswordScreenProps {
    onComplete?: () => void;
}

const ResetPasswordScreen = ({ onComplete }: ResetPasswordScreenProps) => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation<ResetPasswordScreenNavigationProp>();
    const { updatePassword, signOut } = useAuth();

    const handleResetPassword = async () => {
        // Validasyonlar
        if (!password || !confirmPassword) {
            Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
            return;
        }

        if (password.length < 6) {
            Alert.alert("Hata", "Şifre en az 6 karakter olmalıdır.");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Hata", "Şifreler eşleşmiyor.");
            return;
        }

        setLoading(true);
        console.log("handleResetPassword - Geliştirme modu: Şifre güncelleniyor...");
        try {
            await updatePassword(password);
            console.log("handleResetPassword - Şifre başarıyla güncellendi!");
            Alert.alert(
                "Başarılı",
                "Şifreniz başarıyla güncellendi. Lütfen yeni şifrenizle giriş yapın.",
                [
                    {
                        text: "Tamam",
                        onPress: async () => {
                            console.log("handleResetPassword - Tamam tıklandı, çıkış yapılıyor...");
                            if (onComplete) onComplete();
                            await signOut();
                            navigation.reset({
                                index: 0,
                                routes: [{ name: "LoginScreen" }],
                            });
                        },
                    },
                ]
            );
        } catch (error: any) {
            console.error("handleResetPassword - Hata yakalandı:", error);
            Alert.alert(
                "Hata",
                error?.message || "Şifre güncellenirken bir hata oluştu."
            );
        } finally {
            console.log("handleResetPassword - Loading kapatılıyor");
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.headerContainer}>
                        <View style={styles.iconBackground}>
                            <Icon name="lock-reset" size={60} color="#007AFF" />
                        </View>
                        <Text style={styles.title}>Şifre Sıfırlama</Text>
                        <Text style={styles.subtitle}>
                            Lütfen yeni şifrenizi girin
                        </Text>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <Icon name="lock" size={24} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Yeni Şifre"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!isPasswordVisible}
                                placeholderTextColor="#999"
                            />
                            <TouchableOpacity
                                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                                style={styles.eyeIcon}
                            >
                                <Icon
                                    name={isPasswordVisible ? "visibility" : "visibility-off"}
                                    size={24}
                                    color="#666"
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Icon name="lock" size={24} color="#666" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Yeni Şifre (Tekrar)"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!isConfirmPasswordVisible}
                                placeholderTextColor="#999"
                            />
                            <TouchableOpacity
                                onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                                style={styles.eyeIcon}
                            >
                                <Icon
                                    name={isConfirmPasswordVisible ? "visibility" : "visibility-off"}
                                    size={24}
                                    color="#666"
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleResetPassword}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.buttonText}>Şifreyi Güncelle</Text>
                                    <Icon name="check" size={24} color="#fff" />
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.linkButton}
                            onPress={() => navigation.navigate("LoginScreen")}
                        >
                            <Text style={styles.linkText}>Giriş ekranına dön</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        paddingBottom: 40,
    },
    headerContainer: {
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 40,
    },
    iconBackground: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        paddingHorizontal: 40,
    },
    formContainer: {
        paddingHorizontal: 30,
        marginTop: 10,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        marginBottom: 20,
        paddingHorizontal: 15,
        height: 50,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: "#333",
    },
    eyeIcon: {
        padding: 5,
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#007AFF",
        borderRadius: 12,
        height: 50,
        marginTop: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "bold",
        marginRight: 10,
        color: "white",
    },
    linkButton: {
        marginTop: 20,
        alignItems: "center",
    },
    linkText: {
        color: "#007AFF",
        fontSize: 14,
        fontWeight: "600",
    },
});

export default ResetPasswordScreen;
