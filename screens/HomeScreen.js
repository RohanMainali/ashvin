"use client"
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useTheme } from "@react-navigation/native"; // Import useFocusEffect
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Dimensions, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import CustomNavBar from "../components/CustomNavBar";
import { Colors } from "../constants/colors";
import { funFacts, mockBadges } from "../constants/mockData";

const { width } = Dimensions.get("window")

const HomeScreen = ({ navigation }) => {
  const { colors } = useTheme()
  const currentFunFact = funFacts[Math.floor(Math.random() * funFacts.length)]
  const [activeReminders, setActiveReminders] = useState([])
  const [latestScanSummary, setLatestScanSummary] = useState(null)
  const [latestMedicalReport, setLatestMedicalReport] = useState(null)

  const loadReminders = async () => {
    try {
      const storedReminders = await AsyncStorage.getItem("userReminders")
      if (storedReminders) {
        const parsedReminders = JSON.parse(storedReminders)
        const active = parsedReminders.filter((r) => r.enabled)
        setActiveReminders(active)
      }
    } catch (e) {
      console.error("Failed to load reminders for home screen:", e)
    }
  }

  const loadLatestScanSummary = async () => {
    try {
      const storedHistory = await AsyncStorage.getItem("history") // Now `history` holds all scan types
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory)
        // Find the latest medical_report entry
        const latestReport = parsedHistory.find(entry => entry.scanType === 'medical_report' && entry.llmResponse)
        setLatestMedicalReport(latestReport || null)
        // Fallback for latest scan summary (any scan)
        if (
          parsedHistory.length > 0 &&
          parsedHistory[0] &&
          parsedHistory[0].llmResponse &&
          typeof parsedHistory[0].llmResponse.summary !== 'undefined'
        ) {
          setLatestScanSummary(parsedHistory[0].llmResponse.summary)
        } else {
          setLatestScanSummary("")
        }
      }
    } catch (e) {
      console.error("Failed to load latest scan summary:", e)
    }
  }

  useFocusEffect(
    // useCallback is important to prevent infinite loops
    // if dependencies are objects/arrays that change on every render
    // For simple functions like loadProfileData, it's good practice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    () => {
      loadReminders()
      loadLatestScanSummary()
    },
  )

  const Card = ({ children, style }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderColorLight }, style]}>
      {children}
    </View>
  )

  const renderReminderBubble = ({ item }) => (
    <TouchableOpacity
      style={[styles.reminderBubble, { backgroundColor: Colors.primary + "15", borderColor: Colors.primary }]}
      onPress={() => navigation.navigate("Reminders")}
      accessibilityLabel={`Reminder: ${item.name}`}
    >
      <Ionicons name="alarm-outline" size={24} color={Colors.primary} />
      <Text style={[styles.reminderBubbleText, { color: colors.text }]}>{item.name}</Text>
    </TouchableOpacity>
  )

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: 100 }} // Add padding for navbar
      >
        <LinearGradient colors={[Colors.primary, Colors.gradientEnd]} style={styles.heroSection}>
          <Image
            source={{ uri: "/placeholder.svg?height=100&width=100" }}
            style={styles.heroIcon}
            accessibilityLabel="Abstract health monitor icon"
          />
          <Text style={styles.heroTitle}>Welcome to Ashvin</Text>
          <Text style={styles.heroSubtitle}>Your personal AI-powered health companion.</Text>
          {latestScanSummary && (
            <View style={styles.latestSummaryContainer}>
              <Ionicons name="sparkles" size={20} color={Colors.textLight} />
              <Text style={styles.latestSummaryText}>Latest AI Insight: {latestScanSummary}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.heroButton}
            onPress={() => navigation.navigate("Scan")} // Navigate to ScanSelectionScreen
            accessibilityLabel="Start a new health scan"
          >
            <Ionicons name="scan-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.heroButtonText}>Start New Scan</Text>
          </TouchableOpacity>
        </LinearGradient>

      <View style={styles.contentContainer}>
        {activeReminders.length > 0 && (
          <View style={styles.remindersSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Reminders</Text>
            <FlatList
              data={activeReminders}
              renderItem={renderReminderBubble}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.remindersList}
            />
            <TouchableOpacity
              style={styles.viewAllRemindersButton}
              onPress={() => navigation.navigate("Reminders")}
              accessibilityLabel="View all reminders"
            >
              <Text style={[styles.viewAllRemindersText, { color: Colors.primary }]}>View All Reminders</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.primary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ marginBottom: 24 }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Scans</Text>
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={() => navigation.navigate("CardiacScan")}
              accessibilityLabel="Perform cardiac scan"
            >
              <Ionicons name="heart" size={28} color={Colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Cardiac Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={() => navigation.navigate("SkinScanner")}
              accessibilityLabel="Scan skin"
            >
              <Ionicons name="body" size={28} color={Colors.secondary} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Skin Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={() => navigation.navigate("EyeScanner")}
              accessibilityLabel="Scan eyes"
            >
              <Ionicons name="eye" size={28} color={Colors.accentGreen} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Eye Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={() => navigation.navigate("VitalsMonitor")}
              accessibilityLabel="Monitor vitals"
            >
              <Ionicons name="thermometer" size={28} color={Colors.accentRed} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Vitals Monitor</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={() => navigation.navigate("SymptomInput")}
              accessibilityLabel="Check symptoms"
            >
              <Ionicons name="chatbox-ellipses" size={28} color={Colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Symptom Checker</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={() => navigation.navigate("MedicalReportScan")}
              accessibilityLabel="Analyze medical report"
            >
              <Ionicons name="document-text-outline" size={28} color={Colors.secondary} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Medical Report</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Achievements</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesScroll}>
            {mockBadges.map((badge) => (
              <Card key={badge.id} style={styles.badgeCard}>
                <Ionicons name={badge.icon} size={36} color={badge.color} />
                <Text style={[styles.badgeName, { color: colors.text }]}>{badge.name}</Text>
                <Text style={[styles.badgeDescription, { color: colors.text }]}>{badge.description}</Text>
              </Card>
            ))}
          </ScrollView>
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Breathing & Wellness</Text>
          <Card style={styles.wellnessCard}>
            <View style={styles.wellnessIconContainer}>
              <Ionicons name="leaf-outline" size={48} color={Colors.primary} />
            </View>
            <Text style={[styles.wellnessText, { color: colors.text }]}>
              Engage in guided breathing exercises synced with calming visuals to reduce stress and improve focus.
            </Text>
            <TouchableOpacity
              style={[styles.wellnessButton, { backgroundColor: Colors.primary }]}
              onPress={() => navigation.navigate("Breathing")}
              accessibilityLabel="Start Breathing Mode"
            >
              <Text style={styles.wellnessButtonText}>Start Breathing Mode</Text>
            </TouchableOpacity>
          </Card>
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Health Fact</Text>
          <Card style={styles.factCard}>
            <Ionicons name="bulb-outline" size={22} color={Colors.primary} style={styles.factIcon} />
            <Text style={[styles.factText, { color: colors.text }]}>{currentFunFact}</Text>
          </Card>
        </View>

        <View style={{ marginBottom: 8 }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Explore Ashvin</Text>
          <View style={styles.exploreButtonsContainer}>
            <TouchableOpacity
              style={[styles.exploreButton, { backgroundColor: colors.card }]}
              onPress={() => navigation.navigate("HealthInsights")}
              accessibilityLabel="Explore insights"
            >
              <Ionicons name="book-outline" size={20} color={Colors.primary} />
              <Text style={[styles.exploreButtonText, { color: colors.text }]}>Insights</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exploreButton, { backgroundColor: colors.card }]}
              onPress={() => navigation.navigate("Reminders")}
              accessibilityLabel="Set reminders"
            >
              <Ionicons name="alarm-outline" size={20} color={Colors.secondary} />
              <Text style={[styles.exploreButtonText, { color: colors.text }]}>Reminders</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exploreButton, { backgroundColor: colors.card }]}
              onPress={() => navigation.navigate("Support")}
              accessibilityLabel="Get support"
            >
              <Ionicons name="help-circle-outline" size={20} color={Colors.accentGreen} />
              <Text style={[styles.exploreButtonText, { color: colors.text }]}>Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      </ScrollView>
      <CustomNavBar navigation={navigation} activeTab="Home" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
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
  heroIcon: {
    width: 72,
    height: 72,
    marginBottom: 16,
    tintColor: Colors.textLight,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.textLight,
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: "center",
    opacity: 0.95,
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  latestSummaryContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.textLight + "20",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    maxWidth: "100%",
    marginHorizontal: 8,
  },
  latestSummaryText: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  heroButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.textLight,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  heroButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    marginTop: 8,
    letterSpacing: -0.3,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
  },
  remindersSection: {
    marginBottom: 24,
  },
  remindersList: {
    paddingVertical: 4,
  },
  reminderBubble: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  reminderBubbleText: {
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 8,
  },
  viewAllRemindersButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  viewAllRemindersText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    width: "48%",
    minHeight: 120,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderColorLight,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 18,
  },
  badgesScroll: {
    paddingRight: 8,
  },
  badgeCard: {
    width: width * 0.35,
    marginRight: 16,
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
    justifyContent: "center",
    minHeight: 140,
  },
  badgeName: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 12,
    textAlign: "center",
    lineHeight: 20,
  },
  badgeDescription: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    opacity: 0.7,
    lineHeight: 16,
  },
  wellnessCard: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  wellnessIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  wellnessImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginBottom: 20,
    resizeMode: "cover",
  },
  wellnessText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
    opacity: 0.85,
    paddingHorizontal: 8,
  },
  wellnessButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  wellnessButtonText: {
    color: Colors.textLight,
    fontSize: 15,
    fontWeight: "600",
  },
  factCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  factIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  factText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontStyle: "italic",
    opacity: 0.85,
  },
  exploreButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  exploreButton: {
    width: "31%",
    minHeight: 90,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderColorLight,
  },
  exploreButtonText: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
    lineHeight: 14,
  },
})

export default HomeScreen
