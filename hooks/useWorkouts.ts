
import { useState, useEffect, useCallback } from 'react';
// @ts-ignore
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, orderBy, where, FirestoreError } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Workout } from '../types';

export const useWorkouts = () => {
    const { currentUser } = useAuth();
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!currentUser) {
            setWorkouts([]);
            setLoading(false);
            return;
        }

        setError(null);
        const workoutsCollectionRef = collection(db, 'workouts');
        const q = query(
            workoutsCollectionRef, 
            where("userId", "==", currentUser.uid), 
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot: any) => {
            const workoutsData = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
            })) as Workout[];
            setWorkouts(workoutsData);
            setLoading(false);
        }, (err: FirestoreError) => {
            console.error("Firestore Subscription Error:", err);
            if (err.code === 'permission-denied') {
                setError("Permission denied. Please check your Firestore Security Rules.");
            } else if (err.message.includes("requires an index")) {
                setError("This view requires a Firestore Index. Check the console for the link to create it.");
            } else {
                setError(err.message);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const addWorkout = useCallback(async (workout: Omit<Workout, 'id'>) => {
        if (!currentUser) throw new Error("No user logged in");
        const workoutData = { 
            ...workout, 
            userId: currentUser.uid,
            createdAt: new Date().toISOString()
        };
        const workoutsCollectionRef = collection(db, 'workouts');
        try {
            await addDoc(workoutsCollectionRef, workoutData);
        } catch (err: any) {
            if (err.code === 'permission-denied') {
                throw new Error("Permission denied: Ensure you've updated your Firebase Security Rules.");
            }
            throw err;
        }
    }, [currentUser]);

    const updateWorkout = useCallback(async (id: string, workout: Partial<Workout>) => {
        if (!currentUser) throw new Error("No user logged in");
        const workoutDocRef = doc(db, 'workouts', id);
        try {
            await updateDoc(workoutDocRef, {
                ...workout,
                updatedAt: new Date().toISOString()
            });
        } catch (err: any) {
            console.error("Update failed:", err);
            throw err;
        }
    }, [currentUser]);

    const deleteWorkout = useCallback(async (workoutId: string) => {
        if (!currentUser) throw new Error("No user logged in");
        const workoutDocRef = doc(db, 'workouts', workoutId);
        await deleteDoc(workoutDocRef);
    }, [currentUser]);

    return { workouts, addWorkout, updateWorkout, deleteWorkout, loading, error };
};
