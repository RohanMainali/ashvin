// API call to get doctor specialty recommendation from AI
export const getDoctorSpecialtyRecommendation = async (analysisResult) => {
  try {
    const { scanType, scanData, llmResponse } = analysisResult;
    
    // Extract key information from the analysis
    const diagnosis = scanData?.diagnosis || '';
    const symptoms = scanData?.symptoms || '';
    const summary = llmResponse?.summary || llmResponse?.analysis || '';
    const conditions = llmResponse?.topConditions || [];
    const scanDetails = llmResponse?.scan_details || '';
    
    // Create a comprehensive prompt for the AI
    const prompt = `Based on this medical analysis, recommend the most appropriate doctor specialty (give ONLY 1-2 words matching these exact specialties: Cardiologist, Dermatologist, Ophthalmologist, General Physician, Emergency Medicine, Endocrinologist, Pulmonologist, Gastroenterologist):

Scan Type: ${scanType}
Diagnosis: ${diagnosis}
Symptoms: ${symptoms}  
Summary: ${summary}
Possible Conditions: ${conditions.join(', ')}
Scan Details: ${scanDetails}

Respond with ONLY the specialty name (1-2 words max), nothing else.`;

    const response = await fetch('http://192.168.91.92:5001/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { 
            role: 'system', 
            content: 'You are a medical AI that recommends doctor specialties. Respond with ONLY the specialty name from this list: Cardiologist, Dermatologist, Ophthalmologist, General Physician, Emergency Medicine, Endocrinologist, Pulmonologist, Gastroenterologist. Give only 1-2 words max.' 
          },
          { role: 'user', content: prompt }
        ],
        maxTokens: 10,
        temperature: 0.1 // Low temperature for consistent responses
      })
    });
    
    const data = await response.json();
    const specialtyRecommendation = data.reply?.trim() || 'General Physician';
    
    console.log('AI recommended specialty:', specialtyRecommendation);
    return specialtyRecommendation;
    
  } catch (error) {
    console.error('Error getting doctor specialty recommendation:', error);
    return 'General Physician'; // Fallback
  }
};

// Helper function to map AI response to exact specialty names in mock data
export const mapToExactSpecialty = (aiResponse) => {
  const response = aiResponse.toLowerCase().trim();
  
  // Mapping variations to exact specialty names
  const specialtyMap = {
    'cardiologist': 'Cardiologist',
    'cardiology': 'Cardiologist',
    'heart': 'Cardiologist',
    'cardiac': 'Cardiologist',
    
    'dermatologist': 'Dermatologist',
    'dermatology': 'Dermatologist',
    'skin': 'Dermatologist',
    
    'ophthalmologist': 'Ophthalmologist',
    'ophthalmology': 'Ophthalmologist',
    'eye': 'Ophthalmologist',
    'eyes': 'Ophthalmologist',
    
    'general physician': 'General Physician',
    'general': 'General Physician',
    'gp': 'General Physician',
    'family': 'General Physician',
    
    'emergency medicine': 'Emergency Medicine',
    'emergency': 'Emergency Medicine',
    'urgent': 'Emergency Medicine',
    
    'endocrinologist': 'Endocrinologist',
    'endocrinology': 'Endocrinologist',
    'diabetes': 'Endocrinologist',
    'hormone': 'Endocrinologist',
    
    'pulmonologist': 'Pulmonologist',
    'pulmonology': 'Pulmonologist',
    'lung': 'Pulmonologist',
    'respiratory': 'Pulmonologist',
    
    'gastroenterologist': 'Gastroenterologist',
    'gastroenterology': 'Gastroenterologist',
    'digestive': 'Gastroenterologist',
    'stomach': 'Gastroenterologist'
  };
  
  // Find exact match or partial match
  for (const [key, specialty] of Object.entries(specialtyMap)) {
    if (response.includes(key) || key.includes(response)) {
      return specialty;
    }
  }
  
  return 'General Physician'; // Default fallback
};
