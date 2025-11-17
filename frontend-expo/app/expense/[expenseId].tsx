import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, Alert, 
  ActivityIndicator, TouchableOpacity, SafeAreaView, Image, ScrollView
} from 'react-native';
import { useLocalSearchParams, Stack, router, useFocusEffect } from 'expo-router';
import api from '../../src/api'; 
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

export default function ExpenseDetailScreen() {
  const { expenseId } = useLocalSearchParams<{ expenseId: string }>(); 
  const [expense, setExpense] = useState<any>(null);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const userInfo = await SecureStore.getItemAsync('userInfo');
        if (userInfo) {
          const parsed = JSON.parse(userInfo);
          const uId = parsed._id || (parsed.user && parsed.user._id);
          setCurrentUserId(uId);
        }
        if (expenseId) {
          fetchExpenseDetails();
        }
      };
      loadData();
      return () => {};
    }, [expenseId])
  );

  const fetchExpenseDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/expenses/${expenseId}`);
      console.log('Expense Detail Response:', JSON.stringify(response.data, null, 2));
      setExpense(response.data.expense);
      setSettlements(response.data.settlements || []);
    } catch (error: any) {
      console.error('Error fetching expense:', error);
      Alert.alert('Error', 'Failed to load expense details.');
    } finally {
      setLoading(false);
    }
  };

  const renderSettlementAction = (item: any, index: number) => {
    if (item.amount < 0.01) return null;

    if (item.isCurrentUserDebtor) {
      // I OWE MONEY for this expense
      const isPending = item.status === 'paid_pending_verification';
      
      return (
        <Animatable.View animation="fadeInUp" delay={index * 100} key={index} style={styles.actionCard}>
           <View style={styles.actionHeader}>
             <Ionicons name="alert-circle-outline" size={24} color="#D9534F" />
             <Text style={styles.actionTitle}>Your Share</Text>
           </View>
           
           <Text style={styles.debtAmount}>₹{item.amount.toFixed(2)}</Text>
           <Text style={styles.debtDesc}>You owe {item.to.username}</Text>
           
           {isPending ? (
             <View style={styles.pendingContainer}>
               <Ionicons name="time-outline" size={20} color="#FFA500" />
               <Text style={styles.pendingText}>Payment Verification Pending</Text>
             </View>
           ) : (
             <TouchableOpacity 
               style={styles.payButton}
               onPress={() => {
                 router.push({
                   pathname: '/settle-payment',
                   params: { 
                     settlementId: item._id,
                     amount: item.amount.toString(), 
                     creditorName: item.to.username,
                     creditorId: item.to._id,
                     groupId: expense.group._id,
                   }
                 });
               }}
             >
               <Text style={styles.payButtonText}>Pay Now</Text>
               <Ionicons name="arrow-forward" size={18} color="white" style={{marginLeft: 5}}/>
             </TouchableOpacity>
           )}
        </Animatable.View>
      );
    }
    
    if (item.isCurrentUserCreditor) {
      // SOMEONE OWES ME - I am the creditor
      return (
        <Animatable.View animation="fadeInUp" delay={index * 100} key={index} style={styles.actionCard}>
           <View style={styles.actionHeader}>
             <Ionicons name="checkmark-circle-outline" size={24} color="#1D976C" />
             <Text style={styles.actionTitle}>{item.from.username}'s Share</Text>
           </View>
           <Text style={[styles.debtAmount, {color: '#1D976C'}]}>₹{item.amount.toFixed(2)}</Text>
           <Text style={styles.debtDesc}>Owes you</Text>
           
           {/* If they paid, show verify button */}
           {item.status === 'paid_pending_verification' && item._id && (
              <TouchableOpacity 
                style={styles.verifyButton}
                onPress={() => router.push(`/verify-payment/${item._id}`)}
              >
                <Text style={styles.payButtonText}>Verify Payment</Text>
              </TouchableOpacity>
           )}
           
           {/* If pending, show waiting message */}
           {item.status === 'pending' && (
              <View style={styles.pendingContainer}>
                <Ionicons name="time-outline" size={20} color="#FFA500" />
                <Text style={styles.pendingText}>Awaiting Payment</Text>
              </View>
           )}
        </Animatable.View>
      );
    }
    return null;
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1D976C" /></View>;
  }

  if (!expense) return null;

  const mySettlements = settlements.filter((s: any) => 
    s.isCurrentUserDebtor || s.isCurrentUserCreditor
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Expense Details' }} />
      <ScrollView style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.desc}>{expense.description}</Text>
          <Text style={styles.amount}>₹{expense.amount.toFixed(2)}</Text>
          <Text style={styles.meta}>Paid by {expense.paidBy.username} • {new Date(expense.date).toLocaleDateString()}</Text>
        </View>
        
        {/* Pay / Status Section */}
        {mySettlements.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Settlement Status</Text>
            {mySettlements.map((item, idx) => renderSettlementAction(item, idx))}
          </View>
        ) : (
          <View style={styles.section}>
             <Text style={styles.sectionTitle}>Settlement</Text>
             <Text style={{color: '#888', fontStyle:'italic'}}>You are not involved in this expense.</Text>
          </View>
        )}

        {/* Bill Image */}
        {expense.billImage && (
           <View style={styles.section}>
             <Text style={styles.sectionTitle}>Bill Proof</Text>
             <Image 
               source={{ uri: `${api.defaults.baseURL?.replace('/api', '')}${expense.billImage}` }} 
               style={styles.billImage} 
             />
           </View>
        )}

        {/* Full Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Full Split Breakdown ({expense.splitType})</Text>
          <View style={styles.listContainer}>
            {expense.splits.map((split: any, idx: number) => (
              <View key={idx} style={styles.splitItem}>
                <Text style={styles.splitName}>{split.user.username}</Text>
                <Text style={styles.splitAmount}>₹{split.amount.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: {
    backgroundColor: 'white', padding: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  desc: { fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  amount: { fontSize: 40, fontWeight: '800', color: '#1D976C', marginVertical: 10 },
  meta: { fontSize: 14, color: '#888' },
  
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  
  actionCard: {
    backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  actionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  actionTitle: { fontSize: 14, color: '#888', fontWeight: '600', marginLeft: 5, textTransform: 'uppercase' },
  debtAmount: { fontSize: 28, fontWeight: 'bold', color: '#D9534F', marginBottom: 5 },
  debtDesc: { fontSize: 16, color: '#333', marginBottom: 15 },
  
  payButton: {
    backgroundColor: '#D9534F', paddingVertical: 14, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center'
  },
  verifyButton: {
    backgroundColor: '#1D976C', paddingVertical: 14, borderRadius: 10, alignItems: 'center'
  },
  payButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  disabledButton: { backgroundColor: '#ccc' },

  pendingContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    backgroundColor: '#fffaf0', padding: 10, borderRadius: 8
  },
  pendingText: { color: '#FFA500', fontWeight: 'bold', marginLeft: 5 },

  billImage: {
    width: '100%', height: 250, borderRadius: 12, backgroundColor: '#ddd', resizeMode: 'cover'
  },
  
  listContainer: {
    backgroundColor: 'white', borderRadius: 12, overflow: 'hidden'
  },
  splitItem: {
    flexDirection: 'row', justifyContent: 'space-between', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0'
  },
  splitName: { fontSize: 16, color: '#333' },
  splitAmount: { fontSize: 16, fontWeight: 'bold', color: '#333' },
});