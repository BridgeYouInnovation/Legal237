import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Text, Searchbar, Card, useTheme, Surface, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../stores/authStore';
import newLegalDataService from '../../services/newLegalDataService';
import newPaymentService from '../../services/newPaymentService';
import FloatingChatButton from '../../components/FloatingChatButton';

const { width } = Dimensions.get('window');

export default function NewHomeScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const { t, i18n } = useTranslation();
  const theme = useTheme();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const handleLanguageChange = async () => {
      try {
        const currentLang = i18n.language;
        if (currentLang !== currentLanguage) {
          setCurrentLanguage(currentLang);
          await loadCategories(); // Reload categories with new language
        }
      } catch (error) {
        console.error('Error handling language change:', error);
      }
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [currentLanguage, i18n]);

  // Refresh data when screen focuses
  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [])
  );

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Get user's language preference
      const userLanguage = await AsyncStorage.getItem('user_language');
      if (userLanguage) {
        setCurrentLanguage(userLanguage);
        await i18n.changeLanguage(userLanguage);
      }

      // Initialize new legal data service
      await newLegalDataService.initialize();
      
      // Load categories and stats
      await loadCategories();
      await loadStats();
      
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const availableCategories = newLegalDataService.getAvailableCategories();
      setCategories(availableCategories);
      console.log(`📚 Loaded ${availableCategories.length} law categories`);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadStats = async () => {
    try {
      const statistics = await newLegalDataService.getStatistics();
      setStats(statistics);
      console.log('📊 Statistics loaded:', statistics);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const refreshData = async () => {
    try {
      console.log('🔄 Refreshing data...');
      
      // Refresh user purchases
      await newLegalDataService.refreshUserPurchases();
      
      // Reload categories with updated access info
      await loadCategories();
      await loadStats();
      
      console.log('✅ Data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('SearchResults', { query: searchQuery });
    } else {
      navigation.navigate('Search');
    }
  };

  const handleSearchFocus = () => {
    navigation.navigate('Search');
  };

  const handleCategoryPress = async (category) => {
    try {
      if (!category.has_access && !category.is_free) {
        // Show payment required alert
        Alert.alert(
          currentLanguage === 'fr' ? 'Paiement Requis' : 'Payment Required',
          currentLanguage === 'fr' 
            ? `Pour accéder au ${category.name_fr}, vous devez effectuer un paiement de ${category.price} ${category.currency}.`
            : `To access ${category.name_en}, you need to make a payment of ${category.price} ${category.currency}.`,
          [
            {
              text: currentLanguage === 'fr' ? 'Annuler' : 'Cancel',
              style: 'cancel'
            },
            {
              text: currentLanguage === 'fr' ? 'Payer' : 'Pay Now',
              onPress: () => navigation.navigate('Payment', { 
                documentType: category.code,
                categoryInfo: category 
              })
            }
          ]
        );
      } else {
        // User has access, navigate to law viewer
        navigation.navigate('LawViewer', { 
          categoryCode: category.code,
          categoryInfo: category
        });
      }
    } catch (error) {
      console.error('Error handling category press:', error);
      Alert.alert(
        'Error',
        'Failed to access category. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const getLocalizedContent = () => {
    if (currentLanguage === 'fr') {
      return {
        searchPlaceholder: "Rechercher des lois, articles, procédures...",
        quickAccess: "Accès Rapide",
        articles: "articles",
        aiTitle: "Assistant Juridique IA",
        aiSubtitle: "Posez des questions juridiques et obtenez des réponses instantanées",
        popularTopics: "Sujets Populaires",
        topics: ['Vol', 'Caution', 'Procédure pénale', 'Preuve', 'Appels', 'Sentence'],
        paid: "Accès",
        free: "Gratuit",
        requiresPayment: "Payant",
        totalCategories: "Livres totaux",
        accessibleArticles: "Articles accessibles",
        lawyerBannerTitle: "Besoin d'un Avocat ?",
        lawyerBannerSubtitle: "Trouvez des avocats qualifiés près de chez vous",
        lawyerBannerButton: "Explorer les Avocats",
        legalDocuments: "Documents Légaux"
      };
    } else {
      return {
        searchPlaceholder: "Search laws, articles, procedures...",
        quickAccess: "Quick Access",
        articles: "articles",
        aiTitle: "AI Legal Assistant",
        aiSubtitle: "Ask legal questions and get instant answers",
        popularTopics: "Popular Topics",
        topics: ['Theft', 'Bail', 'Criminal procedure', 'Evidence', 'Appeals', 'Sentencing'],
        paid: "Access",
        free: "Free",
        requiresPayment: "Paid",
        totalCategories: "Total Books",
        accessibleArticles: "Accessible Articles",
        lawyerBannerTitle: "Need a Lawyer?",
        lawyerBannerSubtitle: "Find qualified lawyers near you",
        lawyerBannerButton: "Explore Lawyers",
        legalDocuments: "Legal Documents"
      };
    }
  };

  const getCategoryIcon = (iconName) => {
    const iconMap = {
      'gavel': 'gavel',
      'scale-balanced': 'balance',
      'users': 'people',
      'briefcase': 'business-center',
      'hard-hat': 'engineering',
      'home': 'home',
      'document-text': 'description',
      'book-open': 'menu-book',
      'shield-check': 'security',
      'building-office': 'business',
      'banknotes': 'payments',
      'academic-cap': 'school',
      'heart': 'favorite',
      'truck': 'local-shipping',
      'globe-alt': 'public'
    };
    return iconMap[iconName] || 'description';
  };

  const getCategoryGradient = (color, index) => {
    if (color) {
      // Create gradient from the provided color
      const baseColor = color;
      const lighterColor = color + '80'; // Add transparency
      return [lighterColor, baseColor];
    }
    
    // Fallback gradient colors
    const gradients = [
      ['#2E7D32', '#4CAF50'], // Green
      ['#1976D2', '#2196F3'], // Blue
      ['#C62828', '#E53935'], // Red
      ['#7B1FA2', '#9C27B0'], // Purple
      ['#F57C00', '#FF9800'], // Orange
      ['#5D4037', '#795548'], // Brown
      ['#00796B', '#009688'], // Teal
      ['#303F9F', '#3F51B5']  // Indigo
    ];
    return gradients[index % gradients.length];
  };

  const content = getLocalizedContent();

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Enhanced Search Bar */}
        <Surface style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <TouchableOpacity onPress={handleSearchFocus} activeOpacity={0.7}>
            <Searchbar
              placeholder={content.searchPlaceholder}
              onChangeText={setSearchQuery}
              value={searchQuery}
              onSubmitEditing={handleSearch}
              onFocus={handleSearchFocus}
              style={[styles.searchBar, { backgroundColor: 'transparent' }]}
              iconColor={theme.colors.primary}
              placeholderTextColor={theme.colors.onSurface + '80'}
              inputStyle={{ color: theme.colors.onSurface }}
              editable={false}
              pointerEvents="none"
            />
          </TouchableOpacity>
        </Surface>

        {/* Statistics Section */}
        {stats && (
          <View style={styles.statsSection}>
            <View style={styles.statsGrid}>
              <Surface style={[styles.statsCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                <Text style={[styles.statsNumber, { color: theme.colors.primary }]}>{stats.total_categories}</Text>
                <Text style={[styles.statsLabel, { color: theme.colors.onSurface }]}>{content.totalCategories}</Text>
              </Surface>
              <Surface style={[styles.statsCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                <Text style={[styles.statsNumber, { color: theme.colors.primary }]}>{stats.accessible_articles}</Text>
                <Text style={[styles.statsLabel, { color: theme.colors.onSurface }]}>{content.accessibleArticles}</Text>
              </Surface>
            </View>
          </View>
        )}

        {/* Lawyer Banner Section */}
        <TouchableOpacity
          style={styles.lawyerBanner}
          onPress={() => navigation.navigate('FindLawyer')}
          activeOpacity={0.8}
        >
          <View style={[styles.lawyerBannerGradient, { backgroundColor: '#059669' }]}>
            <View style={styles.lawyerBannerContent}>
              <View style={styles.lawyerBannerLeft}>
                <View style={styles.lawyerIconWrapper}>
                  <Icon name="gavel" size={width < 350 ? 24 : 28} color="white" />
                </View>
                <View style={styles.lawyerTextContainer}>
                  <Text style={styles.lawyerBannerTitle} numberOfLines={1}>
                    {content.lawyerBannerTitle}
                  </Text>
                  <Text style={styles.lawyerBannerSubtitle} numberOfLines={2}>
                    {content.lawyerBannerSubtitle}
                  </Text>
                </View>
              </View>
              <View style={styles.lawyerBannerRight}>
                <View style={styles.lawyerButton}>
                  <Text style={styles.lawyerButtonText} numberOfLines={1}>
                    {content.lawyerBannerButton}
                  </Text>
                </View>
                <Icon name="arrow-forward" size={width < 350 ? 16 : 20} color="white" />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Legal Documents Section */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {content.legalDocuments}
          </Text>

          <View style={styles.categoriesGrid}>
            {categories.map((category, index) => (
              <TouchableOpacity 
                key={category.code}
                style={styles.categoryCard} 
                onPress={() => handleCategoryPress(category)}
                activeOpacity={0.8}
              >
                <View style={styles.gradientCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.iconWrapper}>
                      <Icon name={getCategoryIcon(category.icon)} size={28} color="#059669" />
                    </View>
                    <View style={styles.statsContainer}>
                      <Text style={[styles.statsNumber, { fontSize: 20, color: '#1A1A1A' }]}>{category.active_articles}</Text>
                      <Text style={[styles.statsLabel, { fontSize: 11, color: '#666666' }]}>{content.articles}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.cardBody}>
                    <Text variant="titleSmall" style={styles.cardTitle} numberOfLines={2}>
                      {currentLanguage === 'fr' ? category.name_fr : category.name_en}
                    </Text>
                    <Text variant="bodySmall" style={styles.cardSubtitle} numberOfLines={2}>
                      {currentLanguage === 'fr' ? category.description_fr : category.description_en}
                    </Text>
                  </View>
                  
                  <View style={styles.cardFooter}>
                    {category.has_access || category.is_free ? (
                      <View style={styles.accessIndicator}>
                        <Icon name="check-circle" size={14} color="#2D7D32" />
                        <Text style={styles.accessText}>
                          {category.is_free ? content.free : content.paid}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.paymentIndicator}>
                        <Icon name="lock" size={14} color="#F57C00" />
                        <Text style={styles.paymentText}>
                          {category.price} {category.currency}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* AI Assistant Card */}
        <TouchableOpacity
          style={styles.aiCard}
          onPress={() => navigation.navigate('Chat')}
          activeOpacity={0.8}
        >
          <Card style={{ backgroundColor: theme.colors.surface }}>
            <Card.Content style={styles.aiCardContent}>
              <View style={styles.aiHeader}>
                <View style={[styles.aiIconWrapper, { backgroundColor: theme.colors.primary }]}>
                  <Icon name="smart-toy" size={24} color="white" />
                </View>
                <View style={styles.aiTextContainer}>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                    {content.aiTitle}
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurface + '80' }}>
                    {content.aiSubtitle}
                  </Text>
                </View>
                <Icon name="arrow-forward" size={20} color={theme.colors.primary} />
              </View>
            </Card.Content>
          </Card>
        </TouchableOpacity>

        {/* Popular Topics */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {content.popularTopics}
          </Text>
          <View style={styles.topicsContainer}>
            {content.topics.map((topic, index) => (
              <Chip
                key={index}
                style={[styles.topicChip, { backgroundColor: theme.colors.surface }]}
                textStyle={{ color: theme.colors.onSurface }}
                onPress={() => navigation.navigate('SearchResults', { query: topic })}
              >
                {topic}
              </Chip>
            ))}
          </View>
        </View>
      </ScrollView>

      <FloatingChatButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    marginVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  searchBar: {
    elevation: 0,
    shadowOpacity: 0,
  },
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 6,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statsNumber: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    color: '#1A1A1A',
  },
  statsLabel: {
    fontSize: 13,
    textAlign: 'center',
    color: '#666666',
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 20,
    fontWeight: '700',
    fontSize: 20,
    color: '#1A1A1A',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (width - 44) / 2,
    marginBottom: 16,
  },
  gradientCard: {
    borderRadius: 20,
    padding: 20,
    minHeight: 160,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    color: '#1A1A1A',
    fontWeight: '700',
    marginBottom: 6,
    fontSize: 16,
  },
  cardSubtitle: {
    color: '#666666',
    lineHeight: 18,
    fontSize: 13,
  },
  cardFooter: {
    marginTop: 16,
  },
  accessIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#C3E6C3',
  },
  accessText: {
    color: '#2D7D32',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  paymentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  paymentText: {
    color: '#F57C00',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  aiCard: {
    marginBottom: 24,
  },
  aiCardContent: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  aiTextContainer: {
    flex: 1,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  topicChip: {
    marginBottom: 8,
    marginRight: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  // Lawyer Banner Styles
  lawyerBanner: {
    marginBottom: 28,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  lawyerBannerGradient: {
    paddingVertical: width < 350 ? 20 : 26,
    paddingHorizontal: width < 350 ? 18 : 24,
  },
  lawyerBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: width < 350 ? 70 : 80,
  },
  lawyerBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: width < 350 ? 10 : 14,
  },
  lawyerIconWrapper: {
    width: width < 350 ? 50 : 58,
    height: width < 350 ? 50 : 58,
    borderRadius: width < 350 ? 15 : 17,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width < 350 ? 14 : 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  lawyerTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  lawyerBannerTitle: {
    color: 'white',
    fontWeight: '700',
    marginBottom: 6,
    fontSize: width < 350 ? 17 : width < 400 ? 18 : 19,
    lineHeight: width < 350 ? 22 : width < 400 ? 24 : 26,
  },
  lawyerBannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: width < 350 ? 13 : width < 400 ? 14 : 15,
    fontWeight: '500',
    lineHeight: width < 350 ? 18 : width < 400 ? 20 : 22,
  },
  lawyerBannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  lawyerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: width < 350 ? 14 : 18,
    paddingVertical: width < 350 ? 10 : 12,
    borderRadius: width < 350 ? 22 : 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    marginRight: width < 350 ? 10 : 14,
    minWidth: width < 350 ? 70 : 90,
    alignItems: 'center',
  },
  lawyerButtonText: {
    color: 'white',
    fontSize: width < 350 ? 12 : width < 400 ? 13 : 14,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 