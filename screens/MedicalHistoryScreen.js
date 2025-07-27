"use client"

import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useTheme } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"
import { useEffect, useState } from "react"
import { 
  Dimensions, 
  FlatList, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  RefreshControl
} from "react-native"
import CustomNavBar from "../components/CustomNavBar"
import { Colors } from "../constants/colors"
import { getMedicalHistories } from "../utils/api"
import { getSkinScanReports } from "../utils/skinScanApi"
import { getEyeScanReports } from "../utils/eyeScanApi"
import { getMedicalReportAnalyses } from "../utils/medicalReportApi"

const { width } = Dimensions.get("window")

const MedicalHistoryScreen = ({ navigation, isDarkMode }) => {
  const { colors } = useTheme()
  const [filterScanType, setFilterScanType] = useState("All")
  const [medicalHistory, setMedicalHistory] = useState([])
  const [localHistory, setLocalHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [authStatus, setAuthStatus] = useState(null)

  const onRefresh = async () => {
    setRefreshing(true)
    setError(null)
    try {
      const token = await AsyncStorage.getItem("token")
      const allRecords = []
      
      if (token) {
        // Fetch all analysis reports from different endpoints
        const [
          skinScanResponse,
          eyeScanResponse,
          medicalReportResponse,
          existingMedicalHistory
        ] = await Promise.all([
          getSkinScanReports(token),
          getEyeScanReports(token),
          getMedicalReportAnalyses(token),
          getMedicalHistories(token)
        ])

        // Process skin scan reports
        if (Array.isArray(skinScanResponse)) {
          skinScanResponse.forEach(report => {
            if (report.analysis) {
              allRecords.push({
                _id: report._id,
                type: 'skin_scan',
                short_summary: report.analysis.condition || 'Skin analysis completed',
                condition: report.analysis.condition,
                confidence: report.analysis.confidence,
                analysis: report.analysis,
                createdAt: report.createdAt,
                scanType: 'Skin'
              })
            }
          })
        }

        // Process eye scan reports
        if (Array.isArray(eyeScanResponse)) {
          eyeScanResponse.forEach(report => {
            if (report.analysis) {
              allRecords.push({
                _id: report._id,
                type: 'eye_scan',
                short_summary: report.analysis.condition || 'Eye analysis completed',
                condition: report.analysis.condition,
                confidence: report.analysis.confidence,
                analysis: report.analysis,
                createdAt: report.createdAt,
                scanType: 'Eye'
              })
            }
          })
        }

        // Process medical report analyses
        if (Array.isArray(medicalReportResponse)) {
          medicalReportResponse.forEach(report => {
            if (report.analysis) {
              allRecords.push({
                _id: report._id,
                type: 'medical_report',
                short_summary: report.analysis.summary || 'Medical report analyzed',
                condition: report.analysis.diagnosis,
                confidence: report.analysis.confidence,
                analysis: report.analysis,
                createdAt: report.createdAt,
                scanType: 'Medical Report'
              })
            }
          })
        }

        // Include existing medical history records
        if (Array.isArray(existingMedicalHistory)) {
          existingMedicalHistory.forEach(record => {
            allRecords.push({
              ...record,
              type: 'medical_history'
            })
          })
        }

        // Sort all records by date (newest first)
        allRecords.sort((a, b) => {
          const dateA = new Date(a.createdAt?.$date?.$numberLong || a.createdAt || Date.now())
          const dateB = new Date(b.createdAt?.$date?.$numberLong || b.createdAt || Date.now())
          return dateB - dateA
        })

        setMedicalHistory(allRecords)
      }
    } catch (e) {
      console.error("Failed to refresh analysis data:", e)
      setError("Failed to refresh data. Please check your connection and try again.")
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const token = await AsyncStorage.getItem("token")
        
        if (!token) {
          setAuthStatus("not_logged_in")
          setError("Please log in to view your medical records")
          setLoading(false)
          return
        } else {
          setAuthStatus("logged_in")
        }
        
        const allRecords = []
        
        if (token) {
          // Fetch all analysis reports from different endpoints
          const [
            skinScanResponse,
            eyeScanResponse,
            medicalReportResponse,
            existingMedicalHistory
          ] = await Promise.all([
            getSkinScanReports(token),
            getEyeScanReports(token),
            getMedicalReportAnalyses(token),
            getMedicalHistories(token)
          ])

          // Process skin scan reports
          if (Array.isArray(skinScanResponse)) {
            skinScanResponse.forEach(report => {
              if (report.analysis) {
                allRecords.push({
                  _id: report._id,
                  type: 'skin_scan',
                  short_summary: report.analysis.condition || 'Skin analysis completed',
                  condition: report.analysis.condition,
                  confidence: report.analysis.confidence,
                  analysis: report.analysis,
                  createdAt: report.createdAt,
                  scanType: 'Skin'
                })
              }
            })
          } else if (skinScanResponse?.error) {
            console.warn("Skin scan API error:", skinScanResponse.error)
          }

          // Process eye scan reports
          if (Array.isArray(eyeScanResponse)) {
            eyeScanResponse.forEach(report => {
              if (report.analysis) {
                allRecords.push({
                  _id: report._id,
                  type: 'eye_scan',
                  short_summary: report.analysis.condition || 'Eye analysis completed',
                  condition: report.analysis.condition,
                  confidence: report.analysis.confidence,
                  analysis: report.analysis,
                  createdAt: report.createdAt,
                  scanType: 'Eye'
                })
              }
            })
          } else if (eyeScanResponse?.error) {
            console.warn("Eye scan API error:", eyeScanResponse.error)
          }

          // Process medical report analyses
          if (Array.isArray(medicalReportResponse)) {
            medicalReportResponse.forEach(report => {
              if (report.analysis) {
                allRecords.push({
                  _id: report._id,
                  type: 'medical_report',
                  short_summary: report.analysis.summary || 'Medical report analyzed',
                  condition: report.analysis.diagnosis,
                  confidence: report.analysis.confidence,
                  analysis: report.analysis,
                  createdAt: report.createdAt,
                  scanType: 'Medical Report'
                })
              }
            })
          } else if (medicalReportResponse?.error) {
            console.warn("Medical report API error:", medicalReportResponse.error)
          }

          // Include existing medical history records
          if (Array.isArray(existingMedicalHistory)) {
            existingMedicalHistory.forEach(record => {
              allRecords.push({
                ...record,
                type: 'medical_history'
              })
            })
          } else if (existingMedicalHistory?.error) {
            console.warn("Medical history API error:", existingMedicalHistory.error)
          }

          // Sort all records by date (newest first)
          allRecords.sort((a, b) => {
            const dateA = new Date(a.createdAt?.$date?.$numberLong || a.createdAt || Date.now())
            const dateB = new Date(b.createdAt?.$date?.$numberLong || b.createdAt || Date.now())
            return dateB - dateA
          })

          setMedicalHistory(allRecords)
        }
        
        // Load local scan history
        const storedHistory = await AsyncStorage.getItem("history")
        if (storedHistory) {
          const parsedHistory = JSON.parse(storedHistory)
          setLocalHistory(parsedHistory || [])
        }
      } catch (e) {
        console.error("Failed to load analysis data:", e)
        setError("Failed to load medical records. Please try again.")
        setMedicalHistory([])
        setLocalHistory([])
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const getScanTypeIcon = (scanType, condition, shortSummary, type) => {
    // Handle based on analysis type first
    if (type) {
      switch (type) {
        case 'skin_scan':
          return "body"
        case 'eye_scan':
          return "eye"
        case 'medical_report':
          return "document-text"
        case 'medical_history':
          return "medical"
        default:
          break
      }
    }

    // Handle API medical history by analyzing short_summary
    if (shortSummary) {
      const summary = shortSummary.toLowerCase()
      if (summary.includes('heart') || summary.includes('cardiac') || summary.includes('blood pressure') || summary.includes('pulse')) {
        return "heart"
      }
      if (summary.includes('skin') || summary.includes('acne') || summary.includes('rash') || summary.includes('dermat')) {
        return "body"
      }
      if (summary.includes('eye') || summary.includes('vision') || summary.includes('ophthalm')) {
        return "eye"
      }
      if (summary.includes('temperature') || summary.includes('fever') || summary.includes('vital')) {
        return "thermometer"
      }
      if (summary.includes('symptom') || summary.includes('pain') || summary.includes('ache')) {
        return "chatbox-ellipses"
      }
      if (summary.includes('report') || summary.includes('document')) {
        return "document-text"
      }
    }
    
    // Handle API medical history by condition
    if (condition) {
      switch (condition.toLowerCase()) {
        case "cardiac":
        case "heart":
          return "heart"
        case "skin":
        case "dermatology":
          return "body"
        case "eye":
        case "ophthalmology":
          return "eye"
        case "vitals":
        case "vital signs":
          return "thermometer"
        default:
          return "medical"
      }
    }
    
    // Handle local scan history
    switch (scanType?.toLowerCase()) {
      case "cardiac":
        return "heart"
      case "skin":
        return "body"
      case "eye":
        return "eye"
      case "vitals":
        return "thermometer"
      case "symptom":
        return "chatbox-ellipses"
      case "medical_report":
        return "document-text"
      default:
        return "scan-circle"
    }
  }

  const getScanTypeName = (scanType, condition, shortSummary, type) => {
    // Handle based on analysis type first
    if (type) {
      switch (type) {
        case 'skin_scan':
          return "Skin Analysis"
        case 'eye_scan':
          return "Eye Analysis"
        case 'medical_report':
          return "Medical Report"
        case 'medical_history':
          return "Medical History"
        default:
          break
      }
    }

    // Handle API medical history by analyzing short_summary
    if (shortSummary) {
      const summary = shortSummary.toLowerCase()
      if (summary.includes('heart') || summary.includes('cardiac') || summary.includes('blood pressure') || summary.includes('pulse')) {
        return "Cardiac"
      }
      if (summary.includes('skin') || summary.includes('acne') || summary.includes('rash') || summary.includes('dermat')) {
        return "Skin"
      }
      if (summary.includes('eye') || summary.includes('vision') || summary.includes('ophthalm')) {
        return "Eye"
      }
      if (summary.includes('temperature') || summary.includes('fever') || summary.includes('vital')) {
        return "Vitals"
      }
      if (summary.includes('symptom') || summary.includes('pain') || summary.includes('ache')) {
        return "Symptom"
      }
      if (summary.includes('report') || summary.includes('document')) {
        return "Medical Report"
      }
    }
    
    // Handle API medical history by condition
    if (condition) {
      switch (condition.toLowerCase()) {
        case "cardiac":
        case "heart":
          return "Cardiac"
        case "skin":
        case "dermatology":
          return "Skin"
        case "eye":
        case "ophthalmology":
          return "Eye"
        case "vitals":
        case "vital signs":
          return "Vitals"
        default:
          return "Medical"
      }
    }
    
    // Handle local scan history
    switch (scanType?.toLowerCase()) {
      case "cardiac":
        return "Cardiac"
      case "skin":
        return "Skin"
      case "eye":
        return "Eye"
      case "vitals":
        return "Vitals"
      case "symptom":
        return "Symptom"
      case "medical_report":
        return "Medical Report"
      default:
        return "Scan"
    }
  }

  const getScanTypeColor = (scanType, condition, shortSummary, type) => {
    // Handle based on analysis type first
    if (type) {
      switch (type) {
        case 'skin_scan':
          return Colors.secondary
        case 'eye_scan':
          return Colors.accentGreen
        case 'medical_report':
          return Colors.accentBlue
        case 'medical_history':
          return Colors.primary
        default:
          break
      }
    }

    // Handle API medical history by analyzing short_summary
    if (shortSummary) {
      const summary = shortSummary.toLowerCase()
      if (summary.includes('heart') || summary.includes('cardiac') || summary.includes('blood pressure') || summary.includes('pulse')) {
        return Colors.primary
      }
      if (summary.includes('skin') || summary.includes('acne') || summary.includes('rash') || summary.includes('dermat')) {
        return Colors.secondary
      }
      if (summary.includes('eye') || summary.includes('vision') || summary.includes('ophthalm')) {
        return Colors.accentGreen
      }
      if (summary.includes('temperature') || summary.includes('fever') || summary.includes('vital')) {
        return Colors.accentRed
      }
      if (summary.includes('report') || summary.includes('document')) {
        return Colors.accentBlue
      }
    }
    
    // Handle API medical history by condition
    if (condition) {
      switch (condition.toLowerCase()) {
        case "cardiac":
        case "heart":
          return Colors.primary
        case "skin":
        case "dermatology":
          return Colors.secondary
        case "eye":
        case "ophthalmology":
          return Colors.accentGreen
        case "vitals":
        case "vital signs":
          return Colors.accentRed
        default:
          return Colors.primary
      }
    }
    
    // Handle local scan history
    switch (scanType?.toLowerCase()) {
      case "cardiac":
        return Colors.primary
      case "skin":
        return Colors.secondary
      case "eye":
        return Colors.accentGreen
      case "vitals":
        return Colors.accentRed
      case "symptom":
        return Colors.primary
      case "medical_report":
        return Colors.secondary
      default:
        return Colors.primary
    }
  }

  // Combine and normalize both data sources
  const combinedHistory = [
    // Analysis-based medical records from all scan types
    ...medicalHistory.map(item => ({
      ...item,
      source: 'api',
      scanType: item.scanType || getScanTypeName(null, item.condition, item.short_summary, item.type),
      summary: item.analysis?.description || item.analysis?.summary || item.short_summary || "Analysis completed",
      shortSummary: item.short_summary || getScanTypeName(null, item.condition, item.short_summary, item.type),
      date: item.createdAt?.$date?.$numberLong ? new Date(parseInt(item.createdAt.$date.$numberLong)).toISOString() : 
            item.createdAt || item.dateDiagnosed || new Date().toISOString(),
      confidence: item.confidence || (item.analysis?.confidence),
      isApiData: true
    })),
    // Local scan history
    ...localHistory.map(item => ({
      ...item,
      source: 'local',
      summary: item.llmResponse?.summary || "Scan result",
      shortSummary: item.llmResponse?.short_summary || getScanTypeName(item.scanType) + " Scan",
      date: item.timestamp || item.date,
      isApiData: false
    }))
  ]

  // Remove duplicates based on _id, keeping the first occurrence
  const deduplicatedHistory = combinedHistory.reduce((acc, current) => {
    const existingItem = acc.find(item => item._id === current._id)
    if (!existingItem) {
      acc.push(current)
    }
    // If duplicate exists, we keep the first one and ignore subsequent ones
    return acc
  }, [])

  const filteredHistory = deduplicatedHistory
    .filter((item) => {
      if (filterScanType === "All") return true
      
      // Check various fields for filtering
      const matchesType = item.scanType === filterScanType || 
                         item.condition === filterScanType ||
                         item.type?.includes(filterScanType.toLowerCase()) ||
                         getScanTypeName(item.scanType, item.condition, item.short_summary, item.type) === filterScanType
      
      return matchesType
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  // Generate filter options based on analysis types and scan types
  const allScanTypes = [
    "All", 
    ...new Set([
      ...medicalHistory.map(item => getScanTypeName(item.scanType, item.condition, item.short_summary, item.type)),
      ...localHistory.map(item => item.scanType || "Scan")
    ].filter(Boolean))
  ]

  const Card = ({ children, style }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      {children}
    </View>
  )
  const renderHistoryItem = ({ item }) => {
    console.log(`🎯 renderHistoryItem called with: ${item._id}`, item.analysis || item.short_summary || "No analysis data")
    
    const scanType = item.scanType || item.condition || "unknown"
    
    // Use the actual database content instead of generic text
    const summary = item.analysis || item.insights || item.description || item.summary || "Analysis completed"
    
    // Smart title logic: use short_summary if it's 5 words or less, otherwise use scan type names
    let cardTitle = ""
    if (item.short_summary) {
      const wordCount = item.short_summary.trim().split(/\s+/).length
      if (wordCount <= 5) {
        cardTitle = item.short_summary
      } else {
        // Fall back to scan type names
        cardTitle = getScanTypeName(scanType, item.condition, item.short_summary, item.type)
      }
    } else {
      // No short_summary available, use scan type names
      cardTitle = getScanTypeName(scanType, item.condition, item.short_summary, item.type)
    }
    
    const shortSummary = cardTitle // Use the computed title
    
    // Handle MongoDB date format
    let date = item.date || item.createdAt || new Date().toISOString()
    if (item.createdAt?.$date?.$numberLong) {
      date = new Date(parseInt(item.createdAt.$date.$numberLong))
    } else if (typeof date === 'string') {
      date = new Date(date)
    }
    const formattedDate = date.toLocaleDateString()
    
    const isApiData = item.type || item.isApiData || false

    return (
      <TouchableOpacity
        style={[styles.historyItem, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => {
          // Navigate to appropriate screen based on analysis type
          switch (item.type) {
            case 'skin_scan':
              navigation.navigate("Results", { 
                result: {
                  ...item,
                  id: item._id,
                  scanType: "skin",
                  scanData: {
                    diagnosis: item.short_summary || item.condition,
                    confidence: item.confidence
                  },
                  llmResponse: {
                    summary: item.analysis || item.insights || "Skin analysis completed",
                    short_summary: item.short_summary,
                    condition: item.short_summary || item.condition,
                    confidence: item.confidence,
                    analysis: item.analysis,
                    explanation: item.insights || item.analysis,
                    scan_details: item.scan_details
                  },
                  imageUrl: item.imageUrl,
                  date: item.createdAt?.$date?.$numberLong ? new Date(parseInt(item.createdAt.$date.$numberLong)).toISOString() : item.createdAt
                }
              })
              break
            case 'eye_scan':
              navigation.navigate("Results", { 
                result: {
                  ...item,
                  id: item._id,
                  scanType: "eye",
                  scanData: {
                    diagnosis: item.short_summary || item.condition,
                    confidence: item.confidence
                  },
                  llmResponse: {
                    summary: item.analysis || item.insights || "Eye analysis completed",
                    short_summary: item.short_summary,
                    condition: item.short_summary || item.condition,
                    confidence: item.confidence,
                    analysis: item.analysis,
                    explanation: item.insights || item.analysis,
                    scan_details: item.scan_details
                  },
                  imageUrl: item.imageUrl,
                  date: item.createdAt?.$date?.$numberLong ? new Date(parseInt(item.createdAt.$date.$numberLong)).toISOString() : item.createdAt
                }
              })
              break
            case 'medical_report':
              navigation.navigate("Report", { 
                result: {
                  ...item,
                  id: item._id,
                  scanType: "medical_report",
                  scanData: {
                    diagnosis: item.short_summary || item.condition,
                    report: item.analysis
                  },
                  llmResponse: {
                    summary: item.analysis || item.insights || "Medical report analyzed",
                    analysis: item.analysis,
                    explanation: item.insights || item.analysis,
                    confidence: item.confidence,
                    scan_details: item.scan_details
                  },
                  imageUrl: item.imageUrl,
                  date: item.createdAt?.$date?.$numberLong ? new Date(parseInt(item.createdAt.$date.$numberLong)).toISOString() : item.createdAt
                }
              })
              break
            case 'medical_history':
              navigation.navigate("Report", { 
                result: {
                  ...item,
                  id: item._id,
                  scanType: "medical_history",
                  scanData: {
                    condition: item.short_summary || item.condition,
                    description: item.analysis || item.description
                  },
                  llmResponse: {
                    summary: item.short_summary || item.condition,
                    analysis: item.analysis || item.description,
                    explanation: item.analysis || item.description,
                    confidence: item.confidence
                  },
                  date: item.createdAt?.$date?.$numberLong ? new Date(parseInt(item.createdAt.$date.$numberLong)).toISOString() : item.createdAt || item.dateDiagnosed
                }
              })
              break
            default:
              // For local scan history or unknown types
              if (item.source === 'local') {
                navigation.navigate("Results", { result: item })
              } else {
                navigation.navigate("Report", { 
                  result: {
                    ...item,
                    id: item._id || item.id,
                    scanType: item.scanType || "unknown",
                    scanData: {
                      diagnosis: item.short_summary || item.condition,
                      description: item.analysis || item.description
                    },
                    llmResponse: {
                      summary: item.analysis || item.summary || item.short_summary,
                      analysis: item.analysis,
                      explanation: item.insights || item.description || item.analysis,
                      confidence: item.confidence
                    },
                    imageUrl: item.imageUrl,
                    date: item.date || item.createdAt
                  }
                })
              }
          }
        }}
        accessibilityLabel={`View ${shortSummary} details`}
      >
        <View style={styles.itemHeader}>
          <View style={[styles.iconContainer, { backgroundColor: getScanTypeColor(scanType, item.condition, item.short_summary, item.type) + "15" }]}>
            <Ionicons 
              name={getScanTypeIcon(scanType, item.condition, item.short_summary, item.type)} 
              size={20} 
              color={getScanTypeColor(scanType, item.condition, item.short_summary, item.type)} 
            />
          </View>
          <View style={styles.itemContent}>
            <View style={styles.titleRow}>
              <Text style={[styles.itemTitle, { color: colors.text }]}>
                {shortSummary}
              </Text>
              {isApiData && (
                <View style={[styles.sourceBadge, { backgroundColor: Colors.secondary + "20" }]}>
                  <Text style={[styles.sourceBadgeText, { color: Colors.secondary }]}>
                    {item.type === 'skin_scan' ? 'SKIN' : 
                     item.type === 'eye_scan' ? 'EYE' : 
                     item.type === 'medical_report' ? 'REPORT' : 'API'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.itemDate, { color: colors.text }]}>{formattedDate}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text + "60"} />
        </View>
        
        <Text style={[styles.itemSummary, { color: colors.text }]} numberOfLines={2}>
          {summary}
        </Text>

        {isApiData && item.confidence && (
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.text }]}>Confidence: </Text>
            <Text style={[
              styles.statusValue, 
              { color: item.confidence > 0.8 ? Colors.accentGreen : item.confidence > 0.6 ? Colors.secondary : Colors.accentRed }
            ]}>
              {Math.round(item.confidence * 100)}%
            </Text>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        <LinearGradient colors={[Colors.primary, Colors.gradientEnd]} style={styles.headerSection}>
          <Ionicons name="analytics" size={64} color={Colors.textLight} style={styles.headerIcon} />
          <Text style={styles.headerTitle}>Medical Records</Text>
          <Text style={styles.headerSubtitle}>Generated from your health analysis and scans</Text>
          
          {/* Debug button */}

        </LinearGradient>

        {/* Error Banner */}
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: Colors.accentRed + "15", borderColor: Colors.accentRed }]}>
            <Ionicons name="alert-circle" size={20} color={Colors.accentRed} />
            <Text style={[styles.errorText, { color: Colors.accentRed }]}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <Ionicons name="close" size={20} color={Colors.accentRed} />
            </TouchableOpacity>
          </View>
        )}

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text }]}>Loading medical records...</Text>
          </View>
        )}

        <View style={styles.contentContainer}>
          {deduplicatedHistory.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>Filter by type:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterButtons}>
                {allScanTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterButton,
                      {
                        backgroundColor: filterScanType === type ? Colors.primary : colors.background,
                        borderColor: filterScanType === type ? Colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setFilterScanType(type)}
                    accessibilityLabel={`Filter by ${type}`}
                  >
                    <Text
                      style={[
                        styles.filterButtonText, 
                        { color: filterScanType === type ? Colors.textLight : colors.text }
                      ]}
                    >
                      {type === "All" ? "All" : getScanTypeName(type, type, type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {filteredHistory.length === 0 && !loading ? (
            <Card style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color={colors.text + "40"} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Medical Records</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                {!medicalHistory.length && !localHistory.length 
                  ? "Please log in and complete health scans to generate your medical records" 
                  : "No records match the current filter. Try selecting 'All' or a different category."}
              </Text>
              <TouchableOpacity
                style={[styles.startScanButton, { backgroundColor: Colors.primary }]}
                onPress={() => navigation.navigate("ScanSelection")}
                accessibilityLabel="Start a new scan"
              >
                <Ionicons name="scan-circle" size={20} color={Colors.textLight} />
                <Text style={styles.startScanButtonText}>Start New Scan</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            <View style={styles.historyList}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Medical Records ({filteredHistory.length})
              </Text>
              <View>
                {filteredHistory.map((item, index) => (
                  <View key={`${item.source || 'unknown'}-${item._id || item.id || index}-${item.type || 'record'}-${index}`}>
                    {renderHistoryItem({ item })}
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
      <CustomNavBar navigation={navigation} activeTab="History" />
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
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
  },
  debugButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  debugButtonText: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: "600",
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
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  filterButtons: {
    paddingRight: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  historyList: {
    marginBottom: 16,
  },
  historyItem: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  sourceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  itemDate: {
    fontSize: 13,
    opacity: 0.7,
  },
  itemSummary: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  statusRow: {
    flexDirection: "row",
    marginTop: 8,
    alignItems: "center",
  },
  statusLabel: {
    fontSize: 13,
    opacity: 0.7,
  },
  statusValue: {
    fontSize: 13,
    fontWeight: "600",
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
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.7,
    lineHeight: 20,
    marginBottom: 24,
  },
  startScanButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  startScanButtonText: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
})

export default MedicalHistoryScreen
