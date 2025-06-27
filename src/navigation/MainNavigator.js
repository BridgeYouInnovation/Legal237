"use client"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createStackNavigator } from "@react-navigation/stack"
import { useTheme } from "react-native-paper"
import Icon from "react-native-vector-icons/MaterialIcons"
import { useTranslation } from "react-i18next"

import HomeScreen from "../screens/main/HomeScreen"
import FindLawyerScreen from "../screens/main/FindLawyerScreen"
import ChatScreen from "../screens/main/ChatScreen"
import BookmarksScreen from "../screens/main/BookmarksScreen"
import SettingsScreen from "../screens/main/SettingsScreen"
import LawViewerScreen from "../screens/main/LawViewerScreen"
import SearchResultsScreen from "../screens/main/SearchResultsScreen"
import SearchScreen from "../screens/main/SearchScreen"
import PaymentScreen from "../screens/main/PaymentScreen"
import PaymentSuccessScreen from "../screens/main/PaymentSuccessScreen"
import SubscriptionScreen from "../screens/main/SubscriptionScreen"
import ArticleDetailScreen from "../screens/main/ArticleDetailScreen"

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Search" component={SearchScreen} options={{ title: "Search" }} />
      <Stack.Screen name="LawViewer" component={LawViewerScreen} options={{ title: "Law Viewer" }} />
      <Stack.Screen name="SearchResults" component={SearchResultsScreen} options={{ title: "Search Results" }} />
      <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} options={{ title: "Article Detail" }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: "AI Legal Assistant" }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: "Payment" }} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} options={{ title: "Payment Successful" }} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ title: "Subscription" }} />
    </Stack.Navigator>
  )
}

function FindLawyerStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="FindLawyerMain" component={FindLawyerScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} options={{ title: "Article Detail" }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: "AI Legal Assistant" }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: "Payment" }} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ title: "Subscription" }} />
    </Stack.Navigator>
  )
}

function BookmarksStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="BookmarksMain" component={BookmarksScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} options={{ title: "Article Detail" }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: "AI Legal Assistant" }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: "Payment" }} />
    </Stack.Navigator>
  )
}

export default function MainNavigator() {
  const theme = useTheme()
  const { t, i18n } = useTranslation()

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

          if (route.name === "Home") {
            iconName = "home"
          } else if (route.name === "FindLawyer") {
            iconName = "gavel"
          } else if (route.name === "Bookmarks") {
            iconName = "bookmark"
          } else if (route.name === "Settings") {
            iconName = "settings"
          }

          return <Icon name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurface,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ title: t("home.title", "Home") }} />
      <Tab.Screen name="FindLawyer" component={FindLawyerStack} options={{ title: i18n.language === 'fr' ? "Avocats" : "Lawyers" }} />
      <Tab.Screen name="Bookmarks" component={BookmarksStack} options={{ title: t("bookmarks.title") }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: t("settings.title") }} />
    </Tab.Navigator>
  )
}
