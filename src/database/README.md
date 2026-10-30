# Mood Tracker Database Documentation

## Overview
This SQLite database implementation provides a robust solution for storing mood entries with associated activities. It includes transaction support for data integrity and optimized queries for performance.

## Database Schema

### Tables

#### 1. **moods** - Daily mood entries
```sql
CREATE TABLE IF NOT EXISTS moods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mood_type TEXT NOT NULL,
  intensity INTEGER NOT NULL CHECK(intensity >= 1 AND intensity <= 10),
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
```

**Columns:**
- `id`: Primary key (auto-increment)
- `mood_type`: Type of mood (e.g., "Happy", "Sad", "Anxious")
- `intensity`: Mood intensity on a scale of 1-10
- `note`: Optional text note for the mood
- `created_at`: Timestamp of when the mood was recorded

---

#### 2. **activities** - Master list of activities
```sql
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  icon_name TEXT NOT NULL
);
```

**Columns:**
- `id`: Primary key (auto-increment)
- `name`: Activity name (unique constraint)
- `icon_name`: Icon identifier for UI display

**Default Activities:**
- Work (briefcase)
- School (school)
- Exercise (fitness)
- Gaming (game-controller)
- Reading (book)
- Socializing (people)
- Family Time (home)
- Meditation (leaf)
- Music (musical-notes)
- Cooking (restaurant)
- Shopping (cart)
- Travel (airplane)

---

#### 3. **mood_activities** - Junction table (Many-to-Many)
```sql
CREATE TABLE IF NOT EXISTS mood_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mood_id INTEGER NOT NULL,
  activity_id INTEGER NOT NULL,
  FOREIGN KEY (mood_id) REFERENCES moods(id) ON DELETE CASCADE,
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  UNIQUE(mood_id, activity_id)
);
```

**Columns:**
- `id`: Primary key (auto-increment)
- `mood_id`: Foreign key to moods table
- `activity_id`: Foreign key to activities table
- **Constraints:**
  - Cascade delete: When a mood is deleted, associated records are removed
  - Unique pair: Prevents duplicate activity assignments to the same mood

---

### Indexes for Performance
```sql
CREATE INDEX idx_moods_created_at ON moods(created_at DESC);
CREATE INDEX idx_mood_activities_mood_id ON mood_activities(mood_id);
CREATE INDEX idx_mood_activities_activity_id ON mood_activities(activity_id);
```

---

## Entity Relationship Diagram

```
┌─────────────────┐
│     moods       │
├─────────────────┤
│ id (PK)         │◄─────┐
│ mood_type       │      │
│ intensity       │      │
│ note            │      │
│ created_at      │      │
└─────────────────┘      │
                         │
                    ┌────┴─────────────────┐
                    │  mood_activities     │
                    ├──────────────────────┤
                    │ id (PK)              │
                    │ mood_id (FK)         │
                    │ activity_id (FK)     │
                    └────┬─────────────────┘
                         │
┌─────────────────┐      │
│   activities    │      │
├─────────────────┤      │
│ id (PK)         │◄─────┘
│ name (UNIQUE)   │
│ icon_name       │
└─────────────────┘
```

---

## Key Features

### 1. Transaction Support
All mood entries with activities are inserted within a transaction:
```typescript
await db.transaction(async (tx) => {
  // Insert mood
  const [moodResult] = await tx.executeSql(...);
  
  // Insert associated activities
  for (const activityId of activity_ids) {
    await tx.executeSql(...);
  }
});
```

**Benefits:**
- ✅ Data integrity: All operations succeed or all fail
- ✅ No orphaned records
- ✅ Consistent database state

---

### 2. Optimized Queries

#### Standard Query (Multiple Database Calls)
```typescript
getMoodHistory()
// Fetches moods, then queries activities for each mood
```

#### Optimized Query (Single Database Call)
```typescript
getMoodHistoryOptimized()
// Uses GROUP_CONCAT to fetch everything in one query
// Better performance for large datasets
```

---

## Core Functions

### Database Initialization
```typescript
import { getDatabase, seedActivities } from './src/database';

// Initialize database and create tables
const db = await getDatabase();

// Seed default activities
await seedActivities();
```

### Insert Mood with Activities
```typescript
import { insertMoodWithActivities, NewMoodEntry } from './src/database';

const newMood: NewMoodEntry = {
  mood_type: 'Happy',
  intensity: 8,
  note: 'Great day!',
  activity_ids: [1, 3, 6] // Work, Exercise, Socializing
};

const moodId = await insertMoodWithActivities(newMood);
```

