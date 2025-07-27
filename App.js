"use client"

import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useEffect, useState } from "react"
import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from "react-native"

// Screens
import BreathingScreen from "./screens/BreathingScreen"
import CardiacScanScreen from "./screens/CardiacScanScreen"; // Renamed from RecordScreen
import ChatScreen from "./screens/ChatScreen"
import CompareScreen from "./screens/CompareScreen"
import EditProfileScreen from "./screens/EditProfileScreen"
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen"
import HealthInsightsScreen from "./screens/HealthInsightsScreen"
import HomeScreen from "./screens/HomeScreen"
import LoginScreen from "./screens/LoginScreen"
import MedicalHistoryScreen from "./screens/MedicalHistoryScreen"; // Renamed from HistoryScreen
import OnboardingScreen from "./screens/OnboardingScreen"
import PrivacyPolicyScreen from "./screens/PrivacyPolicyScreen"
import ProfileScreen from "./screens/ProfileScreen"
import RemindersScreen from "./screens/RemindersScreen"
import ResultsScreen from "./screens/ResultsScreen"
import ScanSelectionScreen from "./screens/ScanSelectionScreen"; // New screen for selecting scan types
import SetGoalScreen from "./screens/SetGoalScreen"
import SignUpScreen from "./screens/SignUpScreen"
import SupportScreen from "./screens/SupportScreen"
// New Scan Screens
import EyeScannerScreen from "./screens/EyeScannerScreen"
import SkinScannerScreen from "./screens/SkinScannerScreen"
import SymptomInputScreen from "./screens/SymptomInputScreen"
import VitalsMonitorScreen from "./screens/VitalsMonitorScreen"
// New Feature Screens
import DoctorRecommendationScreen from "./screens/DoctorRecommendationScreen"; // New for doctor matching
import ReportScreen from "./screens/ReportScreen"; // New for medical reports
import MedicalReportScanScreen from "./screens/MedicalReportScanScreen";
// Constants
import { Colors } from "./constants/colors"

const Stack = createNativeStackNavigator()

// Wrapper components
const CardiacScanWrapper = (props) => (
  <CardiacScanScreen {...props} addHistoryEntry={props.addHistoryEntry} isDarkMode={props.isDarkMode} />
)
const ScanSelectionWrapper = (props) => (
  <ScanSelectionScreen {...props} addHistoryEntry={props.addHistoryEntry} isDarkMode={props.isDarkMode} />
)
const MedicalHistoryWrapper = (props) => (
  <MedicalHistoryScreen {...props} history={props.history} isDarkMode={props.isDarkMode} />
) // Renamed wrapper
const ProfileWrapper = (props) => (
  <ProfileScreen
    {...props}
    isDarkMode={props.isDarkMode}
    toggleTheme={props.toggleTheme}
    setLoggedIn={props.setLoggedIn}
  />
)
const ResultsWrapper = (props) => (
  <ResultsScreen {...props} addHistoryEntry={props.addHistoryEntry} isDarkMode={props.isDarkMode} />
)

