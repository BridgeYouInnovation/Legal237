"use client"

import React, { useEffect, useState } from "react"
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native"
import { Text, Card, IconButton, useTheme, Snackbar, Chip } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useFocusEffect } from "@react-navigation/native"
import Icon from "react-native-vector-icons/MaterialIcons"
import legalDataService from "../../services/legalDataService"
import paymentService from "../../services/paymentService"
import AsyncStorage from "@react-native-async-storage/async-storage"
import FloatingChatButton from "../../components/FloatingChatButton"

export default function BookmarksScreen({ navigation }) {
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentLanguage, setCurrentLanguage] = useState('en')

  const { t } = useTranslation()
  const theme = useTheme()

  useEffect(() => {
    initializeBookmarks()
  }, [])

  // Refresh bookmarks when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      initializeBookmarks()
    }, [])
  )

  const initializeBookmarks = async () => {
    try {
      setLoading(true)
      
      // Get current language
      const userLanguage = await AsyncStorage.getItem('user_language')
      setCurrentLanguage(userLanguage || 'en')
      
      // Load bookmarks from legalDataService
      const savedBookmarks = legalDataService.getBookmarks()
      setBookmarks(savedBookmarks)
      
      console.log(`Loaded ${savedBookmarks.length} bookmarks`)
    } catch (error) {
      console.error('Error loading bookmarks:', error)
      setBookmarks([])
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveBookmark = async (bookmarkId) => {
    try {
      const success = await legalDataService.removeBookmark(bookmarkId)
      if (success) {
        // Refresh bookmarks list
        const updatedBookmarks = legalDataService.getBookmarks()
        setBookmarks(updatedBookmarks)
        setSnackbarMessage(currentLanguage === 'fr' ? 'Signet supprimé' : 'Bookmark removed')
      } else {
        setSnackbarMessage(currentLanguage === 'fr' ? 'Erreur lors de la suppression' : 'Error removing bookmark')
      }
    } catch (error) {
      console.error('Error removing bookmark:', error)
      setSnackbarMessage(currentLanguage === 'fr' ? 'Erreur' : 'Error')
    }
    setSnackbarVisible(true)
  }

  const handleBookmarkPress = async (item) => {
    try {
      const documentType = item.documentType
      const isPaymentRequired = await paymentService.isPaymentRequired(documentType)
      
      if (isPaymentRequired) {
        // Show payment required alert
        const docInfo = paymentService.getDocumentInfo(documentType, currentLanguage)
        Alert.alert(
          currentLanguage === 'fr' ? 'Paiement Requis' : 'Payment Required',
          currentLanguage === 'fr' 
            ? `Pour accéder au ${docInfo.name}, vous devez effectuer un paiement de ${docInfo.price} ${docInfo.currency}.`
            : `To access ${docInfo.name}, you need to make a payment of ${docInfo.price} ${docInfo.currency}.`,
          [
            {
              text: currentLanguage === 'fr' ? 'Annuler' : 'Cancel',
              style: 'cancel'
            },
            {
              text: currentLanguage === 'fr' ? 'Payer' : 'Pay Now',
              onPress: () => navigation.navigate('Payment', { documentType })
            }
          ]
        )
      } else {
        // User has paid, allow access
        navigation.navigate("ArticleDetail", { 
          article: item.article, 
          documentType: item.documentType,
          language: item.language 
        })
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
      // Fallback to normal navigation
      navigation.navigate("ArticleDetail", { 
        article: item.article, 
        documentType: item.documentType,
        language: item.language 
      })
    }
  }

  const getLocalizedContent = () => {
    if (currentLanguage === 'fr') {
      return {
        title: 'Signets',
        savedArticles: 'articles sauvegardés',
        empty: 'Aucun signet',
        emptyDescription: 'Vous n\'avez pas encore sauvegardé d\'articles. Appuyez sur l\'icône signet dans les détails d\'un article pour le sauvegarder.',
        saved: 'Sauvegardé le',
        penalCode: 'Code Pénal',
        criminalProcedure: 'Procédure Pénale'
      }
    } else {
      return {
        title: 'Bookmarks',
        savedArticles: 'saved articles',
        empty: 'No bookmarks yet',
        emptyDescription: 'You haven\'t saved any articles yet. Tap the bookmark icon in article details to save them.',
        saved: 'Saved',
        penalCode: 'Penal Code',
        criminalProcedure: 'Criminal Procedure'
      }
    }
  }

  const content = getLocalizedContent()

  const renderBookmark = ({ item }) => (
    <Card style={styles.bookmarkCard}>
      <Card.Content>
        <TouchableOpacity
          onPress={() => handleBookmarkPress(item)}
          style={styles.bookmarkContent}
        >
          <View style={styles.bookmarkInfo}>
            <View style={styles.bookmarkHeader}>
              <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
                {item.article.id}
              </Text>
              <Chip mode="outlined" compact>
                {item.documentType === "penal_code" ? content.penalCode : content.criminalProcedure}
              </Chip>
            </View>
            
            {item.article.title && (
              <Text variant="titleSmall" style={[styles.bookmarkTitle, { color: theme.colors.onSurface }]}>
                {item.article.title}
              </Text>
            )}
            
            <Text
              variant="bodyMedium"
              style={[styles.bookmarkPreview, { color: theme.colors.onSurface }]}
              numberOfLines={2}
            >
              {item.article.text}
            </Text>
            
            <View style={styles.bookmarkMeta}>
              <Chip mode="outlined" compact style={styles.languageChip}>
                {item.language === 'en' ? 'English' : 'Français'}
              </Chip>
              <Text variant="bodySmall" style={[styles.bookmarkDate, { color: theme.colors.onSurface }]}>
                {content.saved} {new Date(item.timestamp).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Card.Content>
      <Card.Actions>
        <IconButton 
          icon="delete" 
          iconColor={theme.colors.error} 
          onPress={() => handleRemoveBookmark(item.id)} 
        />
      </Card.Actions>
    </Card>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="bookmark-outline" size={80} color={theme.colors.onSurface} style={{ opacity: 0.3 }} />
      <Text variant="titleLarge" style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
        {content.empty}
      </Text>
      <Text variant="bodyMedium" style={[styles.emptyDescription, { color: theme.colors.onSurface }]}>
        {content.emptyDescription}
      </Text>
    </View>
  )

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.colors.onSurface }}>
            {currentLanguage === 'fr' ? 'Chargement...' : 'Loading...'}
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
          {content.title}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, opacity: 0.7 }}>
          {bookmarks.length} {content.savedArticles}
        </Text>
      </View>

      <FlatList
        data={bookmarks}
        renderItem={renderBookmark}
        keyExtractor={(item) => item.id}
        style={styles.bookmarksList}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000}>
        {snackbarMessage}
      </Snackbar>
      
      <FloatingChatButton />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  bookmarksList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  bookmarkCard: {
    marginBottom: 12,
    elevation: 2,
  },
  bookmarkContent: {
    flex: 1,
  },
  bookmarkInfo: {
    flex: 1,
  },
  bookmarkHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  bookmarkTitle: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  bookmarkPreview: {
    opacity: 0.8,
    marginBottom: 12,
  },
  bookmarkMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  languageChip: {
    height: 24,
  },
  bookmarkDate: {
    opacity: 0.6,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyTitle: {
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    textAlign: "center",
    opacity: 0.7,
    paddingHorizontal: 32,
  },
})

