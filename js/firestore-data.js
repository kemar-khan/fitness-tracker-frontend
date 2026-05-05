import { db } from './firebase-config.js';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
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
    await setDoc(ref, {
        profile: {
            fullName: userData.fullName || 'FitPulse Member',
            email: userData.email || '',
            profilePic: userData.profilePic || '',
            memberSince: userData.memberSince || ''
        },
        updatedAt: serverTimestamp()
    }, { merge: true });
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

export async function loadFitnessLogs(uid) {
    if (!uid) return [];
    const snap = await getDoc(userDocRef(uid));
    if (!snap.exists()) return [];
    const data = snap.data();
    return Array.isArray(data.fitnessLogs) ? data.fitnessLogs : [];
}

export async function saveFitnessLogs(uid, logs) {
    if (!uid) return;
    await updateDoc(userDocRef(uid), {
        fitnessLogs: logs,
        updatedAt: serverTimestamp()
    });
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
