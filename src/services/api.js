// API service for Legal237
const API_BASE_URL = "https://api.legal237.com" // Replace with actual API URL

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "API request failed")
      }

      return data
    } catch (error) {
      console.error("API Error:", error)
      throw error
    }
  }

  // Authentication
  async login(email, password) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  async register(email, password, name) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    })
  }

  // Articles
  async getArticles(category, language = "en") {
    return this.request(`/articles?category=${category}&language=${language}`)
  }

  async searchArticles(query, language = "en") {
    return this.request(`/articles/search?q=${encodeURIComponent(query)}&language=${language}`)
  }

  async getArticle(id) {
    return this.request(`/articles/${id}`)
  }

  // AI Chat
  async sendChatMessage(message, userId) {
    return this.request("/chat", {
      method: "POST",
      body: JSON.stringify({ message, userId }),
    })
  }

  // Payments
  async initiatePayment(planId, userId, paymentMethod) {
    return this.request("/payments/initiate", {
      method: "POST",
      body: JSON.stringify({ planId, userId, paymentMethod }),
    })
  }

  async verifyPayment(transactionId) {
    return this.request(`/payments/verify/${transactionId}`)
  }
}

export default new ApiService()
