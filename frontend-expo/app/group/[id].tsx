// frontend-expo/app/group/[id].tsx
import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Alert, 
  ActivityIndicator, TouchableOpacity, SafeAreaView
} from 'react-native';
import { Link, useLocalSearchParams, router, useFocusEffect, Stack } from 'expo-router';
import api from '../../src/api'; 
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); 
  const [group, setGroup] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserNet, setCurrentUserNet] = useState<number>(0);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const userInfo = await SecureStore.getItemAsync('userInfo');
        if (userInfo) {
          const parsed = JSON.parse(userInfo);
          const uId = parsed._id || (parsed.user && parsed.user._id);
          setCurrentUserId(String(uId));
        }
        if (id) fetchGroupDetails();
      };
      loadData();
    }, [id])
  );

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/groups/${id}`);
      setGroup(response.data.group);
      setExpenses(response.data.expenses || []);
      setSettlements(response.data.settlements || []);
      setCurrentUserNet(Number(response.data.currentUserNet || 0));
    } catch (error: any) {
      Alert.alert('Error', 'Failed to fetch group details.');
    } finally {
      setLoading(false);
    }
  };

  const getMyShareForExpense = (expense: any) => {
    if (!currentUserId) return 0;
    const mySplit = (expense.splits || []).find((s: any) => {
      const uid = (s.user && (s.user._id || s.user)) ? (s.user._id || s.user) : null;
      return String(uid) === String(currentUserId);
    });
    if (mySplit && String(expense.paidBy._id) !== String(currentUserId)) return Number(mySplit.amount || 0);
    return 0;
  };

  const handleDeleteGroup = async () => {
    Alert.alert("Delete Group", "Are you sure?", [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/groups/${id}`);
            router.replace('/groups');
          } catch (error) { Alert.alert('Error', 'Failed to delete'); }
        }
      }
    ]);
  };

  // --- Use currentUserNet to show Total Outstanding reliably ---
  const renderTotalSettlement = () => {
    if (currentUserNet < -0.01) {
      // user owes money (negative)
      
      const amount = Math.abs(currentUserNet);
      return (
        <Animatable.View animation="fadeIn" style={styles.settlementCardRed}>
           <View style={{flexDirection:'row', justifyContent:'space-between'}}>
             <View>
               <Text style={styles.settleTitle}>Total Outstanding</Text>
               <Text style={styles.settleDesc}>You owe</Text>
             </View>
             <Text style={styles.settleAmountRed}>₹{amount.toFixed(2)}</Text>
           </View>
           <TouchableOpacity 
             style={styles.payButton}
             onPress={() => {
               // navigate to a generic settle-all screen - you already have flow to settle by settlementId,
               // but for simplicity we redirect user to a page showing all personal pending settlements.
               router.push({ pathname: '/my-settlements', params: { groupId: id } });
             }}
           >
             <Text style={styles.payButtonText}>Settle Full Amount</Text>
           </TouchableOpacity>
        </Animatable.View>
      );
    } 
    
    if (currentUserNet > 0.01) {
      const amount = currentUserNet;
      return (
        <Animatable.View animation="fadeIn" style={styles.settlementCardGreen}>
           <View style={{flexDirection:'row', justifyContent:'space-between'}}>
             <View>
               <Text style={styles.settleTitle}>You are owed</Text>
               <Text style={styles.settleDesc}>Group owes you</Text>
             </View>
             <Text style={styles.settleAmountGreen}>₹{amount.toFixed(2)}</Text>
           </View>
        </Animatable.View>
      );
    }

    return (
      <View style={styles.settledCard}>
        <Ionicons name="checkmark-circle" size={24} color="#1D976C" />
        <Text style={styles.settledText}>All settled up!</Text>
      </View>
    );
  };

  const renderExpenseItem = ({ item }: { item: any }) => {
    const myShare = getMyShareForExpense(item);
    const isPayer = String(item.paidBy._id) === String(currentUserId);
    const isSettled = !!item.isSettled;

    return (
      <TouchableOpacity 
        style={styles.expenseItem}
        activeOpacity={0.7}
        onPress={() => {
          router.push(`/expense/${item._id}`);
        }}
      >
        <View style={styles.expenseIcon}>
          <Ionicons name="receipt-outline" size={24} color="#1D976C" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.expenseDesc}>{item.description}</Text>
          <Text style={styles.expenseUser}>Paid by {item.paidBy.username}</Text>
        </View>
        
        <View style={{alignItems: 'flex-end', marginRight: 10}}>
          <Text style={styles.expenseAmount}>₹{Number(item.amount).toFixed(2)}</Text>

          {isSettled ? (
            <View style={{marginTop:6, paddingHorizontal:8, paddingVertical:4, borderRadius:8, backgroundColor:'#eef7ed'}}>
              <Text style={{color:'#1D976C', fontSize:12, fontWeight:'700'}}>Paid</Text>
            </View>
          ) : isPayer ? (
            <Text style={{color: '#1D976C', fontSize: 12, fontWeight: '600'}}>You paid</Text>
          ) : myShare > 0 ? (
            <Text style={{color: '#D9534F', fontSize: 12, fontWeight: '600'}}>You owe ₹{myShare.toFixed(2)}</Text>
          ) : (
              <Text style={{color: '#999', fontSize: 12}}>Not involved</Text>
          )}
        </View>
        
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>
    );
  };

  const ListHeader = () => {
    if (!group) return null;
    return (
      <View style={{ padding: 20 }}>
        <View style={styles.headerInfo}>
           <Text style={styles.groupName}>{group.name}</Text>
           <Text style={{color:'#666'}}>{(group.members || []).length} Members</Text>
        </View>

        <Text style={styles.sectionTitle}>Group Settlement</Text>
        {renderTotalSettlement()}
        
        <Text style={styles.sectionTitle}>All Expenses</Text>
      </View>
    );
  };

  const ListFooter = () => {
    if (!group) return null;
    return (
      <View style={{ padding: 20 }}>
        {String(group.createdBy._id) === String(currentUserId) && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteGroup}>
            <Ionicons name="trash-outline" size={20} color="#D9534F" />
            <Text style={styles.deleteButtonText}>Delete Group</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading || !group) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1D976C" /></View>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: group.name }} />
      <FlatList
        data={expenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item: any) => item._id}
        ListHeaderComponent={ListHeader} 
        ListFooterComponent={ListFooter} 
        ListEmptyComponent={
          <>
             {ListHeader()}
             <Text style={styles.emptyText}>No expenses added yet.</Text>
             {ListFooter()}
          </>
        }
        onRefresh={fetchGroupDetails}
        refreshing={loading}
        contentContainerStyle={{ paddingBottom: 100 }} 
      />
      
      <View style={styles.buttonRow}>
        <Link href={{ pathname: "/add-members", params: { groupId: id, groupName: group.name } }} style={styles.buttonLink}>
          <Text style={styles.buttonText}>+ Members</Text>
        </Link>
        <Link href={{ pathname: "/add-expense", params: { groupId: id } }} style={[styles.buttonLink, styles.buttonPrimary]}>
          <Text style={[styles.buttonText, styles.buttonTextPrimary]}>+ Expense</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}

