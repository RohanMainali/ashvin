"use client"

import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"
import { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Dimensions,
  Keyboard,
} from "react-native"
import { Colors } from "../constants/colors"
import { chatWithAnimus } from "../utils/chatApi"
import CustomNavBar from "../components/CustomNavBar"

const { width } = Dimensions.get("window")

// Simple markdown parser for basic formatting
const parseMarkdown = (text) => {
  // Remove markdown syntax and return clean text with basic formatting hints
  let parsed = text
    // Remove headers (##, ###, etc.)
    .replace(/^#{1,6}\s/gm, '')
    // Remove bold markers but keep text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Remove italic markers but keep text  
    .replace(/\*(.*?)\*/g, '$1')
    // Remove code block markers
    .replace(/```[\s\S]*?```/g, (match) => {
      return match.replace(/```/g, '').trim()
    })
    // Remove inline code markers
    .replace(/`(.*?)`/g, '$1')
    // Remove list markers
    .replace(/^[\s]*[-\*\+]\s/gm, '• ')
    // Remove numbered list markers
    .replace(/^[\s]*\d+\.\s/gm, '• ')
    // Clean up extra whitespace
    .replace(/\n\s*\n/g, '\n\n')
    .trim()
  
  return parsed
}

const ChatScreen = ({ route, navigation }) => {
  const { colors } = useTheme()
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const flatListRef = useRef(null)

  useEffect(() => {
    // Initial welcome message or prompt from route params
    const initialPrompt = route.params?.initialPrompt
    setMessages([
      {
        id: "1",
        text: "Hello! I'm Animus, your AI-powered health assistant. I can help you understand your medical results, answer health questions, and provide personalized insights. How can I assist you today?",
        sender: "bot",
      },
    ])
    if (initialPrompt) {
      setTimeout(() => handleSendMessage(initialPrompt), 500)
    }
  }, [route.params?.initialPrompt])

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true)
    })
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false)
    })

    return () => {
      keyboardDidShowListener?.remove()
      keyboardDidHideListener?.remove()
    }
  }, [])

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true })
    }
  }, [messages])

  const handleSendMessage = async (text = inputText) => {
    if (text.trim() === "") return

    const newMessage = { id: Date.now().toString(), text: text, sender: "user" }
    const updatedMessages = [...messages, newMessage]
    setMessages(updatedMessages)
    setInputText("")
    setIsTyping(true)

    try {
      // Pass conversation history excluding the current message we just added
      // and the welcome message (first message)
      const conversationHistory = updatedMessages.slice(1, -1) // Exclude welcome message and current message
      
      const response = await chatWithAnimus(text, conversationHistory)
      const botMessage = { id: Date.now().toString() + "_bot", text: response.response, sender: "bot" }
      setMessages((prevMessages) => [...prevMessages, botMessage])
    } catch (error) {
      console.error("Chat API error:", error)
      const errorMessage = {
        id: Date.now().toString() + "_error",
        text: "Sorry, I could not process your request. Please try again.",
        sender: "bot",
      }
      setMessages((prevMessages) => [...prevMessages, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageBubble,
        item.sender === "user" ? styles.userMessage : styles.botMessage,
        {
          backgroundColor: item.sender === "user" ? Colors.primary : colors.card,
          borderColor: item.sender === "user" ? Colors.primary : colors.border,
        },
      ]}
    >
      {item.sender === "bot" && (
        <View style={[styles.botAvatar, { backgroundColor: Colors.primary + "15" }]}>
          <Ionicons name="medical" size={16} color={Colors.primary} />
        </View>
      )}
      <View style={[styles.messageContent, { flex: item.sender === "user" ? 1 : 1 }]}>
        <Text style={[styles.messageText, { color: item.sender === "user" ? Colors.textLight : colors.text }]}>
          {item.sender === "bot" ? parseMarkdown(item.text) : item.text}
        </Text>
        <Text style={[styles.messageTime, { 
          color: item.sender === "user" ? Colors.textLight + "80" : colors.text + "60",
          alignSelf: item.sender === "user" ? "flex-end" : "flex-start"
        }]}>
          {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </Text>
      </View>
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        />
        
        {isTyping && (
          <View style={[styles.typingIndicator, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.botAvatar, { backgroundColor: Colors.primary + "15" }]}>
              <Ionicons name="medical" size={14} color={Colors.primary} />
            </View>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={[styles.typingText, { color: colors.text }]}>Animus is thinking...</Text>
          </View>
        )}
        
        {/* Input Container */}
        <View style={[
          styles.inputContainer, 
          { 
            borderTopColor: colors.border, 
            backgroundColor: colors.background,
            paddingBottom: keyboardVisible ? 30 : 90 // Ensure input is always visible
          }
        ]}>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me anything about your health..."
            placeholderTextColor={colors.text + "60"}
            multiline
            returnKeyType="send"
            onSubmitEditing={() => handleSendMessage()}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton, 
              { 
                backgroundColor: inputText.trim() === "" || isTyping ? colors.text + "20" : Colors.primary,
                opacity: inputText.trim() === "" || isTyping ? 0.5 : 1,
              }
            ]}
            onPress={() => handleSendMessage()}
            disabled={inputText.trim() === "" || isTyping}
            accessibilityLabel="Send message"
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={inputText.trim() === "" || isTyping ? colors.text + "60" : Colors.textLight} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <CustomNavBar navigation={navigation} activeTab="Chat" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerIcon: {
    marginBottom: 12,
    opacity: 0.9,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.textLight,
    marginBottom: 8,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textLight + "90",
    textAlign: "center",
    marginBottom: 20,
  },
  suggestionsContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  suggestionChip: {
    backgroundColor: Colors.textLight + "20",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.textLight + "30",
  },
  suggestionText: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: "500",
  },
  chatContainer: {
    flex: 1,
    paddingTop: 50, // Add padding for status bar area
  },
  messagesContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingBottom: 100, // Add extra bottom padding for input area
    flexGrow: 1,
  },
  messageBubble: {
    flexDirection: "row",
    maxWidth: "85%",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderRadius: 18,
    borderWidth: 1,
  },
  userMessage: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 6,
    paddingLeft: 16,
    paddingRight: 16,
  },
  botMessage: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 6,
    paddingLeft: 4,
    paddingRight: 16,
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginLeft: 4,
    marginTop: 4,
  },
  messageContent: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 12,
    alignSelf: "flex-end",
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    maxWidth: "70%",
  },
  typingText: {
    marginLeft: 8,
    fontStyle: "italic",
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    // paddingBottom is now handled dynamically
  },
  textInput: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 48,
    maxHeight: 120,
    marginRight: 12,
    fontSize: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
})

export default ChatScreen
