"use client"

import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useTheme } from "@react-navigation/native"
import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from "expo-linear-gradient"  
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native"
import { Colors } from "../constants/colors"
import { createSkinScanReport } from "../utils/skinScanApi"
import { uploadImageToImgBB } from "../utils/uploadImage"

const IMGBB_API_KEY = "1d214f9e52b271e1f9f3e8e1ac83eaf5" // Replace with your real key

const SkinScannerScreen = ({ navigation, addHistoryEntry, isDarkMode }) => {
  const { colors } = useTheme()
  const [imageUri, setImageUri] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [userContext, setUserContext] = useState("")

  useEffect(() => {
    ;(async () => {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Camera permission is needed to take photos for skin analysis. Please enable it in your device settings."
          )
        }
      }
    })()
  }, [])

  const Card = ({ children, style }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderColorLight }, style]}>
      {children}
    </View>
  )

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    })

    if (!result.canceled) {
      setImageUri(result.assets[0].uri)
    }
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    })

    if (!result.canceled) {
      setImageUri(result.assets[0].uri)
    }
  }

  const handleAnalyze = async () => {
    if (!imageUri) {
      Alert.alert("No Image", "Please take a photo or select an image to analyze.")
      return
    }

    setIsLoading(true)
    try {
      let hostedImageUrl = null
      try {
        hostedImageUrl = await uploadImageToImgBB(imageUri, IMGBB_API_KEY)
        if (!hostedImageUrl) throw new Error("Image upload failed: No URL returned")
      } catch (uploadErr) {
        console.error("Image upload error:", uploadErr)
        Alert.alert("Image Upload Error", uploadErr.message || "Failed to upload image.")
        setIsLoading(false)
        return
      }

      const token = await AsyncStorage.getItem("token")
      let response = null

      try {
        response = await createSkinScanReport({ imageUrl: hostedImageUrl, userContext }, token)
        console.log("Backend response:", response)
      } catch (apiErr) {
        console.error("Backend API error:", apiErr)
        Alert.alert("Backend Error", apiErr.message || "Failed to analyze skin.")
        setIsLoading(false)
        return
      }

      if (response && response.short_summary) {
        const newEntry = {
          id: response._id || Date.now().toString(),
          date: response.date || new Date().toISOString(),
          scanType: "skin",
          scanData: {
            imageUrl: hostedImageUrl,
            short_summary: response.short_summary,
            analysis: response.analysis,
            confidence: response.confidence,
            scan_details: response.scan_details,
            insights: response.insights,
          },
          llmResponse: response,
        }

        if (typeof addHistoryEntry === "function") {
          addHistoryEntry(newEntry)
        }

        navigation.navigate("Results", { result: newEntry })
      } else {
        Alert.alert("Analysis Error", response?.error || "Failed to analyze skin.")
      }
    } catch (error) {
      console.error("Skin analysis failed", error)
      Alert.alert("Upload/Analysis Error", error.message || "Failed to analyze skin. Please try again.")
    } finally {
      setIsLoading(false)
      setImageUri(null)
    }
  }

  const handleAskAboutFungalInfection = () => {
    navigation.navigate("MainApp", {
      screen: "Chat",
      params: { initialPrompt: "Tell me more about Fungal Infection." },
    })
  }

  const handleGoHome = () => {
    navigation.navigate("MainApp", { screen: "Home" })
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <LinearGradient
        colors={isDarkMode ? ['#1a1a1a', '#2d2d2d'] : ['#ffffff', '#f8f9fa']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Skin Analysis</Text>
          <TouchableOpacity 
            style={styles.helpButton}
            onPress={() => Alert.alert("Help", "Take a clear, well-lit photo of the skin area you want to analyze. Ensure the area is in focus for best results.")}
          >
            <Ionicons name="help-circle-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Analysis Card */}
        <LinearGradient
          colors={isDarkMode ? ['#2a2a2a', '#1f1f1f'] : ['#ffffff', '#f5f7fa']}
          style={styles.modernCard}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[Colors.primary + '20', Colors.primary + '10']}
                style={styles.iconBackground}
              >
                <Ionicons name="scan" size={32} color={Colors.primary} />
              </LinearGradient>
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Skin Abnormality Detection</Text>
            <Text style={[styles.cardSubtitle, { color: colors.text }]}>
              AI-powered analysis for dermatological conditions
            </Text>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <View style={styles.instructionItem}>
              <View style={[styles.stepNumber, { backgroundColor: Colors.primary + '20' }]}>
                <Text style={[styles.stepNumberText, { color: Colors.primary }]}>1</Text>
              </View>
              <Text style={[styles.instructionText, { color: colors.text }]}>
                Ensure good lighting conditions
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={[styles.stepNumber, { backgroundColor: Colors.primary + '20' }]}>
                <Text style={[styles.stepNumberText, { color: Colors.primary }]}>2</Text>
              </View>
              <Text style={[styles.instructionText, { color: colors.text }]}>
                Keep the camera steady and focused
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={[styles.stepNumber, { backgroundColor: Colors.primary + '20' }]}>
                <Text style={[styles.stepNumberText, { color: Colors.primary }]}>3</Text>
              </View>
              <Text style={[styles.instructionText, { color: colors.text }]}>
                Capture the affected area clearly
              </Text>
            </View>
          </View>

          {/* Context Input */}
          <View style={styles.contextSection}>
            <Text style={[styles.contextLabel, { color: colors.text }]}>Additional Notes (Optional)</Text>
            <LinearGradient
              colors={isDarkMode ? ['#333333', '#2a2a2a'] : ['#f8f9fa', '#ffffff']}
              style={styles.inputContainer}
            >
              <TextInput
                style={[styles.contextInput, { color: colors.text }]}
                placeholder="Describe symptoms (e.g., 'itchy for 2 days', 'painful bump', etc.)"
                placeholderTextColor={colors.text + "30"}
                value={userContext}
                onChangeText={setUserContext}
                editable={!isLoading}
                multiline
                numberOfLines={3}
              />
            </LinearGradient>
          </View>

          {/* Image Preview */}
          <View style={styles.imageSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Skin Image</Text>
            <View style={styles.imageContainer}>
              {imageUri ? (
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setImageUri(null)}
                  >
                    <Ionicons name="close-circle" size={28} color={Colors.accentRed} />
                  </TouchableOpacity>
                </View>
              ) : (
                <LinearGradient
                  colors={isDarkMode ? ['#333333', '#2a2a2a'] : ['#f8f9fa', '#e9ecef']}
                  style={styles.imagePlaceholder}
                >
                  <Ionicons name="image-outline" size={64} color={colors.text} opacity={0.4} />
                  <Text style={[styles.placeholderText, { color: colors.text }]}>
                    No image selected
                  </Text>
                  <Text style={[styles.placeholderSubtext, { color: colors.text }]}>
                    Take a photo or choose from gallery
                  </Text>
                </LinearGradient>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, { opacity: isLoading ? 0.6 : 1 }]}
                onPress={takePhoto}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.actionButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="camera" size={24} color={Colors.textLight} />
                  <Text style={styles.actionButtonText}>Take Photo</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { opacity: isLoading ? 0.6 : 1 }]}
                onPress={pickImage}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={[Colors.secondary, '#4ade80']}
                  style={styles.actionButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="images" size={24} color={Colors.textLight} />
                  <Text style={styles.actionButtonText}>Gallery</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Analyze Button */}
        {imageUri && (
          <TouchableOpacity
            style={[styles.analyzeContainer, { opacity: isLoading ? 0.6 : 1 }]}
            onPress={handleAnalyze}
            disabled={!imageUri || isLoading}
          >
            <LinearGradient
              colors={[Colors.accentGreen, '#4ade80']}
              style={styles.analyzeButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.textLight} />
              ) : (
                <Ionicons name="analytics" size={24} color={Colors.textLight} />
              )}
              <Text style={styles.analyzeButtonText}>
                {isLoading ? "Analyzing Image..." : "Analyze Skin Condition"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Tips Card */}
        <LinearGradient
          colors={isDarkMode ? ['#2a2a2a', '#1f1f1f'] : ['#ffffff', '#f5f7fa']}
          style={styles.tipsCard}
        >
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={24} color={Colors.accentGreen} />
            <Text style={[styles.tipsTitle, { color: colors.text }]}>Tips for Better Results</Text>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.accentGreen} />
              <Text style={[styles.tipText, { color: colors.text }]}>Use natural daylight when possible</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.accentGreen} />
              <Text style={[styles.tipText, { color: colors.text }]}>Avoid shadows and reflections</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.accentGreen} />
              <Text style={[styles.tipText, { color: colors.text }]}>Keep the area clean and dry</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.accentGreen} />
              <Text style={[styles.tipText, { color: colors.text }]}>Fill the frame with the affected area</Text>
            </View>
          </View>
        </LinearGradient>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  helpButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  modernCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 22,
  },
  instructionsContainer: {
    marginBottom: 24,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },
  contextSection: {
    marginBottom: 24,
  },
  contextLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputContainer: {
    borderRadius: 16,
    padding: 4,
  },
  contextInput: {
    minHeight: 80,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#000000',
  },
  imageSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  imageContainer: {
    marginBottom: 20,
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 250,
    borderRadius: 16,
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 14,
  },
  imagePlaceholder: {
    height: 200,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
    opacity: 0.6,
  },
  placeholderSubtext: {
    fontSize: 14,
    marginTop: 8,
    opacity: 0.4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  analyzeContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  analyzeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 32,
  },
  analyzeButtonText: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  tipsCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  tipsList: {
    marginLeft: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
})

export default SkinScannerScreen
