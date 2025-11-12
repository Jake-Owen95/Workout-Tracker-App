
export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id:string;
  name: string;
  date: string; // ISO string format
  exercises: Exercise[];
}
