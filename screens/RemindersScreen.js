import React, { useEffect, useState, useRef } from "react"
import { 
  Alert, 
  Platform, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View,
  Animated,
  Dimensions,
  StatusBar,
  Modal,
  FlatList
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import DateTimePicker from '@react-native-community/datetimepicker'
import { useTheme } from "@react-navigation/native"
import { LinearGradient } from 'expo-linear-gradient'
import {
    createReminder,
    deleteReminder,
    getReminders,
    updateReminder,
} from "../utils/api"
import { Colors } from "../constants/colors"

const { width, height } = Dimensions.get('window')

const RemindersScreen = ({ navigation }) => {
  const { colors } = useTheme()
  const [reminders, setReminders] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newReminderName, setNewReminderName] = useState("")
  const [newReminderTime, setNewReminderTime] = useState(new Date())
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [selectedFrequency, setSelectedFrequency] = useState('daily')
  const [isLoading, setIsLoading] = useState(true)
  
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(100)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current

  const frequencies = [
    { id: 'daily', name: 'Daily', icon: 'calendar', color: '#4CAF50' },
    { id: 'weekly', name: 'Weekly', icon: 'calendar-outline', color: '#2196F3' },
    { id: 'monthly', name: 'Monthly', icon: 'calendar-number', color: '#FF9800' },
    { id: 'once', name: 'Once', icon: 'time', color: '#9C27B0' }
  ]

  useEffect(() => {
    loadReminders()
    animateEntry()
  }, [])

  const animateEntry = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start()
  }

  const loadReminders = async () => {
    try {
      setIsLoading(true)
      const token = await AsyncStorage.getItem("token")
      const response = await getReminders(token)
      if (Array.isArray(response)) {
        setReminders(response)
      } else {
        setReminders([])
      }
    } catch (error) {
      console.error('Error loading reminders:', error)
      setReminders([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddReminder = async () => {
    console.log('handleAddReminder called')
    console.log('Current form state:', {
      name: newReminderName,
      time: newReminderTime,
      frequency: selectedFrequency
    })

    if (!newReminderName.trim()) {
      console.log('Validation failed: empty reminder name')
      Alert.alert("Error", "Please enter a reminder name")
      return
    }

    console.log('Validation passed, proceeding with creation')

    try {
      const token = await AsyncStorage.getItem("token")
      
      console.log('Token retrieved:', token ? 'Token exists' : 'No token found')
      
      if (!token) {
        Alert.alert("Error", "You are not logged in. Please login again.")
        return
      }

      const reminderData = {
        type: "custom",
        message: newReminderName.trim(),
        dateTime: newReminderTime.toISOString(),
        repeat: selectedFrequency,
      }
      
      console.log('Creating reminder with data:', reminderData)
      
      const response = await createReminder(token, reminderData)
      
      console.log('Create reminder response:', response)
      
      // Check for various response formats
      if (response && (response._id || response.id || response.success)) {
        console.log('Reminder created successfully')
        const newReminder = response._id ? response : response.data || response
        setReminders(prev => [...prev, newReminder])
        resetForm()
        setShowAddModal(false)
        Alert.alert("Success", "Reminder created successfully!")
      } else if (response && response.message) {
        console.log('API returned error message:', response.message)
        Alert.alert("Error", response.message)
      } else {
        console.error('Unexpected response format:', response)
        Alert.alert("Error", "Failed to create reminder. Please try again.")
      }
    } catch (error) {
      console.error('Error creating reminder:', error)
      Alert.alert("Error", `Failed to create reminder: ${error.message || 'Unknown error'}`)
    }
  }

  const deleteReminderHandler = async (reminderId) => {
    Alert.alert(
      "Delete Reminder",
      "Are you sure you want to delete this reminder?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token")
              await deleteReminder(token, reminderId)
              setReminders(prev => prev.filter(r => (r._id || r.id) !== reminderId))
              Alert.alert("Success", "Reminder deleted successfully!")
            } catch (error) {
              Alert.alert("Error", "Failed to delete reminder")
            }
          }
        }
      ]
    )
  }

  const resetForm = () => {
    console.log('Resetting form')
    setNewReminderName("")
    setNewReminderTime(new Date())
    setSelectedFrequency('daily')
    console.log('Form reset complete')
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getFrequencyInfo = (frequency) => {
    return frequencies.find(f => f.id === frequency) || frequencies[0]
  }

  const renderReminderCard = ({ item, index }) => {
    const frequencyInfo = getFrequencyInfo(item.repeat || 'daily')
    
    return (
      <Animated.View
        style={[
          styles.reminderCard,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, 50 + (index * 10)],
                })
              },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
          style={styles.cardGradient}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.frequencyBadge, { backgroundColor: frequencyInfo.color + '20' }]}>
              <Ionicons 
                name={frequencyInfo.icon} 
                size={16} 
                color={frequencyInfo.color} 
              />
            </View>
            <TouchableOpacity
              onPress={() => deleteReminderHandler(item._id || item.id)}
              style={styles.deleteBtn}
            >
              <Ionicons name="trash-outline" size={18} color="#FF5722" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.reminderTitle, { color: colors.text }]}>
            {item.message}
          </Text>

          <View style={styles.reminderDetails}>
            <View style={styles.timeInfo}>
              <Ionicons name="time-outline" size={16} color={colors.text} />
              <Text style={[styles.timeText, { color: colors.text }]}>
                {formatTime(item.dateTime)}
              </Text>
            </View>
            
            <View style={styles.frequencyInfo}>
              <Text style={[styles.frequencyText, { color: frequencyInfo.color }]}>
                {frequencyInfo.name}
              </Text>
            </View>
          </View>

          <View style={styles.dateInfo}>
            <Text style={[styles.dateText, { color: colors.text }]}>
              {formatDate(item.dateTime)}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    )
  }

  const EmptyState = () => (
    <Animated.View 
      style={[
        styles.emptyContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
        }
      ]}
    >
      <LinearGradient
        colors={['rgba(108, 92, 231, 0.1)', 'rgba(108, 92, 231, 0.05)']}
        style={styles.emptyCard}
      >
        <View style={styles.emptyIconContainer}>
          <Ionicons name="notifications-outline" size={80} color={Colors.primary} style={{ opacity: 0.3 }} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Reminders Yet</Text>
        <Text style={[styles.emptySubtitle, { color: colors.text }]}>
          Create your first reminder to stay on top of your health goals
        </Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: Colors.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add-circle-outline" size={20} color="white" />
          <Text style={styles.createButtonText}>Create Reminder</Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  )

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <LinearGradient 
        colors={[Colors.primary, Colors.gradientEnd]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Health Reminders</Text>
            <Text style={styles.headerSubtitle}>
              {reminders.length} {reminders.length === 1 ? 'reminder' : 'reminders'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addHeaderButton}
            onPress={() => {
              console.log('Add button pressed, opening modal')
              setShowAddModal(true)
            }}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text }]}>Loading reminders...</Text>
          </View>
        ) : reminders.length === 0 ? (
          <EmptyState />
        ) : (
          <FlatList
            data={reminders}
            keyExtractor={(item) => item._id || item.id}
            renderItem={renderReminderCard}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
          />
        )}
      </View>

      {/* Add Reminder Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={[styles.fullScreenModal, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.simpleModalHeader, { backgroundColor: Colors.primary }]}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setShowAddModal(false)}
            >
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.simpleModalTitle}>New Reminder</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Content */}
          <ScrollView style={styles.simpleModalContent} contentContainerStyle={{ padding: 20 }}>
            {/* Reminder Name */}
            <View style={styles.simpleInputGroup}>
              <Text style={[styles.simpleLabel, { color: colors.text }]}>Reminder Name</Text>
              <TextInput
                style={[styles.simpleInput, { 
                  backgroundColor: colors.card, 
                  borderColor: colors.border,
                  color: colors.text 
                }]}
                value={newReminderName}
                onChangeText={setNewReminderName}
                placeholder="Enter reminder name"
                placeholderTextColor={colors.text + '60'}
              />
            </View>

            {/* Time Selection */}
            <View style={styles.simpleInputGroup}>
              <Text style={[styles.simpleLabel, { color: colors.text }]}>Time</Text>
              <TouchableOpacity
                style={[styles.simpleTimeButton, { 
                  backgroundColor: colors.card, 
                  borderColor: colors.border 
                }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={[styles.simpleTimeText, { color: colors.text }]}>
                  {formatTime(newReminderTime.toISOString())}
                </Text>
                <Ionicons name="time" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Frequency Selection */}
            <View style={styles.simpleInputGroup}>
              <Text style={[styles.simpleLabel, { color: colors.text }]}>Frequency</Text>
              {frequencies.map((freq) => (
                <TouchableOpacity
                  key={freq.id}
                  style={[
                    styles.simpleFrequencyItem,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    selectedFrequency === freq.id && { borderColor: Colors.primary, backgroundColor: Colors.primary + '20' }
                  ]}
                  onPress={() => setSelectedFrequency(freq.id)}
                >
                  <Ionicons 
                    name={freq.icon} 
                    size={24} 
                    color={selectedFrequency === freq.id ? Colors.primary : colors.text} 
                  />
                  <Text style={[
                    styles.simpleFrequencyText,
                    { color: selectedFrequency === freq.id ? Colors.primary : colors.text }
                  ]}>
                    {freq.name}
                  </Text>
                  {selectedFrequency === freq.id && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Bottom Button */}
          <View style={[styles.simpleModalFooter, { backgroundColor: colors.background }]}>
            <TouchableOpacity
              style={[styles.createReminderBtn, { backgroundColor: Colors.primary }]}
              onPress={() => {
                console.log('Simple modal create pressed')
                handleAddReminder()
              }}
            >
              <Text style={styles.createReminderBtnText}>Create Reminder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={newReminderTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowTimePicker(false)
            if (selectedDate) {
              setNewReminderTime(selectedDate)
            }
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  addHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  listContainer: {
    paddingVertical: 20,
    paddingBottom: 100,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyCard: {
    width: '100%',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
    marginBottom: 30,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },

  // Reminder Cards
  reminderCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    backgroundColor: 'white',
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  frequencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 24,
  },
  reminderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  frequencyInfo: {
    alignItems: 'flex-end',
  },
  frequencyText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateInfo: {
    alignItems: 'flex-start',
  },
  dateText: {
    fontSize: 13,
    opacity: 0.6,
  },

  // Simple Modal Styles
  fullScreenModal: {
    flex: 1,
  },
  simpleModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtn: {
    padding: 5,
  },
  simpleModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  simpleModalContent: {
    flex: 1,
  },
  simpleInputGroup: {
    marginBottom: 25,
  },
  simpleLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  simpleInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  simpleTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  simpleTimeText: {
    fontSize: 16,
  },
  simpleFrequencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 10,
  },
  simpleFrequencyText: {
    fontSize: 16,
    marginLeft: 15,
    flex: 1,
  },
  simpleModalFooter: {
    padding: 20,
    paddingBottom: 40,
  },
  createReminderBtn: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createReminderBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Old Modal Styles (keeping for reference)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
    maxHeight: 500,
  },

  // Form Inputs
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },

  // Time Selector
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  timeSelectorText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Frequency Selection
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  frequencyButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal Actions
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 30,
    paddingBottom: 10,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
})

export default RemindersScreen
