import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { MaterialIcons as Icon } from "@expo/vector-icons";

type RootStackParamList = {
    LoginScreen: undefined;
    RegisterScreen: undefined;
    AdminDashboard: undefined;
    UserDashboard: undefined;
};

type RegisterScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    "RegisterScreen"
>;

const RegisterScreen = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const navigation = useNavigation<RegisterScreenNavigationProp>();
    const { signUp } = useAuth();
    const [loading, setLoading] = useState(false);
    const { colors, isDark } = useTheme();

    const handleRegister = async () => {
        if (!email || !password || !confirmPassword) {
            Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Hata", "Şifreler eşleşmiyor.");
            return;
        }

        try {
            setLoading(true);
            const user = await signUp(email, password);
            if (!user) {
                Alert.alert("Hata", "Kayıt işlemi başarısız oldu.");
                return;
            }
            // Navigation is handled automatically by App.tsx based on user state
        } catch (error) {
            console.log(error);
            Alert.alert("Hata", "Kayıt işlemi sırasında bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.logoContainer}>
                        <View style={[styles.logoBackground, , { backgroundColor: isDark ? colors.card : "#fff" }]}>
                            <Image
                                source={require("../../assets/icon.png")}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={[styles.title, { color: colors.text }]}>Vzbel</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Yeni Hesap Oluştur</Text>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground }]}>
                            <Icon
                                name="email"
                                size={24}
                                color={colors.textSecondary}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Email"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>

                        <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground }]}>
                            <Icon name="lock" size={24} color={colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Şifre"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!isPasswordVisible}
                                placeholderTextColor={colors.textSecondary}
                            />
                            <TouchableOpacity
                                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                                style={styles.eyeIcon}
                            >
                                <Icon
                                    name={isPasswordVisible ? "visibility" : "visibility-off"}
                                    size={24}
                                    color={colors.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground }]}>
                            <Icon name="lock-outline" size={24} color={colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Şifre Tekrar"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!isConfirmPasswordVisible}
                                placeholderTextColor={colors.textSecondary}
                            />
                            <TouchableOpacity
                                onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                                style={styles.eyeIcon}
                            >
                                <Icon
                                    name={isConfirmPasswordVisible ? "visibility" : "visibility-off"}
                                    size={24}
                                    color={colors.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? "Kayıt Olunuyor..." : "Kayıt Ol"}
                            </Text>
                            {!loading && <Icon name="arrow-forward" size={24} color="#fff" />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.linkButton}
                            onPress={() => navigation.navigate("LoginScreen")}
                        >
                            <Text style={styles.linkText}>Zaten hesabın var mı? Giriş Yap</Text>
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
    logoContainer: {
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 40,
    },
    logoBackground: {
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
    logo: {
        width: 80,
        height: 80,
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
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
        backgroundColor: "#28a745", // Green color for registration
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
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
        marginRight: 10,
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

export default RegisterScreen;
