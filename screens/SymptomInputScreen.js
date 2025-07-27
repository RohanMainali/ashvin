"use client"

import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "@react-navigation/native"
import { Audio } from "expo-av"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from "expo-linear-gradient"
import { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native"
import { Colors } from "../constants/colors"
import { createSymptomReport } from "../utils/symptomApi"
import { transcribeAudioFile } from '../utils/speechToText'

const SymptomInputScreen = ({ navigation, addHistoryEntry, isDarkMode }) => {
  const { colors } = useTheme()
  const [symptoms, setSymptoms] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recording, setRecording] = useState(null)
  const [recordedUri, setRecordedUri] = useState(null)
  const [playbackObject, setPlaybackObject] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const pulseAnim = useRef(new Animated.Value(1)).current
  const recordingTimer = useRef(null)

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start()
      recordingTimer.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
    } else {
      pulseAnim.stopAnimation()
      clearInterval(recordingTimer.current)
      setElapsedTime(0)
    }
    return () => {
      clearInterval(recordingTimer.current)
      if (playbackObject) playbackObject.unloadAsync()
    }
  }, [isRecording, playbackObject])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0")
    const secs = (seconds % 60).toString().padStart(2, "0")
    return `${mins}:${secs}`
  }

  const getMicrophonePermission = async () => {
    const { status } = await Audio.requestPermissionsAsync()
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Microphone permission is needed to record symptoms. Please enable it in your device settings."
      )
      return false
    }
    return true
  }

  const startRecording = async () => {
    const hasPermission = await getMicrophonePermission()
    if (!hasPermission) return
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playsInSilentModeAndroid: true,
        shouldDuckAndroid: true,
      })
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
      setRecording(recording)
      setIsRecording(true)
      setRecordedUri(null)
      setIsPlaying(false)
      if (playbackObject) playbackObject.unloadAsync()
    } catch (err) {
      console.error("Failed to start recording", err)
      Alert.alert("Recording Error", "Could not start recording. Please ensure no other app is using the microphone.")
    }
  }

  const stopRecording = async () => {
    setIsRecording(false)
    try {
      await recording.stopAndUnloadAsync()
      const uri = recording.getURI()
      setRecordedUri(uri)
      setRecording(null)
      // Auto-transcribe after recording stops
      setIsLoading(true)
      try {
        const transcript = await transcribeAudioFile(uri)
        setSymptoms(transcript)
      } catch (err) {
        // Optionally handle error, but do not show popup
        console.error("Transcription Error", err)
      } finally {
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Failed to stop recording", error)
      Alert.alert("Recording Error", "Could not stop recording. Please try again.")
    }
  }

  const playRecording = async () => {
    if (!recordedUri) return
    try {
      if (playbackObject) await playbackObject.unloadAsync()
      const { sound } = await Audio.Sound.createAsync({ uri: recordedUri }, { shouldPlay: true })
      setPlaybackObject(sound)
      setIsPlaying(true)
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) setIsPlaying(false)
      })
    } catch (error) {
      console.error("Failed to play recording", error)
      Alert.alert("Playback Error", "Could not play recording. Please try again.")
    }
  }

  const resetRecording = async () => {
    if (recording) await recording.stopAndUnloadAsync()
    if (playbackObject) playbackObject.unloadAsync()
    setRecording(null)
    setIsRecording(false)
    setRecordedUri(null)
    setPlaybackObject(null)
    setIsPlaying(false)
  }

  const handleTranscribe = async () => {
    if (!recordedUri) {
      Alert.alert("No Audio", "Please record a voice note first to transcribe.")
      return
    }
    setIsLoading(true)
    try {
      const transcript = await transcribeAudioFile(recordedUri)
      setSymptoms(transcript)
      // No popup on completion
    } catch (err) {
      Alert.alert("Transcription Error", err.message || 'Could not transcribe audio.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!symptoms.trim()) {
      Alert.alert("No Symptoms", "Please describe your symptoms to get an analysis.")
      return
    }
    setIsLoading(true)
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await createSymptomReport({ symptoms: symptoms.trim() }, token)
      if (response && response.analysis) {
        const newEntry = {
          id: response._id || Date.now().toString(),
          date: response.date || new Date().toISOString(),
          scanType: "symptom",
          scanData: {
            symptoms: response.symptoms,
            analysis: response.analysis,
            confidence: response.confidence,
            scan_details: response.scan_details,
            insights: response.insights,
          },
          llmResponse: response,
        }
        if (typeof addHistoryEntry === "function") addHistoryEntry(newEntry)
        navigation.navigate("Results", { result: newEntry })
      } else {
        Alert.alert("Analysis Error", response.analysis || "Failed to analyze symptoms.")
      }
    } catch (error) {
      console.error("Symptom analysis failed", error)
      Alert.alert("Analysis Error", "Failed to analyze symptoms. Please try again.")
    } finally {
      setIsLoading(false)
      setSymptoms("")
    }
  }

  const Card = ({ children, style }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderColorLight }, style]}>
      {children}
    </View>
  )

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Symptom Checker</Text>
          <TouchableOpacity 
            style={styles.helpButton}
            onPress={() => Alert.alert("Help", "Describe your symptoms in detail or use voice recording for automatic transcription. Be specific about duration, severity, and location.")}
          >
            <Ionicons name="help-circle-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Main Symptom Card */}
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
                <Ionicons name="medical" size={32} color={Colors.primary} />
              </LinearGradient>
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>AI Symptom Analysis</Text>
            <Text style={[styles.cardSubtitle, { color: colors.text }]}>
              Describe your symptoms for intelligent health insights
            </Text>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <View style={styles.instructionItem}>
              <View style={[styles.stepNumber, { backgroundColor: Colors.primary + '20' }]}>
                <Text style={[styles.stepNumberText, { color: Colors.primary }]}>1</Text>
              </View>
              <Text style={[styles.instructionText, { color: colors.text }]}>
                Record or type your symptoms clearly
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={[styles.stepNumber, { backgroundColor: Colors.primary + '20' }]}>
                <Text style={[styles.stepNumberText, { color: Colors.primary }]}>2</Text>
              </View>
              <Text style={[styles.instructionText, { color: colors.text }]}>
                Include duration and severity details
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={[styles.stepNumber, { backgroundColor: Colors.primary + '20' }]}>
                <Text style={[styles.stepNumberText, { color: Colors.primary }]}>3</Text>
              </View>
              <Text style={[styles.instructionText, { color: colors.text }]}>
                Get AI-powered health analysis
              </Text>
            </View>
          </View>

          {/* Voice Recording Section */}
          <View style={styles.recordingSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Voice Recording</Text>
            
            <LinearGradient
              colors={isDarkMode ? ['#333333', '#2a2a2a'] : ['#f8f9fa', '#ffffff']}
              style={styles.recordingContainer}
            >
              {isRecording ? (
                <View style={styles.recordingActive}>
                  <Animated.View style={[styles.recordButtonOuter, { transform: [{ scale: pulseAnim }] }]}>
                    <TouchableOpacity
                      style={[styles.recordButton, { backgroundColor: Colors.accentRed }]}
                      onPress={stopRecording}
                      disabled={isLoading}
                    >
                      <Ionicons name="stop" size={32} color={Colors.textLight} />
                    </TouchableOpacity>
                  </Animated.View>
                  <Text style={[styles.recordingStatusText, { color: Colors.accentRed }]}>Recording...</Text>
                  <Text style={[styles.timerText, { color: colors.text }]}>{formatTime(elapsedTime)}</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.recordButtonLarge, { backgroundColor: Colors.primary, opacity: (isLoading || recordedUri !== null) ? 0.6 : 1 }]}
                  onPress={startRecording}
                  disabled={isLoading || recordedUri !== null}
                >
                  <Ionicons name="mic" size={36} color={Colors.textLight} />
                  <Text style={styles.recordButtonText}>Start Recording</Text>
                </TouchableOpacity>
              )}

              {recordedUri && !isRecording && (
                <View style={styles.playbackControls}>
                  <TouchableOpacity
                    style={[styles.playbackButton, { opacity: isLoading ? 0.6 : 1 }]}
                    onPress={playRecording}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={isPlaying ? [Colors.secondary, '#4ade80'] : [Colors.primary, Colors.secondary]}
                      style={styles.playbackButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Ionicons name={isPlaying ? "pause" : "play"} size={20} color={Colors.textLight} />
                      <Text style={styles.playbackButtonText}>{isPlaying ? "Pause" : "Play"}</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.playbackButton, { opacity: isLoading ? 0.6 : 1 }]}
                    onPress={resetRecording}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={[Colors.secondary, '#4ade80']}
                      style={styles.playbackButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Ionicons name="refresh" size={20} color={Colors.textLight} />
                      <Text style={styles.playbackButtonText}>Reset</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </LinearGradient>
          </View>

          {/* Text Input Section */}
          <View style={styles.textInputSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Describe Your Symptoms</Text>
            <LinearGradient
              colors={isDarkMode ? ['#333333', '#2a2a2a'] : ['#f8f9fa', '#ffffff']}
              style={styles.inputContainer}
            >
              <Ionicons name="document-text-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g., 'I have a persistent cough for 3 days, feeling tired and have mild fever'"
                placeholderTextColor={colors.text + "30"}
                value={symptoms}
                onChangeText={setSymptoms}
                multiline
                numberOfLines={4}
                editable={!isLoading}
              />
            </LinearGradient>
          </View>
        </LinearGradient>

        {/* Analyze Button */}
        {symptoms.trim() && (
          <TouchableOpacity
            style={[styles.analyzeContainer, { opacity: isLoading ? 0.6 : 1 }]}
            onPress={handleAnalyze}
            disabled={!symptoms.trim() || isLoading}
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
                {isLoading ? "Analyzing Symptoms..." : "Analyze Symptoms"}
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
            <Text style={[styles.tipsTitle, { color: colors.text }]}>Tips for Better Analysis</Text>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.accentGreen} />
              <Text style={[styles.tipText, { color: colors.text }]}>Be specific about symptom duration and severity</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.accentGreen} />
              <Text style={[styles.tipText, { color: colors.text }]}>Mention location and triggering factors</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.accentGreen} />
              <Text style={[styles.tipText, { color: colors.text }]}>Include any associated symptoms</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.accentGreen} />
              <Text style={[styles.tipText, { color: colors.text }]}>Use voice recording for detailed descriptions</Text>
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
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  helpButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  modernCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
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
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
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
  recordingSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  recordingContainer: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  recordButtonLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 12,
  },
  recordButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  recordingActive: {
    alignItems: 'center',
  },
  recordButtonOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.accentRed + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  recordingStatusText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  playbackControls: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  playbackButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  playbackButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  playbackButtonText: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  textInputSection: {
    marginBottom: 8,
  },
  inputContainer: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#000000',
    minHeight: 120,
  },
  inputIcon: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  input: {
    flex: 1,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  analyzeContainer: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  analyzeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 32,
  },
  analyzeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  tipsCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
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
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipText: {
    fontSize: 15,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
})

export default SymptomInputScreen
