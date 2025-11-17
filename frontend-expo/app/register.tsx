// (app)/register.tsx
import React, { useState } from 'react';
import { 
  View, Text, TextInput, StyleSheet, Alert, 
  TouchableOpacity, KeyboardAvoidingView, 
  Platform, ScrollView 
} from 'react-native';
import { Link, router, Stack } from 'expo-router';
import api from '../src/api';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context'; // Correct import

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNo, setPhoneNo] = useState(''); // Use phoneNo to match backend
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !phoneNo || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);

    try {
      await api.post('/users/register', {
        username,
        email,
        phoneNo, // Send 'phoneNo'
        password,
      });

      Alert.alert('Success', 'Registration successful! Please log in.');
      router.replace('/login'); // Go back to login (we renamed index.tsx to login.tsx)

    } catch (error: any) {
      console.error('Registration Error:', error.response?.data || error);
      const message = error.response?.data?.message || 'Registration failed.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#000000ff', '#013013ff']} // Your new dark theme
        style={styles.container}
      >
        <Stack.Screen options={{ title: 'Register', headerStyle: { backgroundColor: '#000000ff' }, headerTintColor: 'white' }} /> 
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollView}>
            
            <Animatable.View animation="fadeInUp" delay={300} style={styles.formContainer}>
              <Text style={styles.title}>Create Account</Text>
              
              {/* --- THIS IS THE MISSING CODE --- */}
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={22} color="#666" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#666"
                  value={username}
                  onChangeText={setUsername}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={22} color="#666" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={22} color="#666" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor="#666"
                  value={phoneNo}
                  onChangeText={setPhoneNo}
                  keyboardType="phone-pad"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={22} color="#666" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
              {/* --- END OF MISSING CODE --- */}

              <TouchableOpacity 
                style={styles.button} 
                onPress={handleRegister} 
                disabled={loading}
              >
                <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Register'}</Text>
              </TouchableOpacity>
              
              <Link href="/login" asChild> 
                <TouchableOpacity style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Already have an account? Login</Text>
                </TouchableOpacity>
              </Link>
            </Animatable.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000ff', // Dark background
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'white', // White card
    borderRadius: 20, 
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10, 
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 25,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f3f3', 
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#1D976C', // Green button
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#1D976C', 
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    marginTop: 20,
  },
  secondaryButtonText: {
    color: '#1D976C', // Green link
    fontSize: 16,
    textAlign: 'center',
  },
});