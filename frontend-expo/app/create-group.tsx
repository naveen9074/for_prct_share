// (app)/create-group.tsx
import React, { useState } from 'react';
import { 
  View, Text, TextInput, StyleSheet, Alert, 
  TouchableOpacity, KeyboardAvoidingView, Platform, 
  ScrollView, // <-- We are back to ScrollView
  ActivityIndicator
} from 'react-native';
import { router, Stack } from 'expo-router';
import api from '../src/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import DateTimePickerModal from "react-native-modal-datetime-picker";

type StagedMember = {
  phoneNo: string;
  name: string;
};

export default function CreateGroupScreen() {
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [stagedMembers, setStagedMembers] = useState<StagedMember[]>([]);
  const [manualPhone, setManualPhone] = useState('');
  
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const handleAddFromContacts = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your contacts to add members.');
      return;
    }
    
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
    });

    if (data.length > 0) {
      const firstContact = data.find(c => c.name && c.phoneNumbers && c.phoneNumbers[0]?.number);
      if (firstContact) {
        addStagedMember(firstContact.phoneNumbers![0].number, firstContact.name);
      } else {
        Alert.alert('No Contacts Found', 'No contacts with phone numbers were found.');
      }
    }
  };
  
  const handleAddManualPhone = () => {
    if (manualPhone.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number.');
      return;
    }
    addStagedMember(manualPhone, `User (${manualPhone.slice(-4)})`);
    setManualPhone('');
  };
  
  const addStagedMember = (phoneNo: string, name: string) => {
    const normalized = phoneNo.replace(/\D/g, ''); 
    
    if (stagedMembers.find(m => m.phoneNo.replace(/\D/g, '') === normalized)) {
      Alert.alert('Already Added', `${name} is already in the list.`);
      return;
    }
    setStagedMembers(prev => [...prev, { phoneNo, name }]);
  };
  
  const removeStagedMember = (phoneNo: string) => {
    setStagedMembers(prev => prev.filter(m => m.phoneNo !== phoneNo));
  };
  
  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleDateConfirm = (date: Date) => {
    setDueDate(date);
    hideDatePicker();
  };
  
  const handleCreateGroup = async () => {
    if (!groupName) {
      Alert.alert('Error', 'Please enter a group name.');
      return;
    }
    setLoading(true);

    try {
      const phoneNumbers = stagedMembers.map(m => m.phoneNo);
      
      const response = await api.post('/groups', {
        name: groupName,
        phoneNumbers: phoneNumbers,
        dueDate: dueDate,
      });

      Alert.alert('Success', response.data.message);
      router.back(); 

    } catch (error: any) {
      console.error('Failed to create group:', error.response?.data || error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create group.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Create New Group' }} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        {/* We use ScrollView as the main container */}
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled" // This helps with keyboard dismissal
        >
          
          {/* All content is now directly inside the ScrollView */}
          <Text style={styles.label}>Group Name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g., 'Kerala Trip'"
              value={groupName}
              onChangeText={setGroupName}
            />
          </View>

          <Text style={styles.label}>Add Members (Optional)</Text>
          <TouchableOpacity style={styles.contactButton} onPress={handleAddFromContacts}>
            <Ionicons name="people-outline" size={20} color="white" />
            <Text style={styles.contactButtonText}>Add from Contacts</Text>
          </TouchableOpacity>
          
          <View style={styles.manualAddContainer}>
            <TextInput
              style={styles.manualInput}
              placeholder="Or enter 10-digit phone #"
              value={manualPhone}
              onChangeText={setManualPhone}
              keyboardType="phone-pad"
            />
            <TouchableOpacity style={styles.manualAddButton} onPress={handleAddManualPhone}>
              <Text style={styles.manualAddButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          {/* We use .map() instead of FlatList */}
          {stagedMembers.map((item) => (
            <View key={item.phoneNo} style={styles.stagedItem}>
              <Ionicons name="person-circle" size={24} color="#1D976C" />
              <Text style={styles.stagedName}>{item.name}</Text>
              <TouchableOpacity onPress={() => removeStagedMember(item.phoneNo)}>
                <Ionicons name="close-circle" size={24} color="#D9534F" />
              </TouchableOpacity>
            </View>
          ))}

          <Text style={styles.label}>Due Date (Optional)</Text>
          <View style={styles.datePickerContainer}>
            <TouchableOpacity style={styles.datePickerButton} onPress={showDatePicker}>
              <Ionicons name="calendar-outline" size={20} color="#1D976C" />
              <Text style={styles.datePickerText}>
                {dueDate ? dueDate.toLocaleDateString() : 'Set a due date'}
              </Text>
            </TouchableOpacity>
            
            {dueDate && (
              <TouchableOpacity onPress={() => setDueDate(null)} style={styles.clearButton}>
                <Ionicons name="close-circle" size={24} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleDateConfirm}
            onCancel={hideDatePicker}
          />

          <View style={{ marginTop: 30 }}>
            <TouchableOpacity 
              style={[styles.button, loading && styles.disabledButton]} 
              onPress={handleCreateGroup} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Create Group</Text>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  container: { flex: 1, backgroundColor: 'white' },
  scrollContent: {
    padding: 20,
    paddingBottom: 60, // Extra space at the bottom
  },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 10 },
  inputContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  input: {
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#1D976C',
    marginTop: 5,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  manualAddContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 20,
  },
  manualInput: {
    flex: 1,
    height: 50,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#eee',
    fontSize: 16,
  },
  manualAddButton: {
    paddingHorizontal: 15,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007bff',
    borderRadius: 10,
    marginLeft: 10,
  },
  manualAddButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stagedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  stagedName: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#f5f5f5',
  },
  datePickerText: {
    color: '#333',
    fontSize: 16,
    marginLeft: 10,
  },
  clearButton: {
    padding: 10,
    marginLeft: 10,
  },
  button: {
    backgroundColor: '#1D976C',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: 'gray',
  },
});