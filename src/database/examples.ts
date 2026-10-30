/**
 * Database Usage Examples
 * 
 * This file demonstrates how to use the SQLite database functions
 * in your React Native Mood Tracker app.
 */

import {
    getDatabase,
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
    closeDatabase,
} from './database';
import { NewMoodEntry, MoodWithActivities, Activity } from './types';

/**
 * Example 1: Initialize Database on App Launch
 * Call this when your app starts (e.g., in App.tsx useEffect)
 */
export const initializeDatabase = async () => {
    try {
        // Open database connection
        const db = await getDatabase();
        console.log('Database initialized');

        // Seed initial activities (only runs once due to UNIQUE constraint)
        await seedActivities();
        console.log('Activities seeded');

        return true;
    } catch (error) {
        console.error('Failed to initialize database:', error);
        return false;
    }
};

/**
 * Example 2: Insert a New Mood Entry with Activities
 * This uses a transaction to ensure data integrity
 */
export const saveMoodEntry = async () => {
    try {
        // First, get available activities (you'd typically do this when user selects)
        const activities = await getAllActivities();
        console.log('Available activities:', activities);

        // User selects mood and activities
        const newMood: NewMoodEntry = {
            mood_type: 'Happy',
            intensity: 8,
            note: 'Had a great day at work!',
            activity_ids: [1, 3, 6], // Work, Exercise, Socializing (example IDs)
        };

        // Insert mood with activities in a transaction
        const moodId = await insertMoodWithActivities(newMood);
        console.log(`Mood saved with ID: ${moodId}`);

        return moodId;
    } catch (error) {
        console.error('Failed to save mood:', error);
        throw error;
    }
};

/**
 * Example 3: Fetch Mood History with Activities
 * Retrieves all moods with their associated activities
 */
export const fetchMoodHistory = async () => {
    try {
        // Get all mood history
        const allMoods = await getMoodHistory();
        console.log('All moods:', allMoods);

        // Get last 10 moods
        const recentMoods = await getMoodHistory(10);
        console.log('Recent moods:', recentMoods);

        // Or use optimized version (single query with GROUP_CONCAT)
        const optimizedMoods = await getMoodHistoryOptimized(10);
        console.log('Optimized moods:', optimizedMoods);

        // Example of processing mood history
        recentMoods.forEach((mood) => {
            console.log(`\nMood: ${mood.mood_type} (Intensity: ${mood.intensity})`);
            console.log(`Date: ${mood.created_at}`);
            console.log(`Note: ${mood.note}`);
            console.log(
                `Activities: ${mood.activities.map((a) => a.name).join(', ')}`
            );
        });

        return recentMoods;
    } catch (error) {
        console.error('Failed to fetch mood history:', error);
        throw error;
    }
};

/**
 * Example 4: Get All Activities
 * Useful for displaying activity selection UI
 */
export const fetchAllActivities = async () => {
    try {
        const activities = await getAllActivities();
        console.log('Activities:', activities);

        // Example: Display in UI
        activities.forEach((activity) => {
            console.log(`${activity.name} - Icon: ${activity.icon_name}`);
        });

        return activities;
    } catch (error) {
        console.error('Failed to fetch activities:', error);
        throw error;
    }
};

/**
 * Example 5: Add a Custom Activity
 */
export const addCustomActivity = async (name: string, iconName: string) => {
    try {
        const activityId = await addActivity(name, iconName);
        console.log(`Activity "${name}" added with ID: ${activityId}`);
        return activityId;
    } catch (error) {
        console.error('Failed to add activity:', error);
        throw error;
    }
};

/**
 * Example 6: Update a Mood Entry
 */
export const updateMoodEntry = async (moodId: number) => {
    try {
        await updateMood(moodId, 'Content', 7, 'Updated my mood after reflection');
        console.log('Mood updated successfully');
    } catch (error) {
        console.error('Failed to update mood:', error);
        throw error;
    }
};

/**
 * Example 7: Delete a Mood Entry
 * Note: This will also delete associated mood_activities due to CASCADE
 */
export const deleteMoodEntry = async (moodId: number) => {
    try {
        await deleteMood(moodId);
        console.log('Mood deleted successfully');
    } catch (error) {
        console.error('Failed to delete mood:', error);
        throw error;
    }
};

/**
 * Example 8: Get Mood Statistics
 * Useful for analytics/insights screen
 */
