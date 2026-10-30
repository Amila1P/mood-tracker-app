# Quick Start Integration Guide

## Step 1: Link Native Modules (Android)

Since you've installed `react-native-sqlite-storage`, you need to rebuild the native app:

### For Android:
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### For iOS:
```bash
cd ios
pod install
cd ..
npm run ios
```

---

## Step 2: Initialize Database in App.tsx

Add database initialization to your existing App.tsx:

```typescript
import { useEffect } from 'react';
import { getDatabase, seedActivities } from './src/database';

function App() {
  // Add this useEffect to initialize database
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        console.log('Initializing database...');
        await getDatabase();
        await seedActivities();
        console.log('Database initialized successfully');
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };

    initializeDatabase();
  }, []);

  // Your existing code...
}
```

---

## Step 3: Replace AsyncStorage with SQLite

### Current AsyncStorage Implementation:
```typescript
const saveMood = async (mood: Mood) => {
  const newEntry = {
    mood: mood.label,
    timestamp: new Date().toISOString(),
    emoji: mood.emoji,
    color: mood.color,
  };
  const updatedHistory = [newEntry, ...moodHistory];
  await AsyncStorage.setItem('moodHistory', JSON.stringify(updatedHistory));
  setMoodHistory(updatedHistory);
};
```

### New SQLite Implementation:
```typescript
import { insertMoodWithActivities, getAllActivities, getMoodHistory } from './src/database';

// State for activities
const [activities, setActivities] = useState<Activity[]>([]);
const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);

// Load activities on mount
useEffect(() => {
  const loadActivities = async () => {
    const acts = await getAllActivities();
    setActivities(acts);
  };
  loadActivities();
}, []);

// Save mood with SQLite
const saveMood = async (mood: Mood) => {
  try {
    await insertMoodWithActivities({
      mood_type: mood.label,
      intensity: 5, // You can add a slider for this
      note: '', // Optional note field
      activity_ids: selectedActivityIds, // Selected activities
    });
    
    // Reload mood history
    const history = await getMoodHistory(50);
    setMoodHistory(history);
    setSelectedMood(mood.label);
  } catch (error) {
    console.error('Failed to save mood:', error);
  }
};
```

---

## Step 4: Update Mood History Display

```typescript
// Load mood history from SQLite
useEffect(() => {
  const loadMoodHistory = async () => {
    try {
      const history = await getMoodHistory(50); // Get last 50 entries
      setMoodHistory(history);
      
      if (history.length > 0) {
        setSelectedMood(history[0].mood_type);
      }
    } catch (error) {
      console.error('Failed to load mood history:', error);
    }
  };

  loadMoodHistory();
}, []);

// Update your history rendering
{moodHistory.map((entry, index) => (
  <View key={entry.id} style={styles.historyItem}>
    <Text style={styles.historyEmoji}>{entry.emoji}</Text>
    <View>
      <Text style={styles.historyMood}>{entry.mood_type}</Text>
      <Text style={styles.historyIntensity}>Intensity: {entry.intensity}/10</Text>
      {entry.activities.length > 0 && (
        <Text style={styles.historyActivities}>
          {entry.activities.map(a => a.name).join(', ')}
        </Text>
      )}
      <Text style={styles.time}>{formatDate(entry.created_at)}</Text>
    </View>
  </View>
))}
```

---

## Step 5: Add Activity Selection UI (Optional)

```typescript
// Add activity selection before saving mood
<View style={styles.activityContainer}>
  <Text style={styles.activityTitle}>What were you doing?</Text>
  <View style={styles.activityGrid}>
    {activities.map((activity) => (
      <TouchableOpacity
        key={activity.id}
        style={[
          styles.activityButton,
          selectedActivityIds.includes(activity.id!)
            ? styles.activitySelected
            : null,
        ]}
        onPress={() => {
          setSelectedActivityIds((prev) =>
            prev.includes(activity.id!)
              ? prev.filter((id) => id !== activity.id)
              : [...prev, activity.id!]
          );
        }}
      >
        <Text>{activity.name}</Text>
      </TouchableOpacity>
    ))}
  </View>
</View>
```

---

## Step 6: Test the Database

### Option 1: Test in Your App
Just run the app and save some moods. Check the console for database logs.

### Option 2: Run Test Script
Create a test script to verify everything works:

```typescript
// Add to App.tsx temporarily
import { completeMoodFlow } from './src/database/examples';

useEffect(() => {
  const testDatabase = async () => {
    try {
      await completeMoodFlow();
      console.log('Database test completed successfully!');
    } catch (error) {
      console.error('Database test failed:', error);
    }
  };

  // Uncomment to run test
  // testDatabase();
}, []);
```

