"use client"

import { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, RefreshControl } from "react-native"
import { Text, Searchbar, Card, useTheme, Avatar, Chip, Button, Divider, ActivityIndicator } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useFocusEffect } from "@react-navigation/native"
import Icon from "react-native-vector-icons/MaterialIcons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import legalDataService from "../../services/legalDataService"
import FloatingChatButton from "../../components/FloatingChatButton"
import { useTranslation } from "react-i18next"
import subscriptionService from "../../services/subscriptionService"

export default function FindLawyerScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState(null)
  const [lawyers, setLawyers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [hasSubscription, setHasSubscription] = useState(false)
  const [checkingSubscription, setCheckingSubscription] = useState(true)
  const { t, i18n } = useTranslation()
  const theme = useTheme()

  // Get current language from i18n
  const currentLanguage = i18n.language

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const userLanguage = await AsyncStorage.getItem('user_language')
        if (userLanguage && userLanguage !== i18n.language) {
          await i18n.changeLanguage(userLanguage)
        }
      } catch (error) {
        console.error('Error loading language:', error)
      }
    }
    loadLanguage()
  }, [])

  // Reload content when language changes
  useEffect(() => {
    console.log('Language changed to:', currentLanguage)
    // Reset selected specialty when language changes since translations might be different
    setSelectedSpecialty(null)
  }, [currentLanguage])

  // Check if user has lawyers subscription
  const checkSubscription = async (forceRefresh = false) => {
    try {
      setCheckingSubscription(true)
      const hasAccess = await subscriptionService.hasLawyersAccess(forceRefresh)
      setHasSubscription(hasAccess)
      
      if (!hasAccess) {
        // Show subscription required screen
        showSubscriptionRequired()
        return false
      }
      return true
    } catch (error) {
      console.error('Error checking subscription:', error)
      setHasSubscription(false)
      return false
    } finally {
      setCheckingSubscription(false)
    }
  }

  // Show subscription required alert
  const showSubscriptionRequired = () => {
    Alert.alert(
      currentLanguage === 'fr' ? 'Abonnement Requis' : 'Subscription Required',
      currentLanguage === 'fr' 
        ? 'Vous devez souscrire à l\'accès à l\'annuaire des avocats pour voir cette page. Coût unique: 500 XAF'
        : 'You need to subscribe to lawyers directory access to view this page. One-time fee: 500 XAF',
      [
        {
          text: currentLanguage === 'fr' ? 'Plus tard' : 'Later',
          style: 'cancel',
          onPress: () => navigation.goBack()
        },
        {
          text: currentLanguage === 'fr' ? 'S\'abonner' : 'Subscribe',
          onPress: () => navigation.navigate('LawyersSubscription')
        }
      ]
    )
  }

  // Load lawyers from database
  const loadLawyers = async () => {
    try {
      setLoading(true)
      console.log('Fetching lawyers from database...')
      const lawyersData = await legalDataService.getLawyers()
      console.log('Lawyers loaded:', lawyersData)
      setLawyers(lawyersData || [])
    } catch (error) {
      console.error('Error loading lawyers:', error)
      Alert.alert(
        currentLanguage === 'fr' ? 'Erreur' : 'Error',
        currentLanguage === 'fr' 
          ? 'Impossible de charger les avocats. Vérifiez votre connexion.'
          : 'Failed to load lawyers. Please check your connection.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Refresh lawyers data
  const onRefresh = async () => {
    setRefreshing(true)
    const hasAccess = await checkSubscription(true) // Force refresh from database
    if (hasAccess) {
      await loadLawyers()
    }
    setRefreshing(false)
  }

  // Load lawyers when screen focuses
  useFocusEffect(
    useCallback(() => {
      const initializeScreen = async () => {
        const hasAccess = await checkSubscription(true) // Force refresh from database when screen focuses
        if (hasAccess) {
          await loadLawyers()
        }
      }
      initializeScreen()
    }, [])
  )

  const getLocalizedContent = () => {
    if (currentLanguage === 'fr') {
      return {
        title: "Trouver un Avocat",
        searchPlaceholder: "Rechercher un avocat...",
        specialties: "Spécialités",
        allSpecialties: "Toutes",
        featuredLawyers: "Avocats Disponibles",
        callNow: "Appeler",
        email: "Email",
        experience: "ans d'expérience",
        specialtyList: [
          "Criminal Law",
          "Civil Law",
          "Commercial Law",
          "Family Law",
          "Labor Law",
          "Real Estate Law"
        ],
        specialtyTranslations: {
          "Criminal Law": "Droit Pénal",
          "Civil Law": "Droit Civil",
          "Commercial Law": "Droit Commercial",
          "Family Law": "Droit de la Famille",
          "Labor Law": "Droit du Travail",
          "Real Estate Law": "Droit Immobilier"
        },
        noResults: "Aucun avocat trouvé",
        tryDifferentSearch: "Essayez une recherche différente",
        loading: "Chargement des avocats..."
      }
    } else {
      return {
        title: "Find a Lawyer",
        searchPlaceholder: "Search lawyers...",
        specialties: "Specialties",
        allSpecialties: "All",
        featuredLawyers: "Available Lawyers",
        callNow: "Call Now",
        email: "Email",
        experience: "years experience",
        specialtyList: [
          "Criminal Law",
          "Civil Law",
          "Commercial Law",
          "Family Law",
          "Labor Law",
          "Real Estate Law"
        ],
        specialtyTranslations: {
          "Criminal Law": "Criminal Law",
          "Civil Law": "Civil Law",
          "Commercial Law": "Commercial Law",
          "Family Law": "Family Law",
          "Labor Law": "Labor Law",
          "Real Estate Law": "Real Estate Law"
        },
        noResults: "No lawyers found",
        tryDifferentSearch: "Try a different search",
        loading: "Loading lawyers..."
      }
    }
  }

  const content = getLocalizedContent()

  // Function to get localized specialty name
  const getLocalizedSpecialty = (specialty) => {
    return content.specialtyTranslations[specialty] || specialty
  }

  const filteredLawyers = lawyers.filter(lawyer => {
    const matchesSearch = !searchQuery || 
      lawyer.name.includes(searchQuery) ||
      lawyer.specialization.includes(searchQuery) ||
      lawyer.location.includes(searchQuery)
    
    const matchesSpecialty = !selectedSpecialty || lawyer.specialization === selectedSpecialty
    
    return matchesSearch && matchesSpecialty
  })

  const handleCall = (phone) => {
    Alert.alert(
      currentLanguage === 'fr' ? 'Appeler' : 'Call',
      `${currentLanguage === 'fr' ? 'Appeler' : 'Call'} ${phone}?`,
      [
        { text: currentLanguage === 'fr' ? 'Annuler' : 'Cancel', style: 'cancel' },
        { 
          text: currentLanguage === 'fr' ? 'Appeler' : 'Call', 
          onPress: () => {
            Linking.openURL(`tel:${phone}`).catch(err => {
              console.error('Error opening phone dialer:', err)
              Alert.alert(
                currentLanguage === 'fr' ? 'Erreur' : 'Error',
                currentLanguage === 'fr' 
                  ? 'Impossible d\'ouvrir le composeur'
                  : 'Unable to open phone dialer'
              )
            })
          }
        }
      ]
    )
  }

  const renderLawyerCard = (lawyer) => (
    <Card key={lawyer.id} style={styles.lawyerCard}>
      <Card.Content style={styles.lawyerContent}>
        <View style={styles.lawyerHeader}>
          {lawyer.profile_image_url ? (
            <Avatar.Image 
              size={60} 
              source={{ uri: lawyer.profile_image_url }}
            />
          ) : (
            <Avatar.Text 
              size={60} 
              label={lawyer.name.split(' ').map(n => n[0]).join('')}
              style={{ backgroundColor: theme.colors.primary }}
            />
          )}
          <View style={styles.lawyerInfo}>
            <View style={styles.nameRow}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                {lawyer.name}
              </Text>
              <Icon name="verified" size={20} color={theme.colors.primary} />
            </View>
            <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
              {getLocalizedSpecialty(lawyer.specialization)}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
              {lawyer.years_experience} {content.experience} • {lawyer.location}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
              {currentLanguage === 'fr' ? 'Barreau: ' : 'Bar: '}{lawyer.bar_number}
            </Text>
            <TouchableOpacity onPress={() => Linking.openURL(`mailto:${lawyer.email}`)}>
              <Text variant="bodySmall" style={{ color: theme.colors.primary, marginTop: 4 }}>
                {lawyer.email}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.lawyerActions}>
          <Button 
            mode="outlined" 
            onPress={() => handleCall(lawyer.phone)}
            style={styles.actionButton}
            icon="phone"
          >
            {content.callNow}
          </Button>
          <Button 
            mode="contained" 
            onPress={() => Linking.openURL(`mailto:${lawyer.email}`)}
            style={styles.actionButton}
            icon="email"
          >
            {content.email}
          </Button>
        </View>
      </Card.Content>
    </Card>
  )

  // Show loading screen while checking subscription
  if (checkingSubscription) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
          <Text variant="bodyMedium" style={{ color: theme.colors.outline, marginTop: 16 }}>
            {currentLanguage === 'fr' ? 'Vérification de l\'abonnement...' : 'Checking subscription...'}
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  // Don't render main content if user doesn't have subscription
  if (!hasSubscription) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.subscriptionRequiredContainer}>
          <Icon name="gavel" size={64} color={theme.colors.outline} />
          <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, textAlign: 'center', marginTop: 16 }}>
            {currentLanguage === 'fr' ? 'Abonnement Requis' : 'Subscription Required'}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.outline, textAlign: 'center', marginTop: 8, marginHorizontal: 32 }}>
            {currentLanguage === 'fr' 
              ? 'Souscrivez à l\'accès à l\'annuaire des avocats pour voir cette page.'
              : 'Subscribe to lawyers directory access to view this page.'
            }
          </Text>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('LawyersSubscription')}
            style={{ marginTop: 24, marginHorizontal: 32 }}
          >
            {currentLanguage === 'fr' ? 'S\'abonner (500 XAF)' : 'Subscribe (500 XAF)'}
          </Button>
          <Button 
            mode="text" 
            onPress={() => navigation.goBack()}
            style={{ marginTop: 8 }}
          >
            {currentLanguage === 'fr' ? 'Retour' : 'Go Back'}
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
          {content.title}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder={content.searchPlaceholder}
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[
              styles.searchBar, 
              { backgroundColor: theme.colors.surface }
            ]}
            inputStyle={[
              styles.searchInput, 
              { color: theme.colors.onSurface }
            ]}
            iconColor={theme.colors.primary}
            placeholderTextColor={theme.colors.onSurface + '60'}
            elevation={2}
          />
        </View>

        {/* Specialties Filter */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {content.specialties}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
            <Chip
              mode={selectedSpecialty === null ? "flat" : "outlined"}
              onPress={() => setSelectedSpecialty(null)}
              style={styles.chip}
              selected={selectedSpecialty === null}
            >
              {content.allSpecialties}
            </Chip>
            {content.specialtyList.map((specialty, index) => (
              <Chip
                key={index}
                mode={selectedSpecialty === specialty ? "flat" : "outlined"}
                onPress={() => setSelectedSpecialty(specialty)}
                style={styles.chip}
                selected={selectedSpecialty === specialty}
              >
                {getLocalizedSpecialty(specialty)}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {/* Lawyers List */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {content.featuredLawyers}
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
              <Text variant="bodyMedium" style={{ color: theme.colors.outline, marginTop: 16 }}>
                {content.loading}
              </Text>
            </View>
          ) : filteredLawyers.length > 0 ? (
            filteredLawyers.map(renderLawyerCard)
          ) : (
            <View style={styles.noResults}>
              <Icon name="search-off" size={48} color={theme.colors.outline} />
              <Text variant="titleMedium" style={{ color: theme.colors.outline, marginTop: 16 }}>
                {content.noResults}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.outline, marginTop: 8 }}>
                {content.tryDifferentSearch}
              </Text>
            </View>
          )}
        </View>

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
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    marginBottom: 24,
    paddingHorizontal: 2,
  },
  searchBar: {
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 56,
    borderWidth: 0,
  },
  searchInput: {
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlignVertical: 'center',
    minHeight: 44,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: "bold",
  },
  chipsContainer: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  chip: {
    marginRight: 8,
  },
  lawyerCard: {
    marginBottom: 16,
    elevation: 2,
  },
  lawyerContent: {
    padding: 16,
  },
  lawyerHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  lawyerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  lawyerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  bottomSpacing: {
    height: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    justifyContent: 'center',
    flex: 1,
  },
  subscriptionRequiredContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 20,
  },
}) 