import React, { useState, useCallback } from 'react';
import { signOut } from 'firebase/auth.js';
import { auth } from './firebase';
import { useAuth } from './contexts/AuthContext';
import { useWorkouts } from './hooks/useWorkouts';
import type { Workout } from './types';
import { WorkoutForm } from './components/WorkoutForm';
import { SuggestionModal } from './components/SuggestionModal';
import { DumbbellIcon, SparklesIcon, PlusIcon, LogOutIcon } from './components/Icons';
import { WorkoutCard } from './components/WorkoutCard';
import { AuthPage } from './components/AuthPage';

type View = 'list' | 'form';

const WorkoutTracker: React.FC = () => {
  const { workouts, addWorkout, deleteWorkout, loading } = useWorkouts();
  const { currentUser } = useAuth();
  const [currentView, setCurrentView] = useState<View>('list');
  const [workoutTemplate, setWorkoutTemplate] = useState<Workout | null>(null);
  const [isSuggestionModalOpen, setSuggestionModalOpen] = useState(false);

  const handleShowForm = () => {
    setWorkoutTemplate(null);
    setCurrentView('form');
  };

  const handleWorkoutAdded = useCallback(async (workout: Omit<Workout, 'id'>) => {
    await addWorkout(workout);
    setCurrentView('list');
    setWorkoutTemplate(null);
  }, [addWorkout]);

  const handleCancelForm = () => {
    setCurrentView('list');
    setWorkoutTemplate(null);
  };

  const handleDuplicateWorkout = useCallback((workoutId: string) => {
    const template = workouts.find(w => w.id === workoutId);
    if (template) {
      setWorkoutTemplate(template);
      setCurrentView('form');
    }
  }, [workouts]);

  const handleSuggestionAdded = useCallback(async (suggestedWorkouts: Workout[]) => {
    for (const workout of suggestedWorkouts) {
      const { id, ...workoutData } = workout; // Strip client-side ID before saving
      await addWorkout(workoutData);
    }
    setSuggestionModalOpen(false);
    setCurrentView('list');
  }, [addWorkout]);

  // Workouts from the hook are already sorted by date descending
  const sortedWorkouts = workouts;

  // Create a map to easily find the previous workout
  const workoutHistory: { [key: string]: Workout[] } = {};
  [...sortedWorkouts].reverse().forEach(workout => {
    if (!workoutHistory[workout.name]) {
      workoutHistory[workout.name] = [];
    }
    workoutHistory[workout.name].push(workout);
  });

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <DumbbellIcon className="h-8 w-8 text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Gemini Fitness
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSuggestionModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition-transform transform hover:scale-105"
            >
              <SparklesIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Get Suggestions</span>
            </button>
            <div className="flex items-center gap-2">
               <span className="hidden md:inline text-sm text-gray-300 truncate">{currentUser?.email}</span>
                <button
                    onClick={() => signOut(auth)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                    aria-label="Log out"
                >
                    <LogOutIcon className="h-5 w-5" />
                </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {currentView === 'list' && (
          <div>
            <h2 className="text-3xl font-bold mb-6 text-white">Your Workouts</h2>
            {loading ? (
              <div className="text-center py-16"><p className="text-gray-400">Loading workouts...</p></div>
            ) : sortedWorkouts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedWorkouts.map((workout, index) => {
                  const history = workoutHistory[workout.name] || [];
                  const currentIndex = history.findIndex(w => w.id === workout.id);
                  const previousWorkout = currentIndex > 0 ? history[currentIndex - 1] : undefined;

                  return (
                    <WorkoutCard 
                      key={workout.id} 
                      workout={workout} 
                      previousWorkout={previousWorkout}
                      onDelete={deleteWorkout}
                      onDuplicate={handleDuplicateWorkout}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 px-6 bg-gray-800 rounded-xl">
                <p className="text-gray-400 text-lg">No workouts logged yet.</p>
                <p className="text-gray-500 mt-2">Click the '+' button to add your first one!</p>
              </div>
            )}
          </div>
        )}

        {currentView === 'form' && (
          <WorkoutForm 
            onWorkoutAdded={handleWorkoutAdded} 
            onCancel={handleCancelForm}
            templateWorkout={workoutTemplate}
          />
        )}
      </main>

      {currentView === 'list' && (
        <button
          onClick={handleShowForm}
          className="fixed bottom-6 right-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full p-4 shadow-2xl transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 z-20"
          aria-label="Add new workout"
        >
          <PlusIcon className="h-8 w-8" />
        </button>
      )}

      {isSuggestionModalOpen && (
        <SuggestionModal
          onClose={() => setSuggestionModalOpen(false)}
          onSuggestionAdded={handleSuggestionAdded}
        />
      )}
    </div>
  );
};


const App: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DumbbellIcon className="h-12 w-12 text-indigo-400 animate-pulse" />
      </div>
    );
  }

  return currentUser ? <WorkoutTracker /> : <AuthPage />;
};

export default App;