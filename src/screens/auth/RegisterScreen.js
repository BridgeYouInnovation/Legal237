"use client"

import { useState } from "react"
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native"
import { Text, TextInput, Button, Card, Snackbar, useTheme } from "react-native-paper"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "../../stores/authStore"

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")

  const { register, isLoading } = useAuthStore()
  const { t } = useTranslation()
  const theme = useTheme()

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setSnackbarMessage("Please fill in all fields")
      setSnackbarVisible(true)
      return
    }

    if (password !== confirmPassword) {
      setSnackbarMessage("Passwords do not match")
      setSnackbarVisible(true)
      return
    }

    if (password.length < 6) {
      setSnackbarMessage("Password must be at least 6 characters")
      setSnackbarVisible(true)
      return
    }

    const result = await register(email, password, name)
    if (result.success) {
      setSnackbarMessage(t("auth.registerSuccess"))
      setSnackbarVisible(true)
    } else {
      setSnackbarMessage(result.error || "Registration failed")
      setSnackbarVisible(true)
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="headlineLarge" style={[styles.title, { color: theme.colors.primary }]}>
            Legal237
          </Text>
          <Text variant="titleMedium" style={[styles.subtitle, { color: theme.colors.onSurface }]}>
            {t("auth.createAccount")}
          </Text>
        </View>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <TextInput
              label={t("common.name")}
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label={t("common.email")}
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            <TextInput
              label={t("common.password")}
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
            />

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
            >
              {t("common.register")}
            </Button>

            <View style={styles.footer}>
              <Text style={{ color: theme.colors.onSurface }}>{t("auth.hasAccount")}</Text>
              <Button mode="text" onPress={() => navigation.navigate("Login")}>
                {t("common.login")}
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000}>
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
  },
  card: {
    elevation: 4,
  },
  cardContent: {
    padding: 20,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 12,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
})
