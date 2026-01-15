import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, where, FirestoreError } from 'firebase/firestore.js';
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
        // This query requires a Composite Index in Firebase: userId (Asc), date (Desc)
        const q = query(
            workoutsCollectionRef, 
            where("userId", "==", currentUser.uid), 
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const workoutsData = snapshot.docs.map(doc => ({
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
            createdAt: new Date().toISOString() // Useful for internal tracking
        };
        const workoutsCollectionRef = collection(db, 'workouts');
        try {
            await addDoc(workoutsCollectionRef, workoutData);
        } catch (err: any) {
            if (err.code === 'permission-denied') {
                throw new Error("Permission denied: Ensure you've updated your Firebase Security Rules in the console.");
            }
            throw err;
        }
    }, [currentUser]);

    const deleteWorkout = useCallback(async (workoutId: string) => {
        if (!currentUser) throw new Error("No user logged in");
        const workoutDocRef = doc(db, 'workouts', workoutId);
        await deleteDoc(workoutDocRef);
    }, [currentUser]);

    return { workouts, addWorkout, deleteWorkout, loading, error };
};