"use client"

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@react-navigation/native";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    StatusBar,
} from "react-native";
import { Colors } from "../constants/colors";
import { analyzeCardiacAudio, saveCardiacAnalysis } from "../utils/cardiacAnalysisApi";

const CardiacScanScreen = ({ navigation, addHistoryEntry, isDarkMode }) => {
  const { colors } = useTheme()
  const [recording, setRecording] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedUri, setRecordedUri] = useState(null)
  const [playbackObject, setPlaybackObject] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const pulseAnim = useRef(new Animated.Value(1)).current
  const recordingTimer = useRef(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    if (isRecording) {
      pulseAnimation()
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
      if (playbackObject) {
        playbackObject.unloadAsync()
      }
    }
  }, [isRecording, playbackObject])

  const pulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0")
    const secs = (seconds % 60).toString().padStart(2, "0")
    return `${mins}:${secs}`
  }

  const getMicrophonePermission = async () => {
    const { status } = await Audio.requestPermissionsAsync()
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Microphone permission is needed to record heartbeats. Please enable it in your device settings.",
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
        staysActiveInBackground: true,
      })

      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
      setRecording(recording)
      setIsRecording(true)
    } catch (error) {
      Alert.alert("Recording Error", "Could not start recording. Please try again.")
    }
  }

  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync()
      const uri = recording.getURI()
      setRecordedUri(uri)
      setIsRecording(false)
    } catch (error) {
      Alert.alert("Recording Error", "Could not stop recording. Please try again.")
    }
  }

  const playRecording = async () => {
    if (!recordedUri) return

    try {
      if (playbackObject && isPlaying) {
        await playbackObject.pauseAsync()
        setIsPlaying(false)
        return
      }

      const { sound } = await Audio.Sound.createAsync({ uri: recordedUri })
      setPlaybackObject(sound)
      await sound.playAsync()
      setIsPlaying(true)

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false)
        }
      })
    } catch (error) {
      Alert.alert("Playback Error", "Could not play recording. Please try again.")
    }
  }

  const resetRecording = async () => {
    if (recording) {
      await recording.stopAndUnloadAsync()
    }
    if (playbackObject) {
      playbackObject.unloadAsync()
    }
    setRecording(null)
    setIsRecording(false)
    setRecordedUri(null)
    setPlaybackObject(null)
    setIsPlaying(false)
  }

  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: false,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0]
        setRecordedUri(selectedFile.uri)
        setIsRecording(false)
        if (recording) {
          await recording.stopAndUnloadAsync()
          setRecording(null)
        }
        if (playbackObject) {
          playbackObject.unloadAsync()
          setPlaybackObject(null)
        }
      }
    } catch (error) {
      console.error('Error picking audio file:', error)
      Alert.alert('Error', 'Failed to pick audio file')
    }
  }

  const updateScanMetrics = async () => {
    try {
      const today = new Date().toISOString().split("T")[0]
      const lastScanDate = await AsyncStorage.getItem("lastScanDate")
      let currentScanStreak = Number.parseInt((await AsyncStorage.getItem("scanStreak")) || "0")
      let totalScans = Number.parseInt((await AsyncStorage.getItem("totalScans")) || "0")

      if (lastScanDate === today) {
        // Already scanned today, do nothing to streak
      } else if (lastScanDate) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split("T")[0]

        if (lastScanDate === yesterdayStr) {
          currentScanStreak += 1
        } else {
          currentScanStreak = 1
        }
      } else {
        currentScanStreak = 1
      }

      totalScans += 1

      await AsyncStorage.setItem("scanStreak", currentScanStreak.toString())
      await AsyncStorage.setItem("totalScans", totalScans.toString())
      await AsyncStorage.setItem("lastScanDate", today)
    } catch (error) {
      console.error("Error updating scan metrics:", error)
    }
  }

  const analyzeAudio = async () => {
    if (!recordedUri) {
      Alert.alert("No Recording", "Please record or upload an audio file first.")
      return
    }

    setIsAnalyzing(true)
    setIsLoading(true)
    
    try {
      console.log('Starting AI cardiac analysis...')
      
      // Use AI-powered cardiac analysis
      const result = await analyzeCardiacAudio(recordedUri)
      
      console.log('AI Analysis completed:', result)
      
      // Save analysis locally
      await saveCardiacAnalysis(result)
      
      // Update metrics
      await updateScanMetrics()
      
      // Set analysis result for display
      setAnalysisResult(result)
      
      // Create history entry
      const historyEntry = {
        type: "cardiac",
        result: {
          heartRate: result.audioFeatures.estimatedBPM,
          riskLevel: result.aiAnalysis.riskLevel,
          assessment: result.aiAnalysis.overallAssessment,
          recommendations: result.aiAnalysis.recommendations,
          confidence: result.aiAnalysis.confidence
        },
        timestamp: new Date().toISOString(),
        audioUri: recordedUri,
        analysisId: result.analysisId
      }
      
      addHistoryEntry(historyEntry)
      
      // Navigate to results with AI analysis
      const resultForNavigation = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        scanType: "cardiac",
        scanData: {
          heartRate: isNaN(result.audioFeatures.estimatedBPM) ? null : result.audioFeatures.estimatedBPM,
          riskLevel: result.aiAnalysis.riskLevel,
          assessment: result.aiAnalysis.overallAssessment,
          rhythmAnalysis: result.aiAnalysis.rhythmAnalysis,
          recommendations: result.aiAnalysis.recommendations,
          seekMedicalAttention: result.aiAnalysis.seekMedicalAttention,
          lifestyleSuggestions: result.aiAnalysis.lifestyleSuggestions,
          confidence: result.aiAnalysis.confidence,
          duration: isNaN(result.audioFeatures.duration) ? null : result.audioFeatures.duration,
          audioQuality: result.audioFeatures.audioQuality,
          diagnosis: result.aiAnalysis.overallAssessment || "Cardiac Analysis",
          waveformUrl: null, // Audio waveform visualization not available
          spectrogramUrl: null // Audio spectrogram visualization not available
        },
        audioUri: recordedUri, // Add audio URI for playback
        llmResponse: result.aiAnalysis
      }
      
      navigation.navigate("Results", { result: resultForNavigation })
      
    } catch (error) {
      console.error('AI Cardiac analysis error:', error)
      
      // Check if it's a speech detection error
      if (error.message.includes('Speech detected:')) {
        Alert.alert(
          "Invalid Audio Recording", 
          error.message + "\n\nPlease record only your heartbeat sounds without speaking or making noise."
        )
      } else {
        Alert.alert(
          "Analysis Error", 
          `AI analysis failed: ${error.message}\n\nPlease ensure you have a clear heartbeat recording and try again.`
        )
      }
    } finally {
      setIsAnalyzing(false)
      setIsLoading(false)
    }
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Heart Monitor</Text>
          <TouchableOpacity 
            style={styles.helpButton}
            onPress={() => Alert.alert("Help", "Place your phone's microphone near your heart and record your heartbeat for analysis.")}
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
        {/* Main Recording Card */}
        <LinearGradient
          colors={isDarkMode ? ['#2a2a2a', '#1f1f1f'] : ['#ffffff', '#f5f7fa']}
          style={styles.modernCard}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[Colors.accentRed + '20', Colors.accentRed + '10']}
                style={styles.iconBackground}
              >
                <Ionicons name="heart" size={32} color={Colors.accentRed} />
              </LinearGradient>
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Heartbeat Analysis</Text>
            <Text style={[styles.cardSubtitle, { color: colors.text }]}>
              Record your heartbeat for AI-powered health insights
            </Text>
          </View>

          {/* Recording Instructions */}
          <View style={styles.instructionsContainer}>
            <View style={styles.instructionItem}>
              <View style={[styles.stepNumber, { backgroundColor: Colors.primary + '20' }]}>
                <Text style={[styles.stepNumberText, { color: Colors.primary }]}>1</Text>
              </View>
              <Text style={[styles.instructionText, { color: colors.text }]}>
                Find a quiet environment
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={[styles.stepNumber, { backgroundColor: Colors.primary + '20' }]}>
                <Text style={[styles.stepNumberText, { color: Colors.primary }]}>2</Text>
              </View>
              <Text style={[styles.instructionText, { color: colors.text }]}>
                Place phone firmly against your chest
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={[styles.stepNumber, { backgroundColor: Colors.primary + '20' }]}>
                <Text style={[styles.stepNumberText, { color: Colors.primary }]}>3</Text>
              </View>
              <Text style={[styles.instructionText, { color: colors.text }]}>
                Hold still and breathe normally
              </Text>
            </View>
          </View>

          {/* Recording Controls */}
          <View style={styles.recordingSection}>
            {isRecording ? (
              <View style={styles.recordingActive}>
                <Animated.View style={[styles.pulseContainer, { transform: [{ scale: pulseAnim }] }]}>
                  <LinearGradient
                    colors={[Colors.accentRed, '#ff6b6b']}
                    style={styles.recordingButton}
                  >
                    <TouchableOpacity
                      style={styles.stopButton}
                      onPress={stopRecording}
                      disabled={isLoading}
                    >
                      <Ionicons name="stop" size={40} color={Colors.textLight} />
                    </TouchableOpacity>
                  </LinearGradient>
                </Animated.View>
                <Text style={[styles.recordingStatus, { color: Colors.accentRed }]}>
                  Recording in progress...
                </Text>
                <Text style={[styles.timerDisplay, { color: colors.text }]}>
                  {formatTime(elapsedTime)}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.startRecordingButton, { opacity: (isLoading || recordedUri !== null) ? 0.6 : 1 }]}
                onPress={startRecording}
                disabled={isLoading || recordedUri !== null}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.recordButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="mic" size={36} color={Colors.textLight} />
                  <Text style={styles.recordButtonText}>Start Recording</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Playback Controls */}
            {recordedUri && !isRecording && (
              <View style={styles.playbackSection}>
                <LinearGradient
                  colors={isDarkMode ? ['#333333', '#2a2a2a'] : ['#f0f0f0', '#e8e8e8']}
                  style={styles.audioPreview}
                >
                  <View style={styles.audioInfo}>
                    <Ionicons name="musical-notes" size={24} color={Colors.primary} />
                    <Text style={[styles.audioFileName, { color: colors.text }]}>
                      Recording captured
                    </Text>
                  </View>
                  <View style={styles.playbackControls}>
                    <TouchableOpacity
                      style={styles.playButton}
                      onPress={playRecording}
                      disabled={isLoading}
                    >
                      <LinearGradient
                        colors={isPlaying ? [Colors.secondary, '#4ade80'] : [Colors.primary, Colors.secondary]}
                        style={styles.controlButtonGradient}
                      >
                        <Ionicons name={isPlaying ? "pause" : "play"} size={20} color={Colors.textLight} />
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.resetButton}
                      onPress={resetRecording}
                      disabled={isLoading}
                    >
                      <View style={[styles.controlButton, { backgroundColor: colors.card }]}>
                        <Ionicons name="refresh" size={20} color={colors.text} />
                      </View>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Upload Alternative Card */}
        <LinearGradient
          colors={isDarkMode ? ['#2a2a2a', '#1f1f1f'] : ['#ffffff', '#f5f7fa']}
          style={styles.modernCard}
        >
          <View style={styles.uploadHeader}>
            <Ionicons name="cloud-upload-outline" size={28} color={Colors.secondary} />
            <Text style={[styles.uploadTitle, { color: colors.text }]}>Alternative Upload</Text>
            <Text style={[styles.uploadSubtitle, { color: colors.text }]}>
              Already have a heartbeat recording? Upload it here
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.uploadButton, { opacity: (isLoading || isRecording) ? 0.6 : 1 }]}
            onPress={pickAudioFile}
            disabled={isLoading || isRecording}
          >
            <LinearGradient
              colors={[Colors.secondary, '#4ade80']}
              style={styles.uploadButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="folder-open" size={24} color={Colors.textLight} />
              <Text style={styles.uploadButtonText}>Choose Audio File</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>

        {/* Analyze Button */}
        {recordedUri && (
          <TouchableOpacity
            style={[styles.analyzeContainer, { opacity: isLoading ? 0.6 : 1 }]}
            onPress={analyzeAudio}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[Colors.accentGreen, '#4ade80']}
              style={styles.analyzeButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading || isAnalyzing ? (
                <ActivityIndicator size="small" color={Colors.textLight} />
              ) : (
                <Ionicons name="analytics" size={24} color={Colors.textLight} />
              )}
              <Text style={styles.analyzeButtonText}>
                {isAnalyzing ? "🚀 Analyzing..." : isLoading ? "Processing..." : "Analyze"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
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
    marginBottom: 32,
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
    alignItems: 'center',
  },
  recordingActive: {
    alignItems: 'center',
  },
  pulseContainer: {
    marginBottom: 20,
  },
  recordingButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  stopButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingStatus: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  timerDisplay: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  startRecordingButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  recordButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  recordButtonText: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  playbackSection: {
    width: '100%',
    marginTop: 24,
  },
  audioPreview: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  audioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  audioFileName: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  playbackControls: {
    flexDirection: 'row',
  },
  playButton: {
    marginRight: 12,
  },
  controlButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  uploadHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 22,
  },
  uploadButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  uploadButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  uploadButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  analyzeContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
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
})

export default CardiacScanScreen
