"use client"

import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "@react-navigation/native"
import { useEffect, useMemo, useState } from "react"
import { Alert, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, StatusBar } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Colors } from "../constants/colors"
import { mockDoctors as importedMockDoctors, assignDoctors } from "../constants/mockData"
import { getDoctorSpecialtyRecommendation, mapToExactSpecialty } from "../utils/doctorRecommendationApi"

const DoctorRecommendationScreen = ({ route, navigation }) => {

  const { colors } = useTheme()
  const { result } = route.params
  const { llmResponse } = result

  // Default topConditions to [] if undefined
  const { urgency, topConditions: rawTopConditions = [] } = llmResponse

  // Memoize topConditions to avoid infinite loop
  const topConditions = useMemo(() => rawTopConditions, [JSON.stringify(rawTopConditions)])

  // Add recommendedDoctors state
  const [recommendedDoctors, setRecommendedDoctors] = useState([])
  const [aiRecommendedSpecialty, setAiRecommendedSpecialty] = useState(null)
  const [isLoadingAI, setIsLoadingAI] = useState(true)

  const mockDoctors = useMemo(() => importedMockDoctors, [])

  // AI-based doctor specialty recommendation
  useEffect(() => {
    const getAIRecommendation = async () => {
      setIsLoadingAI(true)
      try {
        const aiSpecialty = await getDoctorSpecialtyRecommendation(result)
        const mappedSpecialty = mapToExactSpecialty(aiSpecialty)
        setAiRecommendedSpecialty(mappedSpecialty)
        console.log('AI recommended specialty (mapped):', mappedSpecialty)
      } catch (error) {
        console.error('Error getting AI specialty recommendation:', error)
        setAiRecommendedSpecialty('General Physician')
      } finally {
        setIsLoadingAI(false)
      }
    }
    
    getAIRecommendation()
  }, [result])

  useEffect(() => {
    if (!aiRecommendedSpecialty) return
    
    // Prioritize AI-recommended specialty first, then fallback to condition-based matching
    let doctors = []
    
    // First, get doctors that match the AI-recommended specialty
    const aiRecommendedDoctors = mockDoctors.filter(doc => 
      doc.specialization === aiRecommendedSpecialty
    )
    
    // Then get doctors based on conditions (existing logic)
    let conditions = [];
    if (topConditions && topConditions.length > 0) {
      conditions = topConditions;
    } else {
      const fallbackCond = result?.scanData?.diagnosis || result?.scanData?.symptoms;
      if (fallbackCond) conditions = [fallbackCond];
    }
    const conditionBasedDoctors = assignDoctors({ conditions, urgency });
    
    // Combine and prioritize: AI-recommended first, then condition-based
    const aiDoctorIds = new Set(aiRecommendedDoctors.map(d => d.id))
    const uniqueConditionDoctors = conditionBasedDoctors.filter(d => !aiDoctorIds.has(d.id))
    
    doctors = [...aiRecommendedDoctors, ...uniqueConditionDoctors]
    
    // If no AI-recommended doctors, fall back to condition-based only
    if (aiRecommendedDoctors.length === 0) {
      doctors = conditionBasedDoctors
    }
    
    setRecommendedDoctors(doctors);
  }, [aiRecommendedSpecialty, urgency, topConditions, result, mockDoctors]);

  const handleBookAppointment = (doctorName) => {
    Alert.alert(
      "Appointment Booking",
      `A mock appointment request has been sent for ${doctorName}. You will be contacted shortly to confirm.`,
      [{ text: "OK" }],
      { cancelable: true },
    )
  }

  const renderStarRating = (rating) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={18}
          color={Colors.primary}
          style={styles.starIcon}
        />,
      )
    }
    return <View style={styles.starRatingContainer}>{stars}</View>
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
          
          <Text style={styles.headerTitle}>Find a Doctor</Text>
          
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => {/* Help functionality */}}
          >
            <Ionicons name="help-circle-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollContent}>
          
          {/* Header Card */}
          <Card>
            <View style={styles.pageHeader}>
              <View style={styles.pageIconContainer}>
                <Ionicons name="medical-outline" size={40} color={Colors.primary} />
              </View>
              <Text style={[styles.pageTitle, { color: colors.text }]}>Doctor Recommendations</Text>
              <Text style={[styles.pageSubtitle, { color: colors.text }]}>
                Based on your recent {result.scanType} analysis
              </Text>
              
              {/* Analysis Summary */}
              <View style={styles.analysisSummaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>Diagnosis:</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {result.scanData.diagnosis || result.scanData.symptoms || 'General Health Check'}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>Urgency:</Text>
                  <View style={[
                    styles.urgencyBadge,
                    {
                      backgroundColor: urgency === 'High' ? Colors.accentRed :
                                     urgency === 'Medium' ? Colors.secondary :
                                     Colors.accentGreen
                    }
                  ]}>
                    <Text style={styles.urgencyText}>{urgency || 'Low'}</Text>
                  </View>
                </View>
              </View>
            </View>
          </Card>

          {/* AI Recommendation Banner */}
          {isLoadingAI ? (
            <Card gradient={true}>
              <View style={styles.aiLoadingContainer}>
                <Ionicons name="sync-outline" size={24} color="#fff" />
                <Text style={styles.aiLoadingText}>AI is analyzing your results...</Text>
              </View>
            </Card>
          ) : aiRecommendedSpecialty && (
            <Card gradient={true}>
              <View style={styles.aiRecommendationBanner}>
                <Ionicons name="bulb-outline" size={24} color="#fff" />
                <View style={styles.aiRecommendationContent}>
                  <Text style={styles.aiRecommendationTitle}>AI Recommendation</Text>
                  <Text style={styles.aiRecommendationText}>
                    Based on your analysis, we recommend consulting a {aiRecommendedSpecialty}
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* Doctors List */}
          {recommendedDoctors.length === 0 ? (
            <Card>
              <View style={styles.noDoctorsContainer}>
                <Ionicons name="medical-outline" size={60} color={Colors.primary} style={{ opacity: 0.3 }} />
                <Text style={[styles.noDoctorsTitle, { color: colors.text }]}>No Specific Recommendations</Text>
                <Text style={[styles.noDoctorsText, { color: colors.text }]}>
                  No specific doctor recommendations found for your condition at this time. 
                  Please consult a general physician for further guidance.
                </Text>
                <TouchableOpacity
                  style={styles.generalPhysicianButton}
                  onPress={() => {
                    const generalDocs = mockDoctors.filter(doc => doc.specialization === 'General Physician')
                    setRecommendedDoctors(generalDocs)
                  }}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    style={styles.generalPhysicianGradient}
                  >
                    <Ionicons name="person-outline" size={20} color="#fff" />
                    <Text style={styles.generalPhysicianText}>Show General Physicians</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Card>
          ) : (
            <View style={styles.doctorsContainer}>
              <Text style={[styles.doctorsListTitle, { color: colors.text }]}>
                Recommended Healthcare Professionals ({recommendedDoctors.length})
              </Text>
              
              {recommendedDoctors.map((doctor, index) => (
                <Card key={doctor.id}>
                  <View style={styles.doctorCard}>
                    
                    {/* Doctor Header */}
                    <View style={styles.doctorHeader}>
                      <View style={styles.doctorImageContainer}>
                        <Image source={{ uri: doctor.imageUrl }} style={styles.doctorImage} />
                        {/* AI Recommended Badge */}
                        {aiRecommendedSpecialty === doctor.specialization && index === 0 && (
                          <View style={styles.aiRecommendedBadge}>
                            <Ionicons name="sparkles" size={12} color="#fff" />
                          </View>
                        )}
                      </View>
                      
                      <View style={styles.doctorInfo}>
                        <Text style={[styles.doctorName, { color: colors.text }]}>{doctor.name}</Text>
                        <Text style={[styles.doctorSpecialization, { color: Colors.primary }]}>
                          {doctor.specialization}
                        </Text>
                        
                        {/* Rating */}
                        <View style={styles.ratingContainer}>
                          {renderStarRating(doctor.rating)}
                          <Text style={[styles.ratingText, { color: colors.text }]}>
                            {doctor.rating} ({doctor.reviews} reviews)
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Doctor Bio */}
                    <View style={styles.doctorBioSection}>
                      <Text style={[styles.doctorBio, { color: colors.text }]}>{doctor.bio}</Text>
                    </View>

                    {/* Contact Information */}
                    <View style={styles.contactInfoSection}>
                      <View style={styles.contactItem}>
                        <View style={styles.contactIconContainer}>
                          <Ionicons name="location-outline" size={18} color={Colors.primary} />
                        </View>
                        <Text style={[styles.contactText, { color: colors.text }]}>{doctor.address}</Text>
                      </View>
                      
                      <View style={styles.contactItem}>
                        <View style={styles.contactIconContainer}>
                          <Ionicons name="call-outline" size={18} color={Colors.secondary} />
                        </View>
                        <Text style={[styles.contactText, { color: colors.text }]}>{doctor.phone}</Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        style={styles.bookButton}
                        onPress={() => handleBookAppointment(doctor.name)}
                        accessibilityLabel={`Book appointment with ${doctor.name}`}
                      >
                        <LinearGradient
                          colors={[Colors.accentGreen, '#4CAF50']}
                          style={styles.bookButtonGradient}
                        >
                          <Ionicons name="calendar-outline" size={20} color="#fff" />
                          <Text style={styles.bookButtonText}>Book Appointment</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.callButton}
                        onPress={() => Alert.alert('Call Doctor', `Calling ${doctor.phone}...`)}
                        accessibilityLabel={`Call ${doctor.name}`}
                      >
                        <LinearGradient
                          colors={[Colors.primary, Colors.secondary]}
                          style={styles.callButtonGradient}
                        >
                          <Ionicons name="call" size={20} color="#fff" />
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backToResultsButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back to results"
          >
            <LinearGradient
              colors={[Colors.secondary, Colors.primary]}
              style={styles.backToResultsGradient}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
              <Text style={styles.backToResultsText}>Back to Results</Text>
            </LinearGradient>
          </TouchableOpacity>

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
  helpButton: {
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
  pageHeader: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  pageIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(109, 40, 217, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 20,
  },
  analysisSummaryCard: {
    backgroundColor: 'rgba(109, 40, 217, 0.05)',
    padding: 16,
    borderRadius: 16,
    width: '100%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
  },
  urgencyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  aiLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  aiLoadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  aiRecommendationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiRecommendationContent: {
    marginLeft: 16,
    flex: 1,
  },
  aiRecommendationTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  aiRecommendationText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
  },
  noDoctorsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDoctorsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  noDoctorsText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.7,
    marginBottom: 24,
  },
  generalPhysicianButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  generalPhysicianGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  generalPhysicianText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  doctorsContainer: {
    marginTop: 8,
  },
  doctorsListTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  doctorCard: {
    // Card styling handled by Card component
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  doctorImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  doctorImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f0f0f0',
  },
  aiRecommendedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  doctorSpecialization: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starRatingContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  starIcon: {
    marginRight: 2,
  },
  ratingText: {
    fontSize: 14,
    opacity: 0.7,
  },
  doctorBioSection: {
    marginBottom: 16,
  },
  doctorBio: {
    fontSize: 16,
    lineHeight: 22,
    opacity: 0.8,
  },
  contactInfoSection: {
    marginBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(109, 40, 217, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactText: {
    fontSize: 16,
    flex: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  bookButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  callButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  callButtonGradient: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToResultsButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  backToResultsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  backToResultsText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
})

export default DoctorRecommendationScreen
