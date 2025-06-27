import { create } from "zustand"
import AsyncStorage from "@react-native-async-storage/async-storage"

export const useBookmarkStore = create((set, get) => ({
  bookmarks: [],

  initializeBookmarks: async () => {
    try {
      const savedBookmarks = await AsyncStorage.getItem("bookmarks")
      if (savedBookmarks) {
        set({ bookmarks: JSON.parse(savedBookmarks) })
      }
    } catch (error) {
      console.error("Error loading bookmarks:", error)
    }
  },

  addBookmark: async (article) => {
    const bookmarks = [...get().bookmarks, { ...article, bookmarkedAt: new Date().toISOString() }]
    set({ bookmarks })
    await AsyncStorage.setItem("bookmarks", JSON.stringify(bookmarks))
  },

  removeBookmark: async (articleId) => {
    const bookmarks = get().bookmarks.filter((bookmark) => bookmark.id !== articleId)
    set({ bookmarks })
    await AsyncStorage.setItem("bookmarks", JSON.stringify(bookmarks))
  },

  isBookmarked: (articleId) => {
    return get().bookmarks.some((bookmark) => bookmark.id === articleId)
  },
}))
