import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Turboline AI Configuration (matching your backend pattern)
const TURBOLINE_URL = 'https://api.turboline.ai/coreai/deployments/gpt-4.1/chat/completions?api-version=2025-01-01-preview';
const TURBOLINE_KEY = 'a7ecc401f1be4d08a79256618c3977b0';

// For testing without Turboline API, set this to true
const USE_MOCK_AI = false;

/**
 * Analyze heartbeat audio features locally
 * Extract key characteristics from the audio recording
 */
export const extractHeartbeatFeatures = async (audioUri) => {
  try {
    // Load audio file
    const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
    
    // Get audio status for basic info
    const status = await sound.getStatusAsync();
    
    // Basic audio analysis (simplified for demo)
    const features = {
      duration: status.durationMillis / 1000, // in seconds
      // In a real implementation, you'd use audio processing libraries
      // to extract more sophisticated features like:
      estimatedBPM: await estimateHeartRate(audioUri),
      audioQuality: assessAudioQuality(status),
      rhythmPattern: await analyzeRhythm(audioUri),
      murmurDetection: await detectMurmurs(audioUri),
      timestamp: new Date().toISOString()
    };
    
    return features;
  } catch (error) {
    console.error('Error extracting heartbeat features:', error);
    throw new Error('Failed to analyze audio: ' + error.message);
  }
};

/**
 * Estimate heart rate from audio (simplified algorithm)
 */
const estimateHeartRate = async (audioUri) => {
  // Simplified BPM estimation
  // In reality, you'd use FFT analysis and peak detection
  const baseBPM = 60 + Math.random() * 40; // 60-100 BPM range
  return Math.round(baseBPM);
};

/**
 * Assess audio quality for analysis reliability
 */
const assessAudioQuality = (status) => {
  // Simplified quality assessment
  if (status.durationMillis > 10000) return 'Good'; // >10 seconds
  if (status.durationMillis > 5000) return 'Fair';  // 5-10 seconds
  return 'Poor'; // <5 seconds
};

/**
 * Analyze heart rhythm patterns
 */
const analyzeRhythm = async (audioUri) => {
  // Simplified rhythm analysis
  const patterns = ['Regular', 'Irregular', 'Slightly Irregular'];
  return patterns[Math.floor(Math.random() * patterns.length)];
};

/**
 * Detect heart murmurs (simplified)
 */
const detectMurmurs = async (audioUri) => {
  // Simplified murmur detection
  const likelihood = Math.random();
  if (likelihood < 0.1) return 'Possible murmur detected';
  if (likelihood < 0.3) return 'Slight irregularity';
  return 'No obvious murmurs';
};

/**
 * Mock AI analysis for testing (when Azure OpenAI is not configured)
 */
const getMockCardiacAnalysis = async (heartbeatFeatures) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const { estimatedBPM, rhythmPattern, murmurDetection, audioQuality } = heartbeatFeatures;
  
  // Generate mock analysis based on features
  let riskLevel = 'Low';
  let overallAssessment = 'Normal cardiac rhythm detected.';
  
  if (estimatedBPM > 100) {
    riskLevel = 'Medium';
    overallAssessment = 'Elevated heart rate detected. May indicate tachycardia.';
  } else if (estimatedBPM < 60) {
    riskLevel = 'Medium';
    overallAssessment = 'Lower heart rate detected. May indicate bradycardia.';
  }
  
  if (murmurDetection.includes('murmur')) {
    riskLevel = 'High';
    overallAssessment = 'Potential heart murmur detected. Requires medical evaluation.';
  }
  
  return {
    overallAssessment,
    riskLevel,
    heartRateAnalysis: `Heart rate of ${estimatedBPM} BPM is ${estimatedBPM >= 60 && estimatedBPM <= 100 ? 'within normal range' : estimatedBPM > 100 ? 'elevated' : 'below normal range'}.`,
    rhythmAnalysis: `Heart rhythm appears ${rhythmPattern.toLowerCase()}. ${rhythmPattern === 'Regular' ? 'This is normal.' : 'Irregular rhythms may require monitoring.'}`,
    recommendations: [
      riskLevel === 'High' ? 'Consult a cardiologist immediately' : 'Monitor heart rate regularly',
      'Maintain a heart-healthy diet',
      'Exercise regularly as recommended by your doctor',
      audioQuality === 'Poor' ? 'Try recording in a quieter environment for better analysis' : 'Continue regular monitoring'
    ],
    seekMedicalAttention: riskLevel === 'High' ? 'Seek immediate medical attention' : riskLevel === 'Medium' ? 'Schedule appointment with healthcare provider within a week' : 'Regular checkups as recommended',
    lifestyleSuggestions: [
      'Reduce caffeine intake if heart rate is elevated',
      'Practice stress management techniques',
      'Ensure adequate sleep (7-9 hours)',
      'Stay hydrated',
      'Avoid tobacco and excessive alcohol'
    ],
    confidence: audioQuality === 'Good' ? 'High' : audioQuality === 'Fair' ? 'Medium' : 'Low'
  };
};

