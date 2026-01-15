import React, { useState, useCallback, useMemo } from 'react';
import { signOut } from 'firebase/auth.js';
import { auth } from './firebase';
import { useAuth } from './contexts/AuthContext';
import { useWorkouts } from './hooks/useWorkouts';
import type { Workout } from './types';
import { WorkoutForm } from './components/WorkoutForm';
import { SuggestionModal } from './components/SuggestionModal';
import { DumbbellIcon, SparklesIcon, PlusIcon, LogOutIcon, FireIcon } from './components/Icons';
import { WorkoutCard } from './components/WorkoutCard';
import { AuthPage } from './components/AuthPage';

type View = 'list' | 'form';

const WorkoutTracker: React.FC = () => {
  const { workouts, addWorkout, deleteWorkout, loading, error: fetchError } = useWorkouts();
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
      const { id, ...workoutData } = workout;
      await addWorkout(workoutData);
    }
    setSuggestionModalOpen(false);
    setCurrentView('list');
  }, [addWorkout]);

  // Calculate streak
  const streak = useMemo(() => {
    if (workouts.length === 0) return 0;
    const sortedDates = [...new Set(workouts.map(w => new Date(w.date).toDateString()))]
      .map(d => new Date(d).getTime())
      .sort((a, b) => b - a);

    let currentStreak = 0;
    const oneDay = 24 * 60 * 60 * 1000;
    const today = new Date().toDateString();
    const latestWorkoutDate = new Date(sortedDates[0]).toDateString();
    
    // Check if latest workout was today or yesterday to maintain streak
    const diffToToday = Math.abs(new Date(today).getTime() - new Date(latestWorkoutDate).getTime());
    if (diffToToday > oneDay) return 0;

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        currentStreak++;
        continue;
      }
      const diff = sortedDates[i-1] - sortedDates[i];
      if (diff <= oneDay) {
        currentStreak++;
      } else {
        break;
      }
    }
    return currentStreak;
  }, [workouts]);

  const workoutHistory: { [key: string]: Workout[] } = {};
  [...workouts].reverse().forEach(workout => {
    if (!workoutHistory[workout.name]) {
      workoutHistory[workout.name] = [];
    }
    workoutHistory[workout.name].push(workout);
  });

  const isIndexError = fetchError?.toLowerCase().includes('index');

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-indigo-500/30">
      <header className="bg-gray-900/80 backdrop-blur-xl sticky top-0 z-30 shadow-2xl border-b border-white/5">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <DumbbellIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white uppercase sm:text-2xl">
                LWJ <span className="text-indigo-400">Tracker</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-6">
            {streak > 0 && (
              <div className="flex items-center gap-1.5 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
                <FireIcon className="h-4 w-4 text-orange-500 animate-pulse" />
                <span className="text-sm font-bold text-orange-400">{streak} Day Streak</span>
              </div>
            )}
            
            <button
              onClick={() => setSuggestionModalOpen(true)}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all border border-white/10 active:scale-95"
            >
              <SparklesIcon className="h-4 w-4 text-indigo-400" />
              <span className="hidden md:inline">Ask Gemini</span>
            </button>

            <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

            <div className="flex items-center gap-3">
                <button
                    onClick={() => signOut(auth)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                    aria-label="Log out"
                >
                    <LogOutIcon className="h-5 w-5" />
                </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-10 max-w-7xl">
        {currentView === 'list' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-4xl font-black text-white tracking-tight">Activity</h2>
                <p className="text-gray-500 mt-1">Keep crushing your goals.</p>
              </div>
            </div>
            
            {fetchError && (
              <div className="mb-10 p-8 bg-red-950/20 border border-red-500/30 rounded-3xl text-red-50 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-red-500 rounded-2xl p-2 shadow-lg shadow-red-500/20">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-black">Database Connection Required</h3>
                </div>

                {isIndexError ? (
                  <div className="space-y-6">
                    <p className="text-red-200/80 leading-relaxed text-lg">Your data is safe, but we need to optimize the sorting on the server.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <span className="block text-indigo-400 font-bold mb-1">Step 1</span>
                        <p className="text-sm">Press <kbd className="bg-gray-800 px-1.5 py-0.5 rounded border border-gray-600">F12</kbd> to open the Console.</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <span className="block text-indigo-400 font-bold mb-1">Step 2</span>
                        <p className="text-sm">Click the <strong>Firebase Console link</strong> in the error message.</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <span className="block text-indigo-400 font-bold mb-1">Step 3</span>
                        <p className="text-sm">Click <strong className="text-white">Create Index</strong> and wait 2 mins.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-lg opacity-90">{fetchError}</p>
                )}
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-6">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                  <DumbbellIcon className="h-8 w-8 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-gray-400 font-medium tracking-wide uppercase text-xs">Syncing your gains...</p>
              </div>
            ) : workouts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {workouts.map((workout) => {
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
            ) : !fetchError && (
              <div className="text-center py-32 px-6 bg-gray-900 rounded-[3rem] border-2 border-dashed border-gray-800 flex flex-col items-center">
                <div className="bg-indigo-500/10 w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-inner">
                   <PlusIcon className="h-10 w-10 text-indigo-500" />
                </div>
                <h3 className="text-3xl font-black text-white mb-4">Ready for your first session?</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-10 text-lg">Your workout history will appear here once you log your first lift. Use the plus button to get started.</p>
                <button 
                  onClick={handleShowForm}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-2xl shadow-indigo-600/30 active:scale-95"
                >
                  Log My First Workout
                </button>
              </div>
            )}
          </div>
        )}

        {currentView === 'form' && (
          <div className="animate-in zoom-in-95 duration-300">
            <WorkoutForm 
              onWorkoutAdded={handleWorkoutAdded} 
              onCancel={handleCancelForm}
              templateWorkout={workoutTemplate}
            />
          </div>
        )}
      </main>

      {currentView === 'list' && (
        <button
          onClick={handleShowForm}
          className="fixed bottom-10 right-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(79,70,229,0.3)] transition-all transform hover:scale-110 active:scale-90 z-40 group"
          aria-label="Add new workout"
        >
          <PlusIcon className="h-10 w-10 group-hover:rotate-90 transition-transform duration-500" />
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950">
        <DumbbellIcon className="h-16 w-16 text-indigo-500 animate-pulse mb-8" />
        <div className="w-64 h-1.5 bg-gray-900 rounded-full overflow-hidden border border-white/5">
          <div className="w-1/2 h-full bg-gradient-to-r from-indigo-600 to-indigo-400 animate-[loading_1.5s_ease-in-out_infinite]" />
        </div>
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    );
  }

  return currentUser ? <WorkoutTracker /> : <AuthPage />;
};

export default App;