---

## Complete Modified App.tsx Example

Here's how your App.tsx would look with SQLite integration:

```typescript
import { useState, useEffect } from 'react';
import { 
  Text, TouchableOpacity, View, Alert, ScrollView, StyleSheet 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RNShake from 'react-native-shake';
import { 
  getDatabase, 
  seedActivities, 
  insertMoodWithActivities,
  getMoodHistory,
  getAllActivities,
  clearAllData,
} from './src/database';
import { Activity, MoodWithActivities } from './src/database/types';

function App() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodHistory, setMoodHistory] = useState<MoodWithActivities[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);

  // Initialize database
  useEffect(() => {
    const initDB = async () => {
      try {
        await getDatabase();
        await seedActivities();
        
        // Load activities
        const acts = await getAllActivities();
        setActivities(acts);
        
        // Load mood history
        await loadMoodHistory();
        
        console.log('Database initialized');
      } catch (error) {
        console.error('Database init failed:', error);
      }
    };

    initDB();
  }, []);

  const loadMoodHistory = async () => {
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

  const moods = [
    { emoji: '😀', label: "Happy", color: '#FFD700', intensity: 8 },
    { emoji: '😢', label: "Sad", color: '#4169E1', intensity: 3 },
    { emoji: '😡', label: "Angry", color: '#FF4500', intensity: 2 },
    { emoji: '😌', label: "Calm", color: '#90EE90', intensity: 7 },
    // ... your other moods
  ];

  const saveMood = async (mood: { emoji: string; label: string; intensity: number }) => {
    try {
      await insertMoodWithActivities({
        mood_type: mood.label,
        intensity: mood.intensity,
        note: '',
        activity_ids: selectedActivityIds,
      });
      
      await loadMoodHistory();
      setSelectedMood(mood.label);
      setSelectedActivityIds([]);
    } catch (error) {
      console.error('Failed to save mood:', error);
    }
  };

  const clearHistory = async () => {
    try {
      await clearAllData();
      await seedActivities(); // Re-seed activities
      await loadMoodHistory();
      Alert.alert('History Cleared', 'All mood history has been deleted!');
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  // Shake to delete
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
      <View style={styles.header}>
        <Text style={styles.title}>How Are You Feeling?</Text>
        <Text style={styles.subtitle}>Track Your Daily Moods</Text>
      </View>

      {/* Mood Grid */}
      <ScrollView style={styles.moodGridContainer}>
        <View style={styles.moodGrid}>
          {moods.map((mood, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.moodButton,
                { backgroundColor: mood.color },
                selectedMood === mood.label && styles.selectedMood,
              ]}
              onPress={() => saveMood(mood)}
            >
              <Text style={styles.emoji}>{mood.emoji}</Text>
              <Text style={styles.label}>{mood.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Mood History */}
      {moodHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Your Mood History</Text>
          <ScrollView style={styles.historyScroll}>
            {moodHistory.map((entry) => (
              <View
                key={entry.id}
                style={[
                  styles.historyItem,
                  { borderLeftColor: moods.find(m => m.label === entry.mood_type)?.color },
                ]}
              >
                <Text style={styles.historyEmoji}>
                  {moods.find(m => m.label === entry.mood_type)?.emoji}
                </Text>
                <View>
                  <Text style={styles.historyMood}>
                    {entry.mood_type} (Intensity: {entry.intensity}/10)
                  </Text>
                  {entry.activities.length > 0 && (
                    <Text style={styles.historyActivities}>
                      {entry.activities.map(a => a.name).join(', ')}
                    </Text>
                  )}
                  <Text style={styles.time}>{formatDate(entry.created_at)}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

// Your existing styles...
const styles = StyleSheet.create({
  // ... your existing styles
});

export default App;
```

---

## Troubleshooting

### Issue: "SQLite not found" error
**Solution:** Rebuild the app after installing the package:
```bash
npm run android  # or npm run ios
```

### Issue: Database not persisting
**Solution:** Check that you're awaiting all async operations.

### Issue: Can't see activities
**Solution:** Make sure `seedActivities()` is called after database initialization.

---

## Next Steps

1. ✅ Install package
2. ✅ Rebuild native app
3. ✅ Initialize database in App.tsx
4. ✅ Replace AsyncStorage calls with SQLite
5. ✅ Add activity selection UI (optional)
6. ✅ Test the app

---

## Resources

- [Database README](./README.md) - Full documentation
- [Examples](./examples.ts) - Code examples
- [Types](./types.ts) - TypeScript definitions
