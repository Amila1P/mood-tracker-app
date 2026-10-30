// Database Type Definitions

export interface MoodEntry {
    id?: number;
    mood_type: string;
    intensity: number; // 1-10
    note?: string;
    created_at: string;
}

export interface Activity {
    id?: number;
    name: string;
    icon_name: string;
}

export interface MoodActivity {
    id?: number;
    mood_id: number;
    activity_id: number;
}

export interface MoodWithActivities extends MoodEntry {
    activities: Activity[];
}

export interface NewMoodEntry {
    mood_type: string;
    intensity: number;
    note?: string;
    activity_ids: number[];
}