export const fetchMoodStatistics = async () => {
    try {
        const stats = await getMoodStatistics();
        console.log('Mood Statistics:', stats);

        // Example output processing
        stats.forEach((stat) => {
            console.log(
                `${stat.mood_type}: ${stat.mood_count} entries (avg intensity: ${stat.avg_intensity?.toFixed(
                    1
                )})`
            );
        });

        return stats;
    } catch (error) {
        console.error('Failed to fetch statistics:', error);
        throw error;
    }
};

/**
 * Example 9: Clear All Data (for testing or reset)
 */
export const resetDatabase = async () => {
    try {
        await clearAllData();
        console.log('All data cleared');

        // Optionally re-seed activities
        await seedActivities();
        console.log('Activities re-seeded');
    } catch (error) {
        console.error('Failed to reset database:', error);
        throw error;
    }
};

/**
 * Example 10: Complete Flow - Save and Retrieve Mood
 */
export const completeMoodFlow = async () => {
    try {
        console.log('=== Starting Complete Mood Flow ===\n');

        // 1. Initialize database
        await initializeDatabase();

        // 2. Get activities for selection
        const activities = await getAllActivities();
        console.log(`\nFound ${activities.length} activities`);

        // 3. User creates a mood entry
        const newMood: NewMoodEntry = {
            mood_type: 'Excited',
            intensity: 9,
            note: 'Starting a new project!',
            activity_ids: activities.slice(0, 3).map((a) => a.id!), // Select first 3 activities
        };

        const moodId = await insertMoodWithActivities(newMood);
        console.log(`\nMood saved with ID: ${moodId}`);

        // 4. Retrieve mood history
        const history = await getMoodHistory(5);
        console.log(`\nRetrieved ${history.length} mood entries`);

        // 5. Display the mood we just created
        const latestMood = history[0];
        console.log('\nLatest Mood Entry:');
        console.log(`  Type: ${latestMood.mood_type}`);
        console.log(`  Intensity: ${latestMood.intensity}/10`);
        console.log(`  Note: ${latestMood.note}`);
        console.log(
            `  Activities: ${latestMood.activities.map((a) => a.name).join(', ')}`
        );
        console.log(`  Created: ${latestMood.created_at}`);

        // 6. Get statistics
        const stats = await getMoodStatistics();
        console.log('\nMood Statistics:', stats);

        console.log('\n=== Complete Mood Flow Finished ===');
    } catch (error) {
        console.error('Error in complete mood flow:', error);
        throw error;
    }
};

/**
 * Example 11: Using in a React Component
 */
export const ReactComponentExample = `
import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import {
  initializeDatabase,
  getAllActivities,
  insertMoodWithActivities,
  getMoodHistory,
} from './src/database';
import { Activity, MoodWithActivities, NewMoodEntry } from './src/database/types';

const MoodScreen = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [moodHistory, setMoodHistory] = useState<MoodWithActivities[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<number[]>([]);

  useEffect(() => {
    // Initialize database on component mount
    const init = async () => {
      await initializeDatabase();
      
      // Load activities
      const acts = await getAllActivities();
      setActivities(acts);
      
      // Load mood history
      const history = await getMoodHistory(20);
      setMoodHistory(history);
    };

    init();
  }, []);

  const handleSaveMood = async () => {
    try {
      const newMood: NewMoodEntry = {
        mood_type: 'Happy',
        intensity: 8,
        note: 'Sample note',
        activity_ids: selectedActivities,
      };

      await insertMoodWithActivities(newMood);
      
      // Refresh mood history
      const history = await getMoodHistory(20);
      setMoodHistory(history);
    } catch (error) {
      console.error('Error saving mood:', error);
    }
  };

  return (
    <View>
      <Text>Mood Tracker</Text>
      <Button title="Save Mood" onPress={handleSaveMood} />
      
      <FlatList
        data={moodHistory}
        keyExtractor={(item) => item.id!.toString()}
        renderItem={({ item }) => (
          <View>
            <Text>{item.mood_type} - Intensity: {item.intensity}</Text>
            <Text>{item.activities.map(a => a.name).join(', ')}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default MoodScreen;
`;

// Export all examples
export default {
    initializeDatabase,
    saveMoodEntry,
    fetchMoodHistory,
    fetchAllActivities,
    addCustomActivity,
    updateMoodEntry,
    deleteMoodEntry,
    fetchMoodStatistics,
    resetDatabase,
    completeMoodFlow,
};
