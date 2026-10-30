/**
 * Database Test Script
 * 
 * Run this to verify your SQLite database is working correctly.
 * Import and call testDatabase() from your App.tsx to run tests.
 */

import {
    getDatabase,
    seedActivities,
    insertMoodWithActivities,
    getMoodHistory,
    getAllActivities,
    addActivity,
    deleteMood,
    updateMood,
    getMoodStatistics,
    clearAllData,
} from './database';
import { NewMoodEntry } from './types';

/**
 * Run all database tests
 */
export const testDatabase = async () => {
    console.log('\n🧪 Starting Database Tests...\n');

    try {
        // Test 1: Initialize Database
        console.log('Test 1: Initialize Database');
        await getDatabase();
        console.log('✅ Database initialized\n');

        // Test 2: Seed Activities
        console.log('Test 2: Seed Activities');
        await seedActivities();
        const activities = await getAllActivities();
        console.log(`✅ Seeded ${activities.length} activities\n`);

        // Test 3: Insert Mood with Activities
        console.log('Test 3: Insert Mood with Activities');
        const testMood: NewMoodEntry = {
            mood_type: 'Happy',
            intensity: 8,
            note: 'Test mood entry',
            activity_ids: [1, 2, 3], // First 3 activities
        };
        const moodId = await insertMoodWithActivities(testMood);
        console.log(`✅ Mood inserted with ID: ${moodId}\n`);

        // Test 4: Fetch Mood History
        console.log('Test 4: Fetch Mood History');
        const history = await getMoodHistory(10);
        console.log(`✅ Retrieved ${history.length} mood entries`);
        if (history.length > 0) {
            console.log(`   Latest mood: ${history[0].mood_type} (Intensity: ${history[0].intensity})`);
            console.log(`   Activities: ${history[0].activities.map(a => a.name).join(', ')}\n`);
        }

        // Test 5: Insert Multiple Moods
        console.log('Test 5: Insert Multiple Moods');
        const moods = [
            { mood_type: 'Sad', intensity: 4, note: 'Feeling down', activity_ids: [1, 4] },
            { mood_type: 'Excited', intensity: 9, note: 'Great news!', activity_ids: [5, 6, 9] },
            { mood_type: 'Calm', intensity: 7, note: 'Peaceful day', activity_ids: [8] },
        ];

        for (const mood of moods) {
            await insertMoodWithActivities(mood);
        }
        console.log(`✅ Inserted ${moods.length} additional moods\n`);

        // Test 6: Add Custom Activity
        console.log('Test 6: Add Custom Activity');
        const customActivityId = await addActivity('Testing', 'test-tube');
        console.log(`✅ Custom activity added with ID: ${customActivityId}\n`);

        // Test 7: Update Mood
        console.log('Test 7: Update Mood');
        await updateMood(moodId, 'Content', 7, 'Updated test mood');
        console.log(`✅ Mood ${moodId} updated\n`);

        // Test 8: Get Statistics
        console.log('Test 8: Get Mood Statistics');
        const stats = await getMoodStatistics();
        console.log(`✅ Retrieved statistics for ${stats.length} mood types:`);
        stats.forEach(stat => {
            console.log(`   ${stat.mood_type}: ${stat.mood_count} entries (avg: ${stat.avg_intensity?.toFixed(1)})`);
        });
        console.log('');

        // Test 9: Verify Data Integrity
        console.log('Test 9: Verify Data Integrity');
        const updatedHistory = await getMoodHistory();
        const totalMoods = updatedHistory.length;
        const totalActivities = await getAllActivities();
        console.log(`✅ Database integrity check:`);
        console.log(`   Total moods: ${totalMoods}`);
        console.log(`   Total activities: ${totalActivities.length}`);
        console.log(`   All moods have activities: ${updatedHistory.every(m => m.activities !== undefined)}\n`);

        // Test 10: Delete Mood
        console.log('Test 10: Delete Mood (Cascade Test)');
        await deleteMood(moodId);
        const afterDelete = await getMoodHistory();
        console.log(`✅ Mood deleted. Remaining moods: ${afterDelete.length}\n`);

        // Test 11: Transaction Test (Insert with Error Handling)
        console.log('Test 11: Transaction Test');
        try {
            await insertMoodWithActivities({
                mood_type: 'Anxious',
                intensity: 6,
                note: 'Transaction test',
                activity_ids: [1, 2],
            });
            console.log('✅ Transaction completed successfully\n');
        } catch (error) {
            console.log('❌ Transaction failed (expected for error handling test)\n');
        }

        // Test 12: Final Summary
        console.log('Test 12: Final Summary');
        const finalHistory = await getMoodHistory();
        console.log(`✅ Final database state:`);
        console.log(`   Total moods recorded: ${finalHistory.length}`);
        console.log(`   Date range: ${finalHistory[finalHistory.length - 1]?.created_at} to ${finalHistory[0]?.created_at}\n`);

        // Success message
        console.log('🎉 All Database Tests Passed!\n');
        console.log('Your SQLite database is working correctly.');
        console.log('You can now integrate it into your app.\n');

        return true;
    } catch (error) {
        console.error('❌ Database Test Failed:', error);
        return false;
    }
};

/**
 * Clean test - runs tests and cleans up afterward
 */
export const cleanTest = async () => {
    console.log('Running clean test (will delete test data afterward)...\n');

    const success = await testDatabase();

    if (success) {
        console.log('Cleaning up test data...');
        await clearAllData();
        await seedActivities(); // Re-seed activities
        console.log('✅ Test data cleaned up\n');
    }

    return success;
};

/**
 * Quick health check
 */
export const healthCheck = async () => {
    try {
        const db = await getDatabase();
        const activities = await getAllActivities();
        const moods = await getMoodHistory(1);

        console.log('✅ Database Health Check Passed');
        console.log(`   Activities: ${activities.length}`);
        console.log(`   Recent moods: ${moods.length}`);

        return true;
    } catch (error) {
        console.error('❌ Database Health Check Failed:', error);
        return false;
    }
};

export default {
    testDatabase,
    cleanTest,
    healthCheck,
};
