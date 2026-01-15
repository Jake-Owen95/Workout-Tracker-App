import { GoogleGenAI, Type } from "@google/genai";
import type { Workout } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const workoutPlanSchema = {
  type: Type.ARRAY,
  description: "A list of workout sessions that form a complete workout plan.",
  items: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: "The name of the workout session, e.g., 'Day 1: Upper Body' or 'Leg Day'."
      },
      exercises: {
        type: Type.ARRAY,
        description: "A list of exercises to be performed in this workout session.",
        items: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "The name of the exercise, e.g., 'Barbell Bench Press'."
            },
            sets: {
              type: Type.ARRAY,
              description: "A list of sets for this exercise, detailing target reps and weight for each.",
              items: {
                type: Type.OBJECT,
                properties: {
                  reps: {
                    type: Type.INTEGER,
                    description: "The number of repetitions for this set."
                  },
                  weight: {
                    type: Type.INTEGER,
                    description: "The suggested starting weight in kilograms for this set. Use 0 for bodyweight exercises."
                  }
                },
                required: ["reps", "weight"]
              }
            }
          },
          required: ["name", "sets"]
        }
      }
    },
    required: ["name", "exercises"]
  }
};


export async function getWorkoutSuggestion(userPrompt: string): Promise<Workout[]> {
  const prompt = `
    Based on the user's request, create a structured workout plan. 
    The plan should be returned as a JSON array of workout objects. 
    Each workout object should have a name and a list of exercises. 
    Each exercise should have a name and a list of sets.
    Each set should have target 'reps' and 'weight' in kg (use 0 for bodyweight exercises).
    For a typical strength exercise, provide 3-4 sets.
    
    User Request: "${userPrompt}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: workoutPlanSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedResult = JSON.parse(jsonText);

    if (!Array.isArray(parsedResult)) {
        throw new Error("API did not return a valid workout plan array.");
    }
    
    // Add IDs and dates to match our Workout type
    const workouts: Workout[] = parsedResult.map((workout: any, index: number) => {
        const date = new Date();
        date.setDate(date.getDate() + index); // Stagger dates for multi-day plans
        return {
            id: `${Date.now()}-${index}`,
            name: workout.name,
            date: date.toISOString(),
            exercises: workout.exercises.map((ex: any, exIndex: number) => ({
                id: `${Date.now()}-${index}-${exIndex}`,
                name: ex.name,
                sets: ex.sets.map((set: any, setIndex: number) => ({
                    id: `${Date.now()}-${index}-${exIndex}-${setIndex}`,
                    reps: set.reps,
                    weight: set.weight,
                })),
            }))
        };
    });

    return workouts;
  } catch (error) {
    console.error("Error generating workout suggestion:", error);
    throw new Error("Failed to get workout suggestion from AI. Please try again.");
  }
}