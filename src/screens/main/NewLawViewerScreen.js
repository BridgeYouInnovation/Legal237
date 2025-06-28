import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
  Share,
} from 'react-native';
import {
  Text,
  Searchbar,
  Card,
  useTheme,
  Surface,
  Chip,
  IconButton,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import newLegalDataService from '../../services/newLegalDataService';
import { useBookmarkStore } from '../../stores/bookmarkStore';

const { width } = Dimensions.get('window');

export default function NewLawViewerScreen({ route, navigation }) {
  const { categoryCode, categoryInfo } = route.params;
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
  
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { bookmarks, addBookmark, removeBookmark, isBookmarked } = useBookmarkStore();

  useEffect(() => {
    loadArticles();
    loadLanguagePreference();
  }, [categoryCode]);

  useEffect(() => {
    filterArticles();
  }, [articles, searchQuery]);

  // Add effect to reload articles when language changes
  useEffect(() => {
    if (currentLanguage) {
      loadArticles();
    }
  }, [currentLanguage]);

  // Listen to i18n language changes
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setCurrentLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const loadLanguagePreference = async () => {
    try {
      const userLanguage = await AsyncStorage.getItem('user_language');
      if (userLanguage) {
        setCurrentLanguage(userLanguage);
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  };

  const loadArticles = async () => {
    try {
      setLoading(true);
      console.log(`🔍 Loading articles for category: ${categoryCode}`);
      
      const articlesList = await newLegalDataService.getArticles(categoryCode, currentLanguage);
      setArticles(articlesList);
      console.log(`📚 Loaded ${articlesList.length} articles`);
      
    } catch (error) {
      console.error('Error loading articles:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to load articles. Please try again.',
        [
          { text: 'Retry', onPress: loadArticles },
          { text: 'Go Back', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const filterArticles = () => {
    if (!searchQuery.trim()) {
      setFilteredArticles(articles);
      return;
    }

    const filtered = articles.filter(article => {
      const searchLower = searchQuery.toLowerCase();
      return (
        article.article_id.toLowerCase().includes(searchLower) ||
        (article.title && article.title.toLowerCase().includes(searchLower)) ||
        article.content.toLowerCase().includes(searchLower)
      );
    });

    setFilteredArticles(filtered);
  };

  const handleArticlePress = (article) => {
    setSelectedArticle(article);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setSelectedArticle(null);
    setViewMode('list');
  };

  const handleBookmarkToggle = (article) => {
    const bookmarkData = {
      id: article.id,
      article_id: article.article_id,
      title: article.title || `Article ${article.article_id}`,
      content: article.content.substring(0, 200) + '...',
      category_code: article.category_code,
      category_name: article.category_name,
      created_at: new Date().toISOString(),
    };

    if (isBookmarked(article.id)) {
      removeBookmark(article.id);
    } else {
      addBookmark(bookmarkData);
    }
  };

  const handleShare = async (article) => {
    try {
      const shareContent = {
        title: `${categoryInfo?.name_en || 'Legal Article'} - Article ${article.article_id}`,
        message: `${article.title || `Article ${article.article_id}`}\n\n${article.content.substring(0, 500)}${article.content.length > 500 ? '...' : ''}\n\nFrom Legal237 App`,
      };

      await Share.share(shareContent);
    } catch (error) {
      console.error('Error sharing article:', error);
    }
  };

  const handleLanguageChange = async (language) => {
    try {
      setCurrentLanguage(language);
      await AsyncStorage.setItem('user_language', language);
      await i18n.changeLanguage(language);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const getLocalizedContent = () => {
    if (currentLanguage === 'fr') {
      return {
        searchPlaceholder: 'Rechercher des articles...',
        noArticles: 'Aucun article trouvé',
        noResults: 'Aucun résultat trouvé',
        articleCount: 'articles',
        loading: 'Chargement...',
        share: 'Partager',
        bookmark: 'Marquer',
        bookmarked: 'Marqué',
        version: 'Version',
        lastUpdated: 'Dernière mise à jour',
        backToList: 'Retour à la liste',
        english: 'Anglais',
        french: 'Français',
        retry: 'Réessayer',
      };
    } else {
      return {
        searchPlaceholder: 'Search articles...',
        noArticles: 'No articles found',
        noResults: 'No results found',
        articleCount: 'articles',
        loading: 'Loading...',
        share: 'Share',
        bookmark: 'Bookmark',
        bookmarked: 'Bookmarked',
        version: 'Version',
        lastUpdated: 'Last updated',
        backToList: 'Back to list',
        english: 'English',
        french: 'French',
        retry: 'Retry',
      };
    }
  };

  const content = getLocalizedContent();

  const renderArticleCard = ({ item: article }) => (
    <TouchableOpacity
      onPress={() => handleArticlePress(article)}
      activeOpacity={0.7}
    >
      <Card style={[styles.articleCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Card.Content style={styles.articleContent}>
          <View style={styles.articleHeader}>
            <View style={styles.articleInfo}>
              <Text variant="titleMedium" style={[styles.articleNumber, { color: theme.colors.primary }]}>
                Article {article.article_id}
              </Text>
              {article.version && (
                <Chip
                  style={[styles.versionChip, { backgroundColor: theme.colors.primaryContainer }]}
                  textStyle={{ color: theme.colors.onPrimaryContainer, fontSize: 12 }}
                >
                  v{article.version}
                </Chip>
              )}
            </View>
            <View style={styles.articleActions}>
              <IconButton
                icon={isBookmarked(article.id) ? 'bookmark' : 'bookmark-outline'}
                size={20}
                iconColor={isBookmarked(article.id) ? theme.colors.primary : theme.colors.onSurface}
                onPress={() => handleBookmarkToggle(article)}
              />
              <IconButton
                icon="share"
                size={20}
                iconColor={theme.colors.onSurface}
                onPress={() => handleShare(article)}
              />
            </View>
          </View>

          {article.title && (
            <Text variant="titleSmall" style={[styles.articleTitle, { color: theme.colors.onSurface }]}>
              {article.title}
            </Text>
          )}

          <Text
            variant="bodyMedium"
            style={[styles.articlePreview, { color: theme.colors.onSurface + '80' }]}
            numberOfLines={3}
          >
            {article.content}
          </Text>

          <View style={styles.articleFooter}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurface + '60' }}>
              {new Date(article.updated_at).toLocaleDateString()}
            </Text>
            <Icon name="arrow-forward" size={16} color={theme.colors.primary} />
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderDetailView = () => (
    <ScrollView style={styles.detailContainer} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={handleBackToList} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={theme.colors.primary} />
          <Text style={[styles.backText, { color: theme.colors.primary }]}>
            {content.backToList}
          </Text>
        </TouchableOpacity>

        <View style={styles.detailActions}>
          <IconButton
            icon={isBookmarked(selectedArticle.id) ? 'bookmark' : 'bookmark-outline'}
            size={24}
            iconColor={isBookmarked(selectedArticle.id) ? theme.colors.primary : theme.colors.onSurface}
            onPress={() => handleBookmarkToggle(selectedArticle)}
          />
          <IconButton
            icon="share"
            size={24}
            iconColor={theme.colors.onSurface}
            onPress={() => handleShare(selectedArticle)}
          />
        </View>
      </View>

      {/* Article Content */}
      <Surface style={[styles.detailCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <View style={styles.detailCardContent}>
          <View style={styles.detailTitleSection}>
            <Text variant="headlineSmall" style={[styles.detailArticleNumber, { color: theme.colors.primary }]}>
              Article {selectedArticle.article_id}
            </Text>
            {selectedArticle.version && (
              <Chip
                style={[styles.versionChip, { backgroundColor: theme.colors.primaryContainer }]}
                textStyle={{ color: theme.colors.onPrimaryContainer }}
              >
                {content.version} {selectedArticle.version}
              </Chip>
            )}
          </View>

          {selectedArticle.title && (
            <Text variant="titleLarge" style={[styles.detailTitle, { color: theme.colors.onSurface }]}>
              {selectedArticle.title}
            </Text>
          )}

          <Text variant="bodyLarge" style={[styles.detailContent, { color: theme.colors.onSurface }]}>
            {selectedArticle.content}
          </Text>

          <View style={styles.detailFooter}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurface + '60' }}>
              {content.lastUpdated}: {new Date(selectedArticle.updated_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </Surface>
    </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            {content.loading}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {viewMode === 'detail' && selectedArticle ? (
        renderDetailView()
      ) : (
        <>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
              <Icon name="arrow-back" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text variant="titleLarge" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
                {currentLanguage === 'fr' ? categoryInfo?.name_fr : categoryInfo?.name_en}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface + '80' }}>
                {filteredArticles.length} {content.articleCount}
              </Text>
            </View>
          </View>

          {/* Language Selector */}
          <View style={styles.languageContainer}>
            <View style={styles.languageSelector}>
              <Chip
                mode={currentLanguage === 'en' ? 'flat' : 'outlined'}
                onPress={() => handleLanguageChange('en')}
                style={[
                  styles.languageChip,
                  currentLanguage === 'en' && { backgroundColor: theme.colors.primary }
                ]}
                textStyle={[
                  styles.languageChipText,
                  { color: currentLanguage === 'en' ? 'white' : theme.colors.onSurface }
                ]}
              >
                EN
              </Chip>
              <Chip
                mode={currentLanguage === 'fr' ? 'flat' : 'outlined'}
                onPress={() => handleLanguageChange('fr')}
                style={[
                  styles.languageChip,
                  currentLanguage === 'fr' && { backgroundColor: theme.colors.primary }
                ]}
                textStyle={[
                  styles.languageChipText,
                  { color: currentLanguage === 'fr' ? 'white' : theme.colors.onSurface }
                ]}
              >
                FR
              </Chip>
            </View>
          </View>

          {/* Search Bar */}
          <Surface style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Searchbar
              placeholder={content.searchPlaceholder}
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              iconColor={theme.colors.primary}
              placeholderTextColor={theme.colors.onSurface + '60'}
              inputStyle={{ color: theme.colors.onSurface }}
            />
          </Surface>

          {/* Articles List */}
          {filteredArticles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="description" size={64} color={theme.colors.onSurface + '40'} />
              <Text variant="titleMedium" style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                {articles.length === 0 ? content.noArticles : content.noResults}
              </Text>
              {articles.length === 0 && (
                <TouchableOpacity style={styles.retryButton} onPress={loadArticles}>
                  <Text style={[styles.retryText, { color: theme.colors.primary }]}>
                    {content.retry}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={filteredArticles}
              renderItem={renderArticleCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBack: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  searchBar: {
    elevation: 0,
    shadowOpacity: 0,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  separator: {
    height: 12,
  },
  articleCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  articleContent: {
    padding: 16,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  articleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  articleNumber: {
    fontWeight: '600',
    marginRight: 8,
  },
  versionChip: {
    height: 24,
  },
  articleActions: {
    flexDirection: 'row',
  },
  articleTitle: {
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 20,
  },
  articlePreview: {
    lineHeight: 20,
    marginBottom: 12,
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Detail view styles
  detailContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  detailActions: {
    flexDirection: 'row',
  },
  detailCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  detailCardContent: {
    padding: 20,
  },
  detailTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailArticleNumber: {
    fontWeight: '700',
    marginRight: 12,
  },
  detailTitle: {
    fontWeight: '600',
    marginBottom: 20,
    lineHeight: 28,
  },
  detailContent: {
    lineHeight: 24,
    marginBottom: 24,
  },
  detailFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageChip: {
    marginRight: 8,
  },
  languageChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 