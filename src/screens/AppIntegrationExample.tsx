/**
 * INTEGRATION EXAMPLE
 * 
 * This file shows how to integrate the AddMoodScreen into your existing App.tsx
 * Copy and paste the relevant parts into your App.tsx
 */

import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
    ScrollView,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RNShake from 'react-native-shake';

// Import the Add Mood Screen (choose one)
import AddMoodScreen from './AddMoodScreen'; // React Native Paper version
// import AddMoodScreenSimple from './AddMoodScreenSimple'; // Standard RN version

// Import database functions
import {
    getDatabase,
    seedActivities,
    getMoodHistory,
    clearAllData,
} from '../database';
import { MoodWithActivities } from '../database/types';

function AppIntegrationExample() {
    // === NEW STATE FOR ADD MOOD SCREEN ===
    const [showAddMoodModal, setShowAddMoodModal] = useState(false);

    // Existing state
    const [selectedMood, setSelectedMood] = useState<string | null>(null);
    const [moodHistory, setMoodHistory] = useState<MoodWithActivities[]>([]);

    // Existing moods (you already have this)
    const moods = [
        { emoji: '😀', label: 'Happy', color: '#FFD700' },
        { emoji: '😢', label: 'Sad', color: '#4169E1' },
        { emoji: '😡', label: 'Angry', color: '#FF4500' },
        { emoji: '😌', label: 'Calm', color: '#90EE90' },
        // ... rest of your moods
    ];

    // === INITIALIZE DATABASE ===
    useEffect(() => {
        const initializeDatabase = async () => {
            try {
                console.log('Initializing database...');
                await getDatabase();
                await seedActivities();
                await loadMoodHistoryFromDB();
                console.log('Database initialized successfully');
            } catch (error) {
                console.error('Failed to initialize database:', error);
            }
        };

        initializeDatabase();
    }, []);

    // === LOAD MOOD HISTORY FROM DATABASE ===
    const loadMoodHistoryFromDB = async () => {
        try {
            const history = await getMoodHistory(50);
            setMoodHistory(history);

            if (history.length > 0) {
                setSelectedMood(history[0].mood_type);
            }
        } catch (error) {
            console.error('Failed to load mood history:', error);
        }
    };

    // === CALLBACK WHEN MOOD IS ADDED ===
    const handleMoodAdded = () => {
        console.log('New mood added!');
        setShowAddMoodModal(false);
        loadMoodHistoryFromDB(); // Refresh the history
    };

    // === CLEAR HISTORY (EXISTING FUNCTION - UPDATED) ===
    const clearHistory = async () => {
        try {
            await clearAllData();
            await seedActivities(); // Re-seed activities
            await loadMoodHistoryFromDB();
            Alert.alert('History Cleared', 'All mood history has been deleted!');
        } catch (error) {
            console.error('Failed to clear history:', error);
        }
    };

    // Shake to delete (existing)
    useEffect(() => {
        const subscription = RNShake.addListener(() => {
            Alert.alert(
                'Delete History?',
                'Are you sure you want to delete all your mood history?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: clearHistory },
                ]
            );
        });

        return () => subscription.remove();
    }, []);

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Mood Tracker</Text>
                <Text style={styles.subtitle}>Track Your Daily Moods</Text>
            </View>

            {/* === NEW: ADD MOOD BUTTON === */}
            <TouchableOpacity
                style={styles.addMoodButton}
                onPress={() => setShowAddMoodModal(true)}
            >
                <Text style={styles.addMoodButtonText}>+ Add New Mood</Text>
            </TouchableOpacity>

            {/* Mood History */}
            {moodHistory.length > 0 && (
                <View style={styles.historyContainer}>
                    <Text style={styles.historyTitle}>Your Mood History</Text>
                    <ScrollView style={styles.historyScroll} showsVerticalScrollIndicator={true}>
                        {moodHistory.map((entry) => {
                            // Find the matching mood emoji and color
                            const moodData = moods.find((m) => m.label === entry.mood_type);

                            return (
                                <View
                                    key={entry.id}
                                    style={[
                                        styles.historyItem,
                                        { borderLeftColor: moodData?.color || '#ccc' },
                                    ]}
                                >
                                    <Text style={styles.historyEmoji}>{moodData?.emoji || '😊'}</Text>

                                    <View style={styles.historyContent}>
                                        <Text style={styles.historyMood}>
                                            {entry.mood_type} (Intensity: {entry.intensity}/10)
                                        </Text>

                                        {/* === NEW: SHOW ACTIVITIES === */}
                                        {entry.activities && entry.activities.length > 0 && (
                                            <Text style={styles.historyActivities}>
                                                🏃 {entry.activities.map((a) => a.name).join(', ')}
                                            </Text>
                                        )}

                                        {/* === NEW: SHOW NOTE === */}
                                        {entry.note && (
                                            <Text style={styles.historyNote} numberOfLines={2}>
                                                📝 {entry.note}
                                            </Text>
                                        )}

                                        <Text style={styles.time}>{formatDate(entry.created_at)}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {/* === NEW: Empty State === */}
            {moodHistory.length === 0 && (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateEmoji}>💭</Text>
                    <Text style={styles.emptyStateText}>No moods tracked yet</Text>
                    <Text style={styles.emptyStateSubtext}>
                        Tap the button above to add your first mood!
                    </Text>
                </View>
            )}

            {/* === NEW: ADD MOOD MODAL === */}
            <Modal
                visible={showAddMoodModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowAddMoodModal(false)}
            >
                <AddMoodScreen
                    onMoodAdded={handleMoodAdded}
                    onClose={() => setShowAddMoodModal(false)}
                />
            </Modal>

            {/* === OPTIONAL: FLOATING ACTION BUTTON (Alternative to top button) === */}
            {/* <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddMoodModal(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity> */}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 5,
    },
    // === NEW STYLES FOR ADD MOOD BUTTON ===
    addMoodButton: {
        backgroundColor: '#6200ee',
        marginHorizontal: 20,
        marginVertical: 10,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    addMoodButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    historyContainer: {
        padding: 20,
        flex: 1,
    },
    historyScroll: {
        maxHeight: 400,
    },
    historyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    historyItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        borderLeftWidth: 5,
        marginBottom: 12,
    },
    historyEmoji: {
        fontSize: 40,
        marginRight: 15,
    },
    historyContent: {
        flex: 1,
    },
    historyMood: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    // === NEW STYLES FOR ACTIVITIES AND NOTES ===
    historyActivities: {
        fontSize: 14,
        color: '#555',
        marginBottom: 4,
    },
    historyNote: {
        fontSize: 13,
        color: '#666',
        fontStyle: 'italic',
        marginBottom: 4,
    },
    time: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    // === NEW: EMPTY STATE ===
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyStateEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyStateText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    // === OPTIONAL: FAB STYLES ===
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#6200ee',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    fabText: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
    },
});

export default AppIntegrationExample;
