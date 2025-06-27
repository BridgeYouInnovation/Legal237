"use client"

import React, { useState, useEffect, useRef } from "react"
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Dimensions,
  Alert
} from "react-native"
import { 
  Text, 
  TextInput, 
  IconButton, 
  useTheme, 
  Card,
  Chip,
  ActivityIndicator,
  Menu,
  Divider,
  Button
} from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useFocusEffect } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Icon from "react-native-vector-icons/MaterialIcons"
import aiChatService from "../../services/aiChatService"
import audioService from "../../services/audioService"

const { width } = Dimensions.get('window')
const SIDEBAR_WIDTH = width * 0.75

export default function ChatScreen({ navigation }) {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState("")
  const [loading, setLoading] = useState(false)
  const [conversations, setConversations] = useState([])
  const [currentConversation, setCurrentConversation] = useState(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState('en')
  
  // Audio-related state
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioLoading, setAudioLoading] = useState(false)

  const flatListRef = useRef(null)
  const { t } = useTranslation()
  const theme = useTheme()

  useEffect(() => {
    initializeChat()
  }, [])

  // Listen for language changes when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const updateLanguage = async () => {
        try {
          const userLanguage = await AsyncStorage.getItem('user_language')
          if (userLanguage && userLanguage !== currentLanguage) {
            setCurrentLanguage(userLanguage)
          }
        } catch (error) {
          console.error('Error updating language:', error)
        }
      }
      updateLanguage()
    }, [currentLanguage])
  )

  const initializeChat = async () => {
    try {
      // Initialize audio service
      await audioService.initialize()
      
      // Get user language
      const userLanguage = await AsyncStorage.getItem('user_language')
      setCurrentLanguage(userLanguage || 'en')

      // Load conversations
      const allConversations = aiChatService.getConversations()
      setConversations(allConversations)

      // Load current conversation or create new one
      let conversation = aiChatService.getCurrentConversation()
      if (!conversation && allConversations.length === 0) {
        const newConversationId = await aiChatService.createNewConversation()
        conversation = aiChatService.getCurrentConversation()
      } else if (!conversation && allConversations.length > 0) {
        conversation = aiChatService.setCurrentConversation(allConversations[0].id)
      }

      if (conversation) {
        setCurrentConversation(conversation)
        setMessages(conversation.messages || [])
      }
    } catch (error) {
      console.error('Error initializing chat:', error)
    }
  }

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return

    const userMessage = inputText.trim()
    setInputText("")
    setLoading(true)

    try {
      // Add user message to UI immediately
      const tempUserMessage = {
        id: Date.now().toString(),
        content: userMessage,
        role: 'user',
        timestamp: new Date().toISOString()
      }
      
      setMessages(prev => [...prev, tempUserMessage])
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)

      // Get AI response
      const response = await aiChatService.generateResponse(userMessage, currentLanguage)
      
      // Update conversations and messages
      const updatedConversation = aiChatService.getCurrentConversation()
      if (updatedConversation) {
        setCurrentConversation(updatedConversation)
        setMessages(updatedConversation.messages)
        setConversations(aiChatService.getConversations())
      }

      // Scroll to bottom after AI response
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)

    } catch (error) {
      console.error('Error sending message:', error)
      Alert.alert(
        currentLanguage === 'fr' ? 'Erreur' : 'Error',
        currentLanguage === 'fr' 
          ? 'Impossible d\'envoyer le message. Veuillez réessayer.'
          : 'Failed to send message. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const createNewConversation = async () => {
    try {
      const newConversationId = await aiChatService.createNewConversation()
      const newConversation = aiChatService.getCurrentConversation()
      
      setCurrentConversation(newConversation)
      setMessages([])
      setConversations(aiChatService.getConversations())
      setShowSidebar(false)
    } catch (error) {
      console.error('Error creating new conversation:', error)
    }
  }

  const selectConversation = (conversation) => {
    try {
      const selectedConversation = aiChatService.setCurrentConversation(conversation.id)
      if (selectedConversation) {
        setCurrentConversation(selectedConversation)
        setMessages(selectedConversation.messages || [])
        setShowSidebar(false)
      }
    } catch (error) {
      console.error('Error selecting conversation:', error)
    }
  }

  const deleteConversation = async (conversationId) => {
    try {
      Alert.alert(
        currentLanguage === 'fr' ? 'Supprimer la conversation' : 'Delete Conversation',
        currentLanguage === 'fr' 
          ? 'Êtes-vous sûr de vouloir supprimer cette conversation ?'
          : 'Are you sure you want to delete this conversation?',
        [
          {
            text: currentLanguage === 'fr' ? 'Annuler' : 'Cancel',
            style: 'cancel'
          },
          {
            text: currentLanguage === 'fr' ? 'Supprimer' : 'Delete',
            style: 'destructive',
            onPress: async () => {
              const success = await aiChatService.deleteConversation(conversationId)
              if (success) {
                const updatedConversations = aiChatService.getConversations()
                setConversations(updatedConversations)
                
                const currentConv = aiChatService.getCurrentConversation()
                if (currentConv) {
                  setCurrentConversation(currentConv)
                  setMessages(currentConv.messages || [])
                } else {
                  setCurrentConversation(null)
                  setMessages([])
                }
              }
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  const speakMessage = async (text) => {
    try {
      if (isPlaying) {
        // Stop current playback
        await audioService.stopSpeech()
        setIsPlaying(false)
        return
      }

      setIsPlaying(true)
      setAudioLoading(true)
      
      // Choose voice based on language - using better voices
      const voice = currentLanguage === 'fr' ? 'nova' : 'echo'
      
      // Generate and play speech
      await audioService.speakText(text, voice)
      
      setAudioLoading(false)
      
      // Set up a listener to detect when speech ends
      const checkPlaybackStatus = setInterval(async () => {
        const playbackStatus = audioService.getPlaybackStatus()
        if (!playbackStatus) {
          setIsPlaying(false)
          clearInterval(checkPlaybackStatus)
        }
      }, 1000)
      
    } catch (error) {
      console.error('Error speaking message:', error)
      setIsPlaying(false)
      setAudioLoading(false)
      Alert.alert(
        currentLanguage === 'fr' ? 'Erreur' : 'Error',
        currentLanguage === 'fr' 
          ? 'Impossible de lire le message audio.'
          : 'Failed to play audio message.'
      )
    }
  }

  const clearAllConversations = async () => {
    try {
      Alert.alert(
        currentLanguage === 'fr' ? 'Effacer tout' : 'Clear All',
        currentLanguage === 'fr' 
          ? 'Êtes-vous sûr de vouloir supprimer toutes les conversations ?'
          : 'Are you sure you want to delete all conversations?',
        [
          {
            text: currentLanguage === 'fr' ? 'Annuler' : 'Cancel',
            style: 'cancel'
          },
          {
            text: currentLanguage === 'fr' ? 'Effacer' : 'Clear',
            style: 'destructive',
            onPress: async () => {
              const success = await aiChatService.clearAllConversations()
              if (success) {
                setConversations([])
                setCurrentConversation(null)
                setMessages([])
                setMenuVisible(false)
              }
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error clearing conversations:', error)
    }
  }

  const getLocalizedContent = () => {
    if (currentLanguage === 'fr') {
      return {
        title: 'Assistant IA Juridique',
        placeholder: 'Posez votre question juridique...',
        newChat: 'Nouvelle conversation',
        conversations: 'Conversations',
        clearAll: 'Effacer tout',
        today: 'Aujourd\'hui',
        yesterday: 'Hier',
        thisWeek: 'Cette semaine',
        older: 'Plus ancien',
        welcomeTitle: 'Bonjour ! 👋',
        welcomeMessage: 'Je suis votre assistant juridique IA spécialisé dans le droit camerounais. Posez-moi des questions sur le Code Pénal ou le Code de Procédure Pénale.',
        exampleQuestions: [
          'Qu\'est-ce que le vol selon le code pénal ?',
          'Quelles sont les procédures d\'arrestation ?',
          'Comment fonctionne la liberté provisoire ?'
        ]
      }
    } else {
      return {
        title: 'Legal AI Assistant',
        placeholder: 'Ask your legal question...',
        newChat: 'New Chat',
        conversations: 'Conversations',
        clearAll: 'Clear All',
        today: 'Today',
        yesterday: 'Yesterday',
        thisWeek: 'This Week',
        older: 'Older',
        welcomeTitle: 'Hello! 👋',
        welcomeMessage: 'I\'m your AI legal assistant specialized in Cameroonian law. Ask me questions about the Penal Code or Criminal Procedure Code.',
        exampleQuestions: [
          'What is theft according to the penal code?',
          'What are the arrest procedures?',
          'How does bail work?'
        ]
      }
    }
  }

  const content = getLocalizedContent()

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const groupConversationsByDate = (conversations) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    }

    conversations.forEach(conv => {
      const convDate = new Date(conv.updatedAt)
      const convDateOnly = new Date(convDate.getFullYear(), convDate.getMonth(), convDate.getDate())

      if (convDateOnly.getTime() === today.getTime()) {
        groups.today.push(conv)
      } else if (convDateOnly.getTime() === yesterday.getTime()) {
        groups.yesterday.push(conv)
      } else if (convDateOnly >= thisWeek) {
        groups.thisWeek.push(conv)
      } else {
        groups.older.push(conv)
      }
    })

    return groups
  }

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user'
    const isAI = item.role === 'assistant'

    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.aiMessageContainer
      ]}>
        {isAI && (
          <View style={styles.aiAvatar}>
            <Icon name="smart-toy" size={20} color={theme.colors.primary} />
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isUser ? [styles.userBubble, { backgroundColor: theme.colors.primary }] : 
                   [styles.aiBubble, { backgroundColor: theme.colors.surfaceVariant }]
        ]}>
          <Text style={[
            styles.messageText,
            { color: isUser ? 'white' : theme.colors.onSurface }
          ]}>
            {item.content}
          </Text>

          {item.legalReferences && item.legalReferences.length > 0 && (
            <View style={styles.referencesContainer}>
              <Text style={[styles.referencesTitle, { color: theme.colors.onSurface }]}>
                {currentLanguage === 'fr' ? 'Références légales:' : 'Legal References:'}
              </Text>
              {item.legalReferences.map((ref, index) => (
                <Chip
                  key={index}
                  mode="outlined"
                  compact
                  style={styles.referenceChip}
                  onPress={() => {
                    // Navigate to article detail
                    if (ref.fullArticle) {
                      navigation.navigate('ArticleDetail', {
                        article: ref.fullArticle,
                        documentType: ref.documentType,
                        language: currentLanguage
                      });
                    }
                  }}
                >
                  {ref.id}
                </Chip>
              ))}
            </View>
          )}

          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              { color: isUser ? 'rgba(255,255,255,0.7)' : theme.colors.outline }
            ]}>
              {formatMessageTime(item.timestamp)}
            </Text>
            
            {isAI && (
              <TouchableOpacity
                style={[
                  styles.speakerButton,
                  isPlaying && { backgroundColor: theme.colors.primaryContainer }
                ]}
                onPress={() => speakMessage(item.content)}
                disabled={audioLoading}
              >
                {audioLoading ? (
                  <ActivityIndicator size={14} color={theme.colors.primary} />
                ) : (
                  <Icon 
                    name={isPlaying ? "pause" : "play-arrow"} 
                    size={16} 
                    color={theme.colors.primary} 
                  />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {isUser && (
          <View style={styles.userAvatar}>
            <Icon name="person" size={20} color="white" />
          </View>
        )}
      </View>
    )
  }

  const renderWelcomeScreen = () => (
    <View style={styles.welcomeContainer}>
      <View style={styles.welcomeContent}>
        <Text variant="headlineMedium" style={[styles.welcomeTitle, { color: theme.colors.primary }]}>
          {content.welcomeTitle}
        </Text>
        <Text variant="bodyLarge" style={[styles.welcomeMessage, { color: theme.colors.onSurface }]}>
          {content.welcomeMessage}
        </Text>
        
        <View style={styles.exampleQuestions}>
          <Text variant="titleMedium" style={[styles.exampleTitle, { color: theme.colors.onSurface }]}>
            {currentLanguage === 'fr' ? 'Questions d\'exemple:' : 'Example questions:'}
          </Text>
          {content.exampleQuestions.map((question, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.exampleQuestion, { borderColor: theme.colors.outline }]}
              onPress={() => setInputText(question)}
            >
              <Text style={{ color: theme.colors.onSurface }}>{question}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  )

  const renderConversationItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.conversationItem,
        currentConversation?.id === item.id && { backgroundColor: theme.colors.primaryContainer }
      ]}
      onPress={() => selectConversation(item)}
    >
      <View style={styles.conversationContent}>
        <Text 
          style={[styles.conversationTitle, { color: theme.colors.onSurface }]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text 
          style={[styles.conversationDate, { color: theme.colors.outline }]}
          numberOfLines={1}
        >
          {new Date(item.updatedAt).toLocaleDateString()}
        </Text>
    </View>
      <IconButton
        icon="delete"
        size={16}
        iconColor={theme.colors.error}
        onPress={() => deleteConversation(item.id)}
      />
    </TouchableOpacity>
  )

  const renderSidebar = () => {
    const groupedConversations = groupConversationsByDate(conversations)

    return (
      <View style={[styles.sidebar, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.sidebarHeader}>
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
            {content.conversations}
          </Text>
          <IconButton
            icon="close"
            onPress={() => setShowSidebar(false)}
            iconColor={theme.colors.onSurface}
          />
        </View>

        <Button
          mode="contained"
          onPress={createNewConversation}
          style={styles.newChatButton}
          icon="plus"
        >
          {content.newChat}
        </Button>

        <FlatList
          data={[
            { type: 'group', title: content.today, data: groupedConversations.today },
            { type: 'group', title: content.yesterday, data: groupedConversations.yesterday },
            { type: 'group', title: content.thisWeek, data: groupedConversations.thisWeek },
            { type: 'group', title: content.older, data: groupedConversations.older },
          ]}
          renderItem={({ item }) => {
            if (item.type === 'group' && item.data.length > 0) {
              return (
                <View>
                  <Text style={[styles.groupTitle, { color: theme.colors.outline }]}>
                    {item.title}
                  </Text>
                  {item.data.map(conv => (
                    <View key={conv.id}>
                      {renderConversationItem({ item: conv })}
                    </View>
                  ))}
                </View>
              )
            }
            return null
          }}
          keyExtractor={(item, index) => `group-${index}`}
          style={styles.conversationsList}
        />

        {conversations.length > 0 && (
          <Button
            mode="outlined"
            onPress={clearAllConversations}
            style={styles.clearAllButton}
            textColor={theme.colors.error}
          >
            {content.clearAll}
          </Button>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity onPress={() => setShowSidebar(true)}>
            <Icon name="menu" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
            {content.title}
          </Text>
          
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setMenuVisible(true)}
                iconColor={theme.colors.onSurface}
              />
            }
          >
            <Menu.Item onPress={createNewConversation} title={content.newChat} />
            <Divider />
            <Menu.Item onPress={clearAllConversations} title={content.clearAll} />
          </Menu>
      </View>

        {/* Messages */}
        <View style={styles.messagesContainer}>
          {messages.length === 0 ? (
            renderWelcomeScreen()
          ) : (
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
        <TextInput
            style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
            placeholder={content.placeholder}
          multiline
            maxLength={1000}
            editable={!loading && !isPlaying}
          />
          
          {/* Send Button */}
          <IconButton
            icon={loading ? "timer-sand-empty" : "send"}
            onPress={sendMessage}
            disabled={!inputText.trim() || loading || isPlaying}
            iconColor={theme.colors.primary}
          />
          
          {(loading || audioLoading) && (
            <ActivityIndicator 
              size="small" 
              color={theme.colors.primary} 
              style={styles.loadingIndicator}
            />
          )}
        </View>

        {/* Sidebar Overlay */}
        {showSidebar && (
          <>
            <TouchableOpacity
              style={styles.overlay}
              onPress={() => setShowSidebar(false)}
              activeOpacity={1}
            />
            {renderSidebar()}
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginHorizontal: 8,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  referencesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  referencesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  referenceChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 8,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    marginRight: 8,
  },
  loadingIndicator: {
    position: 'absolute',
    right: 60,
    bottom: 16,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  welcomeContent: {
    alignItems: 'center',
    maxWidth: 400,
  },
  welcomeTitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  welcomeMessage: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  exampleQuestions: {
    width: '100%',
  },
  exampleTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  exampleQuestion: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    zIndex: 1001,
    elevation: 16,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  newChatButton: {
    margin: 16,
  },
  conversationsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  conversationContent: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  conversationDate: {
    fontSize: 12,
    marginTop: 2,
  },
  clearAllButton: {
    margin: 16,
    marginTop: 8,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speakerButton: {
    padding: 4,
    borderRadius: 12,
  },
})
