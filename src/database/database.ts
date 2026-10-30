import SQLite from 'react-native-sqlite-storage';
import { MoodEntry, Activity, MoodWithActivities, NewMoodEntry } from './types';

// Enable promise API
SQLite.enablePromise(true);

const DATABASE_NAME = 'MoodTracker.db';
const DATABASE_VERSION = '1.0';
const DATABASE_DISPLAY_NAME = 'Mood Tracker Database';
const DATABASE_SIZE = 200000;

let databaseInstance: SQLite.SQLiteDatabase | null = null;

/**
 * SQL CREATE TABLE Queries
 */

// 1. Moods Table - Stores daily mood entries
const CREATE_MOODS_TABLE = `
  CREATE TABLE IF NOT EXISTS moods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mood_type TEXT NOT NULL,
    intensity INTEGER NOT NULL CHECK(intensity >= 1 AND intensity <= 10),
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
`;

// 2. Activities Table - Master list of activities
const CREATE_ACTIVITIES_TABLE = `
  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    icon_name TEXT NOT NULL
  );
`;

// 3. Mood_Activities Table - Junction table for Many-to-Many relationship
const CREATE_MOOD_ACTIVITIES_TABLE = `
  CREATE TABLE IF NOT EXISTS mood_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mood_id INTEGER NOT NULL,
    activity_id INTEGER NOT NULL,
    FOREIGN KEY (mood_id) REFERENCES moods(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    UNIQUE(mood_id, activity_id)
  );
`;

// Create indexes for better query performance
const CREATE_INDEXES = [
    `CREATE INDEX IF NOT EXISTS idx_moods_created_at ON moods(created_at DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_mood_activities_mood_id ON mood_activities(mood_id);`,
    `CREATE INDEX IF NOT EXISTS idx_mood_activities_activity_id ON mood_activities(activity_id);`,
];

/**
 * Get or create database connection
 */
export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
    if (databaseInstance) {
        return databaseInstance;
    }

    try {
        const db = await SQLite.openDatabase({
            name: DATABASE_NAME,
            location: 'default',
        });

        console.log('Database opened successfully');
        databaseInstance = db;
        await createTables(db);
        return db;
    } catch (error) {
        console.error('Error opening database:', error);
        throw error;
    }
};

/**
 * Create all tables and indexes
 */
const createTables = async (db: SQLite.SQLiteDatabase): Promise<void> => {
    try {
        // Create tables
        await db.executeSql(CREATE_MOODS_TABLE);
        await db.executeSql(CREATE_ACTIVITIES_TABLE);
        await db.executeSql(CREATE_MOOD_ACTIVITIES_TABLE);

        // Create indexes
        for (const indexQuery of CREATE_INDEXES) {
            await db.executeSql(indexQuery);
        }

        console.log('All tables and indexes created successfully');
    } catch (error) {
        console.error('Error creating tables:', error);
        throw error;
    }
};

/**
 * Close database connection
 */
export const closeDatabase = async (): Promise<void> => {
    if (databaseInstance) {
        await databaseInstance.close();
        databaseInstance = null;
        console.log('Database closed');
    }
};

/**
 * Seed initial activities
 */
export const seedActivities = async (): Promise<void> => {
    const db = await getDatabase();

    const defaultActivities = [
        { name: 'Work', icon_name: 'briefcase' },
        { name: 'School', icon_name: 'school' },
        { name: 'Exercise', icon_name: 'fitness' },
        { name: 'Gaming', icon_name: 'game-controller' },
        { name: 'Reading', icon_name: 'book' },
        { name: 'Socializing', icon_name: 'people' },
        { name: 'Family Time', icon_name: 'home' },
        { name: 'Meditation', icon_name: 'leaf' },
        { name: 'Music', icon_name: 'musical-notes' },
        { name: 'Cooking', icon_name: 'restaurant' },
        { name: 'Shopping', icon_name: 'cart' },
        { name: 'Travel', icon_name: 'airplane' },
    ];

    try {
        for (const activity of defaultActivities) {
            await db.executeSql(
                `INSERT OR IGNORE INTO activities (name, icon_name) VALUES (?, ?)`,
                [activity.name, activity.icon_name]
            );
        }
        console.log('Activities seeded successfully');
    } catch (error) {
        console.error('Error seeding activities:', error);
        throw error;
    }
};

