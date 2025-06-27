"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView } from "react-native"
import { Text, Card, Button, IconButton, Snackbar, useTheme, Chip } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import AsyncStorage from "@react-native-async-storage/async-storage"
import legalDataService from "../../services/legalDataService"

export default function ArticleDetailScreen({ route, navigation }) {
  const { article, documentType, language } = route.params
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [relatedArticles, setRelatedArticles] = useState([])
  const [currentLanguage, setCurrentLanguage] = useState(language || 'en')

  const { t } = useTranslation()
  const theme = useTheme()

  useEffect(() => {
    checkBookmarkStatus()
    loadRelatedArticles()
    initializeLanguage()
  }, [article])

  const initializeLanguage = async () => {
    try {
      const userLanguage = await AsyncStorage.getItem('user_language')
      if (userLanguage) {
        setCurrentLanguage(userLanguage)
      }
    } catch (error) {
      console.error('Error getting user language:', error)
    }
  }

  const checkBookmarkStatus = async () => {
    try {
      const bookmarkStatus = legalDataService.isBookmarked(article, documentType, currentLanguage)
      setIsBookmarked(bookmarkStatus)
    } catch (error) {
      console.error('Error checking bookmark status:', error)
    }
  }

  const loadRelatedArticles = async () => {
    try {
      console.log('Loading related articles for:', { book: article.book, chapter: article.chapter });
      
      // Get articles from the same book/chapter
      const related = await legalDataService.getArticlesByHierarchy(
        { book: article.book, chapter: article.chapter },
        documentType,
        currentLanguage
      );
      
      console.log('Found related articles:', related?.length || 0);
      
      // Filter out current article and limit to 5 related articles
      const filteredRelated = related
        .filter(relatedArticle => relatedArticle.id !== article.id)
        .slice(0, 5);
      
      setRelatedArticles(filteredRelated);
    } catch (error) {
      console.error('Error loading related articles:', error);
      setRelatedArticles([]);
    }
  };

  const handleBookmark = async () => {
    try {
      if (isBookmarked) {
        const success = await legalDataService.removeBookmark(`${documentType}_${currentLanguage}_${article.id}`)
        if (success) {
          setIsBookmarked(false)
          setSnackbarMessage(currentLanguage === 'fr' ? 'Signet supprimé' : 'Bookmark removed')
        }
      } else {
        const success = await legalDataService.addBookmark(article, documentType, currentLanguage)
        if (success) {
          setIsBookmarked(true)
          setSnackbarMessage(currentLanguage === 'fr' ? 'Article mis en signet' : 'Article bookmarked')
        }
      }
      setSnackbarVisible(true)
    } catch (error) {
      console.error('Error handling bookmark:', error)
      setSnackbarMessage(currentLanguage === 'fr' ? 'Erreur' : 'Error')
      setSnackbarVisible(true)
    }
  }

  const getLocalizedContent = () => {
    if (currentLanguage === 'fr') {
      return {
        relatedArticles: 'Articles Connexes',
        penalCode: 'Code Pénal',
        criminalProcedure: 'Procédure Pénale'
      }
    } else {
      return {
        relatedArticles: 'Related Articles',
        penalCode: 'Penal Code',
        criminalProcedure: 'Criminal Procedure'
      }
    }
  }

  const getDocumentTypeDisplay = () => {
    // Map the documentType to proper display text
    // Handle both the parameter documentType and article.documentType
    const docType = documentType || article.documentType || '';
    
    if (docType.includes('penal_code') || docType === 'penal_code') {
      return content.penalCode
    } else if (docType.includes('criminal_procedure') || docType === 'criminal_procedure') {
      return content.criminalProcedure
    } else {
      // Default fallback to penal code
      return content.penalCode
    }
  }

  const content = getLocalizedContent()

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.content}>
        <Card style={styles.articleCard}>
          <Card.Content>
            <View style={styles.header}>
              <View style={styles.articleInfo}>
                <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
                  {article.id}
                </Text>
                <Chip mode="outlined" style={styles.categoryChip}>
                  {getDocumentTypeDisplay()}
                </Chip>
              </View>
              <IconButton
                icon={isBookmarked ? "bookmark" : "bookmark-outline"}
                iconColor={isBookmarked ? theme.colors.primary : theme.colors.onSurface}
                onPress={handleBookmark}
              />
            </View>

            {article.title && (
              <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onSurface }]}>
                {article.title}
              </Text>
            )}

            <View style={styles.metadata}>
              <Chip mode="outlined" compact>
                {currentLanguage === "en" ? "English" : "Français"}
              </Chip>
            </View>

            <Text variant="bodyLarge" style={[styles.articleContent, { color: theme.colors.onSurface }]}>
              {article.text}
            </Text>
          </Card.Content>
        </Card>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <Card style={styles.relatedCard}>
            <Card.Content>
              <Text variant="titleMedium" style={[styles.relatedTitle, { color: theme.colors.onSurface }]}>
                {content.relatedArticles}
              </Text>
              {relatedArticles.map((relatedArticle, index) => {
                // Simple display with just article number
                const displayText = `Article ${relatedArticle.id}`;

                return (
                  <Button 
                    key={index}
                    mode="outlined" 
                    style={styles.relatedButton}
                    onPress={() => {
                      // Navigate to the related article using proper navigation
                      navigation.push('ArticleDetail', {
                        article: relatedArticle,
                        documentType: documentType,
                        language: currentLanguage
                      });
                    }}
                  >
                    {displayText}
                  </Button>
                );
              })}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000}>
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  articleCard: {
    elevation: 4,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  articleInfo: {
    flex: 1,
  },
  categoryChip: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  title: {
    fontWeight: "bold",
    marginBottom: 16,
  },
  metadata: {
    flexDirection: "row",
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 8,
  },
  articleContent: {
    lineHeight: 24,
  },
  relatedCard: {
    elevation: 2,
  },
  relatedTitle: {
    fontWeight: "bold",
    marginBottom: 12,
  },
  relatedButton: {
    marginBottom: 8,
  },
})
