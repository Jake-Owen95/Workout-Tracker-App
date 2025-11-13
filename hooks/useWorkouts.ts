import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore.js';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Workout } from '../types';

export const useWorkouts = () => {
    const { currentUser } = useAuth();
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setWorkouts([]);
            setLoading(false);
            return;
        }

        const workoutsCollectionRef = collection(db, 'workouts');
        const q = query(workoutsCollectionRef, where("userId", "==", currentUser.uid), orderBy('date', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const workoutsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Workout[];
            setWorkouts(workoutsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching workouts:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const addWorkout = useCallback(async (workout: Omit<Workout, 'id'>) => {
        if (!currentUser) throw new Error("No user logged in");
        const workoutData = { ...workout, userId: currentUser.uid };
        const workoutsCollectionRef = collection(db, 'workouts');
        await addDoc(workoutsCollectionRef, workoutData);
    }, [currentUser]);

    const deleteWorkout = useCallback(async (workoutId: string) => {
        if (!currentUser) throw new Error("No user logged in");
        const workoutDocRef = doc(db, 'workouts', workoutId);
        await deleteDoc(workoutDocRef);
    }, [currentUser]);

    return { workouts, addWorkout, deleteWorkout, loading };
};