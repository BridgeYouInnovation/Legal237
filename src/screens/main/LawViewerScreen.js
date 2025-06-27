"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native"
import { Text, Card, Searchbar, Chip, useTheme, ActivityIndicator } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import AsyncStorage from "@react-native-async-storage/async-storage"
import legalDataService from "../../services/legalDataService"
import paymentService from "../../services/paymentService"

export default function LawViewerScreen({ route, navigation }) {
  const { category, documentType } = route.params
  const [articles, setArticles] = useState([])
  const [filteredArticles, setFilteredArticles] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [lawTypeTitle, setLawTypeTitle] = useState("")

  const { t, i18n } = useTranslation()
  const theme = useTheme()

  // Map category to document type (with fallback to provided documentType)
  const getDocumentType = (category, providedDocumentType) => {
    if (providedDocumentType) {
      return providedDocumentType;
    }
    
    switch (category) {
      case 'penal':
        return 'penal_code'
      case 'procedure':
        return 'criminal_procedure'
      default:
        return category || 'penal_code'
    }
  }

  // Get display title for any law type
  const getLawTypeTitle = (docType, language) => {
    const titles = {
      'penal_code': language === 'fr' ? 'Code Pénal' : 'Penal Code',
      'criminal_procedure': language === 'fr' ? 'Code de Procédure Pénale' : 'Criminal Procedure Code'
    };
    
    // If it's a known type, return the translated title
    if (titles[docType]) {
      return titles[docType];
    }
    
    // For unknown types, create a title from the document type
    const formattedTitle = docType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return formattedTitle;
  }

  useEffect(() => {
    initializeLanguageAndLoadArticles()
    checkPaymentStatus()
  }, [category, documentType])

  useEffect(() => {
    filterArticles()
  }, [articles, searchQuery, selectedLanguage])

  // Listen for language changes from settings
  useEffect(() => {
    const handleLanguageChange = async () => {
      try {
        const currentLang = i18n.language
        if (currentLang !== selectedLanguage) {
          setSelectedLanguage(currentLang)
          await loadArticles(currentLang)
          updateLawTypeTitle(currentLang)
        }
      } catch (error) {
        console.error('Error handling language change:', error)
      }
    }

    // Listen to i18n language changes
    i18n.on('languageChanged', handleLanguageChange)

    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [selectedLanguage, i18n])

  const updateLawTypeTitle = (language) => {
    const docType = getDocumentType(category, documentType);
    const title = getLawTypeTitle(docType, language);
    setLawTypeTitle(title);
  }

  const initializeLanguageAndLoadArticles = async () => {
    try {
      // Get user's preferred language
      const userLanguage = await AsyncStorage.getItem('user_language')
      const language = userLanguage || 'en'
      setSelectedLanguage(language)
      updateLawTypeTitle(language)
      
      await loadArticles(language)
    } catch (error) {
      console.error('Error initializing language and articles:', error)
      await loadArticles('en')
      updateLawTypeTitle('en')
    }
  }

  const loadArticles = async (language = selectedLanguage) => {
    setLoading(true)
    try {
      const docType = getDocumentType(category, documentType)
      console.log(`Loading articles for: ${docType}, language: ${language}`)
      
      const documentsData = await legalDataService.getDocument(docType, language)
      console.log(`Loaded ${documentsData?.length || 0} articles`)
      
      if (!documentsData || documentsData.length === 0) {
        console.warn(`No articles found for ${docType} in ${language}`)
      }
      
      setArticles(documentsData || [])
    } catch (error) {
      console.error('Error loading articles:', error)
      setArticles([])
    } finally {
      setLoading(false)
    }
  }

  const filterArticles = () => {
    let filtered = [...articles]

    if (searchQuery) {
      filtered = filtered.filter(
        (article) =>
          (article.title && article.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (article.id && article.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (article.text && article.text.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    setFilteredArticles(filtered)
  }

  const handleLocalLanguageChange = async (language) => {
    try {
      setSelectedLanguage(language)
      updateLawTypeTitle(language)
      await loadArticles(language)
    } catch (error) {
      console.error('Error changing language locally:', error)
    }
  }

  const checkPaymentStatus = async () => {
    try {
      const docType = getDocumentType(category, documentType)
      const isPaymentRequired = await paymentService.isPaymentRequired(docType)
      
      if (isPaymentRequired) {
        // Redirect to payment screen if payment is required
        navigation.replace('Payment', { documentType: docType })
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
    }
  }

  const renderArticle = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate("ArticleDetail", { 
      article: item, 
      documentType: getDocumentType(category, documentType),
      language: selectedLanguage 
    })}>
      <Card style={styles.articleCard}>
        <Card.Content>
          <View style={styles.articleHeader}>
            <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
              {item.id || 'N/A'}
            </Text>
            <Chip mode="outlined" compact>
              {lawTypeTitle}
            </Chip>
          </View>
          <Text variant="titleSmall" style={[styles.articleTitle, { color: theme.colors.onSurface }]}>
            {item.title || 'Untitled'}
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.articlePreview, { color: theme.colors.onSurface }]}
            numberOfLines={3}
          >
            {item.text || 'No content available'}
          </Text>
          {item.book && (
            <Text variant="bodySmall" style={[styles.hierarchy, { color: theme.colors.outline }]}>
              {item.book}
              {item.chapter && ` • ${item.chapter}`}
            </Text>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ color: theme.colors.onSurface, marginTop: 16 }}>
          {selectedLanguage === 'fr' ? 'Chargement...' : 'Loading...'}
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
          {lawTypeTitle}
        </Text>

        <View style={styles.languageSelector}>
          <Chip
            mode={selectedLanguage === "en" ? "flat" : "outlined"}
            onPress={() => handleLocalLanguageChange("en")}
            style={[styles.languageChip, selectedLanguage === "en" && { backgroundColor: theme.colors.primary }]}
            textStyle={{ color: selectedLanguage === "en" ? 'white' : theme.colors.onSurface }}
          >
            English
          </Chip>
          <Chip
            mode={selectedLanguage === "fr" ? "flat" : "outlined"}
            onPress={() => handleLocalLanguageChange("fr")}
            style={[styles.languageChip, selectedLanguage === "fr" && { backgroundColor: theme.colors.primary }]}
            textStyle={{ color: selectedLanguage === "fr" ? 'white' : theme.colors.onSurface }}
          >
            Français
          </Chip>
        </View>
      </View>

      <Searchbar
        placeholder={selectedLanguage === 'fr' ? 'Rechercher des articles...' : 'Search articles...'}
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <Text variant="bodyMedium" style={[styles.resultsCount, { color: theme.colors.onSurface }]}>
        {filteredArticles.length} {selectedLanguage === 'fr' ? 'articles trouvés' : 'articles found'}
      </Text>

      <FlatList
        data={filteredArticles}
        renderItem={renderArticle}
        keyExtractor={(item, index) => `${getDocumentType(category, documentType)}_${selectedLanguage}_${item.id}_${index}`}
        style={styles.articlesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ color: theme.colors.onSurface, textAlign: 'center' }}>
              {selectedLanguage === 'fr' 
                ? 'Aucun article trouvé'
                : 'No articles found'
              }
            </Text>
          </View>
        }
      />
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
  languageSelector: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  languageChip: {
    marginRight: 8,
  },
  searchBar: {
    margin: 16,
    elevation: 2,
  },
  articlesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  articleCard: {
    marginBottom: 12,
    elevation: 2,
  },
  articleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  articleTitle: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  articlePreview: {
    opacity: 0.8,
  },
  resultsCount: {
    margin: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  hierarchy: {
    marginTop: 8,
    fontStyle: 'italic',
  },
})
