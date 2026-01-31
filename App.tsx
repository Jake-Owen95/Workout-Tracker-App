import React, { useState, useCallback, useMemo } from 'react';
// @ts-ignore
import { signOut } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';
import { useAuth } from './contexts/AuthContext';
import { useWorkouts } from './hooks/useWorkouts';
import type { Workout } from './types';
import { WorkoutForm } from './components/WorkoutForm';
import { SuggestionModal } from './components/SuggestionModal';
import { DumbbellIcon, SparklesIcon, PlusIcon, LogOutIcon, FireIcon, WeightIcon, CalendarIcon } from './components/Icons';
import { WorkoutCard } from './components/WorkoutCard';
import { AuthPage } from './components/AuthPage';

type FormMode = 'create' | 'edit' | 'duplicate';

const calculateTotalVolume = (w: Workout): number => 
  w.exercises.reduce((acc, ex) => acc + ex.sets.reduce((setAcc, set) => setAcc + (set.reps * set.weight), 0), 0);

const WorkoutTracker: React.FC = () => {
  const { workouts, addWorkout, updateWorkout, deleteWorkout, loading, error: fetchError } = useWorkouts();
  const { currentUser } = useAuth();
  const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [targetWorkout, setTargetWorkout] = useState<Workout | null>(null);
  const [isSuggestionModalOpen, setSuggestionModalOpen] = useState(false);

  const handleShowForm = () => {
    setTargetWorkout(null);
    setFormMode('create');
    setCurrentView('form');
  };

  const handleWorkoutAdded = useCallback(async (workout: Omit<Workout, 'id'>) => {
    await addWorkout(workout);
    setCurrentView('list');
    setTargetWorkout(null);
  }, [addWorkout]);

  const handleWorkoutUpdated = useCallback(async (id: string, workout: Partial<Workout>) => {
    await updateWorkout(id, workout);
    setCurrentView('list');
    setTargetWorkout(null);
  }, [updateWorkout]);

  const handleCancelForm = () => {
    setCurrentView('list');
    setTargetWorkout(null);
  };

  const handleDuplicateWorkout = useCallback((workoutId: string) => {
    const template = workouts.find(w => w.id === workoutId);
    if (template) {
      setTargetWorkout(template);
      setFormMode('duplicate');
      setCurrentView('form');
    }
  }, [workouts]);

  const handleEditWorkout = useCallback((workoutId: string) => {
    const existing = workouts.find(w => w.id === workoutId);
    if (existing) {
      setTargetWorkout(existing);
      setFormMode('edit');
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

  // Comprehensive stats calculation
  const stats = useMemo(() => {
    if (workouts.length === 0) return { streak: 0, totalVolume: 0, weeklyWorkouts: 0 };

    // Volume calculation
    const totalVolume = workouts.reduce((acc, w) => acc + calculateTotalVolume(w), 0);

    // Weekly count
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyWorkouts = workouts.filter(w => new Date(w.date) >= weekAgo).length;

    // Streak calculation
    const dateStrings = workouts.map(w => new Date(w.date).toDateString());
    const sortedDates = Array.from(new Set(dateStrings))
      .map((d: string) => new Date(d).getTime())
      .sort((a, b) => b - a);

    let streak = 0;
    const oneDay = 24 * 60 * 60 * 1000;
    const today = new Date().toDateString();
    const latestWorkoutDate = new Date(sortedDates[0]).toDateString();
    
    const diffToToday = Math.abs(new Date(today).getTime() - new Date(latestWorkoutDate).getTime());
    
    if (diffToToday <= oneDay) {
        for (let i = 0; i < sortedDates.length; i++) {
            if (i === 0) {
                streak++;
                continue;
            }
            const diff = sortedDates[i-1] - sortedDates[i];
            if (diff <= oneDay) {
                streak++;
            } else {
                break;
            }
        }
    }

    return { streak, totalVolume, weeklyWorkouts };
  }, [workouts]);

  const workoutHistory: { [key: string]: Workout[] } = {};
  [...workouts].reverse().forEach(workout => {
    if (!workoutHistory[workout.name]) {
      workoutHistory[workout.name] = [];
    }
    workoutHistory[workout.name].push(workout);
  });

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-indigo-500/30 pb-24">
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

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setSuggestionModalOpen(true)}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white font-semibold py-2.5 px-3 sm:px-4 rounded-xl transition-all border border-white/10 active:scale-95"
            >
              <SparklesIcon className="h-4 w-4 text-indigo-400" />
              <span className="hidden md:inline">Ask Gemini</span>
            </button>

            <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

            <button
                onClick={() => signOut(auth)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                aria-label="Log out"
            >
                <LogOutIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-10 max-w-7xl">
        {currentView === 'list' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              <div className="bg-gradient-to-br from-indigo-600/20 to-indigo-900/10 p-6 rounded-[2rem] border border-indigo-500/20 shadow-xl">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400"><WeightIcon className="h-6 w-6" /></div>
                    <span className="text-[10px] font-black text-indigo-400/60 uppercase tracking-widest">Lifetime</span>
                </div>
                <p className="text-3xl font-black text-white">{(stats.totalVolume/1000).toFixed(1)}k <span className="text-sm font-normal text-gray-500">KG</span></p>
                <p className="text-sm text-gray-500 mt-1 font-medium">Total Volume Moved</p>
              </div>

              <div className="bg-gray-900/50 p-6 rounded-[2rem] border border-white/5 shadow-xl">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-orange-500/20 rounded-xl text-orange-400"><FireIcon className="h-6 w-6" /></div>
                    <span className="text-[10px] font-black text-orange-400/60 uppercase tracking-widest">Active</span>
                </div>
                <p className="text-3xl font-black text-white">{stats.streak} <span className="text-sm font-normal text-gray-500">DAYS</span></p>
                <p className="text-sm text-gray-500 mt-1 font-medium">Current Streak</p>
              </div>

              <div className="bg-gray-900/50 p-6 rounded-[2rem] border border-white/5 shadow-xl">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-green-500/20 rounded-xl text-green-400"><CalendarIcon className="h-6 w-6" /></div>
                    <span className="text-[10px] font-black text-green-400/60 uppercase tracking-widest">7 Days</span>
                </div>
                <p className="text-3xl font-black text-white">{stats.weeklyWorkouts}</p>
                <p className="text-sm text-gray-500 mt-1 font-medium">Sessions This Week</p>
              </div>

              <div className="bg-gray-900/50 p-6 rounded-[2rem] border border-white/5 shadow-xl">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400"><DumbbellIcon className="h-6 w-6" /></div>
                    <span className="text-[10px] font-black text-blue-400/60 uppercase tracking-widest">History</span>
                </div>
                <p className="text-3xl font-black text-white">{workouts.length}</p>
                <p className="text-sm text-gray-500 mt-1 font-medium">Total Sessions</p>
              </div>
            </div>

            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-4xl font-black text-white tracking-tight">Recent Activity</h2>
              </div>
            </div>
            
            {fetchError && (
              <div className="mb-10 p-8 bg-red-950/20 border border-red-500/30 rounded-3xl text-red-50 shadow-2xl">
                <h3 className="text-2xl font-black mb-4">Database Connection Required</h3>
                <p className="text-lg opacity-90">{fetchError}</p>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-6">
                <div className="h-20 w-20 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
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
                      onEdit={handleEditWorkout}
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
                <p className="text-gray-500 max-w-md mx-auto mb-10 text-lg">Your workout history will appear here once you log your first lift.</p>
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
              onWorkoutUpdated={handleWorkoutUpdated}
              onCancel={handleCancelForm}
              initialWorkout={targetWorkout}
              mode={formMode}
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

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 p-10 text-center">
        <div className="bg-red-500/10 p-6 rounded-full mb-8">
           <DumbbellIcon className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-3xl font-black text-white mb-4 uppercase tracking-tight">Configuration Required</h1>
        <p className="text-gray-400 max-w-md mb-8 leading-relaxed">
          Your Firebase environment variables (API Key, Project ID, etc.) are missing or invalid. 
          Please check your <code className="bg-white/5 px-2 py-1 rounded text-indigo-400">.env</code> file or GitHub Secrets.
        </p>
        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 text-left w-full max-w-lg">
           <p className="text-xs font-black text-gray-500 uppercase mb-4 tracking-widest">Expected Variables:</p>
           <ul className="text-xs font-mono space-y-2 text-gray-300">
             <li>• VITE_FIREBASE_API_KEY</li>
             <li>• VITE_FIREBASE_PROJECT_ID</li>
             <li>• VITE_FIREBASE_AUTH_DOMAIN</li>
           </ul>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950">
        <DumbbellIcon className="h-16 w-16 text-indigo-500 animate-pulse mb-8" />
        <div className="w-64 h-1.5 bg-gray-900 rounded-full overflow-hidden border border-white/5">
          <div className="w-1/2 h-full bg-gradient-to-r from-indigo-600 to-indigo-400 animate-[loading_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    );
  }

  return currentUser ? <WorkoutTracker /> : <AuthPage />;
};

export default App;