"use client"

import { useState, useEffect, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, StatusBar, Dimensions } from "react-native"
import { useTheme } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { Colors } from "../constants/colors"

const { width, height } = Dimensions.get("window")

const BreathingScreen = ({ navigation }) => {
  const { colors } = useTheme()
  const [isBreathing, setIsBreathing] = useState(false)
  const [phase, setPhase] = useState("Ready") // Ready, Inhale, Hold, Exhale, Pause
  const [timer, setTimer] = useState(0)
  const [cycleCount, setCycleCount] = useState(0)
  const [sessionTime, setSessionTime] = useState(0)

  const breatheAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current
  const rippleAnim = useRef(new Animated.Value(0)).current
  const particleAnim = useRef(new Animated.Value(0)).current
  const timerIntervalRef = useRef(null)
  const phaseTimeoutRef = useRef(null)
  const sessionTimerRef = useRef(null)

  const BREATH_PATTERN = [
    { phase: "Inhale", duration: 4, instruction: "Breathe in slowly" },
    { phase: "Hold", duration: 7, instruction: "Hold your breath" },
    { phase: "Exhale", duration: 8, instruction: "Breathe out gently" },
    { phase: "Pause", duration: 2, instruction: "Relax and prepare" },
  ]

  const startBreathingAnimation = () => {
    breatheAnim.setValue(0)
    
    // Main breathing animation
    const breathingLoop = Animated.loop(
      Animated.sequence([
        // Inhale
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: BREATH_PATTERN[0].duration * 1000,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
          useNativeDriver: true,
        }),
        // Hold
        Animated.delay(BREATH_PATTERN[1].duration * 1000),
        // Exhale
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: BREATH_PATTERN[2].duration * 1000,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
          useNativeDriver: true,
        }),
        // Pause
        Animated.delay(BREATH_PATTERN[3].duration * 1000),
      ]),
    )

    // Pulse animation for ambient effect
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    )

    // Ripple animation
    const rippleLoop = Animated.loop(
      Animated.timing(rippleAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    )

    // Particle animation
    const particleLoop = Animated.loop(
      Animated.timing(particleAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    )

    breathingLoop.start()
    pulseLoop.start()
    rippleLoop.start()
    particleLoop.start()
  }

  const stopBreathingAnimation = () => {
    breatheAnim.stopAnimation()
    pulseAnim.stopAnimation()
    rippleAnim.stopAnimation() 
    particleAnim.stopAnimation()
    breatheAnim.setValue(0)
    pulseAnim.setValue(1)
    rippleAnim.setValue(0)
    particleAnim.setValue(0)
  }

  const startTimerAndPhases = () => {
    let currentPhaseIndex = 0
    let currentPhaseTime = 0
    const totalTime = 0

    const runPhase = () => {
      const { phase: currentPhaseName, duration: currentPhaseDuration } = BREATH_PATTERN[currentPhaseIndex]
      setPhase(currentPhaseName)
      setTimer(currentPhaseDuration)
      currentPhaseTime = currentPhaseDuration

      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current)
            currentPhaseIndex = (currentPhaseIndex + 1) % BREATH_PATTERN.length
            if (currentPhaseIndex === 0) {
              setCycleCount((prev) => prev + 1)
            }
            phaseTimeoutRef.current = setTimeout(runPhase, 100) // Small delay to ensure state updates
            return 0 // Reset timer for next phase
          }
          return prev - 1
        })
      }, 1000)
    }

    runPhase()
  }

  const stopTimerAndPhases = () => {
    clearInterval(timerIntervalRef.current)
    clearTimeout(phaseTimeoutRef.current)
    setTimer(0)
    setPhase("Ready")
    setCycleCount(0)
  }

  useEffect(() => {
    if (isBreathing) {
      startBreathingAnimation()
      startTimerAndPhases()
    } else {
      stopBreathingAnimation()
      stopTimerAndPhases()
    }

    return () => {
      stopBreathingAnimation()
      stopTimerAndPhases()
    }
  }, [isBreathing])

  const handleStartStop = () => {
    setIsBreathing((prev) => !prev)
  }

  const handleReset = () => {
    setIsBreathing(false)
    setCycleCount(0)
    setSessionTime(0)
    stopBreathingAnimation()
    stopTimerAndPhases()
  }

  // Animation interpolations
  const circleScale = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.2],
  })

  const circleOpacity = breatheAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.7, 1, 0.7],
  })

  const rippleScale = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  })

  const rippleOpacity = rippleAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.5, 0.2, 0],
  })

  const particleRotation = particleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const currentInstruction = BREATH_PATTERN.find(p => p.phase === phase)?.instruction || "Ready to begin"

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Breathing Exercise</Text>
          <Text style={styles.headerSubtitle}>4-7-8 Relaxation Technique</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{cycleCount}</Text>
          <Text style={styles.statLabel}>Cycles</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatTime(sessionTime)}</Text>
          <Text style={styles.statLabel}>Session Time</Text>
        </View>
      </View>

      {/* Main Breathing Animation */}
      <View style={styles.breathingContainer}>
        {/* Ripple Effect */}
        <Animated.View style={[
          styles.rippleCircle,
          {
            transform: [{ scale: rippleScale }],
            opacity: rippleOpacity,
          }
        ]} />
        
        {/* Particle Ring */}
        <Animated.View style={[
          styles.particleRing,
          { transform: [{ rotate: particleRotation }] }
        ]}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <View
              key={index}
              style={[
                styles.particle,
                {
                  transform: [
                    { rotate: `${index * 60}deg` },
                    { translateY: -120 },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)']}
                style={styles.particleDot}
              />
            </View>
          ))}
        </Animated.View>

        {/* Main Breathing Circle */}
        <Animated.View style={[
          styles.breathingCircle,
          {
            transform: [
              { scale: circleScale },
              { scale: pulseAnim }
            ],
            opacity: circleOpacity,
          }
        ]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)']}
            style={styles.circleGradient}
          />
        </Animated.View>

        {/* Center Content */}
        <View style={styles.centerContent}>
          <Text style={styles.phaseText}>{phase}</Text>
          <Text style={styles.instructionText}>{currentInstruction}</Text>
          {isBreathing && (
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>{timer}</Text>
              <Text style={styles.timerLabel}>seconds</Text>
            </View>
          )}
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleReset}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
            style={styles.buttonGradient}
          >
            <Ionicons name="refresh" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mainButton}
          onPress={handleStartStop}
        >
          <LinearGradient
            colors={isBreathing ? ['#ff6b6b', '#ee5a6f'] : [Colors.primary, Colors.secondary]}
            style={styles.mainButtonGradient}
          >
            <Ionicons 
              name={isBreathing ? "pause" : "play"} 
              size={32} 
              color="white" 
            />
            <Text style={styles.mainButtonText}>
              {isBreathing ? 'Pause' : 'Start'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => {/* Add settings functionality */}}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
            style={styles.buttonGradient}
          >
            <Ionicons name="settings" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Tips Section */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Tips for Better Results</Text>
        <Text style={styles.tipsText}>
          Find a comfortable position, close your eyes, and focus only on your breathing rhythm.
        </Text>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },

  // Stats Section
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 40,
    marginBottom: 40,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 15,
    minWidth: 100,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },

  // Breathing Animation
  breathingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  
  rippleCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  
  particleRing: {
    position: 'absolute',
    width: 240,
    height: 240,
  },
  
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    left: '50%',
    top: '50%',
    marginLeft: -4,
    marginTop: -4,
  },
  
  particleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  breathingCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    position: 'absolute',
  },
  
  circleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  
  centerContent: {
    alignItems: 'center',
    zIndex: 10,
  },
  
  phaseText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'rgba(102, 126, 234, 0.9)',
    marginBottom: 8,
  },
  
  instructionText: {
    fontSize: 16,
    color: 'rgba(102, 126, 234, 0.8)',
    textAlign: 'center',
    marginBottom: 15,
  },
  
  timerContainer: {
    alignItems: 'center',
  },
  
  timerText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'rgba(102, 126, 234, 0.9)',
  },
  
  timerLabel: {
    fontSize: 14,
    color: 'rgba(102, 126, 234, 0.7)',
    marginTop: 4,
  },

  // Controls Section
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 30,
    gap: 20,
  },
  
  resetButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  
  settingsButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  
  buttonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  
  mainButton: {
    width: 120,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  
  mainButtonGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    gap: 8,
  },
  
  mainButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },

  // Tips Section
  tipsContainer: {
    marginHorizontal: 30,
    marginBottom: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 15,
  },
  
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  
  tipsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
})

export default BreathingScreen
