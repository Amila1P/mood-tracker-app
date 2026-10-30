# Add Mood Screen - Usage Guide

## 🎨 Two Versions Available

### 1. **AddMoodScreen.tsx** (React Native Paper)
- Beautiful Material Design components
- Requires `react-native-paper` package
- More polished UI out of the box

### 2. **AddMoodScreenSimple.tsx** (Standard React Native)
- Uses only standard React Native components
- No additional dependencies required
- Fully customizable

---

## 📦 Installation

### For React Native Paper Version:
Already installed! ✅

---

## 🚀 Usage Examples

### Option 1: As a Modal (Recommended)

```tsx
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Modal } from 'react-native';
import AddMoodScreen from './src/screens/AddMoodScreen'; // or AddMoodScreenSimple

function App() {
  const [showAddMood, setShowAddMood] = useState(false);

  const handleMoodAdded = () => {
    console.log('Mood added successfully!');
    // Refresh your mood history here
    loadMoodHistory();
  };

  return (
    <View>
      {/* Your existing app content */}
      
      {/* Add Mood Button */}
      <TouchableOpacity onPress={() => setShowAddMood(true)}>
        <Text>Add New Mood</Text>
      </TouchableOpacity>

      {/* Add Mood Modal */}
      <Modal
        visible={showAddMood}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddMood(false)}
      >
        <AddMoodScreen
          onMoodAdded={handleMoodAdded}
          onClose={() => setShowAddMood(false)}
        />
      </Modal>
    </View>
  );
}
```

---

### Option 2: As a Standalone Screen

```tsx
import React from 'react';
import AddMoodScreen from './src/screens/AddMoodScreen';

function App() {
  const handleMoodAdded = () => {
    console.log('Mood saved!');
    // Navigate back or refresh data
  };

  return (
    <AddMoodScreen
      onMoodAdded={handleMoodAdded}
    />
  );
}
```

---

### Option 3: With React Navigation

```tsx
// In your navigation setup
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AddMoodScreen from './src/screens/AddMoodScreen';
import HomeScreen from './src/screens/HomeScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen 
        name="AddMood" 
        component={AddMoodScreen}
        options={{
          title: 'Add Mood',
          presentation: 'modal'
        }}
      />
    </Stack.Navigator>
  );
}

// In your HomeScreen.tsx
navigation.navigate('AddMood');
```

---

## 🔄 Complete Integration with App.tsx

Here's how to add it to your existing MoodTracker App.tsx:

```tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddMoodScreen from './src/screens/AddMoodScreen'; // or AddMoodScreenSimple
import { 
  getDatabase, 
  seedActivities, 
  getMoodHistory 
} from './src/database';
import { MoodWithActivities } from './src/database/types';

function App() {
  const [showAddMood, setShowAddMood] = useState(false);
  const [moodHistory, setMoodHistory] = useState<MoodWithActivities[]>([]);

  // Initialize database
  useEffect(() => {
    const initDB = async () => {
      try {
        await getDatabase();
        await seedActivities();
        await loadMoodHistory();
      } catch (error) {
        console.error('Database init failed:', error);
      }
    };
    initDB();
  }, []);

  // Load mood history
  const loadMoodHistory = async () => {
    try {
      const history = await getMoodHistory(20);
      setMoodHistory(history);
    } catch (error) {
      console.error('Failed to load mood history:', error);
    }
  };

  // Handle when a new mood is added
  const handleMoodAdded = () => {
    setShowAddMood(false);
    loadMoodHistory(); // Refresh the history
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Your existing mood tracker UI */}
      
      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddMood(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add Mood Modal */}
      <Modal
        visible={showAddMood}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddMood(false)}
      >
        <AddMoodScreen
          onMoodAdded={handleMoodAdded}
          onClose={() => setShowAddMood(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
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

export default App;
```

---

## 🎯 Features Included

### ✅ Horizontal Mood Selection
- 8 pre-configured moods with emojis
- Visual feedback on selection
- Color-coded mood buttons
- Smooth horizontal scrolling

### ✅ Multi-select Activity Chips
- Fetches activities from SQLite database
- Toggle selection with tap
- Visual indication of selected items
- Loading state while fetching

### ✅ Notes Input
- Multi-line text input
- 500 character limit
- Character counter
- Optional field

### ✅ Summary Section
- Shows selected mood and activities
- Appears only when mood is selected
- Visual confirmation before saving

### ✅ Save Functionality
- Validates mood selection
- Calls `insertMoodWithActivities()`
- Transaction-safe database operation
- Success/error alerts
- Loading state during save

### ✅ Form Management
- Auto-reset after successful save
- Unsaved changes warning
- Cancel functionality
- Callback support for parent component

---

## 🎨 Customization

### Modify Moods
Edit the `MOODS` array in the screen file:

```typescript
const MOODS = [
  { id: 1, emoji: '😀', label: 'Happy', color: '#FFD700', intensity: 8 },
  { id: 2, emoji: '😢', label: 'Sad', color: '#4169E1', intensity: 3 },
  // Add your custom moods here
];
```

### Change Colors
Update the styles object or add theme support:

```typescript
const styles = StyleSheet.create({
  saveButton: {
    backgroundColor: '#6200ee', // Change primary color
    // ... rest of styles
  },
});
```

### Adjust Intensity Mapping
Each mood has an `intensity` value (1-10) that's automatically saved to the database.

---

## 🔧 Props API

### AddMoodScreen Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onMoodAdded` | `() => void` | No | Callback when mood is successfully saved |
| `onClose` | `() => void` | No | Callback to close the screen/modal |

---

## 📱 Database Integration

The screen automatically:
1. ✅ Fetches activities using `getAllActivities()`
2. ✅ Saves mood using `insertMoodWithActivities()`
3. ✅ Handles loading states
4. ✅ Manages errors with user-friendly alerts

### Data Saved:
```typescript
{
  mood_type: 'Happy',          // Selected mood label
  intensity: 8,                // Mood intensity (1-10)
  note: 'Optional note text',  // User's note
  activity_ids: [1, 2, 3]      // Selected activity IDs
}
```

---

## 🐛 Troubleshooting

### Activities not loading?
Make sure you've initialized the database and seeded activities:
```typescript
await getDatabase();
await seedActivities();
```

### Save button disabled?
- Ensure a mood is selected (required field)
- Check database connection is established

### Modal not showing?
- Verify state management in parent component
- Check Modal visibility prop

---

## 📚 Related Files

- Database Service: `src/database/database.ts`
- Type Definitions: `src/database/types.ts`
- Database Guide: `src/database/README.md`

---

## 🎉 Next Steps

1. ✅ Choose your preferred version (Paper or Simple)
2. ✅ Add to your App.tsx using one of the integration methods
3. ✅ Customize moods and colors to match your app
4. ✅ Test the complete flow
5. ✅ Build and run on device

---

## 💡 Tips

- Use the **Modal** approach for best UX
- Add a **Floating Action Button (FAB)** to trigger the screen
- Consider adding **mood intensity slider** for more granular control
- Add **date/time picker** if you want to log past moods
- Implement **edit mood** functionality using similar patterns

---

## 🚀 Ready to Use!

Both versions are production-ready and include:
- ✅ Full TypeScript support
- ✅ Error handling
- ✅ Loading states
- ✅ Form validation
- ✅ Responsive design
- ✅ Accessibility features
