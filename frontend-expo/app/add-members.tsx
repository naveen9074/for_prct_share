// (app)/add-members.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Alert, 
  ActivityIndicator, 
  TouchableOpacity, 
  TextInput,
  Button // <-- THIS WAS THE MISSING IMPORT
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import * as Contacts from 'expo-contacts';
import api from '../src/api';

export default function AddMembersScreen() {
  const { groupId, groupName } = useLocalSearchParams<{ groupId: string, groupName: string }>();
  
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch contacts when screen loads
  useEffect(() => {
    const getContacts = async () => {
      try {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'We need access to your contacts to add members.');
          setLoading(false);
          return;
        }

        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        });

        if (data.length > 0) {
          const validContacts = data
            .filter(c => c.name && c.phoneNumbers && c.phoneNumbers[0]?.number)
            .sort((a, b) => a.name.localeCompare(b.name));
            
          setContacts(validContacts);
        }
      } catch (error: any) {
        console.error('Failed to get contacts:', error);
        Alert.alert('Error', 'Could not load contacts.');
      } finally {
        setLoading(false);
      }
    };

    getContacts();
  }, []);

  // 2. Function to handle adding a member
  const handleAddMember = async (contact: Contacts.Contact) => {
    const phoneNumber = contact.phoneNumbers![0].number;

    Alert.alert(
      'Add Member',
      `Add ${contact.name} to the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add', 
          onPress: async () => {
            try {
              // This matches your backend route
              const response = await api.post(`/groups/${groupId}/members`, {
                phoneNumber: phoneNumber,
              });
              
              Alert.alert('Success', `${contact.name} has been added to the group.`);
              
            } catch (error: any) {
              console.error(error.response?.data || error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to add member.');
            }
          }
        }
      ]
    );
  };

  // 3. Filter contacts based on search
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 4. UI for each contact item
  const renderItem = ({ item }: { item: Contacts.Contact }) => (
    <View style={styles.contactItem}>
      <View style={{ flex: 1 }}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactNumber}>{item.phoneNumbers![0].number}</Text>
      </View>
      <Button title="Add" onPress={() => handleAddMember(item)} />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `Add to ${groupName}` }} />
      
      <TextInput
        style={styles.searchBar}
        placeholder="Search contacts..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      
      <FlatList
        data={filteredContacts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id!}
        ListEmptyComponent={<Text style={styles.emptyText}>No contacts found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBar: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    margin: 10,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomColor: '#f0f0f0',
    borderBottomWidth: 1,
  },
  contactName: { fontSize: 16, fontWeight: 'bold' },
  contactNumber: { fontSize: 14, color: 'gray' },
  emptyText: { textAlign: 'center', color: 'gray', marginTop: 20 },
});