// (app)/login.tsx
import React, { useState } from 'react';
import { 
  View, Text, TextInput, StyleSheet, Alert, 
  TouchableOpacity, KeyboardAvoidingView, 
  Platform, ScrollView, Image 
} from 'react-native';
import { Link, router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import api from '../src/api'; 
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context'; // Correct import

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    setLoading(true);

    try {
      const response = await api.post('/users/login', {
        email,
        password,
      });

      const { token, user } = response.data;
      if (!token) {
        Alert.alert('Error', 'Login failed: No token received.');
        setLoading(false);
        return;
      }

      await SecureStore.setItemAsync('userToken', token);
      await SecureStore.setItemAsync('userInfo', JSON.stringify(user));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      router.replace('/groups'); 

    } catch (error: any) {
      console.error('Login Error:', error.response?.data || error);
      const message = error.response?.data?.message || 'Invalid email or password.';
      Alert.alert('Error', message);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#000000ff', '#013013ff']} 
        style={styles.container}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollView}>
            
            <Animatable.View animation="fadeIn" delay={250} style={styles.logoContainer}>
              <Image
                source={require('../assets/images/logo.png')} // Use your new logo
                style={styles.logo}
              />
              <Text style={styles.logoText}>Smart Expense Splitter</Text>
            </Animatable.View>

            <Animatable.View animation="fadeInUp" delay={300} style={styles.formContainer}>
              <Text style={styles.title}>Welcome Back</Text>
              
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

              <TouchableOpacity 
                style={styles.button} 
                onPress={handleLogin} 
                disabled={loading}
              >
                <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
              </TouchableOpacity>
              
              <Link href="/register" asChild>
                <TouchableOpacity style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Need an account? Register</Text>
                </TouchableOpacity>
              </Link>
            </Animatable.View>

          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

// ... (styles are exactly the same as before)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000', 
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'white',
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
    backgroundColor: '#1D976C', 
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
    color: '#1D976C', 
    fontSize: 16,
    textAlign: 'center',
  },
});