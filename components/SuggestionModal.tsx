
import React, { useState } from 'react';
import { getWorkoutSuggestion } from '../services/geminiService';
import type { Workout } from '../types';
import { SparklesIcon, XIcon } from './Icons';
import { WorkoutCard } from './WorkoutCard';

interface SuggestionModalProps {
  onClose: () => void;
  onSuggestionAdded: (workouts: Workout[]) => void;
}

export const SuggestionModal: React.FC<SuggestionModalProps> = ({ onClose, onSuggestionAdded }) => {
  const [prompt, setPrompt] = useState('');
  const [suggestedWorkouts, setSuggestedWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setSuggestedWorkouts([]);

    try {
      const result = await getWorkoutSuggestion(prompt);
      setSuggestedWorkouts(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddPlan = async () => {
    if (suggestedWorkouts.length > 0) {
      await onSuggestionAdded(suggestedWorkouts);
    }
  };

  // Dummy handlers for suggestions view as interactions are for preview only
  const dummyDelete = () => {};
  const dummyDuplicate = () => {};
  const dummyEdit = () => {};

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-3xl border border-gray-700 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <SparklesIcon className="h-7 w-7 text-indigo-400" />
            AI Workout Suggestions
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Describe the workout plan you want</label>
                <textarea
                  id="prompt"
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., 'A 3-day full body workout plan for a beginner' or 'An intense 45-minute leg day workout'"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2.5 px-4 rounded-lg transition disabled:bg-indigo-400/50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : 'Generate Plan'}
              </button>
            </div>

            {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</div>}

            {suggestedWorkouts.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Suggested Plan</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {suggestedWorkouts.map((w) => (
                        /* Added missing onEdit prop to satisfy WorkoutCard component requirements */
                        <WorkoutCard 
                          key={w.id} 
                          workout={w} 
                          onDelete={dummyDelete} 
                          onDuplicate={dummyDuplicate} 
                          onEdit={dummyEdit} 
                        />
                    ))}
                </div>
              </div>
            )}
        </div>

        {suggestedWorkouts.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-700 flex justify-end">
            <button 
              onClick={handleAddPlan}
              className="py-2 px-6 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
            >
              Add This Plan to My Workouts
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
