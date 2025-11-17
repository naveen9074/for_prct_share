// (app)/add-expense.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, Button, StyleSheet, Alert, 
  Image, ScrollView, Platform, TouchableOpacity, 
  ActivityIndicator, KeyboardAvoidingView 
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../src/api';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context'; // <-- FIX 1: Correct Import

// ... (Type definitions for GroupMember and CustomSplit are the same)
type GroupMember = {
  _id: string;
  username: string;
};
type CustomSplit = {
  user: string;
  amount: string; 
};

export default function AddExpenseScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>(); 
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal'); 
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [customSplits, setCustomSplits] = useState<CustomSplit[]>([]);

  useEffect(() => {
    const fetchGroupMembers = async () => {
      try {
        const response = await api.get(`/groups/${groupId}`);
        const members = response.data.group.members;
        setGroupMembers(members);
        
        const initialSplits = members.map((member: GroupMember) => ({
          user: member._id,
          amount: '0.00',
        }));
        setCustomSplits(initialSplits);

      } catch (error) {
        Alert.alert('Error', 'Could not load group members.');
      }
    };
    fetchGroupMembers();
  }, [groupId]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Sorry', 'We need camera roll permissions.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      // --- FIX 2: Use the deprecated version for compatibility ---
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      // --- END OF FIX ---
      quality: 0.5, 
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };
  
  const updateCustomSplit = (userId: string, newAmount: string) => {
    setCustomSplits(prevSplits => 
      prevSplits.map(split => 
        split.user === userId ? { ...split, amount: newAmount } : split
      )
    );
  };

  const handleAddExpense = async () => {
    if (!description || !amount) {
      Alert.alert('Error', 'Please fill in description and amount.');
      return;
    }
    
    const totalAmount = parseFloat(amount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('description', description);
    formData.append('amount', amount);
    formData.append('group', groupId); 
    formData.append('splitType', splitType); 

    if (splitType === 'custom') {
      const splitsForBackend = customSplits.map(s => ({
        user: s.user,
        amount: parseFloat(s.amount) || 0,
      }));
      
      const totalCustomSplit = splitsForBackend.reduce((acc, split) => acc + split.amount, 0);

      if (Math.abs(totalCustomSplit - totalAmount) > 0.01) {
        Alert.alert('Error', `Custom splits (₹${totalCustomSplit.toFixed(2)}) must add up to the total amount (₹${totalAmount}). Please correct.`);
        setLoading(false);
        return;
      }
      
      formData.append('splits', JSON.stringify(splitsForBackend));
    }

    if (image) {
      const uri = image.uri;
      const fileType = image.mimeType || 'image/jpeg';
      const fileName = image.fileName || uri.split('/').pop();

      formData.append('billImage', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        type: fileType,
        name: fileName,
      } as any);
    }

    try {
      await api.post('/expenses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Success', 'Expense added!');
      router.back(); 

    } catch (error: any) {
      console.error('Failed to add expense:', error.response?.data || error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add expense.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
          <Stack.Screen options={{ title: 'Add New Expense' }} />
          
          <Text style={styles.label}>Description</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g., 'Dinner at Hotel'"
              value={description}
              onChangeText={setDescription}
            />
          </View>
          
          <Text style={styles.label}>Amount (₹)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g., '480'"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>
          
          <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
            <Ionicons name="camera-outline" size={20} color="#1D976C" />
            <Text style={styles.imagePickerText}>{image ? 'Change Bill' : 'Attach Bill / Proof'}</Text>
          </TouchableOpacity>
          
          {image && <Image source={{ uri: image.uri }} style={styles.imagePreview} />}

          <Text style={styles.label}>Split Type</Text>
          <View style={styles.splitToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, splitType === 'equal' && styles.toggleActive]}
              onPress={() => setSplitType('equal')}
            >
              <Text style={[styles.toggleText, splitType === 'equal' && styles.toggleTextActive]}>Equal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, splitType === 'custom' && styles.toggleActive]}
              onPress={() => setSplitType('custom')}
            >
              <Text style={[styles.toggleText, splitType === 'custom' && styles.toggleTextActive]}>Custom</Text>
            </TouchableOpacity>
          </View>

          {splitType === 'custom' && (
            <View>
              <Text style={styles.label}>Enter Custom Shares:</Text>
              {groupMembers.length === 0 && <ActivityIndicator />}
              
              {groupMembers.map((member) => (
                <View key={member._id} style={styles.customSplitItem}>
                  <Text style={styles.customSplitName}>{member.username}</Text>
                  <TextInput
                    style={styles.customSplitInput}
                    placeholder="₹0.00"
                    keyboardType="numeric"
                    value={customSplits.find(s => s.user === member._id)?.amount || '0'}
                    onChangeText={(text) => updateCustomSplit(member._id, text)}
                  />
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleAddExpense} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Add Expense</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ... (styles are the same)
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  container: { flex: 1, padding: 20, backgroundColor: 'white' },
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
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1D976C',
    borderStyle: 'dashed',
    marginTop: 20,
    backgroundColor: '#f6fffa',
  },
  imagePickerText: {
    color: '#1D976C',
    fontSize: 16,
    marginLeft: 10,
  },
  imagePreview: {
    width: '100%', height: 200, borderRadius: 10,
    marginTop: 20, resizeMode: 'cover', borderColor: '#ddd', borderWidth: 1,
  },
  splitToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#1D976C',
    marginBottom: 20,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  toggleActive: {
    backgroundColor: '#1D976C',
  },
  toggleText: {
    fontSize: 16,
    color: '#1D976C',
  },
  toggleTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  customSplitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
  },
  customSplitName: {
    fontSize: 16,
    color: '#333',
  },
  customSplitInput: {
    height: 40,
    width: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    textAlign: 'right',
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: '#1D976C', // Green
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
});