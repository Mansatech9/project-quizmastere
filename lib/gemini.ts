import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface GeneratedQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  type: 'mcq' | 'true-false';
}

export async function generateQuiz(
  topic: string, 
  difficulty: string, 
  questionCount: number, 
  questionType: string
): Promise<GeneratedQuestion[]> {
  try {
    // Use the correct model name for free tier
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    let typeInstruction = '';
    let optionsInstruction = '';
    
    if (questionType === 'mcq') {
      typeInstruction = 'multiple choice questions with 4 options each';
      optionsInstruction = `"options": ["Option A", "Option B", "Option C", "Option D"],`;
    } else if (questionType === 'true-false') {
      typeInstruction = 'true/false questions';
      optionsInstruction = `"options": ["True", "False"],`;
    } else {
      typeInstruction = 'mixed question types (multiple choice and true/false)';
      optionsInstruction = `"options": ["Option A", "Option B", "Option C", "Option D"] for MCQ or ["True", "False"] for true/false,`;
    }
    
    const fullPrompt = `
      Generate a quiz about "${topic}" with ${difficulty} difficulty level.
      Create exactly ${questionCount} ${typeInstruction}.
      
      Please generate the questions in the following JSON format:
      [
        {
          "question": "Question text here",
          ${optionsInstruction}
          "correctAnswer": 0,
          "type": "${questionType === 'mixed' ? 'mcq' : questionType}"
        }
      ]
      
      Rules:
      - correctAnswer should be the index (0-3 for MCQ, 0-1 for true/false) of the correct option
      - type should be "mcq" for multiple choice questions or "true-false" for true/false questions
      - Make questions educational and engaging for ${difficulty} level
      - Ensure options are plausible but only one is correct
      - Focus specifically on the topic: ${topic}
      - Difficulty level: ${difficulty}
      
      Return only the JSON array, no additional text.
    `;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up the response to extract JSON
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }
    
    const questions = JSON.parse(jsonMatch[0]);
    
    // Validate the structure
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid questions format');
    }
    
    // Ensure we have the right number of questions
    return questions.slice(0, questionCount);
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw new Error('Failed to generate quiz');
  }
}