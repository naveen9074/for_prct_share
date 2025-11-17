// (app)/edit-profile.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, Alert, 
  TouchableOpacity, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import api from '../src/api';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  const [upiId, setUpiId] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/me'); 
        if (response.data.user) {
          const { user } = response.data;
          setUpiId(user.upiId || '');
          setUsername(user.username || '');
          setEmail(user.email || '');
          setPhoneNo(user.phoneNo || '');
        }
      } catch (error: any) {
        Alert.alert('Error', 'Could not load your profile data.');
      } finally {
        setPageLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.patch('/users/profile', { 
        upiId: upiId,
        username: username,
        email: email,
        phoneNo: phoneNo
      });
      Alert.alert('Success', 'Your profile has been saved.');
      router.back(); // Go back to the profile screen
    } catch (error: any) {
      Alert.alert('Error', 'Failed to save profile.');
      console.error('Save profile error:', error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D976C" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.container}>

          <Text style={styles.label}>Username</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Your Name"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Your Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
          </View>

          <Text style={styles.label}>Phone</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Your Phone Number"
              value={phoneNo}
              onChangeText={setPhoneNo}
              keyboardType="phone-pad"
            />
          </View>

          <Text style={styles.label}>Your UPI ID</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g., yourname@okaxis"
              value={upiId}
              onChangeText={setUpiId}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <Text style={styles.info}>Other users will use this ID to pay you.</Text>

          <TouchableOpacity 
            style={[styles.button, loading && styles.disabledButton]} 
            onPress={handleSave} 
            disabled={loading} 
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: 'white' 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  label: { 
    fontSize: 16, 
    marginBottom: 8,
    fontWeight: '600',
    color: '#333'
  },
  inputContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 15,
  },
  input: {
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  info: { 
    color: 'gray', 
    fontStyle: 'italic', 
    marginBottom: 20,
    fontSize: 12,
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
  }
});