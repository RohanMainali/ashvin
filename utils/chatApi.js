// Real API call to backend chat endpoint
export const chatWithAshvin = async (prompt, conversationHistory = []) => {
  try {
    // Convert conversation history to the format expected by the API
    const messages = [
      { role: 'system', content: 'You are Ashvin, a helpful AI health assistant. Provide accurate, helpful health information while reminding users to consult healthcare professionals for medical advice.' }
    ];
    
    // Add conversation history
    conversationHistory.forEach(msg => {
      if (msg.sender === 'user') {
        messages.push({ role: 'user', content: msg.text });
      } else if (msg.sender === 'bot') {
        messages.push({ role: 'assistant', content: msg.text });
      }
    });
    
    // Add the current prompt
    messages.push({ role: 'user', content: prompt });

    const response = await fetch('http://192.168.91.92:5001/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages,
        maxTokens: 500
      })
    });
    const data = await response.json();
    return { response: data.reply };
  } catch (error) {
    return { response: 'Sorry, I could not process your request. Please try again.' };
  }
};
