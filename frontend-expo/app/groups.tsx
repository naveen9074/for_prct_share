// (app)/groups.tsx
import React, { useState, useCallback } from 'react';
import { 
  View, Text, Button, StyleSheet, FlatList, Alert, 
  ActivityIndicator, TouchableOpacity, SafeAreaView
} from 'react-native';
import { Link, router, useFocusEffect, Stack } from 'expo-router'; 
import * as SecureStore from 'expo-secure-store';
import api from '../src/api';
import { Ionicons } from '@expo/vector-icons'; 
import * as Animatable from 'react-native-animatable';
import SidebarMenu from '../src/components/SidebarMenu'; // <-- IMPORT OUR NEW MENU

export default function GroupListScreen() {
  const [groups, setGroups] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [username, setUsername] = useState(''); 
  const [isMenuVisible, setMenuVisible] = useState(false); // State to control the menu

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const userInfo = await SecureStore.getItemAsync('userInfo');
        if (userInfo) {
          const parsed = JSON.parse(userInfo);
          setUsername(parsed.username || (parsed.user && parsed.user.username) || 'User');
        }
        fetchGroups();
      };
      loadData(); 
      return () => {};
    }, [])
  );

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/groups'); 
      setGroups(response.data); 
    } catch (error: any) {
      console.error('Failed to fetch groups:', error.response?.data || error);
      Alert.alert('Error', 'Failed to fetch your groups.');
    } finally {
      setLoading(false);
    }
  };

  // This function will be passed to the SidebarMenu component
  const handleLogout = async () => {
    setMenuVisible(false);
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userInfo');
    delete api.defaults.headers.common['Authorization'];
    router.replace('/login'); // Go to login page
  };

  const renderGroupItem = ({ item, index }: { item: any, index: number }) => (
    <Animatable.View 
      animation="fadeInUp" 
      duration={500} 
      delay={index * 100}
    >
      <Link href={`/group/${item._id}`} asChild>
        <TouchableOpacity style={styles.groupItem}>
          <Ionicons name="people-sharp" size={24} color="#1D976C" style={styles.groupIcon} />
          <View>
            <Text style={styles.groupName}>{item.name}</Text>
          </View>
        </TouchableOpacity>
      </Link>
    </Animatable.View>
  );

  if (loading && groups.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D976C" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* --- USE THE NEW SIDEBAR MENU --- */}
      <SidebarMenu 
        isVisible={isMenuVisible}
        onClose={() => setMenuVisible(false)}
        onLogout={handleLogout}
      />

      {/* --- CUSTOM HEADER --- */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.title}>{username}</Text>
        </View>
        {/* This button just opens the menu */}
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
          <Ionicons name="menu" size={32} color="#333" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.subtitle}>Your Groups</Text>

      <FlatList
        data={groups}
        renderItem={renderGroupItem}
        keyExtractor={(item: any) => item._id} 
        ListEmptyComponent={<Text style={styles.emptyText}>No groups yet. Create one!</Text>}
        refreshing={loading} 
        onRefresh={fetchGroups}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      
      {/* --- FLOATING ACTION BUTTON --- */}
      <Animatable.View animation="zoomIn" delay={300} style={styles.fabContainer}>
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => router.push('/create-group')}
        >
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>
      </Animatable.View>
    </SafeAreaView>
  );
}

// Styles are simplified because all modal styles are gone
const styles = StyleSheet.create({
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: 'gray',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  menuButton: {
    padding: 5,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 20,
    borderRadius: 12,
    marginBottom: 10,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  groupIcon: {
    marginRight: 15,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: 'gray',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    shadowColor: '#1D976C',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1D976C',
    justifyContent: 'center',
    alignItems: 'center',
  },
});