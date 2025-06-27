import React, { useState, useEffect, useCallback } from 'react'
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  FlatList
} from 'react-native'
import { 
  Text, 
  Searchbar, 
  useTheme, 
  Card,
  Chip,
  Button,
  Surface,
  Divider,
  IconButton
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import Icon from 'react-native-vector-icons/MaterialIcons'
import AsyncStorage from '@react-native-async-storage/async-storage'

import searchService from '../../services/searchService'

const { width } = Dimensions.get('window')

export default function SearchScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [recentSearches, setRecentSearches] = useState([])
  const [popularSearches, setPopularSearches] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState('en')

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
        
        loadSearchData()
      } catch (error) {
        console.error('Error initializing search screen:', error)
      }
    }

    initializeScreen()
  }, [])

  // Load search data
  const loadSearchData = useCallback(() => {
    try {
      const recent = searchService.getSearchHistory(currentLanguage).slice(0, 8)
      const popular = searchService.getPopularSearches(currentLanguage).slice(0, 6)
      
      setRecentSearches(recent)
      setPopularSearches(popular)
    } catch (error) {
      console.error('Error loading search data:', error)
    }
  }, [currentLanguage])

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

  // Handle search
  const handleSearch = (query = searchQuery) => {
    if (query.trim()) {
      navigation.navigate('SearchResults', { query: query.trim() })
    }
  }

  const handleSearchChange = (text) => {
    setSearchQuery(text)
    setShowSuggestions(text.length >= 2)
  }

  const handleSuggestionPress = (suggestion) => {
    setSearchQuery(suggestion.text)
    setShowSuggestions(false)
    handleSearch(suggestion.text)
  }

  const handleRecentSearchPress = (searchItem) => {
    handleSearch(searchItem.query)
  }

  const handlePopularSearchPress = (searchItem) => {
    handleSearch(searchItem.query)
  }

  const handleClearRecentSearches = async () => {
    try {
      await searchService.clearSearchHistory()
      setRecentSearches([])
    } catch (error) {
      console.error('Error clearing search history:', error)
    }
  }

  const handleAdvancedSearch = () => {
    navigation.navigate('AdvancedSearch')
  }

  // Get localized content
  const getLocalizedContent = () => {
    if (currentLanguage === 'fr') {
      return {
        searchPlaceholder: "Rechercher des lois, articles, procédures...",
        recentSearches: "Recherches Récentes",
        popularSearches: "Recherches Populaires",
        suggestions: "Suggestions",
        clearAll: "Tout Effacer",
        advancedSearch: "Recherche Avancée",
        noRecentSearches: "Aucune recherche récente",
        noPopularSearches: "Aucune recherche populaire",
        startSearching: "Commencez à rechercher pour voir les suggestions",
        quickTopics: "Sujets Rapides",
        recent: "Récent",
        popular: "Populaire",
        article: "Article",
        searches: "recherches",
        results: "résultats"
      }
    } else {
      return {
        searchPlaceholder: "Search laws, articles, procedures...",
        recentSearches: "Recent Searches",
        popularSearches: "Popular Searches",
        suggestions: "Suggestions",
        clearAll: "Clear All",
        advancedSearch: "Advanced Search",
        noRecentSearches: "No recent searches",
        noPopularSearches: "No popular searches",
        startSearching: "Start typing to see suggestions",
        quickTopics: "Quick Topics",
        recent: "Recent",
        popular: "Popular",
        article: "Article",
        searches: "searches",
        results: "results"
      }
    }
  }

  const content = getLocalizedContent()

  // Quick topic suggestions
  const quickTopics = currentLanguage === 'fr' 
    ? ['Vol', 'Caution', 'Procédure pénale', 'Preuve', 'Appels', 'Sentence', 'Arrestation', 'Tribunal']
    : ['Theft', 'Bail', 'Criminal procedure', 'Evidence', 'Appeals', 'Sentencing', 'Arrest', 'Court']

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
            {item.type === 'history' ? `${item.count} ${content.results}` : `${item.count} ${content.searches}`}
          </Text>
        )}
      </View>
      <Chip compact mode="outlined" style={styles.suggestionTypeChip}>
        {item.type === 'history' ? content.recent : item.type === 'popular' ? content.popular : content.article}
      </Chip>
    </TouchableOpacity>
  )

  // Render recent search item
  const renderRecentSearch = ({ item }) => (
    <TouchableOpacity 
      style={styles.searchHistoryItem}
      onPress={() => handleRecentSearchPress(item)}
    >
      <Icon name="history" size={20} color={theme.colors.onSurface} style={styles.historyIcon} />
      <View style={styles.historyContent}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
          {item.query}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurface, opacity: 0.6 }}>
          {item.resultCount} {content.results} • {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </View>
      <Icon name="north-west" size={16} color={theme.colors.onSurface} style={styles.arrowIcon} />
    </TouchableOpacity>
  )

  // Render popular search item
  const renderPopularSearch = ({ item }) => (
    <TouchableOpacity 
      style={styles.searchHistoryItem}
      onPress={() => handlePopularSearchPress(item)}
    >
      <Icon name="trending-up" size={20} color={theme.colors.primary} style={styles.historyIcon} />
      <View style={styles.historyContent}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
          {item.query}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurface, opacity: 0.6 }}>
          {item.searchCount} {content.searches}
        </Text>
      </View>
      <Icon name="north-west" size={16} color={theme.colors.onSurface} style={styles.arrowIcon} />
    </TouchableOpacity>
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
            onSubmitEditing={() => handleSearch()}
            style={[styles.searchBar, { backgroundColor: 'transparent' }]}
            iconColor={theme.colors.primary}
            placeholderTextColor={theme.colors.onSurface + '80'}
            inputStyle={{ color: theme.colors.onSurface }}
            autoFocus={true}
          />
        </View>

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            compact
            onPress={handleAdvancedSearch}
            style={styles.advancedButton}
            icon="tune"
          >
            {content.advancedSearch}
          </Button>
        </View>
      </Surface>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {content.suggestions}
            </Text>
            <FlatList
              data={suggestions}
              renderItem={renderSuggestion}
              keyExtractor={(item, index) => `${item.type}_${index}`}
              scrollEnabled={false}
            />
          </Surface>
        )}

        {/* Quick Topics */}
        {!showSuggestions && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {content.quickTopics}
            </Text>
            <View style={styles.topicsContainer}>
              {quickTopics.map((topic, index) => (
                <Chip
                  key={index}
                  mode="outlined"
                  onPress={() => handleSearch(topic)}
                  style={styles.topicChip}
                >
                  {topic}
                </Chip>
              ))}
            </View>
          </View>
        )}

        {/* Recent Searches */}
        {!showSuggestions && recentSearches.length > 0 && (
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                {content.recentSearches}
              </Text>
              <Button
                mode="text"
                compact
                onPress={handleClearRecentSearches}
                textColor={theme.colors.primary}
              >
                {content.clearAll}
              </Button>
            </View>
            <FlatList
              data={recentSearches}
              renderItem={renderRecentSearch}
              keyExtractor={(item, index) => `recent_${index}`}
              scrollEnabled={false}
            />
          </Surface>
        )}

        {/* Popular Searches */}
        {!showSuggestions && popularSearches.length > 0 && (
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {content.popularSearches}
            </Text>
            <FlatList
              data={popularSearches}
              renderItem={renderPopularSearch}
              keyExtractor={(item, index) => `popular_${index}`}
              scrollEnabled={false}
            />
          </Surface>
        )}

        {/* Empty States */}
        {!showSuggestions && recentSearches.length === 0 && popularSearches.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="search" size={64} color={theme.colors.onSurface} style={styles.emptyIcon} />
            <Text variant="titleMedium" style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
              {content.startSearching}
            </Text>
          </View>
        )}
      </ScrollView>
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  advancedButton: {
    minWidth: 120,
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    marginBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
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
  searchHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  historyIcon: {
    marginRight: 12,
    opacity: 0.7,
  },
  historyContent: {
    flex: 1,
  },
  arrowIcon: {
    opacity: 0.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    opacity: 0.3,
    marginBottom: 16,
  },
  emptyTitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
}) 