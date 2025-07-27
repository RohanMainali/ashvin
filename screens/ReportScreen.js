"use client"

import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useTheme } from "@react-navigation/native"
import { useEffect, useState } from "react"
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View, StatusBar } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Colors } from "../constants/colors"
import { createHealthReport, createMedicalHistory, getHealthReports, getRecommendations } from "../utils/api"

const ReportScreen = ({ route, navigation }) => {
  const { result } = route.params
  const { colors } = useTheme()
  const [healthReports, setHealthReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [recommendationData, setRecommendationData] = useState(null)
  const [recLoading, setRecLoading] = useState(false)
  const [recError, setRecError] = useState(null)
  const [userName, setUserName] = useState("Ashvin User")
  const [userEmail, setUserEmail] = useState("user@example.com")

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true)
      const token = await AsyncStorage.getItem("token")
      const response = await getHealthReports(token)
      if (Array.isArray(response)) {
        setHealthReports(response)
      } else {
        setHealthReports([])
      }
      setLoading(false)
    }
    fetchReports()
  }, [])

  // Fetch user data from AsyncStorage
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log("Fetching user data from AsyncStorage...") // Debug log
        const storedUserName = await AsyncStorage.getItem("userName")
        const storedUserEmail = await AsyncStorage.getItem("userEmail")
        
        console.log("Retrieved userName:", storedUserName) // Debug log
        console.log("Retrieved userEmail:", storedUserEmail) // Debug log
        
        if (storedUserName) {
          setUserName(storedUserName)
        }
        if (storedUserEmail) {
          setUserEmail(storedUserEmail)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }
    fetchUserData()
  }, [])

  // Save the medical report to the database (HealthReport) only if not already saved
  useEffect(() => {
    const saveReport = async () => {
      const token = await AsyncStorage.getItem("token")
      // Check if already exists in DB
      const existing = healthReports.find(r => r.id === result.id || r._id === result.id)
      if (!existing && scanType && scanData && result && result.id) {
        const reportString = JSON.stringify({
          scanType,
          scanData,
          llmResponse,
          summary,
          explanation,
          scan_details,
          insights,
          topConditions,
          confidence,
          suggestions,
          date: result.date,
          id: result.id
        })
        await createHealthReport(token, {
          reportType: scanType,
          result: reportString,
          doctorFeedback: '',
          date: result.date
        })
      }
    }
    saveReport()
  }, [scanType, scanData, result, healthReports])

  // Fetch recommendations and urgency after report loads, only if not already present
  useEffect(() => {
    const fetchRecommendations = async () => {
      setRecLoading(true)
      setRecError(null)
      try {
        // Only fetch if not already present
        if (!recommendationData) {
          const token = await AsyncStorage.getItem("token")
          const userId = await AsyncStorage.getItem("userId")
          const recPayload = {
            analysis: summary || analysis || explanation || '',
            userId: userId,
            scanType,
            scanData,
            vitalsId: result.id || undefined,
          }
          const recRes = await getRecommendations(token, recPayload)
          setRecommendationData(recRes)
          // Save to medical history if flagged, using all available fields
          if (recRes && recRes.isMedicalCondition === 1) {
            const historyPayload = {
              condition: recRes.condition || summary || analysis || scanType,
              description: recRes.recommendations || recRes.insights || explanation || '',
              dateDiagnosed: result.date || new Date().toISOString(),
              isActive: true,
              referenceId: result.id || undefined
            }
            await createMedicalHistory(token, historyPayload)
          }
        }
      } catch (err) {
        setRecError('Failed to fetch recommendations')
      } finally {
        setRecLoading(false)
      }
    }
    if (!recommendationData && (summary || analysis || explanation) && scanType && scanData) {
      fetchRecommendations()
    }
  }, [summary, analysis, explanation, scanType, scanData, result, recommendationData])

  // Use the passed result for display, but prefer the latest from healthReports if available
  let reportData = result
  if (Array.isArray(healthReports) && healthReports.length > 0) {
    // Try to find a matching report by id
    const found = healthReports.find(r => r.id === result.id)
    if (found) reportData = found
  }
  const { scanType, scanData, llmResponse = {} } = reportData
  // Show all fields, defaulting to empty if missing
  const { summary, topConditions = [], suggestions, confidence, explanation, analysis, scan_details, insights } = llmResponse

  const getScanTypeName = (type) => {
    switch (type) {
      case "cardiac":
        return "Cardiac Scan"
      case "skin":
        return "Skin Scan"
      case "eye":
        return "Eye Scan"
      case "vitals":
        return "Vitals Monitor"
      case "symptom":
        return "Symptom Check"
      default:
        return "Health Analysis"
    }
  }

  const getScanDataDisplay = () => {
    if (scanType === "cardiac") {
      return `Diagnosis: ${scanData.diagnosis}\nConfidence: ${Math.round(scanData.confidence * 100)}%`
    } else if (scanType === "skin" || scanType === "eye") {
      return `Diagnosis: ${scanData.diagnosis}\nConfidence: ${Math.round(scanData.confidence * 100)}%`
    } else if (scanType === "vitals") {
      return Object.entries(scanData)
        .filter(([key]) => key !== "diagnosis" && key !== "confidence")
        .map(([key, value]) => `${key.replace(/([A-Z])/g, " $1").trim()}: ${value}`)
        .join("\n")
    } else if (scanType === "symptom") {
      return `Symptoms Reported: "${scanData.symptoms}"\nConfidence: ${Math.round(scanData.confidence * 100)}%`
    }
    return "N/A"
  }

  const handleDownloadPDF = async () => {
    console.log("Attempting to fetch user data for PDF...") // Debug log
    console.log("Using state values - userName:", userName) // Debug log
    console.log("Using state values - userEmail:", userEmail) // Debug log

    const pdfContent = `
      MEDICAL REPORT - Ashvin Health Monitor
      Generated: ${new Date().toLocaleString()}

      PATIENT INFORMATION
      Name: ${userName}
      Email: ${userEmail}

      SCAN DETAILS
      Scan Type: ${getScanTypeName(scanType)}
      Date of Scan: ${result.date}
      Scan ID: ${result.id}

      RAW SCAN DATA
      ${getScanDataDisplay()}

      AI ANALYSIS FINDINGS
      Summary:
      ${summary || analysis || ''}

      Scan Details:
      ${scan_details || ''}

      Insights:
      ${insights || suggestions || ''}

      Top Possible Conditions:
      ${topConditions.map((c) => `- ${c}`).join("\n")}

      AI Confidence: ${Math.round((confidence || 0) * 100)}%

      RECOMMENDATIONS / NEXT STEPS
      ${suggestions}

      ---
      Disclaimer: This report is generated by an AI-powered health monitoring system and is for informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
    `

    // In a real React Native app, you would use libraries like 'expo-print' and 'expo-sharing'
    // For a web preview, we'll create a blob and trigger a download.
    const blob = new Blob([pdfContent], { type: "text/plain" }) // Mock as plain text, not actual PDF
    const url = URL.createObjectURL(blob)

    Alert.alert(
      "Download Report",
      "This will download a mock text file as a PDF. In a real app, a formatted PDF would be generated.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Download",
          onPress: async () => {
            if (await Linking.canOpenURL(url)) {
              Linking.openURL(url)
              Alert.alert("Download Started", "Your medical report download has begun!")
            } else {
              Alert.alert("Download Failed", "Could not initiate download. Please try again.")
            }
          },
        },
      ],
      { cancelable: true },
    )
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
          
          <Text style={styles.headerTitle}>Medical Report</Text>
          
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleDownloadPDF}
          >
            <Ionicons name="download-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollContent}>
          
          {/* Report Header Card */}
          <Card>
            <View style={styles.reportHeader}>
              <View style={styles.reportIconContainer}>
                <Ionicons name="document-text-outline" size={40} color={Colors.primary} />
              </View>
              <Text style={[styles.reportTitle, { color: colors.text }]}>Health Analysis Report</Text>
              <Text style={[styles.reportSubtitle, { color: colors.text }]}>
                Generated on {new Date().toLocaleDateString()}
              </Text>
              <View style={styles.reportIdBadge}>
                <Text style={styles.reportIdText}>ID: {result.id}</Text>
              </View>
            </View>
          </Card>

          {/* Patient Information Card */}
          <Card>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={24} color={Colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Patient Information</Text>
            </View>
            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <Ionicons name="person-circle-outline" size={20} color={Colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.text }]}>Name</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{userName}</Text>
                </View>
              </View>
              <View style={styles.infoCard}>
                <Ionicons name="mail-outline" size={20} color={Colors.secondary} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.text }]}>Email</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{userEmail}</Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Scan Details Card */}
          <Card>
            <View style={styles.sectionHeader}>
              <Ionicons name="medical-outline" size={24} color={Colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Scan Information</Text>
            </View>
            <View style={styles.scanDetailsGrid}>
              <View style={styles.scanDetailCard}>
                <Ionicons name="scan-outline" size={24} color={Colors.primary} />
                <Text style={[styles.scanDetailLabel, { color: colors.text }]}>Scan Type</Text>
                <Text style={[styles.scanDetailValue, { color: colors.text }]}>{getScanTypeName(scanType)}</Text>
              </View>
              <View style={styles.scanDetailCard}>
                <Ionicons name="calendar-outline" size={24} color={Colors.secondary} />
                <Text style={[styles.scanDetailLabel, { color: colors.text }]}>Date</Text>
                <Text style={[styles.scanDetailValue, { color: colors.text }]}>
                  {new Date(result.date).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.scanDetailCard}>
                <Ionicons name="analytics-outline" size={24} color={Colors.accentGreen} />
                <Text style={[styles.scanDetailLabel, { color: colors.text }]}>Confidence</Text>
                <Text style={[styles.scanDetailValue, { color: colors.text }]}>
                  {Math.round((confidence || 0) * 100)}%
                </Text>
              </View>
            </View>
            
            <View style={styles.rawDataSection}>
              <Text style={[styles.rawDataTitle, { color: colors.text }]}>Raw Scan Data</Text>
              <View style={styles.rawDataContainer}>
                <Text style={[styles.rawDataText, { color: colors.text }]}>{getScanDataDisplay()}</Text>
              </View>
            </View>
          </Card>

          {/* AI Analysis Card */}
          <Card>
            <View style={styles.sectionHeader}>
              <Ionicons name="bulb-outline" size={24} color={Colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Analysis Findings</Text>
            </View>
            
            <View style={styles.analysisSection}>
              <View style={styles.analysisItem}>
                <View style={styles.analysisHeader}>
                  <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
                  <Text style={[styles.analysisTitle, { color: colors.text }]}>Summary</Text>
                </View>
                <Text style={[styles.analysisText, { color: colors.text }]}>
                  {summary || analysis || 'No summary available'}
                </Text>
              </View>

              <View style={styles.analysisItem}>
                <View style={styles.analysisHeader}>
                  <Ionicons name="list-outline" size={20} color={Colors.secondary} />
                  <Text style={[styles.analysisTitle, { color: colors.text }]}>Possible Conditions</Text>
                </View>
                <Text style={[styles.analysisText, { color: colors.text }]}>
                  {scan_details || 'No specific conditions identified'}
                </Text>
              </View>

              <View style={styles.analysisItem}>
                <View style={styles.analysisHeader}>
                  <Ionicons name="lightbulb-outline" size={20} color={Colors.accentGreen} />
                  <Text style={[styles.analysisTitle, { color: colors.text }]}>Insights & Recommendations</Text>
                </View>
                <Text style={[styles.analysisText, { color: colors.text }]}>
                  {insights || suggestions || 'No specific insights available'}
                </Text>
              </View>
            </View>
          </Card>

          {/* Recommendations & Urgency Card */}
          <Card>
            <View style={styles.sectionHeader}>
              <Ionicons name="medical-outline" size={24} color={Colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Medical Recommendations</Text>
            </View>
            
            {recLoading ? (
              <View style={styles.loadingContainer}>
                <Ionicons name="sync-outline" size={24} color={Colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>Loading recommendations...</Text>
              </View>
            ) : recError ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={24} color={Colors.accentRed} />
                <Text style={[styles.errorText, { color: Colors.accentRed }]}>{recError}</Text>
              </View>
            ) : recommendationData ? (
              <View style={styles.recommendationsContent}>
                <View style={styles.urgencyCard}>
                  <View style={styles.urgencyHeader}>
                    <Ionicons name="warning-outline" size={20} color={Colors.accentRed} />
                    <Text style={[styles.urgencyLabel, { color: colors.text }]}>Urgency Level</Text>
                  </View>
                  <View style={[
                    styles.urgencyBadge,
                    {
                      backgroundColor: recommendationData.urgency === 'High' ? Colors.accentRed :
                                     recommendationData.urgency === 'Medium' ? Colors.secondary :
                                     Colors.accentGreen
                    }
                  ]}>
                    <Text style={styles.urgencyText}>
                      {recommendationData.urgency || 'Low'}
                    </Text>
                  </View>
                </View>

                <View style={styles.recommendationsText}>
                  <Text style={[styles.recommendationsTitle, { color: colors.text }]}>
                    Professional Recommendations
                  </Text>
                  <Text style={[styles.recommendationsContent, { color: colors.text }]}>
                    {recommendationData.recommendations || recommendationData.insights || 'No specific recommendations available'}
                  </Text>
                </View>

                {recommendationData.isMedicalCondition === 1 && (
                  <View style={styles.medicalHistoryNotice}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={Colors.accentGreen} />
                    <Text style={[styles.medicalHistoryText, { color: Colors.accentGreen }]}>
                      This result has been saved to your medical history
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="information-circle-outline" size={24} color={colors.text} />
                <Text style={[styles.noDataText, { color: colors.text }]}>
                  No recommendations available for this scan
                </Text>
              </View>
            )}
          </Card>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={handleDownloadPDF}
              accessibilityLabel="Download Medical Report as PDF"
            >
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="download-outline" size={24} color={Colors.textLight} />
                <Text style={styles.actionButtonText}>Download PDF Report</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionButton}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Go back to results"
            >
              <LinearGradient
                colors={[Colors.accentGreen, '#4CAF50']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="arrow-back" size={24} color={Colors.textLight} />
                <Text style={styles.actionButtonText}>Back to Results</Text>
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
  reportHeader: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  reportIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(109, 40, 217, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  reportTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  reportSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 16,
  },
  reportIdBadge: {
    backgroundColor: 'rgba(109, 40, 217, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  reportIdText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(109, 40, 217, 0.05)',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scanDetailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  scanDetailCard: {
    width: '31%',
    alignItems: 'center',
    backgroundColor: 'rgba(109, 40, 217, 0.05)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  scanDetailLabel: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  scanDetailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rawDataSection: {
    marginTop: 8,
  },
  rawDataTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  rawDataContainer: {
    backgroundColor: 'rgba(109, 40, 217, 0.05)',
    padding: 16,
    borderRadius: 12,
  },
  rawDataText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  analysisSection: {
    marginTop: 8,
  },
  analysisItem: {
    marginBottom: 20,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  analysisText: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.85,
    paddingLeft: 32,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    marginLeft: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 16,
    marginLeft: 12,
  },
  recommendationsContent: {
    marginTop: 8,
  },
  urgencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(109, 40, 217, 0.05)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  urgencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urgencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  urgencyBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 80,
  },
  urgencyText: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: 'bold',
  },
  recommendationsText: {
    marginBottom: 20,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  recommendationsContent: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.85,
  },
  medicalHistoryNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 16,
    borderRadius: 12,
  },
  medicalHistoryText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  noDataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  noDataText: {
    fontSize: 16,
    marginLeft: 12,
    opacity: 0.7,
  },
  actionButtonsContainer: {
    marginTop: 8,
  },
  primaryActionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  secondaryActionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
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
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  actionButtonText: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
})

export default ReportScreen
