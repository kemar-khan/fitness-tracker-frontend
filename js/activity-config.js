'use strict';

/**
 * activity-config.js
 * Central source of truth for all activity types, MET values, icons, and emojis.
 * Import from this file instead of hardcoding activity strings anywhere else.
 */

// All supported activity types shown in dropdowns
export const ACTIVITY_TYPES = [
    "Walking",
    "Running",
    "Cycling",
    "Swimming",
    "Workout",
    "Yoga",
    "Hiking",
    "Jump Rope",
    "Dancing",
    "Basketball",
    "Football",
    "Badminton",
    "Strength Training",
    "HIIT",
    "Stair Climbing"
];

/**
 * MET (Metabolic Equivalent of Task) values per activity type.
 * Used in the formula: Calories = MET × weight(kg) × duration(hours)
 *
 * Legacy types (Steps, Other) are kept so old Firestore documents
 * still calculate calories correctly when loaded.
 */
export const MET_VALUES = {
    Walking: 3.5,
    Running: 8,
    Cycling: 7,
    Swimming: 6,
    Workout: 5,
    Yoga: 2.5,
    Hiking: 6,
    "Jump Rope": 10,
    Dancing: 4.5,
    Basketball: 6.5,
    Football: 7,
    Badminton: 5.5,
    "Strength Training": 6,
    HIIT: 9,
    "Stair Climbing": 8.8,
    // Legacy — backward compat with older Firestore documents
    Steps: 3.5,
    Other: 4
};

// Bootstrap Icon class names for the activity card icon box
export const ACTIVITY_ICONS = {
    Walking: "bi-person-walking",
    Running: "bi-lightning-charge",
    Cycling: "bi-bicycle",
    Swimming: "bi-water",
    Workout: "bi-lightning-charge",
    Yoga: "bi-heart",
    Hiking: "bi-map",
    "Jump Rope": "bi-arrow-repeat",
    Dancing: "bi-music-note",
    Basketball: "bi-trophy",
    Football: "bi-trophy",
    Badminton: "bi-activity",
    "Strength Training": "bi-bar-chart-fill",
    HIIT: "bi-fire",
    "Stair Climbing": "bi-arrow-up-circle",
    // Legacy fallbacks
    Steps: "bi-person-walking",
    Other: "bi-activity"
};

// Emoji shown beside the activity type badge on each card
export const ACTIVITY_EMOJIS = {
    Walking: "🚶",
    Running: "🏃",
    Cycling: "🚴",
    Swimming: "🏊",
    Workout: "💪",
    Yoga: "🧘",
    Hiking: "🥾",
    "Jump Rope": "🪢",
    Dancing: "💃",
    Basketball: "🏀",
    Football: "⚽",
    Badminton: "🏸",
    "Strength Training": "🏋️",
    HIIT: "🔥",
    "Stair Climbing": "🪜"
};

// Maps legacy activity type strings to their modern equivalent.
// Used when loading old Firestore documents into the edit form.
export const LEGACY_TYPE_MAP = {
    Steps: "Walking",
    Other: "Workout"
};

// Placeholder text for the Steps input, keyed by activity type.
// Activities where step-counting is common get a specific hint;
// everything else gets a generic "Optional" prompt.
export const STEPS_PLACEHOLDERS = {
    Walking: "Enter total steps (e.g. 8,000)",
    Running: "Optional running steps",
    Hiking: "Optional hiking steps",
    Football: "Optional steps",
    Basketball: "Optional steps",
    "Stair Climbing": "Optional steps",
    _default: "Optional"
};
