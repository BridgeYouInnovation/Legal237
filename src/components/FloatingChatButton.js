import React from 'react'
import { TouchableOpacity, StyleSheet } from 'react-native'
import { useTheme } from 'react-native-paper'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { useNavigation } from '@react-navigation/native'

export default function FloatingChatButton() {
  const theme = useTheme()
  const navigation = useNavigation()

  const openChat = () => {
    // Navigate to a dedicated chat screen
    navigation.navigate('Chat')
  }

  return (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: theme.colors.primary }]}
      onPress={openChat}
      activeOpacity={0.8}
    >
      <Icon name="chat" size={24} color="white" />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    bottom: 20,
    right: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 1000,
  },
}) 