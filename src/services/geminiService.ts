import { GoogleGenAI, Type } from "@google/genai";
import { WorkoutProgram, Exercise, Client, LoggedWorkout, AIAssistSuggestion } from '../types';

export const isApiKeySet = !!process.env.API_KEY;

let ai: GoogleGenAI | null = null;

if (isApiKeySet) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
    console.warn("API_KEY environment variable not set. Gemini features will be disabled.");
}

const exerciseSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "The name of the exercise." },
        sets: { type: Type.INTEGER, description: "The number of sets to perform." },
        reps: { type: Type.STRING, description: "The target repetition range (e.g., '8-12' or '15')." },
        rest: { type: Type.STRING, description: "The rest period in seconds after each set (e.g., '60s')." },
        cues: { type: Type.STRING, description: "Short, actionable coaching cues for performing the exercise correctly." },
        prescribedWeight: { type: Type.STRING, description: "The suggested weight for the user, can be a range (e.g., '135-155 lbs') or a percentage." },
        prescribedRpe: { type: Type.STRING, description: "The target Rate of Perceived Exertion, from 1-10." },
    },
    required: ["name", "sets", "reps", "rest"],
};

const workoutSchema = {
  type: Type.OBJECT,
  properties: {
    name: {
      type: Type.STRING,
      description: "A creative and descriptive name for the workout program.",
    },
    description: {
        type: Type.STRING,
        description: "A short, encouraging description of the workout's purpose."
    },
    programNotes: {
        type: Type.STRING,
        description: "General notes or a motivational message for the entire workout program."
    },
    warmup: {
        type: Type.ARRAY,
        description: "A list of warm-up exercises.",
        items: exerciseSchema
    },
    exercises: {
      type: Type.ARRAY,
      description: "The main list of exercises for the workout routine.",
      items: exerciseSchema,
    },
    cooldown: {
        type: Type.ARRAY,
        description: "A list of cool-down or stretching exercises.",
        items: exerciseSchema
    },
  },
  required: ["name", "description", "exercises"],
};

const agenticSuggestionsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            ...workoutSchema.properties,
            reasoning: {
                type: Type.STRING,
                description: "A brief, one-sentence explanation for why this workout is a good suggestion for the user."
            }
        },
        required: [...(workoutSchema.required || []), 'reasoning'],
    }
};

const callGemini = async (prompt: string, schema: any) => {
    if (!ai) {
        console.error("Gemini client not initialized. API key might be missing.");
        return null;
    }
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return null;
    }
};


export const geminiService = {
    generateWorkout: async (prompt: string): Promise<Partial<WorkoutProgram> | null> => {
        const systemPrompt = `Generate a workout program based on the following user request: "${prompt}".`;
        return callGemini(systemPrompt, workoutSchema);
    },

    generateWorkoutFromContent: async (content: string): Promise<Partial<WorkoutProgram> | null> => {
        const systemPrompt = `
            You are a fitness expert AI. A user has provided the following content, which could be a URL or plain text describing a workout.
            Your task is to analyze this content and convert it into a structured JSON object that conforms to the provided schema.
            Extract all relevant details including the program name, description, warm-up exercises, main exercises, and cool-down exercises.
            For each exercise, identify the name, sets, reps, and rest period.
            If the content is a URL, you should fetch the necessary information from the page's main content. If it's plain text, parse it directly.
            Prioritize accuracy in extracting the workout structure.

            User-provided content:
            "${content}"
        `;
        return callGemini(systemPrompt, workoutSchema);
    },

    getAgenticSuggestions: async (client: Client, programs: WorkoutProgram[], history: LoggedWorkout[]): Promise<AIAssistSuggestion[] | null> => {
        const historySummary = history.slice(0, 5).map(h => `- On ${new Date(h.date).toLocaleDateString()}, did "${h.programName}".`).join('\n');
        const prompt = `
            You are an expert personal trainer AI. A trainer is looking for program suggestions for their client, "${client.name}".
            Based on the following context, generate 2-3 new, distinct workout program suggestions that would be a logical next step for this client.

            CONTEXT:
            - Client's Name: ${client.name}
            - Trainer's Private Notes: ${client.notes || 'None'}
            - Currently Assigned Programs: ${programs.map(p => p.name).join(', ') || 'None'}
            - Recent Workout History (last 5):
            ${historySummary || 'No recent history.'}

            Provide a short "reasoning" for each suggestion explaining why it's a good fit.
        `;
        return callGemini(prompt, agenticSuggestionsSchema);
    },
    
    getSoloAgenticSuggestions: async (programs: WorkoutProgram[], history: LoggedWorkout[]): Promise<AIAssistSuggestion[] | null> => {
        const historySummary = history.slice(0, 5).map(h => `- On ${new Date(h.date).toLocaleDateString()}, did "${h.programName}".`).join('\n');
        const prompt = `
            You are an expert personal trainer AI. A solo user is looking for new workout ideas for themself.
            Based on the following context, generate 2-3 new, distinct workout program suggestions that would be a logical next step for them.

            CONTEXT:
            - Their Existing Programs: ${programs.map(p => p.name).join(', ') || 'None'}
            - Their Recent Workout History (last 5):
            ${historySummary || 'No recent history.'}

            Provide a short "reasoning" for each suggestion explaining why it's a good fit.
        `;
         return callGemini(prompt, agenticSuggestionsSchema);
    }
};