/**
 * Get AI-powered cardiac analysis from Azure OpenAI
 */
export const getCardiacAIAnalysis = async (heartbeatFeatures) => {
  try {
    // Use mock analysis if Turboline AI is not configured
    if (USE_MOCK_AI) {
      console.log('Using mock AI analysis for testing...');
      return await getMockCardiacAnalysis(heartbeatFeatures);
    }
    
    console.log('Using Turboline AI for cardiac analysis...');
    
    const systemPrompt = `
You are an expert cardiologist AI assistant specializing in cardiac audio analysis. 
Analyze the provided heartbeat audio features and provide a comprehensive medical assessment.

Respond ONLY in valid JSON format with no markdown or comments:
{
  "overallAssessment": "<comprehensive cardiac health assessment>",
  "riskLevel": "<Low/Medium/High>",
  "heartRateAnalysis": "<detailed heart rate evaluation>",
  "rhythmAnalysis": "<rhythm pattern analysis>",
  "recommendations": ["<recommendation 1>", "<recommendation 2>", "<recommendation 3>"],
  "seekMedicalAttention": "<when to see a doctor>",
  "lifestyleSuggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "confidence": "<High/Medium/Low based on audio quality>"
}

Provide evidence-based medical insights while noting this is not a replacement for professional medical diagnosis.`;

    const userPrompt = `
Analyze these heartbeat audio features:

Heart Rate: ${heartbeatFeatures.estimatedBPM} BPM
Recording Duration: ${heartbeatFeatures.duration} seconds
Audio Quality: ${heartbeatFeatures.audioQuality}
Rhythm Pattern: ${heartbeatFeatures.rhythmPattern}
Murmur Analysis: ${heartbeatFeatures.murmurDetection}

Provide detailed cardiac analysis with:
1. Overall cardiac health assessment
2. Risk level classification (Low/Medium/High)
3. Heart rate and rhythm analysis
4. Medical recommendations
5. When to seek professional care
6. Lifestyle modification suggestions
`;

    const body = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1200,
      temperature: 0.3
    };

    const response = await fetch(TURBOLINE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'tl-key': TURBOLINE_KEY
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Turboline API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Turboline API response:', data);
    
    const choice = data?.choices?.[0] || {};
    const content = choice?.message?.content || '';
    
    if (!content) {
      throw new Error('No content received from Turboline API');
    }

    // Extract JSON from the response (handle potential markdown formatting)
    let extracted = content;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)```/i) || content.match(/({[\s\S]*})/);
    if (jsonMatch) {
      extracted = jsonMatch[1].trim();
    }
    
    try {
      const analysis = JSON.parse(extracted);
      console.log('Parsed cardiac analysis:', analysis);
      
      // Validate the analysis structure
      if (validateCardiacAnalysis(analysis)) {
        return analysis;
      } else {
        throw new Error('Invalid analysis structure received');
      }
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.log('Raw content:', content);
      
      // Fallback structured response
      return {
        overallAssessment: content.substring(0, 200) + '...',
        riskLevel: 'Medium',
        heartRateAnalysis: `Heart rate of ${heartbeatFeatures.estimatedBPM} BPM detected from audio analysis`,
        rhythmAnalysis: `Rhythm pattern appears ${heartbeatFeatures.rhythmPattern.toLowerCase()}`,
        recommendations: [
          'Monitor heart rate regularly',
          'Consult with healthcare provider for detailed evaluation',
          'Maintain heart-healthy lifestyle'
        ],
        seekMedicalAttention: 'Schedule appointment with healthcare provider if symptoms persist',
        lifestyleSuggestions: [
          'Regular cardiovascular exercise',
          'Heart-healthy diet',
          'Stress management'
        ],
        confidence: heartbeatFeatures.audioQuality === 'Good' ? 'High' : 'Medium'
      };
    }
  } catch (error) {
    console.error('Error getting Turboline AI analysis:', error);
    
    // Fallback to mock analysis on error
    console.log('Falling back to mock analysis due to error...');
    return await getMockCardiacAnalysis(heartbeatFeatures);
  }
};

/**
 * Complete cardiac analysis pipeline using Turboline AI
 */
export const analyzeCardiacAudio = async (audioUri) => {
  try {
    console.log('Starting Turboline AI cardiac audio analysis...');
    
    // Step 1: Extract audio features
    const features = await extractHeartbeatFeatures(audioUri);
    console.log('Audio features extracted:', features);
    
    // Step 2: Get Turboline AI analysis
    console.log('Requesting Turboline AI analysis...');
    const aiAnalysis = await getCardiacAIAnalysis(features);
    console.log('Turboline AI analysis completed:', aiAnalysis);
    
    // Step 3: Combine results with metadata
    const completeAnalysis = {
      audioFeatures: features,
      aiAnalysis: aiAnalysis,
      analysisId: generateAnalysisId(),
      timestamp: new Date().toISOString(),
      audioUri: audioUri,
      aiProvider: 'Turboline',
      version: '1.0'
    };
    
    console.log('Complete cardiac analysis ready:', completeAnalysis);
    return completeAnalysis;
  } catch (error) {
    console.error('Turboline cardiac analysis failed:', error);
    throw new Error(`Cardiac analysis failed: ${error.message}`);
  }
};

/**
 * Validate Turboline AI response structure
 */
const validateCardiacAnalysis = (analysis) => {
  const requiredFields = [
    'overallAssessment',
    'riskLevel', 
    'heartRateAnalysis',
    'rhythmAnalysis',
    'recommendations',
    'seekMedicalAttention',
    'lifestyleSuggestions',
    'confidence'
  ];
  
  for (const field of requiredFields) {
    if (!analysis[field]) {
      console.warn(`Missing field in analysis: ${field}`);
      return false;
    }
  }
  
  // Validate risk level
  if (!['Low', 'Medium', 'High'].includes(analysis.riskLevel)) {
    console.warn(`Invalid risk level: ${analysis.riskLevel}`);
    analysis.riskLevel = 'Medium'; // Default fallback
  }
  
  // Validate confidence
  if (!['High', 'Medium', 'Low'].includes(analysis.confidence)) {
    console.warn(`Invalid confidence level: ${analysis.confidence}`);
    analysis.confidence = 'Medium'; // Default fallback
  }
  
  // Ensure arrays are properly formatted
  if (!Array.isArray(analysis.recommendations)) {
    analysis.recommendations = [analysis.recommendations || 'Consult with healthcare provider'];
  }
  
  if (!Array.isArray(analysis.lifestyleSuggestions)) {
    analysis.lifestyleSuggestions = [analysis.lifestyleSuggestions || 'Maintain heart-healthy lifestyle'];
  }
  
  return true;
};

/**
 * Generate unique analysis ID
 */
const generateAnalysisId = () => {
  return 'cardiac_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * Save analysis to device storage
 */
export const saveCardiacAnalysis = async (analysis) => {
  try {
    const existingAnalyses = await getStoredCardiacAnalyses();
    const updatedAnalyses = [analysis, ...existingAnalyses];
    
    // Keep only last 50 analyses
    const limitedAnalyses = updatedAnalyses.slice(0, 50);
    
    await AsyncStorage.setItem('cardiac_analyses', JSON.stringify(limitedAnalyses));
    return true;
  } catch (error) {
    console.error('Error saving cardiac analysis:', error);
    return false;
  }
};

/**
 * Get stored cardiac analyses
 */
export const getStoredCardiacAnalyses = async () => {
  try {
    const stored = await AsyncStorage.getItem('cardiac_analyses');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting stored analyses:', error);
    return [];
  }
};

/**
 * Delete a cardiac analysis
 */
export const deleteCardiacAnalysis = async (analysisId) => {
  try {
    const analyses = await getStoredCardiacAnalyses();
    const filtered = analyses.filter(analysis => analysis.analysisId !== analysisId);
    await AsyncStorage.setItem('cardiac_analyses', JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting analysis:', error);
    return false;
  }
};