/**
 * Insert a new mood entry along with its selected activities using a Transaction
 * This ensures data integrity - either all inserts succeed or none do
 */
export const insertMoodWithActivities = async (
    moodData: NewMoodEntry
): Promise<number> => {
    const db = await getDatabase();

    try {
        let moodId: number = 0;

        // Use transaction to ensure data integrity
        await db.transaction(async (tx) => {
            // Insert mood entry
            const [moodResult] = await tx.executeSql(
                `INSERT INTO moods (mood_type, intensity, note, created_at) 
         VALUES (?, ?, ?, datetime('now', 'localtime'))`,
                [moodData.mood_type, moodData.intensity, moodData.note || '']
            );

            moodId = moodResult.insertId!;

            // Insert mood-activity relationships
            if (moodData.activity_ids && moodData.activity_ids.length > 0) {
                for (const activityId of moodData.activity_ids) {
                    await tx.executeSql(
                        `INSERT INTO mood_activities (mood_id, activity_id) VALUES (?, ?)`,
                        [moodId, activityId]
                    );
                }
            }
        });

        console.log(`Mood entry created with ID: ${moodId}`);
        return moodId;
    } catch (error) {
        console.error('Error inserting mood with activities:', error);
        throw error;
    }
};

/**
 * Fetch mood history including the names of the activities associated with each mood
 * Returns moods ordered by most recent first
 */
export const getMoodHistory = async (
    limit?: number
): Promise<MoodWithActivities[]> => {
    const db = await getDatabase();

    try {
        const limitClause = limit ? `LIMIT ${limit}` : '';

        // Query to get all moods
        const [moodsResult] = await db.executeSql(
            `SELECT * FROM moods ORDER BY created_at DESC ${limitClause}`
        );

        const moods: MoodWithActivities[] = [];

        // For each mood, get associated activities
        for (let i = 0; i < moodsResult.rows.length; i++) {
            const mood = moodsResult.rows.item(i);

            // Query to get activities for this mood
            const [activitiesResult] = await db.executeSql(
                `SELECT a.id, a.name, a.icon_name
         FROM activities a
         INNER JOIN mood_activities ma ON a.id = ma.activity_id
         WHERE ma.mood_id = ?
         ORDER BY a.name`,
                [mood.id]
            );

            const activities: Activity[] = [];
            for (let j = 0; j < activitiesResult.rows.length; j++) {
                activities.push(activitiesResult.rows.item(j));
            }

            moods.push({
                ...mood,
                activities,
            });
        }

        return moods;
    } catch (error) {
        console.error('Error fetching mood history:', error);
        throw error;
    }
};

/**
 * Alternative: Get mood history with a single query using GROUP_CONCAT
 * More efficient for large datasets
 */
export const getMoodHistoryOptimized = async (
    limit?: number
): Promise<MoodWithActivities[]> => {
    const db = await getDatabase();

    try {
        const limitClause = limit ? `LIMIT ${limit}` : '';

        const [result] = await db.executeSql(
            `SELECT 
        m.id,
        m.mood_type,
        m.intensity,
        m.note,
        m.created_at,
        GROUP_CONCAT(a.id || ':' || a.name || ':' || a.icon_name) as activities_data
       FROM moods m
       LEFT JOIN mood_activities ma ON m.id = ma.mood_id
       LEFT JOIN activities a ON ma.activity_id = a.id
       GROUP BY m.id
       ORDER BY m.created_at DESC
       ${limitClause}`
        );

        const moods: MoodWithActivities[] = [];

        for (let i = 0; i < result.rows.length; i++) {
            const row = result.rows.item(i);
            const activities: Activity[] = [];

            if (row.activities_data) {
                const activitiesArray = row.activities_data.split(',');
                for (const activityData of activitiesArray) {
                    const [id, name, icon_name] = activityData.split(':');
                    activities.push({
                        id: parseInt(id, 10),
                        name,
                        icon_name,
                    });
                }
            }

            moods.push({
                id: row.id,
                mood_type: row.mood_type,
                intensity: row.intensity,
                note: row.note,
                created_at: row.created_at,
                activities,
            });
        }

        return moods;
    } catch (error) {
        console.error('Error fetching mood history (optimized):', error);
        throw error;
    }
};