function MainAppStack({ isDarkMode, toggleTheme, history, addHistoryEntry, setLoggedIn }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home">
        {(props) => (
          <HomeScreen 
            {...props} 
            isDarkMode={isDarkMode}
            history={history}
            addHistoryEntry={addHistoryEntry}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Scan">
        {(props) => <ScanSelectionWrapper {...props} addHistoryEntry={addHistoryEntry} isDarkMode={isDarkMode} />}
      </Stack.Screen>
      <Stack.Screen name="MedicalHistory">
        {(props) => <MedicalHistoryWrapper {...props} history={history} isDarkMode={isDarkMode} />}
      </Stack.Screen>
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Profile">
        {(props) => (
          <ProfileWrapper {...props} isDarkMode={isDarkMode} toggleTheme={toggleTheme} setLoggedIn={setLoggedIn} />
        )}
      </Stack.Screen>
      {/* Additional screens */}
      <Stack.Screen name="Results">
        {(props) => <ResultsWrapper {...props} addHistoryEntry={addHistoryEntry} isDarkMode={isDarkMode} />}
      </Stack.Screen>
      <Stack.Screen name="HealthInsights" component={HealthInsightsScreen} />
      <Stack.Screen name="Reminders" component={RemindersScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="Breathing" component={BreathingScreen} />
      <Stack.Screen name="Compare" component={CompareScreen} />
      <Stack.Screen name="Report" component={ReportScreen} />
      <Stack.Screen name="DoctorRecommendation" component={DoctorRecommendationScreen} />
      <Stack.Screen name="CardiacScan">
        {(props) => <CardiacScanWrapper {...props} addHistoryEntry={addHistoryEntry} isDarkMode={isDarkMode} />}
      </Stack.Screen>
      <Stack.Screen name="SkinScanner">
        {(props) => <SkinScannerScreen {...props} addHistoryEntry={addHistoryEntry} />}
      </Stack.Screen>
      <Stack.Screen name="EyeScanner" component={EyeScannerScreen} />
      <Stack.Screen name="VitalsMonitor" component={VitalsMonitorScreen} />
      <Stack.Screen name="SymptomInput" component={SymptomInputScreen} />
      <Stack.Screen name="MedicalReportScan" component={MedicalReportScanScreen} />
    </Stack.Navigator>
  )
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [history, setHistory] = useState([])
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const theme = await AsyncStorage.getItem("theme")
        if (theme) setIsDarkMode(theme === "dark")
        const hist = await AsyncStorage.getItem("history")
        if (hist) setHistory(JSON.parse(hist))
        // Always force onboarding to show on app restart
        setOnboardingCompleted(false)
        setLoggedIn(false)
        await AsyncStorage.removeItem("onboarding")
        await AsyncStorage.removeItem("loggedIn")
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const theme = isDarkMode ? DarkTheme : DefaultTheme

  const handleOnboardingComplete = async () => {
    setOnboardingCompleted(true)
    await AsyncStorage.setItem("onboarding", "true")
  }

  const addHistoryEntry = async (entry) => {
    const updated = [entry, ...history]
    setHistory(updated)
    await AsyncStorage.setItem("history", JSON.stringify(updated))
  }

  const toggleTheme = async () => {
    const next = !isDarkMode
    setIsDarkMode(next)
    await AsyncStorage.setItem("theme", next ? "dark" : "light")
  }

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: isDarkMode ? Colors.backgroundDark : Colors.backgroundLight },
        ]}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, { color: isDarkMode ? Colors.textLight : Colors.textDark }]}>
          Loading Ashvin...
        </Text>
      </View>
    )
  }

  return (
    <NavigationContainer theme={theme}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!onboardingCompleted && (
          <Stack.Screen name="Onboarding">
            {(props) => <OnboardingScreen {...props} onComplete={handleOnboardingComplete} />}
          </Stack.Screen>
        )}
        {!loggedIn ? (
          <>
            <Stack.Screen name="Login">{(props) => <LoginScreen {...props} setLoggedIn={setLoggedIn} />}</Stack.Screen>
            <Stack.Screen name="SignUp">
              {(props) => <SignUpScreen {...props} setLoggedIn={setLoggedIn} />}
            </Stack.Screen>
            <Stack.Screen name="ForgotPassword">{(props) => <ForgotPasswordScreen {...props} />}</Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen name="MainApp">
              {(props) => (
                <MainAppStack
                  {...props}
                  isDarkMode={isDarkMode}
                  toggleTheme={toggleTheme}
                  history={history}
                  addHistoryEntry={addHistoryEntry}
                  setLoggedIn={setLoggedIn}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Results">
              {(props) => <ResultsWrapper {...props} addHistoryEntry={addHistoryEntry} isDarkMode={isDarkMode} />}
            </Stack.Screen>
          </>
        )}
        {/* Additional stack screens */}
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ headerShown: true, headerTitle: "Edit Profile" }}
        />
        <Stack.Screen
          name="SetGoal"
          component={SetGoalScreen}
          options={{ headerShown: true, headerTitle: "Set Goal" }}
        />
        <Stack.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicyScreen}
          options={{ headerShown: true, headerTitle: "Privacy Policy" }}
        />
        {/* Specific scan screens accessible via ScanSelectionScreen */}
        <Stack.Screen name="CardiacScan" options={{ headerShown: true, headerTitle: "Cardiac Scan" }}>
          {(props) => <CardiacScanWrapper {...props} addHistoryEntry={addHistoryEntry} isDarkMode={isDarkMode} />}
        </Stack.Screen>
        <Stack.Screen
          name="SkinScanner"
          options={{ headerShown: true, headerTitle: "Skin Scanner" }}
        >
          {(props) => <SkinScannerScreen {...props} addHistoryEntry={addHistoryEntry} />}
        </Stack.Screen>
        <Stack.Screen
          name="EyeScanner"
          component={EyeScannerScreen}
          options={{ headerShown: true, headerTitle: "Eye Scanner" }}
        />
        <Stack.Screen
          name="VitalsMonitor"
          component={VitalsMonitorScreen}
          options={{ headerShown: true, headerTitle: "Vitals Monitor" }}
        />
        <Stack.Screen
          name="SymptomInput"
          component={SymptomInputScreen}
          options={{ headerShown: true, headerTitle: "Symptom Checker" }}
        />
        {/* New feature screens */}
        <Stack.Screen
          name="Report"
          component={ReportScreen}
          options={{ headerShown: true, headerTitle: "Medical Report" }}
        />
        <Stack.Screen
          name="MedicalReportScan"
          component={MedicalReportScanScreen}
          options={{ headerShown: true, headerTitle: "Medical Report Scan" }}
        />
        <Stack.Screen
          name="DoctorRecommendation"
          component={DoctorRecommendationScreen}
          options={{ headerShown: true, headerTitle: "Find a Doctor" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
})
