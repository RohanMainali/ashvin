"use client"

import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useState, useRef, useEffect } from "react"
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View, StatusBar, Animated } from "react-native"
import { Colors } from "../constants/colors"

const { width, height } = Dimensions.get("window")

const slides = [
  {
    id: "1",
    title: "Welcome to Ashvin",
    description: "Your AI-powered companion for comprehensive health monitoring and personalized insights.",
    icon: "heart",
    secondaryIcon: "pulse",
    color: Colors.primary,
    gradientColors: ['#ff6b6b', '#ee5a6f'],
  },
  {
    id: "2",
    title: "Scan & Analyze",
    description: "Perform advanced health scans including cardiac monitoring, skin analysis, eye checks, and vital signs.",
    icon: "camera",
    secondaryIcon: "scan",
    color: Colors.secondary,
    gradientColors: ['#4ecdc4', '#44d8ba'],
  },
  {
    id: "3",
    title: "AI-Powered Insights",
    description: "Get intelligent health recommendations, personalized advice, and chat with our AI for guidance.",
    icon: "bulb",
    secondaryIcon: "chatbubbles",
    color: Colors.accent,
    gradientColors: ['#45b7d1', '#96c93d'],
  },
  {
    id: "4",
    title: "Track Your Journey",
    description: "Monitor your progress, view detailed history, and achieve your health goals with data-driven insights.",
    icon: "trending-up",
    secondaryIcon: "trophy",
    color: Colors.primary,
    gradientColors: ['#f093fb', '#f5576c'],
  },
]

const OnboardingScreen = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const flatListRef = useRef(null)
  const pulseAnim = useRef(new Animated.Value(1)).current
  const floatAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Pulse animation for rings
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    )

    // Floating animation for small icons
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    )

    pulseAnimation.start()
    floatAnimation.start()

    return () => {
      pulseAnimation.stop()
      floatAnimation.stop()
    }
  }, [])

  const renderSlide = ({ item, index }) => {
    const translateY = floatAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -10],
    })

    return (
      <View style={styles.slide}>
        <View style={styles.iconSection}>
          <LinearGradient
            colors={item.gradientColors}
            style={styles.iconContainer}
          >
            <View style={styles.primaryIconContainer}>
              <Ionicons name={item.icon} size={64} color="white" />
            </View>
            <View style={styles.secondaryIconContainer}>
              <Ionicons name={item.secondaryIcon} size={24} color="rgba(255,255,255,0.8)" />
            </View>
            
            {/* Animated pulse rings */}
            <Animated.View style={[
              styles.pulseRing, 
              styles.pulseRing1,
              { transform: [{ scale: pulseAnim }] }
            ]} />
            <Animated.View style={[
              styles.pulseRing, 
              styles.pulseRing2,
              { transform: [{ scale: pulseAnim }] }
            ]} />
          </LinearGradient>
          
          {/* Floating icons around main container */}
          <Animated.View style={[
            styles.floatingIcon1,
            { transform: [{ translateY }] }
          ]}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.smallIconContainer}
            >
              <Ionicons name="shield-checkmark" size={16} color="white" />
            </LinearGradient>
          </Animated.View>
          
          <Animated.View style={[
            styles.floatingIcon2,
            { transform: [{ translateY: translateY }] }
          ]}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.smallIconContainer}
            >
              <Ionicons name="star" size={14} color="white" />
            </LinearGradient>
          </Animated.View>
          
          <Animated.View style={[
            styles.floatingIcon3,
            { transform: [{ translateY }] }
          ]}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.smallIconContainer}
            >
              <Ionicons name="flash" size={12} color="white" />
            </LinearGradient>
          </Animated.View>
        </View>
        
        <View style={styles.contentSection}>
          <Text style={styles.slideTitle}>{item.title}</Text>
          <Text style={styles.slideDescription}>{item.description}</Text>
          
          {/* Feature highlights */}
          <View style={styles.featuresContainer}>
            {index === 0 && (
              <>
                <View style={styles.featureItem}>
                  <Ionicons name="medical" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.featureText}>Health Monitoring</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="analytics" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.featureText}>AI Analysis</Text>
                </View>
              </>
            )}
            {index === 1 && (
              <>
                <View style={styles.featureItem}>
                  <Ionicons name="eye" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.featureText}>Eye Scans</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="fitness" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.featureText}>Vital Signs</Text>
                </View>
              </>
            )}
            {index === 2 && (
              <>
                <View style={styles.featureItem}>
                  <Ionicons name="chatbubble-ellipses" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.featureText}>AI Chat</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="library" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.featureText}>Insights</Text>
                </View>
              </>
            )}
            {index === 3 && (
              <>
                <View style={styles.featureItem}>
                  <Ionicons name="time" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.featureText}>History</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="ribbon" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.featureText}>Achievements</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    )
  }

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x
    const newIndex = Math.round(contentOffsetX / width)
    setCurrentIndex(newIndex)
  }

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true })
    } else {
      onComplete()
    }
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true })
    }
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            style={styles.logoGradient}
          >
            <Ionicons name="heart" size={32} color="white" />
          </LinearGradient>
          <Text style={styles.logoText}>Ashvin</Text>
        </View>
        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={onComplete}
          accessibilityLabel="Skip onboarding"
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.flatList}
      />

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Pagination */}
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === currentIndex ? styles.activeDot : styles.inactiveDot]}
              accessibilityLabel={`Page ${index + 1} of ${slides.length}`}
            />
          ))}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
            onPress={goToPrevious}
            disabled={currentIndex === 0}
            accessibilityLabel="Previous slide"
          >
            <Ionicons 
              name="chevron-back" 
              size={24} 
              color={currentIndex === 0 ? 'rgba(255,255,255,0.3)' : 'white'} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={goToNext}
            accessibilityLabel={currentIndex === slides.length - 1 ? "Get Started with Ashvin" : "Next slide"}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.buttonGradient}
            >
              <Text style={styles.getStartedButtonText}>
                {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              <Ionicons 
                name={currentIndex === slides.length - 1 ? "checkmark" : "chevron-forward"} 
                size={20} 
                color="white" 
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  skipText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  flatList: {
    flex: 1,
  },
  slide: {
    width: width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconSection: {
    position: 'relative',
    marginBottom: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
    position: 'relative',
  },
  primaryIconContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryIconContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    borderRadius: 110,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  pulseRing1: {
    width: 220,
    height: 220,
  },
  pulseRing2: {
    width: 260,
    height: 260,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  floatingIcon1: {
    position: 'absolute',
    top: -10,
    right: 10,
  },
  floatingIcon2: {
    position: 'absolute',
    bottom: -20,
    left: 20,
  },
  floatingIcon3: {
    position: 'absolute',
    top: 30,
    left: -15,
  },
  smallIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  contentSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  slideTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  slideDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  featureText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: 'white',
    width: 24,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  getStartedButton: {
    flex: 1,
    marginLeft: 20,
    borderRadius: 25,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  getStartedButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
})

export default OnboardingScreen
