// (app)/profile.tsx
import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, Alert, 
  ActivityIndicator, TouchableOpacity, ScrollView 
} from 'react-native';
import api from '../src/api';
import { Stack, router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

type User = {
  _id: string;
  username: string;
  email: string;
  phoneNo: string;
  upiId: string;
};

type Due = {
  _id: string;
  group: { name: string, _id: string };
  amount: number;
};

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [pendingDues, setPendingDues] = useState<Due[]>([]);
  const [loading, setLoading] = useState(true);

  // useFocusEffect will re-fetch data every time you come back to this screen
  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        try {
          const response = await api.get('/users/me'); 
          if (response.data.user) {
            setUser(response.data.user);
          }
          if (response.data.pendingDues) {
            setPendingDues(response.data.pendingDues);
          }
        } catch (error: any) {
          console.error('Failed to fetch profile', error);
          Alert.alert('Error', 'Could not load your profile data.');
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }, [])
  );
  
  // Calculate total dues
  const totalDues = pendingDues.reduce((sum, due) => sum + due.amount, 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D976C" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container}>
        {/* Profile Info Card */}
        <Animatable.View animation="fadeInUp" delay={100} style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={50} color="#1D976C" />
          </View>
          <Text style={styles.username}>{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => router.push('/edit-profile')} // Go to the new edit screen
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </Animatable.View>

        {/* Dues Summary Card */}
        <Animatable.View animation="fadeInUp" delay={200} style={styles.card}>
          <Text style={styles.cardTitle}>Dues Summary</Text>
          <View style={styles.divider} />
          {pendingDues.length === 0 ? (
            <View style={styles.emptyDues}>
              <Ionicons name="checkmark-circle" size={40} color="#1D976C" />
              <Text style={styles.emptyDuesText}>You are all settled up!</Text>
            </View>
          ) : (
            <>
              <Text style={styles.totalDues}>
                You owe <Text style={{color: '#D9534F'}}>₹{totalDues.toFixed(2)}</Text>
              </Text>
              {pendingDues.map(due => (
                <TouchableOpacity 
                  key={due._id} 
                  style={styles.dueItem}
                  onPress={() => router.push(`/group/${due.group._id}`)} // Go to the group
                >
                  <Text style={styles.dueGroup}>{due.group.name}</Text>
                  <Text style={styles.dueAmount}>₹{due.amount.toFixed(2)}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </Animatable.View>

        {/* Other Options Card (placeholder for future features) */}
        <Animatable.View animation="fadeInUp" delay={300} style={styles.card}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="settings-outline" size={22} color="#555" />
            <Text style={styles.menuItemText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={22} color="#555" />
            <Text style={styles.menuItemText}>Help Center</Text>
          </TouchableOpacity>
        </Animatable.View>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  container: { 
    flex: 1, 
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  profileCard: {
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f6fffa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#1D976C'
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 15,
  },
  editButton: {
    backgroundColor: '#1D976C',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  emptyDues: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyDuesText: {
    fontSize: 16,
    color: 'gray',
    marginTop: 10,
  },
  totalDues: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  dueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  dueGroup: {
    fontSize: 16,
    color: '#007bff', // Make it tappable
  },
  dueAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D9534F', // Red for dues
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  }
});