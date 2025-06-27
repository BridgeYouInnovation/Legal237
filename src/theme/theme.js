import { MD3LightTheme, MD3DarkTheme } from "react-native-paper"

const colors = {
  primary: "#2E7D32", // Green
  secondary: "#D32F2F", // Red
  accent: "#F57C00", // Yellow/Orange
  background: "#FFFFFF",
  surface: "#F5F5F5",
  text: "#212121",
  textSecondary: "#757575",
}

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    tertiary: colors.accent,
    background: colors.background,
    surface: colors.surface,
    onSurface: colors.text,
    onBackground: colors.text,
  },
}

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#4CAF50",
    secondary: "#F44336",
    tertiary: "#FF9800",
    background: "#121212",
    surface: "#1E1E1E",
    onSurface: "#FFFFFF",
    onBackground: "#FFFFFF",
  },
}
