"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { Text, List, Switch, Button, Divider, useTheme, Dialog, Portal, RadioButton } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useAuthStore } from "../../stores/authStore"
import { useThemeStore } from "../../stores/themeStore"
import { changeLanguage } from "../../i18n/i18n"

export default function SettingsScreen({ navigation }) {
  const [languageDialogVisible, setLanguageDialogVisible] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("en")

  const { user, logout, subscription } = useAuthStore()
  const { isDarkMode, toggleTheme } = useThemeStore()
  const { t, i18n } = useTranslation()
  const theme = useTheme()

  useEffect(() => {
    // Set current language when component mounts
    setSelectedLanguage(i18n.language || 'en')
  }, [i18n.language])

  const handleLanguageChange = async (language) => {
    try {
      setSelectedLanguage(language)
      await changeLanguage(language) // This will persist to AsyncStorage and update i18n
      setLanguageDialogVisible(false)
    } catch (error) {
      console.error('Error changing language:', error)
      Alert.alert('Error', 'Failed to change language. Please try again.')
    }
  }

  const handleLogout = () => {
    Alert.alert(content.logoutTitle, content.logoutMessage, [
      { text: content.cancel, style: "cancel" },
      { text: content.logout, style: "destructive", onPress: logout },
    ])
  }

  const handleSupport = () => {
    Alert.alert(content.supportTitle, content.supportMessage, [{ text: content.ok }])
  }

  const getLocalizedContent = () => {
    if (i18n.language === 'fr') {
      return {
        title: "Paramètres",
        profile: "Profil",
        preferences: "Préférences",
        support: "Support",
        language: "Langue",
        darkMode: "Mode Sombre",
        enabled: "Activé",
        disabled: "Désactivé",
        accountType: "Type de Compte",
        unlimited: "Illimité",
        guestUser: "Utilisateur Invité",
        registeredUser: "Utilisateur Enregistré",
        userSince: "Membre depuis",
        getHelp: "Obtenir de l'aide et nous contacter",
        about: "À propos de Legal237",
        version: "Version 1.0.0",
        logout: "Se déconnecter",
        logoutTitle: "Se déconnecter",
        logoutMessage: "Êtes-vous sûr de vouloir vous déconnecter ?",
        cancel: "Annuler",
        supportTitle: "Support",
        supportMessage: "Contactez-nous à support@legal237.com ou appelez +237 123 456 789",
        ok: "OK"
      }
    } else {
      return {
        title: "Settings",
        profile: "Profile",
        preferences: "Preferences",
        support: "Support",
        language: "Language",
        darkMode: "Dark Mode",
        enabled: "Enabled",
        disabled: "Disabled",
        accountType: "Account Type",
        unlimited: "Unlimited",
        guestUser: "Guest User",
        registeredUser: "Registered User",
        userSince: "Member since",
        getHelp: "Get help and contact us",
        about: "About Legal237",
        version: "Version 1.0.0",
        logout: "Logout",
        logoutTitle: "Logout",
        logoutMessage: "Are you sure you want to logout?",
        cancel: "Cancel",
        supportTitle: "Support",
        supportMessage: "Contact us at support@legal237.com or call +237 123 456 789",
        ok: "OK"
      }
    }
  }

  const content = getLocalizedContent()

  // Helper function to get account type
  const getAccountType = () => {
    if (!user) return content.guestUser
    if (user.id === "anonymous") return content.guestUser
    return content.registeredUser
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
            {content.title}
          </Text>
        </View>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {content.profile}
          </Text>

          <List.Item
            title={user?.name || "User"}
            description={user?.email}
            left={(props) => <List.Icon {...props} icon="account" />}
            style={styles.listItem}
          />

          <List.Item
            title={content.accountType}
            description={getAccountType()}
            left={(props) => <List.Icon {...props} icon="card-account-details" />}
            style={styles.listItem}
          />
        </View>

        <Divider style={styles.divider} />

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {content.preferences}
          </Text>

          <List.Item
            title={content.language}
            description={i18n.language === "fr" ? "Français" : "English"}
            left={(props) => <List.Icon {...props} icon="translate" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setLanguageDialogVisible(true)}
            style={styles.listItem}
          />

          <List.Item
            title={content.darkMode}
            description={isDarkMode ? content.enabled : content.disabled}
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
            right={() => <Switch value={isDarkMode} onValueChange={toggleTheme} />}
            style={styles.listItem}
          />
        </View>

        <Divider style={styles.divider} />

        {/* Support Section */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {content.support}
          </Text>

          <List.Item
            title={content.support}
            description={content.getHelp}
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleSupport}
            style={styles.listItem}
          />

          <List.Item
            title={content.about}
            description={content.version}
            left={(props) => <List.Icon {...props} icon="information" />}
            style={styles.listItem}
          />
        </View>

        <Divider style={styles.divider} />

        {/* Logout */}
        <View style={styles.section}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            icon="logout"
            style={styles.logoutButton}
            textColor={theme.colors.secondary}
          >
            {content.logout}
          </Button>
        </View>
      </ScrollView>

      {/* Language Selection Dialog */}
      <Portal>
        <Dialog visible={languageDialogVisible} onDismiss={() => setLanguageDialogVisible(false)}>
          <Dialog.Title>{content.language}</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group onValueChange={handleLanguageChange} value={selectedLanguage}>
              <RadioButton.Item label="English" value="en" />
              <RadioButton.Item label="Français" value="fr" />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLanguageDialogVisible(false)}>{content.cancel}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  section: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontWeight: "bold",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  listItem: {
    paddingHorizontal: 16,
  },
  divider: {
    marginHorizontal: 16,
  },
  logoutButton: {
    marginHorizontal: 16,
    borderColor: "rgba(211, 47, 47, 0.5)",
  },
})
