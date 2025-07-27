"use client"

import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "@react-navigation/native"
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import CustomNavBar from "../components/CustomNavBar"
import { Colors } from "../constants/colors"

const { width } = Dimensions.get("window")

const ScanSelectionScreen = ({ navigation, addHistoryEntry, isDarkMode }) => {
  const { colors } = useTheme()

  const Card = ({ children, style }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderColorLight }, style]}>
      {children}
    </View>
  )

  const scanOptions = [
    {
      name: "Cardiac Scan",
      icon: "heart",
      color: Colors.primary,
      screen: "CardiacScan",
      description: "Monitor your heartbeat and cardiovascular health",
    },
    {
      name: "Skin Scan",
      icon: "body",
      color: Colors.secondary,
      screen: "SkinScanner",
      description: "Detect potential skin conditions and issues",
    },
    {
      name: "Eye Scan",
      icon: "eye",
      color: Colors.accentGreen,
      screen: "EyeScanner",
      description: "Check your eye health and detect irritations",
    },
    {
      name: "Vitals Monitor",
      icon: "thermometer",
      color: Colors.accentRed,
      screen: "VitalsMonitor",
      description: "Track vital signs like BP, pulse, and temperature",
    },
    {
      name: "Symptom Checker",
      icon: "chatbox-ellipses",
      color: Colors.primary,
      screen: "SymptomInput",
      description: "Get AI insights on your symptoms and conditions",
    },
    {
      name: "Medical Report",
      icon: "document-text",
      color: Colors.secondary,
      screen: "MedicalReportScan",
      description: "Analyze medical reports and lab results with AI",
    },
  ]

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <LinearGradient colors={[Colors.primary, Colors.gradientEnd]} style={styles.headerSection}>
          <Ionicons name="scan-circle" size={64} color={Colors.textLight} style={styles.headerIcon} />
          <Text style={styles.headerTitle}>Health Scans</Text>
          <Text style={styles.headerSubtitle}>Choose the health area you'd like to analyze today</Text>
        </LinearGradient>

        <View style={styles.contentContainer}>
          <View style={styles.scanOptionsContainer}>
            {scanOptions.map((option) => (
              <TouchableOpacity
                key={option.screen}
                style={[styles.scanOptionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.navigate(option.screen, { addHistoryEntry, isDarkMode })}
                accessibilityLabel={`Start ${option.name}`}
              >
                <View style={[styles.iconContainer, { backgroundColor: option.color + "15" }]}>
                  <Ionicons name={option.icon} size={32} color={option.color} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>{option.name}</Text>
                  <Text style={[styles.optionDescription, { color: colors.text }]}>{option.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text + "60"} />
              </TouchableOpacity>
            ))}
          </View>

          <Card style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={24} color={Colors.primary} />
              <Text style={[styles.infoTitle, { color: colors.text }]}>Important Note</Text>
            </View>
            <Text style={[styles.infoText, { color: colors.text }]}>
              Ashvin uses advanced AI to provide health insights. Always consult a medical professional for diagnosis and treatment.
            </Text>
          </Card>
        </View>
      </ScrollView>
      <CustomNavBar navigation={navigation} activeTab="Scan" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerIcon: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textLight,
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: "center",
    opacity: 0.95,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  scanOptionsContainer: {
    marginBottom: 24,
  },
  scanOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  optionDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
  },
  infoCard: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
})

export default ScanSelectionScreen
