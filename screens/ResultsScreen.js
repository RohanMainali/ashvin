"use client"

import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useTheme } from "@react-navigation/native"
import { useState, useEffect } from "react"
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, StatusBar } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import * as Progress from "react-native-progress"
import { Audio } from "expo-av"
import { Colors } from "../constants/colors"

const ResultsScreen = ({ route, navigation }) => {
  // Add safety check for route.params
  if (!route.params || !route.params.result) {
    navigation.goBack()
    return null
  }
  
  const { result } = route.params // result now contains scanType, scanData, and llmResponse
  const { colors } = useTheme()
  const [feedbackGiven, setFeedbackGiven] = useState(null) // 'helpful' or 'unhelpful'
  
  // Audio playback state for cardiac scans
  const [audioSound, setAudioSound] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackPosition, setPlaybackPosition] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)

  // Extract data from the generic result object
  const { scanType, scanData, llmResponse } = result
  // For symptom, llmResponse may be structured JSON from AI
  const { analysis, confidence, scan_details, insights, summary, topConditions, urgency, suggestions, explanation, message } = llmResponse || {}
  // Fallback for symptom analysis
  const symptomAnalysis = analysis || message || result.analysis || 'No AI analysis available.'

  // Helper function to convert confidence to numeric value
  const getConfidenceValue = (conf) => {
    if (typeof conf === 'number' && !isNaN(conf)) {
      return Math.max(0, Math.min(1, conf)) // Clamp between 0 and 1
    }
    if (typeof conf === 'string') {
      const lower = conf.toLowerCase()
      switch (lower) {
        case 'high': return 0.8
        case 'medium': return 0.6
        case 'low': return 0.4
        default:
          const parsed = parseFloat(conf)
          return isNaN(parsed) ? 0.5 : Math.max(0, Math.min(1, parsed))
      }
    }
    return 0.5 // Default fallback
  }

  // Helper function to generate short cardiac assessment
  const getShortCardiacAssessment = (fullAssessment, riskLevel) => {
    if (!fullAssessment) return 'Analysis Complete'
    
    const assessment = fullAssessment.toLowerCase()
    
    // Check for specific conditions and return short phrases
    if (assessment.includes('irregular') && assessment.includes('rhythm')) {
      return 'Irregular Rhythm Detected'
    } else if (assessment.includes('normal') && assessment.includes('heart rate')) {
      return 'Normal Heart Rate'
    } else if (assessment.includes('murmur')) {
      return 'Murmur Detected'
    } else if (assessment.includes('arrhythmia')) {
      return 'Arrhythmia Suspected'
    } else if (assessment.includes('stable')) {
      return 'Stable Cardiac Function'
    } else if (riskLevel) {
      return `${riskLevel} Risk Level`
    } else {
      return 'Cardiac Analysis Complete'
    }
  }

  // Audio playback functions for cardiac scans
  const playAudio = async (audioUri) => {
    try {
      if (audioSound) {
        await audioSound.unloadAsync()
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      )
      
      setAudioSound(sound)
      setIsPlaying(true)
    } catch (error) {
      console.error('Error playing audio:', error)
      Alert.alert('Playback Error', 'Unable to play audio file')
    }
  }

  const pauseAudio = async () => {
    if (audioSound) {
      await audioSound.pauseAsync()
      setIsPlaying(false)
    }
  }

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis)
      setAudioDuration(status.durationMillis)
      setIsPlaying(status.isPlaying)
      
      if (status.didJustFinish) {
        setIsPlaying(false)
        setPlaybackPosition(0)
      }
    }
  }

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioSound) {
        audioSound.unloadAsync()
      }
    }
  }, [audioSound])

  const getUrgencyColor = (urgencyLevel) => {
    switch (urgencyLevel) {
      case "Low":
        return Colors.accentGreen
      case "Medium":
        return Colors.secondary
      case "High":
        return Colors.accentRed
      default:
        return colors.text
    }
  }

  const handleFeedback = async (type) => {
    setFeedbackGiven(type)
    Alert.alert("Feedback Received", `Thank you for your feedback! You found this explanation ${type}.`)
    // Simulate sending feedback to a backend or storing it
    try {
      const feedbackEntry = {
        resultId: result.id,
        scanType: scanType,
        diagnosis: scanData.diagnosis || scanData.symptoms, // Use diagnosis for scans, symptoms for symptom checker
        feedbackType: type,
        timestamp: new Date().toISOString(),
      }
      const storedFeedback = await AsyncStorage.getItem("aiFeedback")
      const allFeedback = storedFeedback ? JSON.parse(storedFeedback) : []
      allFeedback.push(feedbackEntry)
      await AsyncStorage.setItem("aiFeedback", JSON.stringify(allFeedback))
      console.log("AI Feedback stored:", feedbackEntry)
    } catch (e) {
      console.error("Failed to store AI feedback:", e)
    }
  }

  const Card = ({ children, style, gradient = false }) => (
    <View style={[styles.cardContainer, style]}>
      {gradient ? (
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={[styles.card, styles.gradientCard]}
        >
          {children}
        </LinearGradient>
      ) : (
        <LinearGradient
          colors={['#ffffff', '#f8f9ff']}
          style={styles.card}
        >
          {children}
        </LinearGradient>
      )}
    </View>
  )

  // Render medical report modules using the same logic as other modules
  const renderMedicalReportModules = () => {
    if (!llmResponse) return null;
    return (
      <>
        {llmResponse.analysis && (
          <View style={styles.llmDetailSection}>
            <Text style={[styles.llmDetailTitle, { color: colors.text }]}>Analysis:</Text>
            <Text style={[styles.llmDetailText, { color: colors.text }]}>{llmResponse.analysis}</Text>
          </View>
        )}
        {llmResponse.scan_details && (
          <View style={styles.llmDetailSection}>
            <Text style={[styles.llmDetailTitle, { color: colors.text }]}>Scan Details:</Text>
            <Text style={[styles.llmDetailText, { color: colors.text }]}>{llmResponse.scan_details}</Text>
          </View>
        )}
        {llmResponse.insights && (
          <View style={styles.llmDetailSection}>
            <Text style={[styles.llmDetailTitle, { color: colors.text }]}>Insights / Suggestions:</Text>
            <Text style={[styles.llmDetailText, { color: colors.text }]}>{llmResponse.insights}</Text>
          </View>
        )}
        {llmResponse.explanation && (
          <View style={styles.llmDetailSection}>
            <Text style={[styles.llmDetailTitle, { color: colors.text }]}>Explanation:</Text>
            <Text style={[styles.llmDetailText, { color: colors.text }]}>{llmResponse.explanation}</Text>
          </View>
        )}
      </>
    );
  };

  const renderScanSpecificVisuals = () => {
    if (scanType === "cardiac") {
      return (
        <View style={styles.visualsContainer}>
          {scanData.waveformUrl && (
            <View style={[styles.visualItem, { backgroundColor: colors.background }]}>
              <Text style={[styles.visualTitle, { color: colors.text }]}>Waveform</Text>
              <Image
                source={{ uri: scanData.waveformUrl }}
                style={styles.visualImage}
                accessibilityLabel={`Waveform for ${scanData.diagnosis}`}
              />
            </View>
          )}
          {scanData.spectrogramUrl && (
            <View style={[styles.visualItem, { backgroundColor: colors.background }]}>
              <Text style={[styles.visualTitle, { color: colors.text }]}>Spectrogram</Text>
              <Image
                source={{ uri: scanData.spectrogramUrl }}
                style={styles.visualImage}
                accessibilityLabel={`Spectrogram for ${scanData.diagnosis}`}
              />
            </View>
          )}
          {!scanData.waveformUrl && !scanData.spectrogramUrl && (
            <View style={[styles.visualItem, { backgroundColor: colors.background }]}>
              <Text style={[styles.visualTitle, { color: colors.text }]}>Audio Analysis</Text>
              <Text style={[styles.visualDescription, { color: colors.text }]}>
                Audio waveform and spectrogram visualization not available for this analysis.
              </Text>
            </View>
          )}
        </View>
      )
    } else if (scanType === "skin" || scanType === "eye") {
      return (
        <View style={styles.visualsContainer}>
          <View style={[styles.visualItemFull, { backgroundColor: colors.background }]}>
            <Text style={[styles.visualTitle, { color: colors.text }]}>Captured Image</Text>
            <Image
              source={{ uri: scanData.imageUrl }}
              style={styles.capturedImage}
              accessibilityLabel={`Captured image for ${scanType} scan`}
            />
          </View>
        </View>
      )
    } else if (scanType === "vitals") {
      return (
        <View style={styles.vitalsDisplayContainer}>
          {/* Show Scan Analysis (3-5 word summary) */}
          {llmResponse?.analysis && (
            <View style={[styles.vitalsItem, { borderColor: colors.borderColorLight, backgroundColor: '#e6f7ff', marginBottom: 8 }]}> 
              <Ionicons name="analytics-outline" size={24} color={Colors.primary} />
              <Text style={[styles.vitalsLabel, { color: colors.text, fontWeight: 'bold' }]}>Scan Analysis:</Text>
              <Text style={[styles.vitalsValue, { color: colors.text }]}>{llmResponse.analysis}</Text>
            </View>
          )}
          {(scanData.bpSystolic || scanData.bpDiastolic) && (
            <View style={[styles.vitalsItem, { borderColor: colors.borderColorLight }]}> 
              <Ionicons name="heart-outline" size={24} color={Colors.primary} />
              <Text style={[styles.vitalsLabel, { color: colors.text }]}>BP:</Text>
              <Text style={[styles.vitalsValue, { color: colors.text }]}> 
                {scanData.bpSystolic || '--'}/{scanData.bpDiastolic || '--'} mmHg
              </Text>
            </View>
          )}
          {scanData.heartRate && !isNaN(scanData.heartRate) && (
            <View style={[styles.vitalsItem, { borderColor: colors.borderColorLight }]}> 
              <Ionicons name="pulse-outline" size={24} color={Colors.secondary} />
              <Text style={[styles.vitalsLabel, { color: colors.text }]}>Pulse:</Text>
              <Text style={[styles.vitalsValue, { color: colors.text }]}>{scanData.heartRate} bpm</Text>
            </View>
          )}
          {scanData.o2 && (
            <View style={[styles.vitalsItem, { borderColor: colors.borderColorLight }]}> 
              <Ionicons name="water-outline" size={24} color={Colors.accentGreen} />
              <Text style={[styles.vitalsLabel, { color: colors.text }]}>O₂:</Text>
              <Text style={[styles.vitalsValue, { color: colors.text }]}>{scanData.o2}%</Text>
            </View>
          )}
          {scanData.temperature && (
            <View style={[styles.vitalsItem, { borderColor: colors.borderColorLight }]}> 
              <Ionicons name="thermometer-outline" size={24} color={Colors.accentRed} />
              <Text style={[styles.vitalsLabel, { color: colors.text }]}>Temp:</Text>
              <Text style={[styles.vitalsValue, { color: colors.text }]}>{scanData.temperature}°F</Text>
            </View>
          )}
        </View>
      )
    } else if (scanType === "symptom") {
      return (
        <View style={styles.symptomDisplayContainer}>
          <Ionicons name="chatbox-ellipses-outline" size={30} color={Colors.primary} />
          <Text style={[styles.symptomText, { color: colors.text }]}>You described: "{scanData.symptoms}"</Text>
        </View>
      )
    }
    return null
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Modern Header */}
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>AI Analysis Results</Text>
          
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => {/* Share functionality */}}
          >
            <Ionicons name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollContent}>
          
          {/* Main Results Card */}
          <Card>
            <View style={styles.resultsHeader}>
              <View style={styles.scanTypeIndicator}>
                <View style={styles.iconContainer}>
                  <Ionicons 
                    name={scanType === 'skin' ? 'medical-outline' : 
                          scanType === 'eye' ? 'eye-outline' : 
                          scanType === 'cardiac' ? 'heart-outline' :
                          scanType === 'vitals' ? 'pulse-outline' :
                          scanType === 'symptom' ? 'chatbox-ellipses-outline' :
                          'document-text-outline'} 
                    size={32} 
                    color={Colors.primary} 
                  />
                </View>
                <Text style={[styles.scanTypeText, { color: colors.text }]}>
                  {scanType.charAt(0).toUpperCase() + scanType.slice(1)} Analysis
                </Text>
              </View>
            </View>

            {/* Results Summary Section */}
            {scanType === 'medical_report' ? (
              <View style={styles.modernSummarySection}>
                <View style={styles.diagnosisCard}>
                  <Text style={[styles.diagnosisLabel, { color: colors.text }]}>Diagnosis</Text>
                  <Text style={[styles.diagnosisValue, { color: colors.text }]}> 
                    {llmResponse?.short_summary || 'No disease detected'}
                  </Text>
                </View>
                <View style={styles.confidenceCard}>
                  <Text style={[styles.confidenceLabel, { color: colors.text }]}>Confidence</Text>
                  <Progress.Circle
                    progress={getConfidenceValue(llmResponse?.confidence)}
                    size={80}
                    showsText={true}
                    formatText={() => `${Math.round(getConfidenceValue(llmResponse?.confidence) * 100)}%`}
                    color={Colors.primary}
                    unfilledColor={colors.borderColorLight}
                    borderWidth={0}
                    textStyle={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}
                  />
                </View>
              </View>
            ) : scanType === 'skin' || scanType === 'eye' ? (
              <View style={styles.modernSummarySection}>
                <View style={styles.diagnosisCard}>
                  <Text style={[styles.diagnosisLabel, { color: colors.text }]}>Finding</Text>
                  <Text style={[styles.diagnosisValue, { color: colors.text }]}> 
                    {llmResponse?.short_summary || 'No finding detected'}
                  </Text>
                </View>
                <View style={styles.confidenceCard}>
                  <Text style={[styles.confidenceLabel, { color: colors.text }]}>Confidence</Text>
                  <Progress.Circle
                    progress={getConfidenceValue(confidence)}
                    size={80}
                    showsText={true}
                    formatText={() => `${Math.round(getConfidenceValue(confidence) * 100)}%`}
                    color={Colors.primary}
                    unfilledColor={colors.borderColorLight}
                    borderWidth={0}
                    textStyle={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}
                  />
                </View>
              </View>
            ) : scanType === 'vitals' ? (
              <View style={styles.vitalsResultsSection}>
                <Text style={[styles.vitalsMainResult, { color: colors.text }]}>
                  {llmResponse?.analysis || 'Vitals Analysis Complete'}
                </Text>
                <View style={styles.confidenceCard}>
                  <Text style={[styles.confidenceLabel, { color: colors.text }]}>Confidence</Text>
                  <Progress.Circle
                    progress={getConfidenceValue(confidence)}
                    size={60}
                    showsText={true}
                    formatText={() => `${Math.round(getConfidenceValue(confidence) * 100)}%`}
                    color={Colors.primary}
                    unfilledColor={colors.borderColorLight}
                    borderWidth={0}
                    textStyle={{ color: colors.text, fontSize: 16, fontWeight: "bold" }}
                  />
                </View>
              </View>
            ) : scanType === 'symptom' ? (
              <View style={styles.vitalsResultsSection}>
                <Text style={[styles.vitalsMainResult, { color: colors.text }]}>
                  {llmResponse?.short_summary || 'Symptom Analysis Complete'}
                </Text>
                <View style={styles.confidenceCard}>
                  <Text style={[styles.confidenceLabel, { color: colors.text }]}>Confidence</Text>
                  <Progress.Circle
                    progress={getConfidenceValue(confidence)}
                    size={60}
                    showsText={true}
                    formatText={() => `${Math.round(getConfidenceValue(confidence) * 100)}%`}
                    color={Colors.primary}
                    unfilledColor={colors.borderColorLight}
                    borderWidth={0}
                    textStyle={{ color: colors.text, fontSize: 16, fontWeight: "bold" }}
                  />
                </View>
              </View>
            ) : scanType === 'cardiac' ? (
              <View style={styles.modernSummarySection}>
                <View style={styles.diagnosisCard}>
                  <Text style={[styles.diagnosisLabel, { color: colors.text }]}>Cardiac Assessment</Text>
                  <Text style={[styles.diagnosisValue, { color: colors.text }]}> 
                    {getShortCardiacAssessment(scanData.assessment || llmResponse?.overallAssessment, scanData.riskLevel)}
                  </Text>
                </View>
                <View style={styles.confidenceCard}>
                  <Text style={[styles.confidenceLabel, { color: colors.text }]}>Confidence</Text>
                  <Progress.Circle
                    progress={getConfidenceValue(confidence)}
                    size={80}
                    showsText={true}
                    formatText={() => `${Math.round(getConfidenceValue(confidence) * 100)}%`}
                    color={Colors.primary}
                    unfilledColor={colors.borderColorLight}
                    borderWidth={0}
                    textStyle={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.modernSummarySection}>
                <View style={styles.diagnosisCard}>
                  <Text style={[styles.diagnosisLabel, { color: colors.text }]}>Result</Text>
                  <Text style={[styles.diagnosisValue, { color: colors.text }]}> 
                    {scanData.diagnosis || "Scan Analysis"}
                  </Text>
                  {urgency && (
                    <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(urgency) }]}> 
                      <Text style={styles.urgencyText}>{urgency}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.confidenceCard}>
                  <Text style={[styles.confidenceLabel, { color: colors.text }]}>Confidence</Text>
                  <Progress.Circle
                    progress={getConfidenceValue(confidence)}
                    size={80}
                    showsText={true}
                    formatText={() => `${Math.round(getConfidenceValue(confidence) * 100)}%`}
                    color={Colors.primary}
                    unfilledColor={colors.borderColorLight}
                    borderWidth={0}
                    textStyle={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}
                  />
                </View>
              </View>
            )}
          </Card>

          {/* Scan Details Card */}
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Scan Details</Text>
            {scanType === 'medical_report' && scanData?.imageUrl ? (
              <View style={styles.imageSection}>
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: scanData.imageUrl }}
                    style={styles.capturedImage}
                    accessibilityLabel="Uploaded medical report image"
                  />
                </View>
              </View>
            ) : scanType === 'vitals' ? (
              <View style={styles.vitalsGrid}>
                {(scanData.bpSystolic || scanData.bpDiastolic) && (
                  <View style={[styles.vitalsCard, { backgroundColor: colors.background }]}> 
                    <Ionicons name="heart-outline" size={24} color={Colors.primary} />
                    <Text style={[styles.vitalsCardLabel, { color: colors.text }]}>Blood Pressure</Text>
                    <Text style={[styles.vitalsCardValue, { color: colors.text }]}> 
                      {scanData.bpSystolic || '--'}/{scanData.bpDiastolic || '--'} mmHg
                    </Text>
                  </View>
                )}
                {scanData.heartRate && (
                  <View style={[styles.vitalsCard, { backgroundColor: colors.background }]}> 
                    <Ionicons name="pulse-outline" size={24} color={Colors.secondary} />
                    <Text style={[styles.vitalsCardLabel, { color: colors.text }]}>Heart Rate</Text>
                    <Text style={[styles.vitalsCardValue, { color: colors.text }]}>{scanData.heartRate} bpm</Text>
                  </View>
                )}
                {scanData.o2 && (
                  <View style={[styles.vitalsCard, { backgroundColor: colors.background }]}> 
                    <Ionicons name="water-outline" size={24} color={Colors.accentGreen} />
                    <Text style={[styles.vitalsCardLabel, { color: colors.text }]}>Oxygen Level</Text>
                    <Text style={[styles.vitalsCardValue, { color: colors.text }]}>{scanData.o2}%</Text>
                  </View>
                )}
                {scanData.temperature && (
                  <View style={[styles.vitalsCard, { backgroundColor: colors.background }]}> 
                    <Ionicons name="thermometer-outline" size={24} color={Colors.accentRed} />
                    <Text style={[styles.vitalsCardLabel, { color: colors.text }]}>Temperature</Text>
                    <Text style={[styles.vitalsCardValue, { color: colors.text }]}>{scanData.temperature}°F</Text>
                  </View>
                )}
              </View>
            ) : scanType === 'symptom' ? (
              <View style={styles.symptomDetails}>
                <View style={styles.symptomCard}>
                  <Ionicons name="chatbox-ellipses-outline" size={30} color={Colors.primary} />
                  <Text style={[styles.symptomLabel, { color: colors.text }]}>Your Description</Text>
                  <Text style={[styles.symptomText, { color: colors.text }]}>"{scanData.symptoms}"</Text>
                </View>
              </View>
            ) : scanType === 'cardiac' ? (
              <View style={styles.cardiacDetails}>
                <View style={styles.cardiacAudioSection}>
                  <View style={styles.audioHeader}>
                    <Ionicons name="musical-notes-outline" size={30} color={Colors.primary} />
                    <Text style={[styles.audioLabel, { color: colors.text }]}>Heart Audio Recording</Text>
                  </View>
                  
                  {result.audioUri && (
                    <View style={styles.audioControls}>
                      <TouchableOpacity
                        style={[styles.audioButton, { backgroundColor: Colors.primary }]}
                        onPress={() => isPlaying ? pauseAudio() : playAudio(result.audioUri)}
                      >
                        <Ionicons 
                          name={isPlaying ? "pause" : "play"} 
                          size={24} 
                          color="white" 
                        />
                      </TouchableOpacity>
                      
                      <View style={styles.audioInfo}>
                        <Text style={[styles.audioTime, { color: colors.text }]}>
                          {Math.floor(playbackPosition / 1000)}s / {Math.floor(audioDuration / 1000)}s
                        </Text>
                        <View style={styles.progressBar}>
                          <View 
                            style={[
                              styles.progressFill, 
                              { 
                                width: audioDuration > 0 ? `${(playbackPosition / audioDuration) * 100}%` : '0%',
                                backgroundColor: Colors.primary 
                              }
                            ]} 
                          />
                        </View>
                      </View>
                    </View>
                  )}
                  
                  <View style={styles.audioMetadata}>
                    <View style={styles.metadataItem}>
                      <Text style={[styles.metadataLabel, { color: colors.text }]}>Duration:</Text>
                      <Text style={[styles.metadataValue, { color: colors.text }]}>
                        {scanData.duration ? `${Math.round(scanData.duration)}s` : 'Unknown'}
                      </Text>
                    </View>
                    <View style={styles.metadataItem}>
                      <Text style={[styles.metadataLabel, { color: colors.text }]}>Quality:</Text>
                      <Text style={[styles.metadataValue, { color: colors.text }]}>
                        {scanData.audioQuality || 'Unknown'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (scanType === 'skin' || scanType === 'eye') && scanData?.imageUrl ? (
              <View style={styles.imageSection}>
                <View style={styles.imageContainer}>
                  <Text style={[styles.imageLabel, { color: colors.text }]}>Captured Image</Text>
                  <Image
                    source={{ uri: scanData.imageUrl }}
                    style={styles.capturedImage}
                    accessibilityLabel={`Captured image for ${scanType} scan`}
                  />
                </View>
              </View>
            ) : null}
          </Card>

          {/* AI Insights Card */}
          <Card>
            <View style={styles.insightsHeader}>
              <Ionicons name="bulb-outline" size={24} color={Colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 12, marginBottom: 0 }]}>
                AI-Powered Insights
              </Text>
            </View>
            
            {scanType === 'medical_report' ? (
              renderMedicalReportModules()
            ) : (scanType === 'skin' || scanType === 'eye') ? (
              <View style={styles.insightsContent}>
                {scanData.userContext && (
                  <View style={styles.insightSection}>
                    <Text style={[styles.insightTitle, { color: colors.text }]}>Your Note</Text>
                    <Text style={[styles.insightText, { color: colors.text }]}>{scanData.userContext}</Text>
                  </View>
                )}
                <View style={styles.insightSection}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>Analysis</Text>
                  <Text style={[styles.insightText, { color: colors.text }]}>
                    {llmResponse?.analysis || 'No analysis available.'}
                  </Text>
                </View>
                <View style={styles.insightSection}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>Scan Details</Text>
                  <Text style={[styles.insightText, { color: colors.text }]}>
                    {llmResponse?.scan_details || 'No additional details available.'}
                  </Text>
                </View>
                <View style={styles.insightSection}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>Recommendations</Text>
                  <Text style={[styles.insightText, { color: colors.text }]}>
                    {llmResponse?.insights || 'No specific recommendations at this time.'}
                  </Text>
                </View>
              </View>
            ) : (scanType === 'symptom' || scanType === 'vitals') ? (
              <View style={styles.insightsContent}>
                <View style={styles.insightSection}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>Analysis</Text>
                  <Text style={[styles.insightText, { color: colors.text }]}>
                    {llmResponse?.analysis || llmResponse?.message || 'No AI analysis available.'}
                  </Text>
                </View>
                <View style={styles.insightSection}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>Possible Conditions</Text>
                  <Text style={[styles.insightText, { color: colors.text }]}>
                    {llmResponse?.scan_details || 'No specific conditions identified.'}
                  </Text>
                </View>
                <View style={styles.insightSection}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>Recommendations</Text>
                  <Text style={[styles.insightText, { color: colors.text }]}>
                    {llmResponse?.insights || 'Consult healthcare provider for personalized advice.'}
                  </Text>
                </View>
              </View>
            ) : scanType === 'cardiac' ? (
              <View style={styles.insightsContent}>
                <View style={styles.insightSection}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>Heart Rate Analysis</Text>
                  <Text style={[styles.insightText, { color: colors.text }]}>
                    {scanData.heartRate ? `Heart Rate: ${scanData.heartRate} BPM` : 'Heart rate data not available'}
                  </Text>
                  <Text style={[styles.insightText, { color: colors.text }]}>
                    {llmResponse?.heartRateAnalysis || 'No heart rate analysis available.'}
                  </Text>
                </View>
                
                <View style={styles.insightSection}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>Rhythm Analysis</Text>
                  <Text style={[styles.insightText, { color: colors.text }]}>
                    {scanData.rhythmAnalysis || llmResponse?.rhythmAnalysis || 'No rhythm analysis available.'}
                  </Text>
                </View>

                <View style={styles.insightSection}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>Risk Assessment</Text>
                  <Text style={[styles.insightText, { color: colors.text }]}>
                    Risk Level: {scanData.riskLevel || 'Not specified'}
                  </Text>
                </View>

                <View style={styles.insightSection}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>Medical Attention</Text>
                  <Text style={[styles.insightText, { color: colors.text }]}>
                    {scanData.seekMedicalAttention || llmResponse?.seekMedicalAttention || 'No specific guidance provided.'}
                  </Text>
                </View>

                <View style={styles.insightSection}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>Recommendations</Text>
                  {scanData.recommendations && Array.isArray(scanData.recommendations) ? (
                    scanData.recommendations.map((rec, index) => (
                      <Text key={index} style={[styles.conditionItem, { color: colors.text }]}>• {rec}</Text>
                    ))
                  ) : (
                    <Text style={[styles.insightText, { color: colors.text }]}>
                      {scanData.recommendations || 'No specific recommendations provided.'}
                    </Text>
                  )}
                </View>

                <View style={styles.insightSection}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>Lifestyle Suggestions</Text>
                  {scanData.lifestyleSuggestions && Array.isArray(scanData.lifestyleSuggestions) ? (
                    scanData.lifestyleSuggestions.map((suggestion, index) => (
                      <Text key={index} style={[styles.conditionItem, { color: colors.text }]}>• {suggestion}</Text>
                    ))
                  ) : (
                    <Text style={[styles.insightText, { color: colors.text }]}>
                      {scanData.lifestyleSuggestions || 'No lifestyle suggestions provided.'}
                    </Text>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.insightsContent}>
                <Text style={[styles.insightText, { color: colors.text, fontSize: 16, marginBottom: 20 }]}>
                  {summary}
                </Text>
                <View style={styles.insightSection}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>Explanation</Text>
                  <Text style={[styles.insightText, { color: colors.text }]}>{explanation}</Text>
                </View>
                <View style={styles.insightSection}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>Possible Conditions</Text>
                  {(Array.isArray(topConditions) ? topConditions : []).map((condition, index) => (
                    <Text key={index} style={[styles.conditionItem, { color: colors.text }]}> 
                      • {condition}
                    </Text>
                  ))}
                </View>
                <View style={styles.insightSection}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>Recommendations</Text>
                  <Text style={[styles.insightText, { color: colors.text }]}>{suggestions}</Text>
                </View>
              </View>
            )}

            {/* Feedback Section */}
            <View style={styles.feedbackSection}>
              <Text style={[styles.feedbackQuestion, { color: colors.text }]}>Was this analysis helpful?</Text>
              <View style={styles.feedbackButtons}>
                <TouchableOpacity
                  style={[
                    styles.feedbackButton,
                    {
                      backgroundColor: feedbackGiven === "helpful" ? Colors.accentGreen : colors.background,
                      borderColor: feedbackGiven === "helpful" ? Colors.accentGreen : colors.borderColorLight,
                    },
                  ]}
                  onPress={() => handleFeedback("helpful")}
                  disabled={!!feedbackGiven}
                  accessibilityLabel="Analysis was helpful"
                >
                  <Ionicons
                    name="thumbs-up"
                    size={20}
                    color={feedbackGiven === "helpful" ? Colors.textLight : Colors.accentGreen}
                  />
                  <Text
                    style={[
                      styles.feedbackButtonText,
                      { color: feedbackGiven === "helpful" ? Colors.textLight : Colors.accentGreen },
                    ]}
                  >
                    Helpful
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.feedbackButton,
                    {
                      backgroundColor: feedbackGiven === "unhelpful" ? Colors.accentRed : colors.background,
                      borderColor: feedbackGiven === "unhelpful" ? Colors.accentRed : colors.borderColorLight,
                    },
                  ]}
                  onPress={() => handleFeedback("unhelpful")}
                  disabled={!!feedbackGiven}
                  accessibilityLabel="Analysis was unhelpful"
                >
                  <Ionicons
                    name="thumbs-down"
                    size={20}
                    color={feedbackGiven === "unhelpful" ? Colors.textLight : Colors.accentRed}
                  />
                  <Text
                    style={[
                      styles.feedbackButtonText,
                      { color: feedbackGiven === "unhelpful" ? Colors.textLight : Colors.accentRed },
                    ]}
                  >
                    Not Helpful
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>

          {/* Action Buttons */}
          <View style={styles.actionButtonsGrid}>
            <TouchableOpacity
              style={styles.modernActionButton}
              onPress={() => {
                let topic = llmResponse?.analysis || llmResponse?.summary || llmResponse?.explanation || scanData.diagnosis || scanData.symptoms || "my results"
                if (topic && typeof topic === 'string') topic = topic.replace(/\.$/, '')
                navigation.navigate("MainApp", { screen: "Chat", params: { initialPrompt: `Tell me more about: ${topic}` } })
              }}
              accessibilityLabel="Ask Ashvin about diagnosis"
            >
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="chatbubbles" size={20} color={Colors.textLight} />
                <Text style={styles.actionButtonText}>Ask More</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modernActionButton}
              onPress={() => navigation.navigate("Report", { result: result })}
              accessibilityLabel="Generate medical report"
            >
              <LinearGradient
                colors={[Colors.secondary, Colors.primary]}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="document-text" size={20} color={Colors.textLight} />
                <Text style={styles.actionButtonText}>Get Report</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modernActionButton}
              onPress={() => navigation.navigate("DoctorRecommendation", { result: result })}
              accessibilityLabel="Find a doctor"
            >
              <LinearGradient
                colors={[Colors.accentRed, '#ff6b6b']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="medkit" size={20} color={Colors.textLight} />
                <Text style={styles.actionButtonText}>Find Doctor</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modernActionButton}
              onPress={() => navigation.navigate("MainApp", { screen: "Home" })}
              accessibilityLabel="Back to home"
            >
              <LinearGradient
                colors={[Colors.accentGreen, '#4CAF50']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="home" size={20} color={Colors.textLight} />
                <Text style={styles.actionButtonText}>Back to Home</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  shareButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  cardContainer: {
    marginBottom: 20,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  gradientCard: {
    // Additional styles for gradient cards if needed
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scanTypeIndicator: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(109, 40, 217, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scanTypeText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modernSummarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  diagnosisCard: {
    flex: 1,
    alignItems: 'center',
    marginRight: 16,
  },
  diagnosisLabel: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
    marginBottom: 8,
  },
  diagnosisValue: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  confidenceCard: {
    flex: 1,
    alignItems: 'center',
    marginLeft: 16,
  },
  confidenceLabel: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
    marginBottom: 12,
  },
  vitalsResultsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  vitalsMainResult: {
    flex: 2,
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 16,
  },
  urgencyBadge: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  urgencyText: {
    color: Colors.textLight,
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  imageSection: {
    marginBottom: 16,
  },
  imageContainer: {
    alignItems: 'center',
  },
  imageLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    opacity: 0.8,
  },
  capturedImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    resizeMode: 'contain',
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  vitalsCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderColorLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  vitalsCardLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  vitalsCardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  symptomDetails: {
    alignItems: 'center',
  },
  symptomCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(109, 40, 217, 0.05)',
    borderRadius: 16,
    width: '100%',
  },
  symptomLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  symptomText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  cardiacDetails: {
    alignItems: 'center',
  },
  cardiacAudioSection: {
    width: '100%',
    padding: 20,
    backgroundColor: 'rgba(109, 40, 217, 0.05)',
    borderRadius: 16,
  },
  audioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  audioLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  audioButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  audioInfo: {
    flex: 1,
  },
  audioTime: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(109, 40, 217, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  audioMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metadataItem: {
    flex: 1,
    alignItems: 'center',
  },
  metadataLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  insightsContent: {
    marginTop: 8,
  },
  insightSection: {
    marginBottom: 20,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.85,
  },
  conditionItem: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 4,
    opacity: 0.85,
  },
  feedbackSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.borderColorLight,
    alignItems: 'center',
  },
  feedbackQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  feedbackButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  feedbackButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  actionButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modernActionButton: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
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
})

export default ResultsScreen
