import React, { useState, useEffect } from 'react';
import type { Workout, Exercise, WorkoutSet } from '../types';
import { PlusIcon, TrashIcon } from './Icons';

interface WorkoutFormProps {
  onWorkoutAdded: (workout: Omit<Workout, 'id'>) => Promise<void>;
  onCancel: () => void;
  templateWorkout?: Workout | null;
}

type FormSet = Omit<WorkoutSet, 'id'>;
type FormExercise = Omit<Exercise, 'id' | 'sets'> & { sets: FormSet[] };

const DEFAULT_EXERCISE: FormExercise = { name: '', sets: [{ reps: 10, weight: 0 }] };

export const WorkoutForm: React.FC<WorkoutFormProps> = ({ onWorkoutAdded, onCancel, templateWorkout }) => {
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState<FormExercise[]>([DEFAULT_EXERCISE]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (templateWorkout) {
      setWorkoutName(templateWorkout.name);
      setExercises(templateWorkout.exercises.map(ex => ({
        name: ex.name,
        sets: ex.sets.map(s => ({ reps: s.reps, weight: s.weight }))
      })));
    } else {
      setWorkoutName('');
      setExercises([{ ...DEFAULT_EXERCISE, sets: [{ reps: 10, weight: 0 }] }]);
    }
  }, [templateWorkout]);


  const handleExerciseNameChange = (exIndex: number, name: string) => {
    const newExercises = [...exercises];
    newExercises[exIndex].name = name;
    setExercises(newExercises);
  };
  
  const handleSetChange = (exIndex: number, setIndex: number, field: keyof FormSet, value: string) => {
    const newExercises = [...exercises];
    const numValue = value === '' ? 0 : Number(value);
    if (!isNaN(numValue) && numValue >= 0) {
      newExercises[exIndex].sets[setIndex][field] = numValue;
      setExercises(newExercises);
    }
  };
  
  const addSet = (exIndex: number) => {
    const newExercises = [...exercises];
    const lastSet = newExercises[exIndex].sets[newExercises[exIndex].sets.length - 1] || { reps: 10, weight: 0 };
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
    setExercises([...exercises, { name: '', sets: [{ reps: 10, weight: 0 }] }]);
  };

  const removeExercise = (index: number) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter((_, i) => i !== index));
    }
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
    const newWorkout: Omit<Workout, 'id'> = {
      name: workoutName,
      date: new Date().toISOString(),
      exercises: exercises.map((ex, exIndex) => ({
        id: `ex-${now}-${exIndex}`,
        name: ex.name,
        sets: ex.sets.map((set, setIndex) => ({
          id: `set-${now}-${exIndex}-${setIndex}`,
          reps: set.reps,
          weight: set.weight,
        })),
      })),
    };

    try {
      await onWorkoutAdded(newWorkout);
    } catch (err) {
      console.error("Failed to save workout:", err);
      setError(err instanceof Error ? err.message : 'Failed to save workout. Please check your connection and try again.');
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 border border-gray-700 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">{templateWorkout ? `Repeat: ${templateWorkout.name}` : 'Log New Workout'}</h2>
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
            placeholder="e.g., Push Day, Morning Run"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50"
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
                  placeholder="e.g., Bench Press"
                  className="w-full bg-gray-600 border border-gray-500 rounded-md px-3 py-1.5 text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition font-semibold disabled:opacity-50"
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
                        className="w-full bg-gray-600 border border-gray-500 rounded-md px-3 py-1.5 text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50"
                        disabled={isSaving}
                    />
                    <span className="text-gray-400">x</span>
                    <input
                        type="number"
                        placeholder="Weight"
                        value={set.weight}
                        onChange={(e) => handleSetChange(exIndex, setIndex, 'weight', e.target.value)}
                        className="w-full bg-gray-600 border border-gray-500 rounded-md px-3 py-1.5 text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50"
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
            ) : 'Save Workout'}
          </button>
        </div>
      </form>
    </div>
  );
};