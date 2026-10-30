import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Text,
    TextInput as RNTextInput,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllActivities, insertMoodWithActivities } from '../database';
import { Activity } from '../database/types';

// Mood configuration with emojis and intensity mapping
const MOODS = [
    { id: 1, emoji: '😀', label: 'Happy', color: '#FFD700', intensity: 8 },
    { id: 2, emoji: '😢', label: 'Sad', color: '#4169E1', intensity: 3 },
    { id: 3, emoji: '😡', label: 'Angry', color: '#FF4500', intensity: 2 },
    { id: 4, emoji: '😌', label: 'Relaxed', color: '#90EE90', intensity: 7 },
    { id: 5, emoji: '😰', label: 'Anxious', color: '#FFA500', intensity: 4 },
    { id: 6, emoji: '🤩', label: 'Excited', color: '#FF69B4', intensity: 9 },
    { id: 7, emoji: '😴', label: 'Tired', color: '#9370DB', intensity: 5 },
    { id: 8, emoji: '🥰', label: 'Loved', color: '#FFB6C1', intensity: 9 },
];

interface AddMoodScreenSimpleProps {
    onMoodAdded?: () => void;
    onClose?: () => void;
}

const AddMoodScreenSimple: React.FC<AddMoodScreenSimpleProps> = ({
    onMoodAdded,
    onClose,
}) => {
    // State for selected mood
    const [selectedMood, setSelectedMood] = useState<typeof MOODS[0] | null>(null);

    // State for activities
    const [activities, setActivities] = useState<Activity[]>([]);
    const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(true);

    // State for note
    const [note, setNote] = useState('');

    // State for saving
    const [saving, setSaving] = useState(false);

    // Load activities from database on mount
    useEffect(() => {
        loadActivities();
    }, []);

    const loadActivities = async () => {
        try {
            setLoadingActivities(true);
            const fetchedActivities = await getAllActivities();
            setActivities(fetchedActivities);
        } catch (error) {
            console.error('Failed to load activities:', error);
            Alert.alert('Error', 'Failed to load activities. Please try again.');
        } finally {
            setLoadingActivities(false);
        }
    };

    // Handle mood selection
    const handleMoodSelect = (mood: typeof MOODS[0]) => {
        setSelectedMood(mood);
    };

    // Handle activity chip toggle
    const toggleActivity = (activityId: number) => {
        setSelectedActivityIds((prev) => {
            if (prev.includes(activityId)) {
                return prev.filter((id) => id !== activityId);
            } else {
                return [...prev, activityId];
            }
        });
    };

    // Validate form
    const validateForm = (): boolean => {
        if (!selectedMood) {
            Alert.alert('Validation Error', 'Please select a mood');
            return false;
        }
        return true;
    };

    // Handle save mood
    const handleSaveMood = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setSaving(true);

            // Insert mood with activities into database
            await insertMoodWithActivities({
                mood_type: selectedMood!.label,
                intensity: selectedMood!.intensity,
                note: note.trim(),
                activity_ids: selectedActivityIds,
            });

            Alert.alert(
                'Success',
                'Your mood has been saved!',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Reset form
                            setSelectedMood(null);
                            setSelectedActivityIds([]);
                            setNote('');

                            // Callback for parent component
                            if (onMoodAdded) {
                                onMoodAdded();
                            }

                            // Close modal if applicable
                            if (onClose) {
                                onClose();
                            }
                        },
                    },
                ]
            );
        } catch (error) {
            console.error('Failed to save mood:', error);
            Alert.alert('Error', 'Failed to save mood. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>How are you feeling?</Text>
                    <Text style={styles.subtitle}>Select your current mood</Text>
                </View>

                {/* Mood Selection - Horizontal Scrollable */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Mood *</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.moodScrollContainer}
                    >
                        {MOODS.map((mood) => (
                            <TouchableOpacity
                                key={mood.id}
                                style={[
                                    styles.moodButton,
                                    {
                                        backgroundColor: mood.color,
                                        borderWidth: selectedMood?.id === mood.id ? 4 : 0,
                                        borderColor: '#333',
                                        transform: [
                                            { scale: selectedMood?.id === mood.id ? 1.05 : 1 },
                                        ],
                                    },
                                ]}
                                onPress={() => handleMoodSelect(mood)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                                <Text style={styles.moodLabel}>{mood.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Activities Selection - Multi-select Chips */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>What were you doing? (Optional)</Text>
                    {loadingActivities ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#6200ee" />
                            <Text style={styles.loadingText}>Loading activities...</Text>
                        </View>
                    ) : (
                        <View style={styles.chipContainer}>
                            {activities.map((activity) => (
                                <TouchableOpacity
                                    key={activity.id}
                                    style={[
                                        styles.chip,
                                        selectedActivityIds.includes(activity.id!)
                                            ? styles.chipSelected
                                            : styles.chipUnselected,
                                    ]}
                                    onPress={() => toggleActivity(activity.id!)}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            selectedActivityIds.includes(activity.id!)
                                                ? styles.chipTextSelected
                                                : styles.chipTextUnselected,
                                        ]}
                                    >
                                        {activity.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Notes Input */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Add a Note (Optional)</Text>
                    <RNTextInput
                        placeholder="What's on your mind?"
                        value={note}
                        onChangeText={setNote}
                        multiline
                        numberOfLines={4}
                        style={styles.textInput}
                        maxLength={500}
                        textAlignVertical="top"
                    />
                    <Text style={styles.charCount}>{note.length}/500</Text>
                </View>

                {/* Summary */}
                {selectedMood && (
                    <View style={styles.summarySection}>
                        <Text style={styles.sectionTitle}>Summary</Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryText}>
                                <Text style={styles.summaryLabel}>Mood: </Text>
                                {selectedMood.emoji} {selectedMood.label}
                            </Text>
                        </View>
                        {selectedActivityIds.length > 0 && (
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryText}>
                                    <Text style={styles.summaryLabel}>Activities: </Text>
                                    {activities
                                        .filter((a) => selectedActivityIds.includes(a.id!))
                                        .map((a) => a.name)
                                        .join(', ')}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            (!selectedMood || saving) && styles.saveButtonDisabled,
                        ]}
                        onPress={handleSaveMood}
                        disabled={saving || !selectedMood}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Mood</Text>
                        )}
                    </TouchableOpacity>

                    {onClose && (
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                            disabled={saving}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Bottom Spacing */}
                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    header: {
        marginBottom: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
        textAlign: 'center',
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        color: '#333',
    },
    moodScrollContainer: {
        paddingVertical: 8,
    },
    moodButton: {
        width: 90,
        height: 110,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    moodEmoji: {
        fontSize: 40,
        marginBottom: 4,
    },
    moodLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
    },
    chipSelected: {
        backgroundColor: '#6200ee',
    },
    chipUnselected: {
        backgroundColor: '#e0e0e0',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    chipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    chipTextSelected: {
        color: '#fff',
    },
    chipTextUnselected: {
        color: '#333',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
    },
    loadingText: {
        marginLeft: 12,
        color: '#666',
    },
    textInput: {
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 12,
        minHeight: 100,
        fontSize: 16,
    },
    charCount: {
        textAlign: 'right',
        color: '#999',
        marginTop: 4,
        fontSize: 12,
    },
    summarySection: {
        backgroundColor: '#e8f5e9',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    summaryRow: {
        marginBottom: 8,
    },
    summaryText: {
        fontSize: 16,
        color: '#333',
    },
    summaryLabel: {
        fontWeight: '600',
    },
    buttonContainer: {
        marginTop: 8,
        gap: 12,
    },
    saveButton: {
        backgroundColor: '#6200ee',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    saveButtonDisabled: {
        backgroundColor: '#ccc',
        elevation: 0,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#6200ee',
    },
    cancelButtonText: {
        color: '#6200ee',
        fontSize: 16,
        fontWeight: '600',
    },
    bottomSpacer: {
        height: 32,
    },
});

export default AddMoodScreenSimple;
