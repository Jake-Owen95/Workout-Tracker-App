
import React from 'react';
import type { Workout, WorkoutSet } from '../types';
import { TrashIcon, TrendingUpIcon, TrendingDownIcon, DuplicateIcon } from './Icons';

interface WorkoutCardProps {
  workout: Workout;
  previousWorkout?: Workout;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const calculateTotalVolume = (w: Workout): number => 
  w.exercises.reduce((acc, ex) => acc + ex.sets.reduce((setAcc, set) => setAcc + (set.reps * set.weight), 0), 0);

const getSetComparison = (
  currentSet: WorkoutSet,
  currentExerciseName: string,
  setIndex: number,
  previousWorkout: Workout | undefined
): { text: string; colorClass: string; } | null => {
  if (!previousWorkout) return null;

  const previousExercise = previousWorkout.exercises.find(
    ex => ex.name.trim().toLowerCase() === currentExerciseName.trim().toLowerCase()
  );
  if (!previousExercise) return { text: 'New Exercise', colorClass: 'text-blue-400' };

  const previousSet = previousExercise.sets[setIndex];
  if (!previousSet) return { text: 'New Set', colorClass: 'text-blue-400' };

  const weightDelta = currentSet.weight - previousSet.weight;
  const repsDelta = currentSet.reps - previousSet.reps;
  const volumeDelta = (currentSet.reps * currentSet.weight) - (previousSet.reps * previousSet.weight);

  if (weightDelta === 0 && repsDelta === 0) {
    return { text: 'No Change', colorClass: 'text-gray-500' };
  }

  const parts = [];
  if (weightDelta !== 0) {
    parts.push(`${weightDelta > 0 ? '+' : ''}${weightDelta} kg`);
  }
  if (repsDelta !== 0) {
    parts.push(`${repsDelta > 0 ? '+' : ''}${repsDelta} reps`);
  }

  return {
    text: parts.join(', '),
    colorClass: volumeDelta >= 0 ? 'text-green-400' : 'text-red-400',
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
    <div className={`flex items-center gap-2 text-xs font-semibold p-2 rounded-lg mb-4 ${bgColorClass} ${colorClass}`}>
      {isUp && <TrendingUpIcon className="h-4 w-4" />}
      {isDown && <TrendingDownIcon className="h-4 w-4" />}
      <span>Total Volume: {sign}{delta.toLocaleString()} kg vs last time</span>
    </div>
  );
};

export const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout, previousWorkout, onDelete, onDuplicate }) => {
  const totalWeight = calculateTotalVolume(workout);

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col justify-between hover:shadow-indigo-500/20 transition-all duration-300 border border-gray-700 hover:border-indigo-500/50 transform hover:-translate-y-1">
      <div>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xl font-bold text-white">{workout.name}</h3>
            <p className="text-sm text-gray-400">{new Date(workout.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => onDuplicate(workout.id)}
              className="text-gray-500 hover:text-indigo-400 transition-colors p-1"
              aria-label={`Duplicate workout ${workout.name}`}
            >
              <DuplicateIcon className="h-5 w-5" />
            </button>
            <button 
              onClick={() => onDelete(workout.id)}
              className="text-gray-500 hover:text-red-500 transition-colors p-1"
              aria-label={`Delete workout ${workout.name}`}
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <OverallPerformance workout={workout} previousWorkout={previousWorkout} />

        <ul className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-2">
          {workout.exercises.map((ex) => (
            <li key={ex.id} className="text-sm text-gray-300">
              <p className="font-semibold text-gray-200 truncate">{ex.name}</p>
              <div className="text-gray-400 font-mono text-xs pl-2 space-y-1 mt-1">
                {ex.sets.map((s, i) => {
                  const comparison = getSetComparison(s, ex.name, i, previousWorkout);
                  return (
                    <div key={s.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-gray-700 rounded-full px-1.5 text-gray-300 text-[10px] w-5 h-5 flex items-center justify-center">{i + 1}</span>
                        <span>{s.reps} reps</span>
                        <span className="text-gray-500">@</span>
                        <span>{s.weight} kg</span>
                      </div>
                      {comparison && <span className={`font-semibold ${comparison.colorClass}`}>{comparison.text}</span>}
                    </div>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-gray-700 pt-4 mt-4 flex justify-around text-center">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Exercises</p>
          <p className="text-lg font-semibold text-indigo-400">{workout.exercises.length}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Total Sets</p>
          <p className="text-lg font-semibold text-indigo-400">{workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Volume (kg)</p>
          <p className="text-lg font-semibold text-indigo-400">{totalWeight.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};