// ... keep your styles as before (paste existing styles) ...
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { marginBottom: 20 },
  groupName: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 10, marginTop: 10 },

  // Settlement Cards
  settlementCardRed: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 10, borderLeftWidth: 5, borderLeftColor: '#D9534F', elevation: 2 },
  settlementCardGreen: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 10, borderLeftWidth: 5, borderLeftColor: '#1D976C', elevation: 2 },
  settledCard: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  settledText: { marginLeft: 10, color: '#1D976C', fontWeight: 'bold', fontSize: 16 },
  
  settleTitle: { fontSize: 14, color: '#666', fontWeight: '600' },
  settleDesc: { fontSize: 16, color: '#333', marginTop: 2 },
  settleAmountRed: { fontSize: 22, fontWeight: 'bold', color: '#D9534F' },
  settleAmountGreen: { fontSize: 22, fontWeight: 'bold', color: '#1D976C' },
  
  payButton: { backgroundColor: '#D9534F', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  verifyButton: { backgroundColor: '#1D976C', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  payButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  pendingText: { color: '#D9534F', fontWeight: 'bold', textAlign: 'center', padding: 10, backgroundColor: '#FFF5F5', borderRadius: 8, marginTop: 10 },

  expenseItem: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  expenseRow: { flexDirection: 'row', alignItems: 'center' },
  expenseIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  expenseDesc: { fontSize: 16, fontWeight: '600', color: '#333' },
  expenseUser: { fontSize: 12, color: '#888' },
  expenseTotal: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  
  emptyText: { textAlign: 'center', color: '#999', marginTop: 30 },
  buttonRow: { flexDirection: 'row', position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: 16, paddingBottom: 30, borderTopWidth: 1, borderTopColor: '#eee' },
  buttonLink: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#1D976C', alignItems: 'center', justifyContent: 'center', marginHorizontal: 6 },
  buttonPrimary: { backgroundColor: '#1D976C' },
  buttonText: { color: '#1D976C', fontWeight: 'bold', fontSize: 16 },
  buttonTextPrimary: { color: 'white' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#D9534F', marginTop: 20, backgroundColor: '#FFF5F5' },
  deleteButtonText: { color: '#D9534F', fontWeight: 'bold', marginLeft: 8 },
});
