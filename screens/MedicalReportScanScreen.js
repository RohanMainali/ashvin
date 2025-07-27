import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    StatusBar,
} from "react-native";
import { Colors } from "../constants/colors";
import { createMedicalReportAnalysis } from "../utils/medicalReportApi";
import { uploadImageToImgBB } from "../utils/uploadImage";

const IMGBB_API_KEY = "1d214f9e52b271e1f9f3e8e1ac83eaf5"; // Replace with your real key

const MedicalReportScanScreen = ({ navigation, addHistoryEntry, isDarkMode }) => {
  const { colors } = useTheme();
  const [imageUri, setImageUri] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userContext, setUserContext] = useState("");

  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Camera permission is needed to take photos for report analysis. Please enable it in your device settings."
          );
        }
      }
    })();
  }, []);

  const Card = ({ children, style }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderColorLight }, style]}>
      {children}
    </View>
  );

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleAnalyze = async () => {
    if (!imageUri) {
      Alert.alert("No Image", "Please take a photo or select an image to analyze.");
      return;
    }
    setIsLoading(true);
    try {
      let hostedImageUrl = null;
      try {
        hostedImageUrl = await uploadImageToImgBB(imageUri, IMGBB_API_KEY);
        if (!hostedImageUrl) throw new Error("Image upload failed: No URL returned");
      } catch (uploadErr) {
        console.error("Image upload error:", uploadErr);
        Alert.alert("Image Upload Error", uploadErr.message || "Failed to upload image.");
        setIsLoading(false);
        return;
      }
      const token = await AsyncStorage.getItem("token");
      let response = null;
      try {
        response = await createMedicalReportAnalysis({ imageUrl: hostedImageUrl, userContext }, token);
        console.log("Backend response:", response);
      } catch (apiErr) {
        console.error("Backend API error:", apiErr);
        Alert.alert("Backend Error", apiErr.message || "Failed to analyze report.");
        setIsLoading(false);
        return;
      }
      if (response && response.short_summary) {
        const newEntry = {
          id: response._id || Date.now().toString(),
          date: response.date || new Date().toISOString(),
          scanType: "medical_report",
          scanData: {
            imageUrl: hostedImageUrl,
            short_summary: response.short_summary,
            analysis: response.analysis,
            confidence: response.confidence,
            scan_details: response.scan_details,
            insights: response.insights,
            userContext,
          },
          llmResponse: response,
        };
        if (typeof addHistoryEntry === "function") {
          addHistoryEntry(newEntry);
        }
        navigation.navigate("Results", { result: newEntry });
      } else {
        Alert.alert("Analysis Error", response?.error || "Failed to analyze report.");
      }
    } catch (error) {
      console.error("Report analysis failed", error);
      Alert.alert("Upload/Analysis Error", error.message || "Failed to analyze report. Please try again.");
    } finally {
      setIsLoading(false);
      setImageUri(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <LinearGradient
        colors={isDarkMode ? ['#1a1a1a', '#2d2d2d'] : ['#ffffff', '#f8f9fa']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Report Analysis</Text>
          <TouchableOpacity 
            style={styles.helpButton}
            onPress={() => Alert.alert("Help", "Take a clear photo of your medical report, lab results, or blood test. Ensure good lighting and all text is readable for best analysis.")}
          >
            <Ionicons name="help-circle-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Analysis Card */}
        <LinearGradient
          colors={isDarkMode ? ['#2a2a2a', '#1f1f1f'] : ['#ffffff', '#f5f7fa']}
          style={styles.modernCard}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[Colors.primary + '20', Colors.primary + '10']}
                style={styles.iconBackground}
              >
                <Ionicons name="document-text" size={32} color={Colors.primary} />
              </LinearGradient>
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Medical Report Scanner</Text>
            <Text style={[styles.cardSubtitle, { color: colors.text }]}>
              AI-powered analysis of lab results and medical reports
            </Text>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <View style={styles.instructionItem}>
              <View style={[styles.stepNumber, { backgroundColor: Colors.primary + '20' }]}>
                <Text style={[styles.stepNumberText, { color: Colors.primary }]}>1</Text>
              </View>
              <Text style={[styles.instructionText, { color: colors.text }]}>
                Ensure good lighting and clear text
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={[styles.stepNumber, { backgroundColor: Colors.primary + '20' }]}>
                <Text style={[styles.stepNumberText, { color: Colors.primary }]}>2</Text>
              </View>
              <Text style={[styles.instructionText, { color: colors.text }]}>
                Capture the entire report or relevant section
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={[styles.stepNumber, { backgroundColor: Colors.primary + '20' }]}>
                <Text style={[styles.stepNumberText, { color: Colors.primary }]}>3</Text>
              </View>
              <Text style={[styles.instructionText, { color: colors.text }]}>
                Add context notes for better analysis
              </Text>
            </View>
          </View>

          {/* Context Input */}
          <View style={styles.contextSection}>
            <Text style={[styles.contextLabel, { color: colors.text }]}>Additional Notes (Optional)</Text>
            <LinearGradient
              colors={isDarkMode ? ['#333333', '#2a2a2a'] : ['#f8f9fa', '#ffffff']}
              style={styles.inputContainer}
            >
              <TextInput
                style={[styles.contextInput, { color: colors.text }]}
                placeholder="e.g., 'CBC results', 'liver function test', 'abnormal values highlighted'"
                placeholderTextColor={colors.text + "30"}
                value={userContext}
                onChangeText={setUserContext}
                editable={!isLoading}
                multiline
                numberOfLines={3}
              />
            </LinearGradient>
          </View>

          {/* Image Preview */}
          <View style={styles.imageSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Medical Report Image</Text>
            <View style={styles.imageContainer}>
              {imageUri ? (
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setImageUri(null)}
                  >
                    <Ionicons name="close-circle" size={28} color={Colors.accentRed} />
                  </TouchableOpacity>
                </View>
              ) : (
                <LinearGradient
                  colors={isDarkMode ? ['#333333', '#2a2a2a'] : ['#f8f9fa', '#e9ecef']}
                  style={styles.imagePlaceholder}
                >
                  <Ionicons name="document-attach-outline" size={64} color={colors.text} opacity={0.4} />
                  <Text style={[styles.placeholderText, { color: colors.text }]}>
                    No report selected
                  </Text>
                  <Text style={[styles.placeholderSubtext, { color: colors.text }]}>
                    Take a photo or choose from gallery
                  </Text>
                </LinearGradient>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, { opacity: isLoading ? 0.6 : 1 }]}
                onPress={takePhoto}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.actionButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="camera" size={24} color={Colors.textLight} />
                  <Text style={styles.actionButtonText}>Take Photo</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { opacity: isLoading ? 0.6 : 1 }]}
                onPress={pickImage}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={[Colors.secondary, '#4ade80']}
                  style={styles.actionButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="images" size={24} color={Colors.textLight} />
                  <Text style={styles.actionButtonText}>Gallery</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Analyze Button */}
        {imageUri && (
          <TouchableOpacity
            style={[styles.analyzeContainer, { opacity: isLoading ? 0.6 : 1 }]}
            onPress={handleAnalyze}
            disabled={!imageUri || isLoading}
          >
            <LinearGradient
              colors={[Colors.accentGreen, '#4ade80']}
              style={styles.analyzeButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.textLight} />
              ) : (
                <Ionicons name="analytics" size={24} color={Colors.textLight} />
              )}
              <Text style={styles.analyzeButtonText}>
                {isLoading ? "Analyzing Report..." : "Analyze Medical Report"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Tips Card */}
        <LinearGradient
          colors={isDarkMode ? ['#2a2a2a', '#1f1f1f'] : ['#ffffff', '#f5f7fa']}
          style={styles.tipsCard}
        >
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={24} color={Colors.accentGreen} />
            <Text style={[styles.tipsTitle, { color: colors.text }]}>Tips for Better Results</Text>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.accentGreen} />
              <Text style={[styles.tipText, { color: colors.text }]}>Use good lighting and avoid shadows</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.accentGreen} />
              <Text style={[styles.tipText, { color: colors.text }]}>Ensure all text is clearly readable</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.accentGreen} />
              <Text style={[styles.tipText, { color: colors.text }]}>Include report headers and reference values</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.accentGreen} />
              <Text style={[styles.tipText, { color: colors.text }]}>Add context notes for specific concerns</Text>
            </View>
          </View>
        </LinearGradient>
      </ScrollView>
    </View>
  );
};

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
    fontSize: 24,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  helpButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  modernCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
  },
  instructionsContainer: {
    marginBottom: 24,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },
  contextSection: {
    marginBottom: 24,
  },
  contextLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputContainer: {
    borderRadius: 16,
    padding: 2,
    borderWidth: 1,
    borderColor: '#000000',
  },
  contextInput: {
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: 'top',
    minHeight: 80,
    padding: 16,
    borderRadius: 14,
  },
  imageSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  imageContainer: {
    marginBottom: 20,
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 280,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
  },
  imagePlaceholder: {
    height: 280,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.2)',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    opacity: 0.6,
  },
  placeholderSubtext: {
    fontSize: 14,
    marginTop: 8,
    opacity: 0.5,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
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
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  analyzeContainer: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  analyzeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 32,
  },
  analyzeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  tipsCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipText: {
    fontSize: 15,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});

export default MedicalReportScanScreen;
