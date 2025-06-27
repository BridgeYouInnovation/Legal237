"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Dimensions,
  RefreshControl,
  Alert
} from 'react-native'
import { 
  Text, 
  Card, 
  Searchbar, 
  useTheme, 
  ActivityIndicator, 
  Chip, 
  Button,
  Menu,
  Divider,
  Surface,
  Badge,
  IconButton
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import Icon from 'react-native-vector-icons/MaterialIcons'
import AsyncStorage from '@react-native-async-storage/async-storage'

import searchService from '../../services/searchService'
import paymentService from '../../services/paymentService'

const { width } = Dimensions.get('window')

export default function SearchResultsScreen({ route, navigation }) {
  const { query: initialQuery, lawType: initialLawType } = route.params || {}
  
  // State management
  const [searchQuery, setSearchQuery] = useState(initialQuery || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState('en')
  
  // Filter states
  const [selectedLawType, setSelectedLawType] = useState(initialLawType || null)
  const [showFilters, setShowFilters] = useState(false)
  const [searchMode, setSearchMode] = useState('hybrid') // 'local', 'remote', 'hybrid'
  
  // Menu states
  const [lawTypeMenuVisible, setLawTypeMenuVisible] = useState(false)
  const [searchModeMenuVisible, setSearchModeMenuVisible] = useState(false)
  
  // Search metadata
  const [searchMetadata, setSearchMetadata] = useState(null)
  const [totalResults, setTotalResults] = useState(0)

  const { t, i18n } = useTranslation()
  const theme = useTheme()

  // Initialize
  useEffect(() => {
    const initializeScreen = async () => {
      try {
        const userLanguage = await AsyncStorage.getItem('user_language')
        if (userLanguage) {
          setCurrentLanguage(userLanguage)
        }
        
        if (initialQuery) {
          await performSearch(initialQuery)
        }
      } catch (error) {
        console.error('Error initializing search screen:', error)
      }
    }

    initializeScreen()
  }, [initialQuery])

  // Handle search suggestions
  useEffect(() => {
    const getSuggestions = async () => {
      if (searchQuery.length >= 2 && showSuggestions) {
        try {
          const suggestions = await searchService.getSearchSuggestions(searchQuery, currentLanguage)
          setSuggestions(suggestions)
        } catch (error) {
          console.error('Error getting suggestions:', error)
          setSuggestions([])
        }
      } else {
        setSuggestions([])
      }
    }

    const timeoutId = setTimeout(getSuggestions, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, showSuggestions, currentLanguage])

  // Perform search
  const performSearch = useCallback(async (query = searchQuery, options = {}) => {
    if (!query.trim()) {
      setResults([])
      setTotalResults(0)
      setSearchMetadata(null)
      return
    }

    setLoading(true)
    setShowSuggestions(false)

    try {
      const searchOptions = {
        language: currentLanguage,
        lawType: selectedLawType,
        searchMode,
        limit: 50,
        ...options
      }

      const searchResult = await searchService.searchArticles(query, searchOptions)
      
      setResults(searchResult.results)
      setTotalResults(searchResult.totalCount)
      setSearchMetadata({
        source: searchResult.source,
        query: searchResult.query,
        timestamp: searchResult.timestamp,
        error: searchResult.error
      })

    } catch (error) {
      console.error('Search error:', error)
      Alert.alert(
        t('common.error'),
        t('search.searchError'),
        [{ text: t('common.ok') }]
      )
    } finally {
      setLoading(false)
    }
  }, [searchQuery, currentLanguage, selectedLawType, searchMode, t])

  // Handle search input
  const handleSearchSubmit = () => {
    performSearch()
  }

  const handleSearchChange = (text) => {
    setSearchQuery(text)
    setShowSuggestions(text.length >= 2)
  }

  // Handle suggestion selection
  const handleSuggestionPress = (suggestion) => {
    setSearchQuery(suggestion.text)
    setShowSuggestions(false)
    performSearch(suggestion.text)
  }

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await performSearch(searchQuery, { useCache: false })
    setRefreshing(false)
  }, [performSearch, searchQuery])

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('')
    setResults([])
    setTotalResults(0)
    setSearchMetadata(null)
    setShowSuggestions(false)
  }

  // Handle article navigation with payment check
  const handleArticlePress = async (item) => {
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
        navigation.navigate('ArticleDetail', { 
          article: item,
          documentType: item.documentType,
          language: currentLanguage
        })
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
      // Fallback to normal navigation
      navigation.navigate('ArticleDetail', { 
        article: item,
        documentType: item.documentType,
        language: currentLanguage
      })
    }
  }

  // Get localized content
  const getLocalizedContent = () => {
    if (currentLanguage === 'fr') {
      return {
        searchPlaceholder: "Rechercher des articles juridiques...",
        resultsFor: "Résultats pour",
        found: "trouvé(s)",
        noResults: "Aucun résultat trouvé",
        tryDifferent: "Essayez avec des mots-clés différents",
        filters: "Filtres",
        lawType: "Type de loi",
        allLaws: "Toutes les lois",
        penalCode: "Code Pénal",
        criminalProcedure: "Procédure Pénale",
        searchMode: "Mode de recherche",
        hybrid: "Hybride",
        remote: "Base de données",
        local: "Local",
        article: "Article",
        suggestions: "Suggestions",
        recent: "Récent",
        popular: "Populaire",
        searching: "Recherche en cours...",
        source: "Source"
      }
    } else {
      return {
        searchPlaceholder: "Search legal articles...",
        resultsFor: "Results for",
        found: "found",
        noResults: "No results found",
        tryDifferent: "Try searching with different keywords",
        filters: "Filters",
        lawType: "Law Type",
        allLaws: "All Laws",
        penalCode: "Penal Code",
        criminalProcedure: "Criminal Procedure",
        searchMode: "Search Mode",
        hybrid: "Hybrid",
        remote: "Database",
        local: "Local",
        article: "Article",
        suggestions: "Suggestions",
        recent: "Recent",
        popular: "Popular",
        searching: "Searching...",
        source: "Source"
      }
    }
  }

  const content = getLocalizedContent()

  // Render search result item
  const renderResult = ({ item, index }) => (
    <TouchableOpacity 
      onPress={() => handleArticlePress(item)}
      activeOpacity={0.7}
    >
      <Card style={[styles.resultCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.resultHeader}>
            <View style={styles.articleInfo}>
              <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
                {content.article} {item.id}
              </Text>
              {item.score > 0 && (
                <Badge size={16} style={styles.scoreBadge}>
                  {item.score}
                </Badge>
              )}
            </View>
            <View style={styles.chipContainer}>
              <Chip 
                mode="outlined" 
                compact
                style={styles.lawTypeChip}
              >
                {item.documentType === 'penal_code' ? content.penalCode : content.criminalProcedure}
              </Chip>
              {item.source && (
                <Chip 
                  mode="outlined" 
                  compact
                  style={[styles.sourceChip, { opacity: 0.7 }]}
                  textStyle={{ fontSize: 10 }}
                >
                  {item.source}
                </Chip>
              )}
            </View>
          </View>
          
          {item.title && (
            <Text 
              variant="titleSmall" 
              style={[styles.resultTitle, { color: theme.colors.onSurface }]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
          )}
          
          {item.book && (
            <Text 
              variant="bodySmall" 
              style={[styles.bookInfo, { color: theme.colors.onSurface, opacity: 0.7 }]}
            >
              {item.book}
            </Text>
          )}
          
          <Text
            variant="bodyMedium"
            style={[styles.resultPreview, { color: theme.colors.onSurface }]}
            numberOfLines={3}
          >
            {item.snippet || item.text}
          </Text>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  )

  // Render suggestion item
  const renderSuggestion = ({ item }) => (
    <TouchableOpacity 
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
    >
      <Icon 
        name={item.type === 'history' ? 'history' : item.type === 'popular' ? 'trending-up' : 'article'} 
        size={20} 
        color={theme.colors.onSurface} 
        style={styles.suggestionIcon}
      />
      <View style={styles.suggestionContent}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
          {item.text}
        </Text>
        {item.count && (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurface, opacity: 0.6 }}>
            {item.type === 'history' ? `${item.count} results` : `${item.count} searches`}
          </Text>
        )}
      </View>
      <Chip compact mode="outlined" style={styles.suggestionTypeChip}>
        {item.type === 'history' ? content.recent : item.type === 'popular' ? content.popular : content.article}
      </Chip>
    </TouchableOpacity>
  )

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="search-off" size={64} color={theme.colors.onSurface} style={styles.emptyIcon} />
      <Text variant="titleMedium" style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
        {content.noResults}
      </Text>
      <Text variant="bodyMedium" style={[styles.emptySubtitle, { color: theme.colors.onSurface }]}>
        {content.tryDifferent}
      </Text>
      {searchMetadata?.error && (
        <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
          Error: {searchMetadata.error}
        </Text>
      )}
    </View>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Header */}
      <Surface style={[styles.searchHeader, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <View style={styles.searchBarContainer}>
          <Searchbar
            placeholder={content.searchPlaceholder}
            onChangeText={handleSearchChange}
            value={searchQuery}
            onSubmitEditing={handleSearchSubmit}
            style={[styles.searchBar, { backgroundColor: 'transparent' }]}
            iconColor={theme.colors.primary}
            placeholderTextColor={theme.colors.onSurface + '80'}
            inputStyle={{ color: theme.colors.onSurface }}
            right={() => searchQuery ? (
              <IconButton
                icon="close"
                size={20}
                onPress={handleClearSearch}
              />
            ) : null}
          />
        </View>

        {/* Filter Controls */}
        <View style={styles.filterContainer}>
          <Menu
            visible={lawTypeMenuVisible}
            onDismiss={() => setLawTypeMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                compact
                onPress={() => setLawTypeMenuVisible(true)}
                style={styles.filterButton}
              >
                {selectedLawType ? 
                  (selectedLawType === 'penal_code' ? content.penalCode : content.criminalProcedure) : 
                  content.allLaws
                }
              </Button>
            }
          >
            <Menu.Item onPress={() => { setSelectedLawType(null); setLawTypeMenuVisible(false) }} title={content.allLaws} />
            <Menu.Item onPress={() => { setSelectedLawType('penal_code'); setLawTypeMenuVisible(false) }} title={content.penalCode} />
            <Menu.Item onPress={() => { setSelectedLawType('criminal_procedure'); setLawTypeMenuVisible(false) }} title={content.criminalProcedure} />
          </Menu>

          <Menu
            visible={searchModeMenuVisible}
            onDismiss={() => setSearchModeMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                compact
                onPress={() => setSearchModeMenuVisible(true)}
                style={styles.filterButton}
              >
                {searchMode === 'hybrid' ? content.hybrid : searchMode === 'remote' ? content.remote : content.local}
              </Button>
            }
          >
            <Menu.Item onPress={() => { setSearchMode('hybrid'); setSearchModeMenuVisible(false) }} title={content.hybrid} />
            <Menu.Item onPress={() => { setSearchMode('remote'); setSearchModeMenuVisible(false) }} title={content.remote} />
            <Menu.Item onPress={() => { setSearchMode('local'); setSearchModeMenuVisible(false) }} title={content.local} />
          </Menu>
        </View>

        {/* Search Info */}
        {searchQuery && !loading && (
          <View style={styles.searchInfo}>
            <Text variant="bodyMedium" style={[styles.searchInfoText, { color: theme.colors.onSurface }]}>
              {content.resultsFor} "{searchQuery}" ({totalResults} {content.found})
            </Text>
            {searchMetadata?.source && (
              <Chip compact mode="outlined" style={styles.sourceInfoChip}>
                {content.source}: {searchMetadata.source}
              </Chip>
            )}
          </View>
        )}
      </Surface>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Surface style={[styles.suggestionsContainer, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="titleSmall" style={[styles.suggestionsTitle, { color: theme.colors.onSurface }]}>
            {content.suggestions}
          </Text>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item, index) => `${item.type}_${index}`}
            style={styles.suggestionsList}
            showsVerticalScrollIndicator={false}
          />
        </Surface>
      )}

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            {content.searching}
          </Text>
        </View>
      )}

      {/* Results List */}
      {!loading && !showSuggestions && (
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={(item, index) => `${item.id}_${index}`}
          style={styles.resultsList}
          contentContainerStyle={styles.resultsContent}
          ListEmptyComponent={searchQuery ? renderEmptyState : null}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBarContainer: {
    marginBottom: 12,
  },
  searchBar: {
    elevation: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  filterButton: {
    minWidth: 100,
  },
  searchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  searchInfoText: {
    flex: 1,
    opacity: 0.8,
  },
  sourceInfoChip: {
    marginLeft: 8,
  },
  suggestionsContainer: {
    maxHeight: 200,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    padding: 12,
  },
  suggestionsTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  suggestionsList: {
    maxHeight: 150,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  suggestionIcon: {
    marginRight: 12,
    opacity: 0.7,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTypeChip: {
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  resultCard: {
    marginBottom: 12,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  articleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  scoreBadge: {
    marginLeft: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  lawTypeChip: {
    height: 24,
  },
  sourceChip: {
    height: 20,
  },
  resultTitle: {
    marginBottom: 4,
    fontWeight: '600',
  },
  bookInfo: {
    marginBottom: 8,
    fontStyle: 'italic',
  },
  resultPreview: {
    lineHeight: 20,
    opacity: 0.9,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    opacity: 0.3,
    marginBottom: 16,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  emptySubtitle: {
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 20,
  },
  errorText: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 12,
  },
})
