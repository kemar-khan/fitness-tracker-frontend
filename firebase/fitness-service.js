import { db } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    onSnapshot, 
    query, 
    orderBy, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * Adds a new activity log to Firestore.
 */
export async function addActivity(uid, activityData) {
    const activitiesRef = collection(db, 'users', uid, 'activities');
    return await addDoc(activitiesRef, {
        ...activityData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
}

/**
 * Updates an existing activity log.
 */
export async function updateActivity(uid, activityId, activityData) {
    const activityRef = doc(db, 'users', uid, 'activities', activityId);
    return await updateDoc(activityRef, {
        ...activityData,
        updatedAt: serverTimestamp()
    });
}

/**
 * Deletes an activity log.
 */
export async function deleteActivity(uid, activityId) {
    const activityRef = doc(db, 'users', uid, 'activities', activityId);
    return await deleteDoc(activityRef);
}

/**
 * Listens for real-time changes to the activities collection.
 */
export function subscribeToActivities(uid, callback, errorCallback) {
    const activitiesRef = collection(db, 'users', uid, 'activities');
    // Simplified query to avoid index requirements for now
    const q = query(activitiesRef, orderBy('date', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
        const activities = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(activities);
    }, (error) => {
        console.error("Error subscribing to activities:", error);
        if (errorCallback) errorCallback(error);
    });
}
