import { db } from './firebase-config.js';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    getDocs,
    deleteDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const USERS_COLLECTION = 'users';
const UID_KEY = 'fitpulseUid';

function userDocRef(uid) {
    return doc(db, USERS_COLLECTION, uid);
}

export function getStoredUid() {
    return localStorage.getItem(UID_KEY);
}

export function setStoredUid(uid) {
    if (uid) localStorage.setItem(UID_KEY, uid);
}

export async function ensureUserDocument(uid, userData = {}) {
    if (!uid) return;
    const ref = userDocRef(uid);
    const snap = await getDoc(ref); // check first!!
    if (snap.exists()) return; 

    await setDoc(ref, {
        profile: {
            fullName: userData.fullName || 'FitPulse Member',
            email: userData.email || '',
            profilePic: userData.profilePic || '',
            memberSince: userData.memberSince || '',
            age: userData.age || 0,
            height: userData.height || 0,
            weight: userData.weight || 0,
            isDeactivated: false,
        },
        goals: {
            weeklyWorkouts: 0,
            dailySteps: 0,
            dailyCalories: 0,
            dailyWater:0
        },
        privacy: {
            profileVisibility: false,
            dataSharing: false,
            locationTracking: false,
            googleHealth: false
        },
        updatedAt: serverTimestamp()
    }, { merge: true });
}

export async function deleteUserDocument(uid) {
    if (!uid) return;
    await deleteDoc(userDocRef(uid));
}

export async function loadUserProfile(uid) {
    if (!uid) return null;
    const snap = await getDoc(userDocRef(uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return data.profile || null;
}

export async function saveUserProfile(uid, profile) {
    if (!uid) return;
    await setDoc(userDocRef(uid), {
        profile,
        updatedAt: serverTimestamp()
    }, { merge: true });
}

export async function loadGoals(uid) {
    if (!uid) return null;
    const snap = await getDoc(userDocRef(uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return data.goals || null;
}

export async function saveGoals(uid, goals) {
    if (!uid) return;
    await setDoc(userDocRef(uid), {
        goals,
        updatedAt: serverTimestamp()
    }, { merge: true });
}

export async function logWeight(uid, weight) {
    if (!uid) return;
    const snap = await getDoc(userDocRef(uid));
    if (!snap.exists()) return;
    const date = new Date().toISOString().split('T')[0]; // "2026-05-30"
    const weightLogRef = doc(db, 'users', uid, 'weightLogs', date);
    await setDoc(weightLogRef, {
        weight,
        date,
        updatedAt: serverTimestamp()
    })
}

export async function getWeightLogs(uid) {
    if (!uid) return null;
    const snap = await getDoc(userDocRef(uid));
    if (!snap.exists()) return null;
    const weightLogRef = collection(db, 'users', uid, 'weightLogs');
    const logSnap = await getDocs(weightLogRef);
    return logSnap.docs
        .map(doc => doc.data())
        .sort((a, b) => new Date(a.date) - new Date(b.date));
}

export async function loadPrivacySettings(uid) {
    if (!uid) return null;
    const snap = await getDoc(userDocRef(uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return data.privacy || null;
}

export async function savePrivacySettings(uid, privacy) {
    if (!uid) return;
    await setDoc(userDocRef(uid), {
        privacy,
        updatedAt: serverTimestamp()
    }, { merge: true });
}

export async function submitFeedback(uid, feedback) {
    if (!uid) return;
    const date = new Date().toISOString().split('T')[0];
    const feedbackRef = doc(db, 'users', uid, 'feedback', date);
    await setDoc(feedbackRef, {
        rating: feedback.rating,
        text: feedback.text,
        updatedAt: serverTimestamp()
    });
}

export async function loadFitnessLogs(uid) {
    if (!uid) return [];
    const snap = await getDoc(userDocRef(uid));
    if (!snap.exists()) return [];
    const data = snap.data();
    return Array.isArray(data.fitnessLogs) ? data.fitnessLogs : [];
}

export async function saveFitnessLogs(uid, logs) {
    if (!uid) return;
    await setDoc(userDocRef(uid), {
        fitnessLogs: logs,
        updatedAt: serverTimestamp()
    }, { merge: true });
}

export async function loadNutritionState(uid) {
    if (!uid) return null;
    const snap = await getDoc(userDocRef(uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return data.nutrition || null;
}

export async function saveNutritionState(uid, nutritionState) {
    if (!uid) return;
    await setDoc(userDocRef(uid), {
        nutrition: nutritionState,
        updatedAt: serverTimestamp()
    }, { merge: true });
}

function calorieHistoryDocRef(uid, dateKey) {
    return doc(db, USERS_COLLECTION, uid, 'calorieHistory', dateKey);
}

export async function saveCalorieHistoryDay(uid, dateKey, { consumed, goal }) {
    if (!uid || !dateKey) return;
    await setDoc(calorieHistoryDocRef(uid, dateKey), {
        date: dateKey,
        consumed: Math.max(0, Math.round(consumed)),
        goal: Math.max(0, Math.round(goal)),
        updatedAt: serverTimestamp()
    }, { merge: true });
}
