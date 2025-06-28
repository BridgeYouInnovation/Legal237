import OpenAI from 'openai';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AIChatService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    });
    this.chatHistory = [];
    this.conversations = [];
    this.currentConversationId = null;
  }

  async initialize() {
    try {
      await this.loadConversations();
      // If no conversations exist, create a default one
      if (this.conversations.length === 0) {
        await this.createNewConversation('Welcome Chat');
      }
      console.log('AI Chat Service initialized successfully');
      console.log('Loaded conversations:', this.conversations.length);
    } catch (error) {
      console.error('Error initializing AI Chat Service:', error);
    }
  }

  // Create a new conversation
  async createNewConversation(title = null) {
    const conversationId = Date.now().toString();
    const conversation = {
      id: conversationId,
      title: title || 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.conversations.unshift(conversation);
    this.currentConversationId = conversationId;
    await this.saveConversations();
    
    return conversationId;
  }

  // Get all conversations
  getConversations() {
    return this.conversations;
  }

  // Get current conversation
  getCurrentConversation() {
    if (!this.currentConversationId) return null;
    return this.conversations.find(conv => conv.id === this.currentConversationId);
  }

  // Set current conversation
  setCurrentConversation(conversationId) {
    this.currentConversationId = conversationId;
    const conversation = this.conversations.find(conv => conv.id === conversationId);
    return conversation || null;
  }

  // Delete a conversation
  async deleteConversation(conversationId) {
    try {
      this.conversations = this.conversations.filter(conv => conv.id !== conversationId);
      if (this.currentConversationId === conversationId) {
        this.currentConversationId = this.conversations.length > 0 ? this.conversations[0].id : null;
      }
      await this.saveConversations();
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }

  // Detect language of the message
  detectLanguage(message) {
    // Simple language detection based on common French words
    const frenchWords = ['le', 'la', 'les', 'de', 'du', 'des', 'et', 'est', 'une', 'un', 'dans', 'pour', 'avec', 'sur', 'par', 'que', 'qui', 'ce', 'cette', 'ces', 'article', 'code', 'pénal', 'procédure', 'droit', 'loi'];
    const englishWords = ['the', 'and', 'is', 'in', 'for', 'with', 'on', 'by', 'that', 'this', 'article', 'code', 'penal', 'procedure', 'law', 'legal'];
    
    const words = message.toLowerCase().split(/\s+/);
    let frenchScore = 0;
    let englishScore = 0;

    words.forEach(word => {
      if (frenchWords.includes(word)) frenchScore++;
      if (englishWords.includes(word)) englishScore++;
    });

    return frenchScore > englishScore ? 'fr' : 'en';
  }

  // Generate AI response with online research
  async generateResponse(message, userLanguage = 'en', userId = null) {
    try {
      // Detect message language
      const messageLanguage = this.detectLanguage(message);
      const responseLanguage = messageLanguage;

      // Build system prompt for online research
      const systemPrompt = this.buildSystemPrompt(responseLanguage);

      // Get conversation history for context
      const conversation = this.getCurrentConversation();
      const conversationHistory = conversation ? conversation.messages.slice(-6) : [];

      // Build messages array
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: message }
      ];

      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 1500,
        temperature: 0.7,
      });

      let aiResponse = completion.choices[0].message.content;

      // Add disclaimer at the end of every response
      const disclaimer = this.getDisclaimer(responseLanguage);
      aiResponse += '\n\n' + disclaimer;

      // Add messages to current conversation
      await this.addMessageToConversation(message, 'user');
      await this.addMessageToConversation(aiResponse, 'assistant');

      return {
        response: aiResponse,
        legalReferences: null, // No more references
        language: responseLanguage
      };

    } catch (error) {
      console.error('Error generating AI response:', error);
      
      const errorMessage = userLanguage === 'fr' 
        ? 'Désolé, je ne peux pas répondre pour le moment. Veuillez réessayer.'
        : 'Sorry, I cannot respond right now. Please try again.';
        
      return {
        response: errorMessage,
        legalReferences: null,
        language: userLanguage,
        error: true
      };
    }
  }

  // System prompt for online research
  buildSystemPrompt(language) {
    if (language === 'fr') {
      return `Vous êtes un assistant juridique expert spécialisé dans le droit camerounais. Vous aidez les utilisateurs à comprendre les lois du Cameroun.

INSTRUCTIONS IMPORTANTES:
1. Répondez TOUJOURS en français puisque l'utilisateur écrit en français
2. Gardez vos réponses BRÈVES et CONCISES (maximum 3-4 paragraphes)
3. Concentrez-vous sur le Code Pénal du Cameroun et le Code de Procédure Pénale du Cameroun
4. Si vous connaissez un article spécifique pertinent, mentionnez-le (ex: "Selon l'article 93 du Code de Procédure Pénale...")
5. NE créez PAS de liens cliquables vers les articles
6. Si aucun article spécifique n'est connu, répondez basé sur les principes juridiques généraux
7. Analysez la question juridique et donnez des conseils généraux appropriés
8. Soyez précis et informatif mais concis
9. Mentionnez les domaines pertinents du droit camerounais

Répondez de manière claire, professionnelle et BRÈVE en vous basant sur vos connaissances du système juridique camerounais.`;
    } else {
      return `You are an expert legal assistant specializing in Cameroonian law. You help users understand Cameroon's laws.

IMPORTANT INSTRUCTIONS:
1. ALWAYS respond in English since the user is writing in English
2. Keep your responses BRIEF and CONCISE (maximum 3-4 paragraphs)
3. Focus on Cameroon's Penal Code and Criminal Procedure Code
4. If you know a specific relevant article, mention it (e.g., "According to Article 93 of the Criminal Procedure Code...")
5. DO NOT create clickable links to articles
6. If no specific article is known, respond based on general legal principles
7. Analyze the legal question and give appropriate general guidance
8. Be precise and informative but concise
9. Mention relevant areas of Cameroonian law

Respond clearly, professionally, and BRIEFLY based on your knowledge of the Cameroonian legal system.`;
    }
  }

  // Get disclaimer text
  getDisclaimer(language) {
    if (language === 'fr') {
      return `⚠️ AVERTISSEMENT IMPORTANT: Cette information est fournie à titre informatif uniquement et ne constitue pas un conseil juridique professionnel. Pour des conseils juridiques spécifiques à votre situation, veuillez consulter un avocat qualifié. Vous pouvez également consulter nos documents juridiques officiels sur la page d'accueil de l'application pour des références précises aux lois camerounaises.`;
    } else {
      return `⚠️ IMPORTANT DISCLAIMER: This information is provided for informational purposes only and does not constitute professional legal advice. For legal advice specific to your situation, please consult a qualified lawyer. You can also refer to our official legal documents on the app's home page for precise references to Cameroonian laws.`;
    }
  }

  // Add message to current conversation
  async addMessageToConversation(content, role, legalReferences = null) {
    if (!this.currentConversationId) {
      await this.createNewConversation();
    }

    const conversation = this.conversations.find(conv => conv.id === this.currentConversationId);
    if (!conversation) return;

    const message = {
      id: Date.now().toString(),
      content,
      role,
      timestamp: new Date().toISOString(),
      legalReferences: null // Always null now
    };

    conversation.messages.push(message);
    conversation.updatedAt = new Date().toISOString();

    // Update conversation title if it's the first user message
    if (role === 'user' && conversation.messages.filter(m => m.role === 'user').length === 1) {
      conversation.title = content.length > 50 ? content.substring(0, 50) + '...' : content;
    }

    await this.saveConversations();
  }

  // Save conversations to AsyncStorage
  async saveConversations() {
    try {
      await AsyncStorage.setItem('ai_conversations', JSON.stringify(this.conversations));
      await AsyncStorage.setItem('current_conversation_id', this.currentConversationId || '');
    } catch (error) {
      console.error('Error saving conversations:', error);
    }
  }

  // Load conversations from AsyncStorage
  async loadConversations() {
    try {
      const conversationsData = await AsyncStorage.getItem('ai_conversations');
      const currentConversationId = await AsyncStorage.getItem('current_conversation_id');
      
      this.conversations = conversationsData ? JSON.parse(conversationsData) : [];
      this.currentConversationId = currentConversationId || null;
    } catch (error) {
      console.error('Error loading conversations:', error);
      this.conversations = [];
      this.currentConversationId = null;
    }
  }

  // Clear all conversations
  async clearAllConversations() {
    try {
      this.conversations = [];
      this.currentConversationId = null;
      await this.saveConversations();
      return true;
    } catch (error) {
      console.error('Error clearing conversations:', error);
      return false;
    }
  }
}

// Create and export singleton instance
const aiChatService = new AIChatService();
export default aiChatService; 