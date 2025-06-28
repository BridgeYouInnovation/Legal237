"use client"

import { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from "react-native"
import { Text, Searchbar, Card, useTheme, Avatar, Chip, Surface } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useFocusEffect } from "@react-navigation/native"
import Icon from "react-native-vector-icons/MaterialIcons"
import { LinearGradient } from 'expo-linear-gradient'
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useAuthStore } from "../../stores/authStore"
import legalDataService from "../../services/legalDataService"
import newPaymentService from "../../services/newPaymentService"
import FloatingChatButton from "../../components/FloatingChatButton"

const { width } = Dimensions.get('window')

export default function HomeScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [stats, setStats] = useState(null)
  const [currentLanguage, setCurrentLanguage] = useState("en")
  const [purchasedDocuments, setPurchasedDocuments] = useState([])
  const [availableLawTypes, setAvailableLawTypes] = useState([])
  const { user } = useAuthStore()
  const { t, i18n } = useTranslation()
  const theme = useTheme()

  useEffect(() => {
    // Load data and initialize language
    const loadData = async () => {
      try {
        // Get user's language preference
        const userLanguage = await AsyncStorage.getItem('user_language')
        if (userLanguage) {
          setCurrentLanguage(userLanguage)
          await i18n.changeLanguage(userLanguage)
        }

        const statistics = await legalDataService.getStatistics()
        setStats(statistics)
        
        // Load available law types from database
        const lawTypes = await legalDataService.getAvailableLawTypes()
        setAvailableLawTypes(lawTypes)
        
        // Load purchased documents
        const purchased = await newPaymentService.getPurchasedDocuments()
        setPurchasedDocuments(purchased)
      } catch (error) {
        console.error('Error loading data:', error)
        const statistics = await legalDataService.getStatistics()
        setStats(statistics)
      }
    }
    loadData()
  }, [])

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = async () => {
      try {
        const currentLang = i18n.language
        if (currentLang !== currentLanguage) {
          setCurrentLanguage(currentLang)
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
  }, [currentLanguage, i18n])

  // Refresh payment status when screen focuses
  useFocusEffect(
    useCallback(() => {
      const refreshData = async () => {
        try {
          console.log('Refreshing data...')
          
          // Clear legal data cache to get fresh data from database
          legalDataService.clearCache()
          
          // Sync payments from database first
          await newPaymentService.syncPaymentsFromDatabase()
          
          // Also sync direct payments to database
          const directPaymentService = require('../../services/directPaymentService').default
          await directPaymentService.syncAllPurchasesToDatabase()
          
          // Reload purchased documents
          const purchased = await newPaymentService.getPurchasedDocuments()
          setPurchasedDocuments(purchased)
          
          // Refresh law types and statistics
          const lawTypes = await legalDataService.getAvailableLawTypes()
          setAvailableLawTypes(lawTypes)
          
          const statistics = await legalDataService.getStatistics()
          setStats(statistics)
          
          console.log('Data refreshed successfully')
        } catch (error) {
          console.error('Error refreshing data:', error)
        }
      }

      refreshData()
    }, [])
  )



  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate("SearchResults", { query: searchQuery })
    } else {
      // Navigate to dedicated search screen if no query
      navigation.navigate("Search")
    }
  }

  const handleSearchFocus = () => {
    // Navigate to dedicated search screen when search bar is focused
    navigation.navigate("Search")
  }

  const handleCategoryPress = async (category) => {
    // For backward compatibility, map old categories to document types
    let documentType;
    if (category === 'penal') {
      documentType = 'penal_code';
    } else if (category === 'procedure') {
      documentType = 'criminal_procedure';
    } else {
      // For new law types, use the category directly as document type
      documentType = category;
    }
    
    // Check if payment is required
    const isPaymentRequired = await newPaymentService.hasPaidForDocument(documentType)
    
    if (!isPaymentRequired) {
      // Show payment required alert
      const docInfo = newPaymentService.getDocumentInfo(documentType)
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
      navigation.navigate("LawViewer", { category, documentType })
    }
  }

  const getLocalizedContent = () => {
    if (currentLanguage === 'fr') {
      return {
        searchPlaceholder: "Rechercher des lois, articles, procédures...",
        quickAccess: "Accès Rapide",
        penalCode: "Code Pénal",
        penalSubtitle: "Articles de droit pénal",
        criminalProcedure: "Code de Procédure Pénale", 
        procedureSubtitle: "Directives de procédure",
        articles: "articles",
        aiTitle: "Assistant Juridique IA",
        aiSubtitle: "Posez des questions juridiques et obtenez des réponses instantanées",
        questionsLeft: "2 questions restantes aujourd'hui",
        popularTopics: "Sujets Populaires",
        topics: ['Vol', 'Caution', 'Procédure pénale', 'Preuve', 'Appels', 'Sentence'],
        paid: "Payé",
        requiresPayment: "5,000 XAF"
      }
    } else {
      return {
        searchPlaceholder: "Search laws, articles, procedures...",
        quickAccess: "Quick Access",
        penalCode: "Penal Code",
        penalSubtitle: "Criminal law articles",
        criminalProcedure: "Criminal Procedure Code",
        procedureSubtitle: "Procedure guidelines", 
        articles: "articles",
        aiTitle: "AI Legal Assistant",
        aiSubtitle: "Ask legal questions and get instant answers",
        questionsLeft: "2 questions left today",
        popularTopics: "Popular Topics",
        topics: ['Theft', 'Bail', 'Criminal procedure', 'Evidence', 'Appeals', 'Sentencing'],
        paid: "Paid",
        requiresPayment: "5,000 XAF"
      }
    }
  }

  const content = getLocalizedContent()

  // Generate dynamic quick access data from database
  const generateQuickAccessData = () => {
    if (!availableLawTypes.length) {
      // Fallback to default law types while loading
      return [
        {
          id: 'penal_code',
          title: content.penalCode,
          subtitle: content.penalSubtitle,
          icon: 'gavel',
          color: ['#2E7D32', '#4CAF50'],
          articles: stats?.by_document?.penal_code_en || 0,
          action: () => handleCategoryPress('penal'),
          documentType: 'penal_code',
          isPaid: purchasedDocuments.includes('penal_code')
        },
        {
          id: 'criminal_procedure',
          title: content.criminalProcedure,
          subtitle: content.procedureSubtitle,
          icon: 'description',
          color: ['#C62828', '#E53935'],
          articles: stats?.by_document?.criminal_procedure_en || 0,
          action: () => handleCategoryPress('procedure'),
          documentType: 'criminal_procedure',
          isPaid: purchasedDocuments.includes('criminal_procedure')
        }
      ]
    }

    return availableLawTypes.map((lawType, index) => {
      const colors = [
        ['#2E7D32', '#4CAF50'], // Green
        ['#C62828', '#E53935'], // Red
        ['#1976D2', '#2196F3'], // Blue
        ['#7B1FA2', '#9C27B0'], // Purple
        ['#F57C00', '#FF9800'], // Orange
        ['#5D4037', '#795548']  // Brown
      ];

      const icons = ['gavel', 'description', 'article', 'balance', 'security', 'policy'];
      
      // Get localized title based on law type
      const getLocalizedTitle = (type) => {
        switch (type) {
          case 'penal_code':
            return content.penalCode;
          case 'criminal_procedure':
            return content.criminalProcedure;
          default:
            // Convert snake_case to Title Case
            return type.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
        }
      };

      const getLocalizedSubtitle = (type) => {
        switch (type) {
          case 'penal_code':
            return content.penalSubtitle;
          case 'criminal_procedure':
            return content.procedureSubtitle;
          default:
            return currentLanguage === 'fr' ? 'Articles juridiques' : 'Legal articles';
        }
      };

      // Get category for navigation (fallback for new law types)
      const getCategory = (type) => {
        switch (type) {
          case 'penal_code':
            return 'penal';
          case 'criminal_procedure':
            return 'procedure';
          default:
            // For new law types, use the type itself as category
            return type;
        }
      };

      return {
        id: lawType.id,
        title: getLocalizedTitle(lawType.documentType),
        subtitle: getLocalizedSubtitle(lawType.documentType),
        icon: icons[index % icons.length],
        color: colors[index % colors.length],
        articles: lawType.articleCount[currentLanguage] || 0,
        action: () => handleCategoryPress(getCategory(lawType.documentType)),
        documentType: lawType.documentType,
        isPaid: purchasedDocuments.includes(lawType.documentType)
      };
    });
  };

  const quickAccessData = generateQuickAccessData();

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



        {/* Quick Access Section */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {content.quickAccess}
          </Text>

          <View style={styles.categoriesGrid}>
            {quickAccessData.map((item) => (
              <TouchableOpacity 
                key={item.id}
                style={styles.categoryCard} 
                onPress={item.action}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={item.color}
                  style={styles.gradientCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.iconWrapper}>
                      <Icon name={item.icon} size={28} color="white" />
                    </View>
                    <View style={styles.statsContainer}>
                      <Text style={styles.statsNumber}>{item.articles}</Text>
                      <Text style={styles.statsLabel}>{content.articles}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.cardBody}>
                    <Text variant="titleSmall" style={styles.cardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text variant="bodySmall" style={styles.cardSubtitle} numberOfLines={2}>
                      {item.subtitle}
                    </Text>
                  </View>
                  
                  <View style={styles.cardFooter}>
                    {item.isPaid ? (
                      <View style={styles.paidIndicator}>
                        <Icon name="check-circle" size={14} color="white" />
                        <Text style={styles.paidText}>{content.paid}</Text>
                      </View>
                    ) : (
                      <View style={styles.paymentIndicator}>
                        <Icon name="lock" size={14} color="white" />
                        <Text style={styles.paymentText}>{content.requiresPayment}</Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Popular Topics */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {content.popularTopics}
          </Text>
          <View style={styles.topicsContainer}>
            {content.topics.map((topic, index) => (
              <Chip
                key={index}
                mode="outlined"
                onPress={() => {
                  setSearchQuery(topic)
                  navigation.navigate("SearchResults", { query: topic })
                }}
                style={[styles.topicChip, { borderColor: theme.colors.outline }]}
                textStyle={{ color: theme.colors.onSurface }}
                icon="trending-up"
              >
                {topic}
              </Chip>
            ))}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
      <FloatingChatButton />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    borderRadius: 16,
    marginBottom: 32,
    marginTop: 20,
  },
  searchBar: {
    elevation: 0,
    borderRadius: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearText: {
    fontWeight: '500',
  },
  categoriesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 16,
  },
  categoryCard: {
    flex: 1,
    minHeight: 160,
    maxWidth: '48%',
  },
  gradientCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 50,
  },
  statsNumber: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  statsLabel: {
    color: 'white',
    fontSize: 9,
    opacity: 0.9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 8,
  },
  cardTitle: {
    color: "white",
    fontWeight: "bold",
    marginBottom: 6,
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardSubtitle: {
    color: "white",
    opacity: 0.9,
    fontSize: 11,
    lineHeight: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardFooter: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
  paidIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  paidText: {
    color: 'white',
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '600',
  },
  paymentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  paymentText: {
    color: 'white',
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '600',
  },
  topicsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  topicChip: {
    marginBottom: 8,
  },
  bottomSpacing: {
    height: 20,
  },
})
