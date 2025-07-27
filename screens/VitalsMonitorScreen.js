"use client"

import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTheme } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"
import { useState } from "react"
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native"
import { Colors } from "../constants/colors"
import { createVitals } from "../utils/vitalsApi"

const VitalsMonitorScreen = ({ navigation, addHistoryEntry, isDarkMode }) => {
  const { colors } = useTheme()
  const [bloodPressure, setBloodPressure] = useState("")
  const [pulseRate, setPulseRate] = useState("")
  const [bloodOxygen, setBloodOxygen] = useState("")
  const [temperature, setTemperature] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const Card = ({ children, style }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderColorLight }, style]}>
      {children}
    </View>
  )

  const handleAnalyze = async () => {
    if (!bloodPressure && !pulseRate && !temperature) {
      Alert.alert("No Data", "Please enter at least blood pressure, pulse rate, or temperature.")
      return
    }

    setIsLoading(true)
    try {
      // Split bloodPressure into systolic/diastolic
      let bpSystolic = ""
      let bpDiastolic = ""
      if (bloodPressure.includes("/")) {
        const [sys, dia] = bloodPressure.split("/").map(s => s.replace(/[^\d.]/g, "").trim())
        bpSystolic = sys || ""
        bpDiastolic = dia || ""
      }
      const vitalsData = {
        heartRate: pulseRate.replace(/[^\d.]/g, "").trim(),
        bpSystolic,
        bpDiastolic,
        temperature: temperature.trim(),
        o2: bloodOxygen.trim(),
      }
      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('token');
      const result = await createVitals(vitalsData, token)
      if (result.error) throw new Error(result.error)
      const newEntry = {
        id: result._id || Date.now().toString(),
        date: result.date || new Date().toISOString().split("T")[0],
        scanType: "vitals",
        scanData: vitalsData,
        llmResponse: {
          analysis: result.analysis,
          confidence: result.confidence,
          scan_details: result.scan_details,
          insights: result.insights,
          ai: result.ai
        }
      }
      if (typeof addHistoryEntry === "function") {
        addHistoryEntry(newEntry) // Add to global history
      }
      navigation.navigate("Results", { result: newEntry })
    } catch (error) {
      console.error("Vitals analysis failed", error)
      Alert.alert("Analysis Error", "Failed to analyze vitals. Please try again.")
    } finally {
      setIsLoading(false)
      setBloodPressure("")
      setPulseRate("")
      setBloodOxygen("")
      setTemperature("")
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Vitals Monitor</Text>
          <TouchableOpacity 
            style={styles.helpButton}
            onPress={() => Alert.alert("Help", "Enter your vital signs manually. Ensure accurate measurements for best analysis results.")}
          >
            <Ionicons name="help-circle-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
      >
        {/* Main Vitals Card */}
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
                <Ionicons name="heart-outline" size={32} color={Colors.primary} />
              </LinearGradient>
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Vital Signs Monitoring</Text>
            <Text style={[styles.cardSubtitle, { color: colors.text }]}>
              Enter your vital measurements for AI analysis
            </Text>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <View style={styles.instructionItem}>
              <View style={[styles.stepNumber, { backgroundColor: Colors.primary + '20' }]}>
                <Text style={[styles.stepNumberText, { color: Colors.primary }]}>1</Text>
              </View>
              <Text style={[styles.instructionText, { color: colors.text }]}>
                Take measurements in a calm state
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={[styles.stepNumber, { backgroundColor: Colors.primary + '20' }]}>
                <Text style={[styles.stepNumberText, { color: Colors.primary }]}>2</Text>
              </View>
              <Text style={[styles.instructionText, { color: colors.text }]}>
                Use properly calibrated devices
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={[styles.stepNumber, { backgroundColor: Colors.primary + '20' }]}>
                <Text style={[styles.stepNumberText, { color: Colors.primary }]}>3</Text>
              </View>
              <Text style={[styles.instructionText, { color: colors.text }]}>
                Enter accurate values for best results
              </Text>
            </View>
          </View>

          {/* Vital Signs Input Section */}
          <View style={styles.vitalsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Enter Vital Signs</Text>
            
            {/* Blood Pressure */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Blood Pressure</Text>
              <LinearGradient
                colors={isDarkMode ? ['#333333', '#2a2a2a'] : ['#f8f9fa', '#ffffff']}
                style={styles.inputContainer}
              >
                <Ionicons name="heart-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g., 120/80 mmHg"
                  placeholderTextColor={colors.text + "30"}
                  value={bloodPressure}
                  onChangeText={setBloodPressure}
                  keyboardType="numbers-and-punctuation"
                  editable={!isLoading}
                />
              </LinearGradient>
            </View>

            {/* Pulse Rate */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Heart Rate</Text>
              <LinearGradient
                colors={isDarkMode ? ['#333333', '#2a2a2a'] : ['#f8f9fa', '#ffffff']}
                style={styles.inputContainer}
              >
                <Ionicons name="pulse-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g., 72 bpm"
                  placeholderTextColor={colors.text + "30"}
                  value={pulseRate}
                  onChangeText={setPulseRate}
                  keyboardType="numeric"
                  editable={!isLoading}
                />
              </LinearGradient>
            </View>

            {/* Blood Oxygen */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Blood Oxygen (SpO₂)</Text>
              <LinearGradient
                colors={isDarkMode ? ['#333333', '#2a2a2a'] : ['#f8f9fa', '#ffffff']}
                style={styles.inputContainer}
              >
                <Ionicons name="water-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g., 98%"
                  placeholderTextColor={colors.text + "30"}
                  value={bloodOxygen}
                  onChangeText={setBloodOxygen}
                  keyboardType="numeric"
                  editable={!isLoading}
                />
              </LinearGradient>
            </View>

            {/* Temperature */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Body Temperature</Text>
              <LinearGradient
                colors={isDarkMode ? ['#333333', '#2a2a2a'] : ['#f8f9fa', '#ffffff']}
                style={styles.inputContainer}
              >
                <Ionicons name="thermometer-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g., 98.6°F or 37°C"
                  placeholderTextColor={colors.text + "30"}
                  value={temperature}
                  onChangeText={setTemperature}
                  keyboardType="numbers-and-punctuation"
                  editable={!isLoading}
                />
              </LinearGradient>
            </View>
          </View>
        </LinearGradient>

        {/* Analyze Button */}
        {(bloodPressure || pulseRate || temperature || bloodOxygen) && (
          <TouchableOpacity
            style={[styles.analyzeContainer, { opacity: isLoading ? 0.6 : 1 }]}
            onPress={handleAnalyze}
            disabled={isLoading}
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
                {isLoading ? "Analyzing Vitals..." : "Analyze Vital Signs"}
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
            <Text style={[styles.tipsTitle, { color: colors.text }]}>Measurement Tips</Text>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.accentGreen} />
              <Text style={[styles.tipText, { color: colors.text }]}>Measure in a quiet, comfortable environment</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.accentGreen} />
              <Text style={[styles.tipText, { color: colors.text }]}>Rest for 5 minutes before blood pressure measurement</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.accentGreen} />
              <Text style={[styles.tipText, { color: colors.text }]}>Use the same arm and position consistently</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.accentGreen} />
              <Text style={[styles.tipText, { color: colors.text }]}>Take multiple readings for accuracy</Text>
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
  vitalsSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#000000',
    minHeight: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
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

export default VitalsMonitorScreen
