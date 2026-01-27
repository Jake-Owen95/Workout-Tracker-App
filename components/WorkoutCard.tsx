import React from 'react';
import type { Workout, WorkoutSet } from '../types';
import { TrashIcon, TrendingUpIcon, TrendingDownIcon, DuplicateIcon, TrophyIcon, EditIcon } from './Icons';

interface WorkoutCardProps {
  workout: Workout;
  previousWorkout?: Workout;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onEdit: (id: string) => void;
}

const calculateTotalVolume = (w: Workout): number => 
  w.exercises.reduce((acc, ex) => acc + ex.sets.reduce((setAcc, set) => setAcc + (set.reps * set.weight), 0), 0);

const getSetComparison = (
  currentSet: WorkoutSet,
  currentExerciseName: string,
  setIndex: number,
  previousWorkout: Workout | undefined
): { text: string; colorClass: string; isPR: boolean } | null => {
  if (!previousWorkout) return null;

  const previousExercise = previousWorkout.exercises.find(
    ex => ex.name.trim().toLowerCase() === currentExerciseName.trim().toLowerCase()
  );
  if (!previousExercise) return { text: 'New', colorClass: 'text-blue-400', isPR: false };

  const previousSet = previousExercise.sets[setIndex];
  if (!previousSet) return { text: 'New', colorClass: 'text-blue-400', isPR: false };

  const weightDelta = currentSet.weight - previousSet.weight;
  const repsDelta = currentSet.reps - previousSet.reps;
  const volumeDelta = (currentSet.reps * currentSet.weight) - (previousSet.reps * previousSet.weight);

  const isPR = weightDelta > 0;

  if (weightDelta === 0 && repsDelta === 0) {
    return { text: 'Same', colorClass: 'text-gray-600', isPR: false };
  }

  const parts = [];
  if (weightDelta !== 0) {
    parts.push(`${weightDelta > 0 ? '+' : ''}${weightDelta}kg`);
  }
  if (repsDelta !== 0) {
    parts.push(`${repsDelta > 0 ? '+' : ''}${repsDelta}r`);
  }

  return {
    text: parts.join(', '),
    colorClass: volumeDelta >= 0 ? 'text-green-400' : 'text-red-400',
    isPR,
  };
};

const OverallPerformance: React.FC<{ workout: Workout, previousWorkout?: Workout }> = ({ workout, previousWorkout }) => {
  if (!previousWorkout) return null;

  const currentVolume = calculateTotalVolume(workout);
  const previousVolume = calculateTotalVolume(previousWorkout);
  const delta = currentVolume - previousVolume;

  const isUp = delta > 0;
  const isDown = delta < 0;
  
  const colorClass = isUp ? 'text-green-400' : isDown ? 'text-red-400' : 'text-gray-400';
  const bgColorClass = isUp ? 'bg-green-500/10' : isDown ? 'bg-red-500/10' : 'bg-gray-500/10';
  const sign = delta > 0 ? '+' : '';

  return (
    <div className={`flex items-center gap-2 text-xs font-bold p-2.5 rounded-xl mb-6 ${bgColorClass} ${colorClass} border border-current/10`}>
      {isUp && <TrendingUpIcon className="h-4 w-4" />}
      {isDown && <TrendingDownIcon className="h-4 w-4" />}
      <span>{sign}{delta.toLocaleString()} kg total volume vs last</span>
    </div>
  );
};

export const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout, previousWorkout, onDelete, onDuplicate, onEdit }) => {
  const totalWeight = calculateTotalVolume(workout);

  return (
    <div className="bg-gray-900/50 rounded-[2rem] p-7 flex flex-col justify-between hover:bg-gray-900 transition-all duration-500 border border-white/5 hover:border-indigo-500/30 group shadow-xl">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors">{workout.name}</h3>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
              {new Date(workout.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(workout.id)}
              className="text-gray-600 hover:text-indigo-400 transition-all p-2 hover:bg-white/5 rounded-xl"
              aria-label="Edit workout"
            >
              <EditIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDuplicate(workout.id)}
              className="text-gray-600 hover:text-indigo-400 transition-all p-2 hover:bg-white/5 rounded-xl"
              aria-label="Repeat workout"
            >
              <DuplicateIcon className="h-5 w-5" />
            </button>
            <button 
              onClick={() => onDelete(workout.id)}
              className="text-gray-600 hover:text-red-500 transition-all p-2 hover:bg-white/5 rounded-xl"
              aria-label="Delete"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <OverallPerformance workout={workout} previousWorkout={previousWorkout} />

        <ul className="space-y-4 mb-6">
          {workout.exercises.map((ex) => (
            <li key={ex.id} className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
              <p className="font-bold text-gray-200 text-sm mb-3 flex items-center justify-between">
                <span>{ex.name}</span>
                {ex.sets.some((s, i) => getSetComparison(s, ex.name, i, previousWorkout)?.isPR) && (
                  <span className="bg-yellow-500/10 text-yellow-500 text-[10px] px-2 py-0.5 rounded-full border border-yellow-500/20 flex items-center gap-1">
                    <TrophyIcon className="h-3 w-3" /> PR
                  </span>
                )}
              </p>
              <div className="space-y-2">
                {ex.sets.map((s, i) => {
                  const comp = getSetComparison(s, ex.name, i, previousWorkout);
                  return (
                    <div key={s.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-600 font-mono w-4">#{i + 1}</span>
                        <div className="flex items-center gap-1 font-mono">
                          <span className="text-gray-300 font-bold">{s.reps}</span>
                          <span className="text-gray-600">×</span>
                          <span className="text-gray-300 font-bold">{s.weight}</span>
                          <span className="text-gray-600 text-[10px] ml-0.5">KG</span>
                        </div>
                      </div>
                      {comp && (
                        <div className="flex items-center gap-1.5">
                           {comp.isPR && <TrophyIcon className="h-3 w-3 text-yellow-500" />}
                           <span className={`font-mono font-bold tracking-tighter ${comp.colorClass}`}>
                            {comp.text}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-6 border-t border-white/5">
        <div className="text-center">
          <p className="text-[10px] text-gray-600 font-black uppercase tracking-tighter mb-1">Items</p>
          <p className="text-base font-black text-white">{workout.exercises.length}</p>
        </div>
        <div className="text-center border-x border-white/5 px-2">
          <p className="text-[10px] text-gray-600 font-black uppercase tracking-tighter mb-1">Sets</p>
          <p className="text-base font-black text-white">{workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-600 font-black uppercase tracking-tighter mb-1">Load</p>
          <p className="text-base font-black text-indigo-400">{totalWeight > 999 ? (totalWeight/1000).toFixed(1)+'k' : totalWeight}</p>
        </div>
      </div>
    </div>
  );
};