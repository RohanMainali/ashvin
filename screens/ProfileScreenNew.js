"use client"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useFocusEffect, useTheme } from "@react-navigation/native"
import { useState } from "react"
import { Alert, Image, Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View, StatusBar } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Colors } from "../constants/colors"
import { mockBadges } from "../constants/mockData"
import { getProfile } from "../utils/api"

const ProfileScreen = ({ isDarkMode, toggleTheme, navigation, setLoggedIn }) => {
  const { colors } = useTheme()
  const [userName, setUserName] = useState("Animus User")
  const [userEmail, setUserEmail] = useState("user@example.com")
  const [scanStreak, setScanStreak] = useState(0)
  const [totalScans, setTotalScans] = useState(0)
  const [scanGoalProgress, setScanGoalProgress] = useState(0)
  const [scanGoalTarget, setScanGoalTarget] = useState(0)

  useFocusEffect(() => {
    const loadProfile = async () => {
      try {
        const storedName = await AsyncStorage.getItem("userName")
        const storedEmail = await AsyncStorage.getItem("userEmail")
        const streak = await AsyncStorage.getItem("scanStreak")
        const total = await AsyncStorage.getItem("totalScans")
        const goalProgress = await AsyncStorage.getItem("scanGoalProgress")
        const goalTarget = await AsyncStorage.getItem("scanGoalTarget")

        if (storedName) setUserName(storedName)
        if (storedEmail) setUserEmail(storedEmail)
        if (streak) setScanStreak(parseInt(streak))
        if (total) setTotalScans(parseInt(total))
        if (goalProgress) setScanGoalProgress(parseInt(goalProgress))
        if (goalTarget) setScanGoalTarget(parseInt(goalTarget))
      } catch (error) {
        console.error("Error loading profile:", error)
      }
    }
    loadProfile()
  })

  const handleSetGoal = () => {
    navigation.navigate("SetGoal")
  }

  const handleLogout = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          onPress: async () => {
            await AsyncStorage.setItem("loggedIn", "false")
            await AsyncStorage.removeItem("userName")
            await AsyncStorage.removeItem("userEmail")
            await AsyncStorage.removeItem("history")
            await AsyncStorage.removeItem("userReminders")
            await AsyncStorage.removeItem("userGoals")
            await AsyncStorage.removeItem("aiFeedback")
            await AsyncStorage.removeItem("scanStreak")
            await AsyncStorage.removeItem("totalScans")
            await AsyncStorage.removeItem("lastScanDate")
            setLoggedIn(false)
          },
          style: "destructive",
        },
      ],
      { cancelable: true },
    )
  }

  const handleExportData = async () => {
    try {
      const historyData = await AsyncStorage.getItem("history")
      const reminders = await AsyncStorage.getItem("userReminders")
      const goals = await AsyncStorage.getItem("userGoals")
      const feedback = await AsyncStorage.getItem("aiFeedback")
      const streak = await AsyncStorage.getItem("scanStreak")
      const totalScansExport = await AsyncStorage.getItem("totalScans")

      const dataToExport = {
        profile: { name: userName, email: userEmail },
        healthHistory: historyData ? JSON.parse(historyData) : [],
        reminders: reminders ? JSON.parse(reminders) : [],
        goals: goals ? JSON.parse(goals) : [],
        aiFeedback: feedback ? JSON.parse(feedback) : [],
        scanMetrics: {
          streak: Number.parseInt(streak || "0"),
          totalScans: Number.parseInt(totalScansExport || "0"),
        },
      }

      Alert.alert(
        "Export Data",
        "Your data has been prepared for export. In a real app, this would be saved to a file or sent via email.",
        [{ text: "OK" }]
      )
    } catch (error) {
      Alert.alert("Export Error", "Failed to export data. Please try again.")
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
          <TouchableOpacity 
            style={styles.settingsIcon}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Info Card */}
        <LinearGradient
          colors={isDarkMode ? ['#2a2a2a', '#1f1f1f'] : ['#ffffff', '#f5f7fa']}
          style={[styles.modernCard]}
        >
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: "https://via.placeholder.com/120" }}
                style={styles.profileAvatar}
              />
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                style={styles.avatarBorder}
              />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>{userName}</Text>
              <Text style={[styles.profileEmail, { color: colors.text }]}>{userEmail}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: Colors.primary }]}>{totalScans}</Text>
                  <Text style={[styles.statLabel, { color: colors.text }]}>Total Scans</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: Colors.accentGreen }]}>{scanStreak}</Text>
                  <Text style={[styles.statLabel, { color: colors.text }]}>Day Streak</Text>
                </View>
              </View>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="person-outline" size={18} color={Colors.textLight} />
              <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>

        {/* Settings Card */}
        <LinearGradient
          colors={isDarkMode ? ['#2a2a2a', '#1f1f1f'] : ['#ffffff', '#f5f7fa']}
          style={[styles.modernCard]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="settings-outline" size={24} color={Colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>App Settings</Text>
          </View>
          
          <View style={styles.settingsContainer}>
            <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.border }]}>
              <View style={styles.settingLeft}>
                <Ionicons name="moon-outline" size={22} color={Colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>Dark Mode</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: Colors.borderColorLight, true: Colors.primary }}
                thumbColor={Colors.textLight}
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingItem, { borderBottomColor: colors.border }]}
              onPress={() => navigation.navigate("Reminders")}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="alarm-outline" size={22} color={Colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>Reminders</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text} opacity={0.6} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingItem, { borderBottomColor: colors.border }]}
              onPress={() => navigation.navigate("HealthInsights")}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="analytics-outline" size={22} color={Colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>Health Insights</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text} opacity={0.6} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingItem, { borderBottomColor: colors.border }]}
              onPress={handleExportData}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="download-outline" size={22} color={Colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>Export Data</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text} opacity={0.6} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingItem, { borderBottomColor: colors.border }]}
              onPress={() => navigation.navigate("PrivacyPolicy")}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="shield-outline" size={22} color={Colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>Privacy Policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text} opacity={0.6} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingItem, { borderBottomColor: 'transparent' }]}
              onPress={() => navigation.navigate("Support")}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="help-circle-outline" size={22} color={Colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text} opacity={0.6} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Achievement Card */}
        <LinearGradient
          colors={isDarkMode ? ['#2a2a2a', '#1f1f1f'] : ['#ffffff', '#f5f7fa']}
          style={[styles.modernCard]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="trophy-outline" size={24} color={Colors.accentGreen} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Your Achievements</Text>
          </View>

          <View style={styles.achievementContent}>
            {/* Goal Progress */}
            {scanGoalTarget > 0 && (
              <View style={styles.goalSection}>
                <Text style={[styles.goalTitle, { color: colors.text }]}>Scan Goal Progress</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <LinearGradient
                      colors={[Colors.accentGreen, '#4ade80']}
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(100, (scanGoalProgress / scanGoalTarget) * 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressText, { color: colors.text }]}>
                    {scanGoalProgress}/{scanGoalTarget} scans
                  </Text>
                </View>
                {scanGoalProgress >= scanGoalTarget && (
                  <View style={styles.achievedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.accentGreen} />
                    <Text style={[styles.achievedText, { color: Colors.accentGreen }]}>Goal Achieved!</Text>
                  </View>
                )}
              </View>
            )}

            {/* Badges */}
            <View style={styles.badgesSection}>
              <Text style={[styles.badgesTitle, { color: colors.text }]}>Earned Badges</Text>
              <View style={styles.badgesGrid}>
                {mockBadges.map((badge) => (
                  <View key={badge.id} style={styles.badgeCard}>
                    <View style={[styles.badgeIcon, { backgroundColor: badge.color + '20' }]}>
                      <Ionicons name={badge.icon} size={32} color={badge.color} />
                    </View>
                    <Text style={[styles.badgeName, { color: colors.text }]}>{badge.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.goalButton}
              onPress={handleSetGoal}
            >
              <LinearGradient
                colors={[Colors.accentGreen, '#4ade80']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="target-outline" size={20} color={Colors.textLight} />
                <Text style={styles.goalButtonText}>Set New Goal</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutContainer}
          onPress={handleLogout}
        >
          <LinearGradient
            colors={[Colors.accentRed, '#ef4444']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.textLight} />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </LinearGradient>
        </TouchableOpacity>
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
    fontSize: 28,
    fontWeight: 'bold',
  },
  settingsIcon: {
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
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarBorder: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 64,
    zIndex: -1,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  editProfileButton: {
    alignSelf: 'center',
    borderRadius: 25,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  editProfileButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  settingsContainer: {
    marginTop: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  achievementContent: {
    marginTop: 10,
  },
  goalSection: {
    marginBottom: 24,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  achievedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  achievedText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  badgesSection: {
    marginBottom: 24,
  },
  badgesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  badgeCard: {
    alignItems: 'center',
    width: '30%',
    marginBottom: 16,
  },
  badgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  goalButton: {
    alignSelf: 'center',
    borderRadius: 25,
    overflow: 'hidden',
  },
  goalButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  logoutContainer: {
    alignSelf: 'center',
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 10,
  },
  logoutButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
})

export default ProfileScreen