### Fetch Mood History
```typescript
import { getMoodHistory } from './src/database';

// Get all moods
const allMoods = await getMoodHistory();

// Get last 10 moods
const recentMoods = await getMoodHistory(10);

// Access mood data
recentMoods.forEach(mood => {
  console.log(mood.mood_type);
  console.log(mood.intensity);
  console.log(mood.activities); // Array of Activity objects
});
```

### Other Operations
```typescript
// Get all activities
const activities = await getAllActivities();

// Add custom activity
const activityId = await addActivity('Yoga', 'lotus');

// Update mood
await updateMood(1, 'Content', 7, 'Feeling better');

// Delete mood (cascades to mood_activities)
await deleteMood(1);

// Get statistics
const stats = await getMoodStatistics();

// Clear all data
await clearAllData();
```

---

## SQL Queries Reference

### Insert Mood Entry
```sql
INSERT INTO moods (mood_type, intensity, note, created_at) 
VALUES (?, ?, ?, datetime('now', 'localtime'))
```

### Insert Mood-Activity Link
```sql
INSERT INTO mood_activities (mood_id, activity_id) 
VALUES (?, ?)
```

### Fetch Mood History with Activities
```sql
-- Standard approach
SELECT * FROM moods ORDER BY created_at DESC LIMIT ?

SELECT a.id, a.name, a.icon_name
FROM activities a
INNER JOIN mood_activities ma ON a.id = ma.activity_id
WHERE ma.mood_id = ?
ORDER BY a.name

-- Optimized approach (single query)
SELECT 
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
LIMIT ?
```

### Get All Activities
```sql
SELECT * FROM activities ORDER BY name
```

### Get Mood Statistics
```sql
SELECT 
  COUNT(*) as total_entries,
  AVG(intensity) as avg_intensity,
  mood_type,
  COUNT(*) as mood_count
FROM moods
GROUP BY mood_type
ORDER BY mood_count DESC
```

---

## TypeScript Types

```typescript
interface MoodEntry {
  id?: number;
  mood_type: string;
  intensity: number; // 1-10
  note?: string;
  created_at: string;
}

interface Activity {
  id?: number;
  name: string;
  icon_name: string;
}

interface MoodWithActivities extends MoodEntry {
  activities: Activity[];
}

interface NewMoodEntry {
  mood_type: string;
  intensity: number;
  note?: string;
  activity_ids: number[];
}
```

---

## Usage in React Native

### App Initialization
```typescript
// App.tsx
import { useEffect } from 'react';
import { getDatabase, seedActivities } from './src/database';

function App() {
  useEffect(() => {
    const initDB = async () => {
      try {
        await getDatabase();
        await seedActivities();
        console.log('Database initialized');
      } catch (error) {
        console.error('Database init failed:', error);
      }
    };

    initDB();
  }, []);

  return <YourAppContent />;
}
```

### Complete Example Component
See [examples.ts](./examples.ts) for full React component examples.

---

## Best Practices

1. **Always use transactions** for related inserts (mood + activities)
2. **Handle errors** with try-catch blocks
3. **Use the optimized query** for large datasets
4. **Index frequently queried columns** (already implemented)
5. **Close database** when app is terminated (optional with SQLite)
6. **Validate data** before inserting (intensity 1-10, etc.)

---

## Testing

Run the complete flow test:
```typescript
import { completeMoodFlow } from './src/database/examples';

completeMoodFlow()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Test failed:', err));
```

---

## Migration Support

For future schema changes, implement versioning:
```typescript
const DATABASE_VERSION = '1.0';

// Future: Check version and run migration scripts
if (currentVersion < targetVersion) {
  await runMigrations();
}
```

---

## Performance Considerations

- **Indexes** are created on commonly queried fields
- **Transaction batches** multiple inserts for atomicity
- **Optimized queries** use GROUP_CONCAT to reduce round trips
- **Limit clauses** prevent loading excessive data

---

## Security Notes

- Input is parameterized to prevent SQL injection
- Sensitive data should be encrypted before storage (if needed)
- Consider adding user authentication and data encryption for production

---

## File Structure

```
src/
└── database/
    ├── index.ts           # Main exports
    ├── types.ts           # TypeScript type definitions
    ├── database.ts        # Core database functions
    ├── examples.ts        # Usage examples
    └── README.md          # This file
```

---

## License
MIT

---

## Support

For issues or questions, please refer to:
- SQLite documentation: https://www.sqlite.org/docs.html
- react-native-sqlite-storage: https://github.com/andpor/react-native-sqlite-storage
