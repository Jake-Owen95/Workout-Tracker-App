import React, { useState, useEffect } from 'react';
import type { Workout, Exercise, WorkoutSet } from '../types';
import { PlusIcon, TrashIcon, CalendarIcon } from './Icons';

interface WorkoutFormProps {
  onWorkoutAdded: (workout: Omit<Workout, 'id'>) => Promise<void>;
  onWorkoutUpdated?: (id: string, workout: Partial<Workout>) => Promise<void>;
  onCancel: () => void;
  initialWorkout?: Workout | null;
  mode?: 'create' | 'edit' | 'duplicate';
}

// Redefine form types to allow empty strings for better input handling
type FormSet = { reps: number | ""; weight: number | "" };
type FormExercise = { name: string; sets: FormSet[] };

// Changed default sets to be empty strings so placeholders are visible initially
const DEFAULT_EXERCISE: FormExercise = { name: '', sets: [{ reps: "", weight: "" }] };

export const WorkoutForm: React.FC<WorkoutFormProps> = ({ 
  onWorkoutAdded, 
  onWorkoutUpdated,
  onCancel, 
  initialWorkout,
  mode = 'create'
}) => {
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDate, setWorkoutDate] = useState<string>('');
  const [exercises, setExercises] = useState<FormExercise[]>([DEFAULT_EXERCISE]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialWorkout) {
      setWorkoutName(initialWorkout.name);
      
      // Preserve date if editing, otherwise set to now for duplication
      if (mode === 'edit') {
        setWorkoutDate(initialWorkout.date);
      } else {
        setWorkoutDate(new Date().toISOString());
      }

      setExercises(initialWorkout.exercises.map(ex => ({
        name: ex.name,
        sets: ex.sets.map(s => ({ reps: s.reps, weight: s.weight }))
      })));
    } else {
      setWorkoutName('');
      setWorkoutDate(new Date().toISOString());
      setExercises([{ name: '', sets: [{ reps: "", weight: "" }] }]);
    }
  }, [initialWorkout, mode]);


  const handleExerciseNameChange = (exIndex: number, name: string) => {
    const newExercises = [...exercises];
    newExercises[exIndex].name = name;
    setExercises(newExercises);
  };
  
  const handleSetChange = (exIndex: number, setIndex: number, field: keyof FormSet, value: string) => {
    const newExercises = [...exercises];
    
    // If empty string, allow it in state for better UX (shows placeholder)
    if (value === '') {
      newExercises[exIndex].sets[setIndex][field] = '';
      setExercises(newExercises);
      return;
    }

    const numValue = Number(value);
    if (!isNaN(numValue)) {
      newExercises[exIndex].sets[setIndex][field] = Math.max(0, numValue);
      setExercises(newExercises);
    }
  };
  
  const addSet = (exIndex: number) => {
    const newExercises = [...exercises];
    const lastSet = newExercises[exIndex].sets[newExercises[exIndex].sets.length - 1] || { reps: "", weight: "" };
    newExercises[exIndex].sets.push({ ...lastSet });
    setExercises(newExercises);
  };
  
  const removeSet = (exIndex: number, setIndex: number) => {
    const newExercises = [...exercises];
    if (newExercises[exIndex].sets.length > 1) {
      newExercises[exIndex].sets.splice(setIndex, 1);
      setExercises(newExercises);
    }
  };

  const addExercise = () => {
    setExercises([...exercises, { name: '', sets: [{ reps: "", weight: "" }] }]);
  };

  const removeExercise = (index: number) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter((_, i) => i !== index));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'BUTTON' || target.getAttribute('type') !== 'submit') {
        e.preventDefault();
      }
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    if (!workoutName.trim() || exercises.some(ex => !ex.name.trim())) {
      setError('Please fill in the workout name and all exercise names.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const now = Date.now();
    const workoutPayload = {
      name: workoutName,
      date: workoutDate, // Use the state-held date (preserved for edit, new for create/duplicate)
      exercises: exercises.map((ex, exIndex) => ({
        id: `ex-${now}-${exIndex}`,
        name: ex.name,
        sets: ex.sets.map((set, setIndex) => ({
          id: `set-${now}-${exIndex}-${setIndex}`,
          reps: set.reps === "" ? 0 : set.reps,
          weight: set.weight === "" ? 0 : set.weight,
        })),
      })),
    };

    try {
      if (mode === 'edit' && initialWorkout && onWorkoutUpdated) {
        await onWorkoutUpdated(initialWorkout.id, workoutPayload);
      } else {
        await onWorkoutAdded(workoutPayload);
      }
    } catch (err) {
      console.error("Failed to save workout:", err);
      setError(err instanceof Error ? err.message : 'Failed to save workout. Please try again.');
      setIsSaving(false);
    }
  };

  const title = mode === 'edit' ? 'Edit Workout' : mode === 'duplicate' ? `Duplicate: ${initialWorkout?.name}` : 'Log New Workout';
  const submitLabel = mode === 'edit' ? 'Update Workout' : 'Save Workout';
  
  const displayDate = workoutDate 
    ? new Date(workoutDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Loading...';

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 border border-gray-700 max-w-2xl mx-auto" onKeyDown={handleKeyDown}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 rounded-lg border border-gray-600">
          <CalendarIcon className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{displayDate}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="workoutName" className="block text-sm font-medium text-gray-300 mb-2">
            Workout Name
          </label>
          <input
            type="text"
            id="workoutName"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            onFocus={handleInputFocus}
            placeholder="e.g., Push Day, Morning Run"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50 placeholder:text-gray-500"
            required
            disabled={isSaving}
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-gray-200">Exercises</h3>
          {exercises.map((ex, exIndex) => (
            <div key={exIndex} className="bg-gray-700/50 p-4 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <input
                  type="text"
                  value={ex.name}
                  onChange={(e) => handleExerciseNameChange(exIndex, e.target.value)}
                  onFocus={handleInputFocus}
                  placeholder="e.g., Bench Press"
                  className="w-full bg-gray-600 border border-gray-500 rounded-md px-3 py-1.5 text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition font-semibold disabled:opacity-50 placeholder:text-gray-500"
                  required
                  disabled={isSaving}
                />
                {exercises.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExercise(exIndex)}
                    className="ml-4 text-gray-500 hover:text-red-400 p-1 disabled:opacity-50"
                    aria-label="Remove exercise"
                    disabled={isSaving}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {ex.sets.map((set, setIndex) => (
                  <div key={setIndex} className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-400 w-10">Set {setIndex + 1}</span>
                    <input
                        type="number"
                        placeholder="Reps"
                        value={set.reps}
                        onChange={(e) => handleSetChange(exIndex, setIndex, 'reps', e.target.value)}
                        onFocus={handleInputFocus}
                        className="w-full bg-gray-600 border border-gray-500 rounded-md px-3 py-1.5 text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50 placeholder:text-gray-500"
                        disabled={isSaving}
                    />
                    <span className="text-gray-400">x</span>
                    <input
                        type="number"
                        placeholder="Weight"
                        value={set.weight}
                        onChange={(e) => handleSetChange(exIndex, setIndex, 'weight', e.target.value)}
                        onFocus={handleInputFocus}
                        className="w-full bg-gray-600 border border-gray-500 rounded-md px-3 py-1.5 text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50 placeholder:text-gray-500"
                        disabled={isSaving}
                    />
                     <span className="text-sm text-gray-400">kg</span>
                    <button 
                      type="button" 
                      onClick={() => removeSet(exIndex, setIndex)} 
                      className="text-gray-500 hover:text-red-400 disabled:opacity-50 disabled:hover:text-gray-500" 
                      disabled={isSaving || ex.sets.length <= 1}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addSet(exIndex)}
                className="w-full text-sm flex justify-center items-center gap-2 py-1.5 px-4 border border-dashed border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500 rounded-lg transition disabled:opacity-50"
                disabled={isSaving}
              >
                <PlusIcon className="h-4 w-4" /> Add Set
              </button>
            </div>
          ))}
        </div>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={addExercise}
          className="w-full flex justify-center items-center gap-2 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-gray-200 hover:text-white rounded-lg transition font-medium disabled:opacity-50"
          disabled={isSaving}
        >
          <PlusIcon className="h-5 w-5" />
          Add Another Exercise
        </button>

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="py-2 px-6 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition disabled:opacity-50"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="py-2 px-6 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition disabled:bg-indigo-500/50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
};