/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert, ScrollView } from 'react-native';
import RNShake from 'react-native-shake';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MoodEntry {
  mood: string;
  timestamp: string;
  emoji: string;
  color: string;
}

interface Mood {
  emoji: string;
  label: string;
  color: string;
}

function App() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);

  const moods = [
    { emoji: '😀', label: "Happy", color: '#FFD700' },
    { emoji: '😢', label: "Sad", color: '#4169E1' },
    { emoji: '😡', label: "Angry", color: '#FF4500' },
    { emoji: '😌', label: "Calm", color: '#90EE90' },
    { emoji: '😴', label: "Tired", color: '#9370DB' },
    { emoji: '🤩', label: "Excited", color: '#FF69B4' },
    { emoji: '😊', label: "Content", color: '#98FB98' },
    { emoji: '😁', label: "Joyful", color: '#FFD700' },
    { emoji: '🥰', label: "Loved", color: '#FFB6C1' },
    { emoji: '😎', label: "Cool", color: '#00CED1' },
    { emoji: '🤔', label: "Thinking", color: '#D3D3D3' },
    { emoji: '😇', label: "Blessed", color: '#F0E68C' },
    { emoji: '🥳', label: "Celebrating", color: '#FF8C00' },
    { emoji: '😤', label: "Frustrated", color: '#CD5C5C' },
    { emoji: '😱', label: "Shocked", color: '#8B0000' },
    { emoji: '🥱', label: "Sleepy", color: '#B0C4DE' },
    { emoji: '🤗', label: "Caring", color: '#FFC0CB' },
    { emoji: '😬', label: "Nervous", color: '#A9A9A9' },
    { emoji: '🤯', label: "Mind Blown", color: '#7B68EE' },
    { emoji: '😏', label: "Confident", color: '#20B2AA' },
    { emoji: '🙃', label: "Playful", color: '#FFE4B5' },
    { emoji: '😋', label: "Satisfied", color: '#FFA07A' },
    { emoji: '🤓', label: "Focused", color: '#87CEFA' },
    { emoji: '🥺', label: "Emotional", color: '#FFDEAD' },
    { emoji: '😮‍💨', label: "Relieved", color: '#AFEEEE' },
    { emoji: '😕', label: "Confused", color: '#DCDCDC' },
  ];
  const saveMood = async (mood: Mood) => {
    try {
      const newEntry = {
        mood: mood.label,
        timestamp: new Date().toISOString(),
        emoji: mood.emoji,
        color: mood.color,
      };
      const updatedHistory = [newEntry, ...moodHistory];
      await AsyncStorage.setItem('moodHistory', JSON.stringify(updatedHistory));
      setMoodHistory(updatedHistory);
      setSelectedMood(mood.label);
    } catch (error) {
      console.error('Failed to save mood:', error);
    }
  };


  const loadMoodHistory = async () => {
    try {
      const storedHistory = await AsyncStorage.getItem('moodHistory');
      if (storedHistory !== null) {
        const parsedHistory = JSON.parse(storedHistory);
        setMoodHistory(parsedHistory);

        // optional: last mood eka select karanna
        if (parsedHistory.length > 0) {
          setSelectedMood(parsedHistory[0].mood);
        }
      }
    } catch (error) {
      console.error('Failed to load mood history:', error);
    }
  };

  useEffect(() => {
    loadMoodHistory();
  }, []);



  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem('moodHistory');
      setMoodHistory([]);
      setSelectedMood(null);
      Alert.alert('History Cleared', 'All mood history has been deleted!');
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  useEffect(() => {
    const subscription = RNShake.addListener(() => {
      Alert.alert(
        'Delete History?',
        'Are you sure you want to delete all your mood history?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: clearHistory,
          },
        ]
      );
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>How Are You Feeling?</Text>
        <Text style={styles.subtitiles}>Track Your Daily Moods</Text>
      </View>
      <ScrollView style={styles.moodGridContainer} contentContainerStyle={styles.moodGridContent}>
        <View style={styles.moodGrid}>
          {moods.map((mood, index) => (
            <TouchableOpacity key={index} style={[styles.moodButton, { backgroundColor: mood.color }, selectedMood === mood.label && styles.selectedMood]}

              onPress={() => saveMood(mood)}

            >
              <Text style={styles.emoji}>{mood.emoji}</Text>
              <Text style={styles.label}>{mood.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      {moodHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Your Mood History</Text>
          <ScrollView style={styles.historyScroll} showsVerticalScrollIndicator={true}>
            {moodHistory.map((entry, index) => (
              <View key={index} style={[styles.historyItem, { backgroundColor: '#f9f5f5' }, { borderLeftColor: entry.color }]}>

                <Text style={styles.historyEmoji}>{entry.emoji}</Text>

                <View>
                  <Text style={styles.historyMood}>{entry.mood}</Text>
                  <Text style={styles.time}>{formatDate(entry.timestamp)}</Text>
                </View>

              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  header: {
    padding: 20,
    alignItems: 'center'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitiles: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  moodGridContainer: {
    flex: 1,
    maxHeight: 300,
  },
  moodGridContent: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  moodButton: {
    width: 100,
    height: 120,
    borderRadius: 20,
    alignItems: 'center',
    margin: 5,
    justifyContent: 'center',
    backgroundColor: '#fff',
    elevation: 5,
    shadowColor: '#4815ee',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  emoji: {
    fontSize: 50,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  selectedMood: {
    borderWidth: 4,
    borderColor: '#333',
    transform: [{ scale: 1.05 }],
  },
  historyContainer: {
    padding: 20,
    flex: 1,
  },
  historyScroll: {
    maxHeight: 400,
  },
  selectedLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
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
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderLeftWidth: 5,
  },
  historyEmoji: {
    fontSize: 40,
    marginRight: 15,
  },
  historyMood: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  time: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  }
});

export default App;
