import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, Alert, 
  TouchableOpacity, KeyboardAvoidingView, Platform, 
  ScrollView, ActivityIndicator
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import api from '../../src/api'; // <-- FIX: Correct path (up two levels)
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from "react-native-modal-datetime-picker";

export default function EditGroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const response = await api.get(`/groups/${id}`);
        const { group } = response.data;
        setGroupName(group.name);
        if (group.dueDate) setDueDate(new Date(group.dueDate));
      } catch (error: any) {
        Alert.alert('Error', 'Failed to load group data.');
      } finally {
        setPageLoading(false);
      }
    };
    fetchGroupData();
  }, [id]);
  
  const handleUpdateGroup = async () => {
    if (!groupName) {
      Alert.alert('Error', 'Group name cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      await api.patch(`/groups/${id}`, { name: groupName, dueDate: dueDate });
      Alert.alert('Success', 'Group updated!');
      router.back(); 
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update group.');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <ActivityIndicator size="large" color="#1D976C" style={{marginTop:50}} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.container}>
          <Text style={styles.label}>Group Name</Text>
          <TextInput style={styles.input} value={groupName} onChangeText={setGroupName} />

          <Text style={styles.label}>Due Date</Text>
          <TouchableOpacity style={styles.datePickerButton} onPress={() => setDatePickerVisibility(true)}>
             <Text>{dueDate ? dueDate.toLocaleDateString() : 'Set Date'}</Text>
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={(date) => { setDueDate(date); setDatePickerVisibility(false); }}
            onCancel={() => setDatePickerVisibility(false)}
          />

          <TouchableOpacity style={styles.button} onPress={handleUpdateGroup}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Save</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  container: { padding: 20 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  input: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 10, marginBottom: 20 },
  datePickerButton: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 10, marginBottom: 20 },
  button: { backgroundColor: '#1D976C', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});