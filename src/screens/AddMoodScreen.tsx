import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Dimensions,
} from 'react-native';
import {
    TextInput,
    Button,
    Chip,
    Text,
    Card,
    Portal,
    Modal,
    ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllActivities, insertMoodWithActivities } from '../database';
import { Activity } from '../database/types';

const { width } = Dimensions.get('window');

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

interface AddMoodScreenProps {
    onMoodAdded?: () => void;
    onClose?: () => void;
}

const AddMoodScreen: React.FC<AddMoodScreenProps> = ({ onMoodAdded, onClose }) => {
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

    // Handle cancel
    const handleCancel = () => {
        if (selectedMood || selectedActivityIds.length > 0 || note.trim()) {
            Alert.alert(
                'Discard Changes?',
                'You have unsaved changes. Are you sure you want to discard them?',
                [
                    { text: 'Keep Editing', style: 'cancel' },
                    {
                        text: 'Discard',
                        style: 'destructive',
                        onPress: () => {
                            setSelectedMood(null);
                            setSelectedActivityIds([]);
                            setNote('');
                            if (onClose) {
                                onClose();
                            }
                        },
                    },
                ]
            );
        } else {
            if (onClose) {
                onClose();
            }
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text variant="headlineMedium" style={styles.title}>
                        How are you feeling?
                    </Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        Select your current mood
                    </Text>
                </View>

                {/* Mood Selection - Horizontal Scrollable */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Select Mood
                        </Text>
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
                    </Card.Content>
                </Card>

                {/* Activities Selection - Multi-select Chips */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            What were you doing? (Optional)
                        </Text>
                        {loadingActivities ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" />
                                <Text style={styles.loadingText}>Loading activities...</Text>
                            </View>
                        ) : (
                            <View style={styles.chipContainer}>
                                {activities.map((activity) => (
                                    <Chip
                                        key={activity.id}
                                        selected={selectedActivityIds.includes(activity.id!)}
                                        onPress={() => toggleActivity(activity.id!)}
                                        style={styles.chip}
                                        selectedColor="#6200ee"
                                        mode="flat"
                                    >
                                        {activity.name}
                                    </Chip>
                                ))}
                            </View>
                        )}
                    </Card.Content>
                </Card>

                {/* Notes Input */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Add a Note (Optional)
                        </Text>
                        <TextInput
                            mode="outlined"
                            placeholder="What's on your mind?"
                            value={note}
                            onChangeText={setNote}
                            multiline
                            numberOfLines={4}
                            style={styles.textInput}
                            maxLength={500}
                        />
                        <Text variant="bodySmall" style={styles.charCount}>
                            {note.length}/500
                        </Text>
                    </Card.Content>
                </Card>

                {/* Summary */}
                {selectedMood && (
                    <Card style={[styles.card, styles.summaryCard]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={styles.sectionTitle}>
                                Summary
                            </Text>
                            <View style={styles.summaryRow}>
                                <Text variant="bodyLarge">
                                    <Text style={styles.summaryLabel}>Mood: </Text>
                                    {selectedMood.emoji} {selectedMood.label}
                                </Text>
                            </View>
                            {selectedActivityIds.length > 0 && (
                                <View style={styles.summaryRow}>
                                    <Text variant="bodyMedium">
                                        <Text style={styles.summaryLabel}>Activities: </Text>
                                        {activities
                                            .filter((a) => selectedActivityIds.includes(a.id!))
                                            .map((a) => a.name)
                                            .join(', ')}
                                    </Text>
                                </View>
                            )}
                        </Card.Content>
                    </Card>
                )}

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <Button
                        mode="contained"
                        onPress={handleSaveMood}
                        loading={saving}
                        disabled={saving || !selectedMood}
                        style={styles.saveButton}
                        contentStyle={styles.buttonContent}
                        labelStyle={styles.buttonLabel}
                    >
                        Save Mood
                    </Button>
                    {onClose && (
                        <Button
                            mode="outlined"
                            onPress={handleCancel}
                            disabled={saving}
                            style={styles.cancelButton}
                            contentStyle={styles.buttonContent}
                        >
                            Cancel
                        </Button>
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
        marginBottom: 20,
        alignItems: 'center',
    },
    title: {
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    subtitle: {
        color: '#666',
        marginTop: 4,
        textAlign: 'center',
    },
    card: {
        marginBottom: 16,
        elevation: 2,
    },
    sectionTitle: {
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
        marginBottom: 4,
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
        backgroundColor: '#fff',
        minHeight: 100,
    },
    charCount: {
        textAlign: 'right',
        color: '#999',
        marginTop: 4,
    },
    summaryCard: {
        backgroundColor: '#e8f5e9',
    },
    summaryRow: {
        marginBottom: 8,
    },
    summaryLabel: {
        fontWeight: '600',
    },
    buttonContainer: {
        marginTop: 8,
        gap: 12,
    },
    saveButton: {
        borderRadius: 8,
    },
    cancelButton: {
        borderRadius: 8,
    },
    buttonContent: {
        paddingVertical: 8,
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    bottomSpacer: {
        height: 32,
    },
});

export default AddMoodScreen;
