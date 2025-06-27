import OpenAI from 'openai';
import AsyncStorage from '@react-native-async-storage/async-storage';
import legalDataService from './legalDataService';

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

  // Get relevant legal context for a query
  async getLegalContext(query, language = 'en') {
    try {
      // Search for relevant articles with broader search
      let searchResults = await this.searchForRelevantArticles(query, language);
      
      if (searchResults.length === 0) {
        return null;
      }

      // Get top 5 most relevant articles (increased from 3)
      const topResults = searchResults.slice(0, 5);
      
      const context = topResults.map(article => ({
        id: article.id,
        title: article.title,
        text: article.text.substring(0, 800) + (article.text.length > 800 ? '...' : ''), // Increased context length
        documentType: article.documentType,
        score: article.score,
        fullArticle: article // Include full article for navigation
      }));

      return context;
    } catch (error) {
      console.error('Error getting legal context:', error);
      return null;
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

  // Generate AI response
  async generateResponse(message, userLanguage = 'en') {
    try {
      // Detect message language
      const messageLanguage = this.detectLanguage(message);
      const responseLanguage = messageLanguage;

      // Get legal context
      const legalContext = await this.getLegalContext(message, responseLanguage);

      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(responseLanguage, legalContext);

      // Get conversation history for context
      const conversation = this.getCurrentConversation();
      const conversationHistory = conversation ? conversation.messages.slice(-6) : []; // Last 6 messages for context

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
        max_tokens: 1000,
        temperature: 0.7,
      });

      const aiResponse = completion.choices[0].message.content;

      // Add messages to current conversation
      await this.addMessageToConversation(message, 'user');
      await this.addMessageToConversation(aiResponse, 'assistant', legalContext);

      return {
        response: aiResponse,
        legalReferences: legalContext,
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

  // Build system prompt based on language and context
  buildSystemPrompt(language, legalContext) {
    const contextText = legalContext 
      ? legalContext.map(article => `${article.id}: ${article.title}\n${article.text}`).join('\n\n')
      : '';

    if (language === 'fr') {
      return `Vous êtes un assistant juridique expert spécialisé dans le droit camerounais. Vous aidez les utilisateurs à comprendre le Code Pénal et le Code de Procédure Pénale du Cameroun.

INSTRUCTIONS IMPORTANTES:
1. Répondez TOUJOURS en français puisque l'utilisateur écrit en français
2. Basez vos réponses EXCLUSIVEMENT sur les articles de loi fournis ci-dessous
3. Citez OBLIGATOIREMENT les articles spécifiques dans votre réponse (ex: "Selon l'Article 25 du Code Pénal...")
4. Analysez TOUS les articles fournis et utilisez ceux qui sont pertinents
5. Si plusieurs articles sont pertinents, mentionnez-les tous
6. Structurez votre réponse de manière claire avec des paragraphes
7. Terminez toujours par "Consultez les articles référencés ci-dessous pour plus de détails."
8. N'inventez JAMAIS de contenu juridique qui n'est pas dans les articles fournis

${contextText ? `ARTICLES PERTINENTS:\n${contextText}` : 'Aucun article spécifique trouvé pour cette question. Je ne peux pas fournir de conseil juridique spécifique sans articles pertinents.'}

Répondez de manière claire, professionnelle et complète en vous basant uniquement sur les articles fournis.`;
    } else {
      return `You are an expert legal assistant specializing in Cameroonian law. You help users understand the Penal Code and Criminal Procedure Code of Cameroon.

IMPORTANT INSTRUCTIONS:
1. ALWAYS respond in English since the user is writing in English
2. Base your answers EXCLUSIVELY on the law articles provided below
3. ALWAYS cite specific articles in your response (e.g., "According to Article 25 of the Penal Code...")
4. Analyze ALL provided articles and use those that are relevant
5. If multiple articles are relevant, mention them all
6. Structure your response clearly with paragraphs
7. Always end with "Please refer to the referenced articles below for more details."
8. NEVER invent legal content that is not in the provided articles

${contextText ? `RELEVANT ARTICLES:\n${contextText}` : 'No specific articles found for this question. I cannot provide specific legal advice without relevant articles.'}

Respond clearly, professionally, and comprehensively based only on the articles provided.`;
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
      legalReferences
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

  async searchForRelevantArticles(query, language = 'en') {
    try {
      // First, search in the user's preferred language
      let searchResults = await legalDataService.searchDocuments(query, language);
      
      // If not enough results, try the other language
      if (searchResults.length < 3) {
        const otherLanguage = language === 'en' ? 'fr' : 'en';
        const additionalResults = await legalDataService.searchDocuments(query, otherLanguage);
        searchResults = [...searchResults, ...additionalResults];
      }

      // Also search for individual keywords
      const keywords = query.split(' ').filter(word => word.length > 3);
      for (const word of keywords.slice(0, 3)) { // Limit to 3 keywords
        const wordResults = await legalDataService.searchDocuments(word, language);
        searchResults = [...searchResults, ...wordResults.slice(0, 2)];
      }

      return searchResults;
    } catch (error) {
      console.error('Error searching for relevant articles:', error);
      return [];
    }
  }
}

// Create and export singleton instance
const aiChatService = new AIChatService();
export default aiChatService; 