/**
 * Get all activities
 */
export const getAllActivities = async (): Promise<Activity[]> => {
    const db = await getDatabase();

    try {
        const [result] = await db.executeSql(
            `SELECT * FROM activities ORDER BY name`
        );

        const activities: Activity[] = [];
        for (let i = 0; i < result.rows.length; i++) {
            activities.push(result.rows.item(i));
        }

        return activities;
    } catch (error) {
        console.error('Error fetching activities:', error);
        throw error;
    }
};

/**
 * Add a new activity
 */
export const addActivity = async (
    name: string,
    icon_name: string
): Promise<number> => {
    const db = await getDatabase();

    try {
        const [result] = await db.executeSql(
            `INSERT INTO activities (name, icon_name) VALUES (?, ?)`,
            [name, icon_name]
        );

        console.log(`Activity created with ID: ${result.insertId}`);
        return result.insertId!;
    } catch (error) {
        console.error('Error adding activity:', error);
        throw error;
    }
};

/**
 * Delete a mood entry (cascade will delete associated mood_activities)
 */
export const deleteMood = async (moodId: number): Promise<void> => {
    const db = await getDatabase();

    try {
        await db.executeSql(`DELETE FROM moods WHERE id = ?`, [moodId]);
        console.log(`Mood ${moodId} deleted successfully`);
    } catch (error) {
        console.error('Error deleting mood:', error);
        throw error;
    }
};

/**
 * Update a mood entry
 */
export const updateMood = async (
    moodId: number,
    mood_type: string,
    intensity: number,
    note?: string
): Promise<void> => {
    const db = await getDatabase();

    try {
        await db.executeSql(
            `UPDATE moods SET mood_type = ?, intensity = ?, note = ? WHERE id = ?`,
            [mood_type, intensity, note || '', moodId]
        );
        console.log(`Mood ${moodId} updated successfully`);
    } catch (error) {
        console.error('Error updating mood:', error);
        throw error;
    }
};

/**
 * Get mood statistics
 */
export const getMoodStatistics = async () => {
    const db = await getDatabase();

    try {
        const [result] = await db.executeSql(
            `SELECT 
        COUNT(*) as total_entries,
        AVG(intensity) as avg_intensity,
        mood_type,
        COUNT(*) as mood_count
       FROM moods
       GROUP BY mood_type
       ORDER BY mood_count DESC`
        );

        const stats = [];
        for (let i = 0; i < result.rows.length; i++) {
            stats.push(result.rows.item(i));
        }

        return stats;
    } catch (error) {
        console.error('Error fetching mood statistics:', error);
        throw error;
    }
};

/**
 * Clear all data (useful for testing)
 */
export const clearAllData = async (): Promise<void> => {
    const db = await getDatabase();

    try {
        await db.transaction(async (tx) => {
            await tx.executeSql(`DELETE FROM mood_activities`);
            await tx.executeSql(`DELETE FROM moods`);
            await tx.executeSql(`DELETE FROM activities`);
        });
        console.log('All data cleared successfully');
    } catch (error) {
        console.error('Error clearing data:', error);
        throw error;
    }
};

export default {
    getDatabase,
    closeDatabase,
    seedActivities,
    insertMoodWithActivities,
    getMoodHistory,
    getMoodHistoryOptimized,
    getAllActivities,
    addActivity,
    deleteMood,
    updateMood,
    getMoodStatistics,
    clearAllData,
};
