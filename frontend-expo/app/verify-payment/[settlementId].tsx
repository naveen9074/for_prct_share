// (app)/verify-payment/[settlementId].tsx
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Alert, 
  ActivityIndicator, Image, TouchableOpacity, ScrollView 
} from 'react-native';
import { useLocalSearchParams, router, Stack, useFocusEffect } from 'expo-router';
import api from '../../src/api';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VerifyPaymentScreen() {
  const { settlementId } = useLocalSearchParams<{ settlementId: string }>();
  const [settlement, setSettlement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchSettlement();
      return () => {};
    }, [settlementId])
  );

  const fetchSettlement = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/settlements/${settlementId}`);
      console.log('Settlement fetched:', response.data);
      setSettlement(response.data);
    } catch (error: any) {
      console.error('Failed to fetch settlement:', error.response?.data || error);
      Alert.alert('Error', 'Could not load payment details.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (action: 'accept' | 'reject') => {
    try {
      setVerifying(true);
      await api.patch(`/settlements/${settlementId}/verify`, { action });
      
      const message = action === 'accept' 
        ? 'Payment verified successfully!' 
        : 'Payment rejected. Debtor can try again.';
      
      Alert.alert('Success', message);
      router.back(); 
    } catch (error: any) {
      console.error('Verification failed:', error.response?.data || error);
      Alert.alert('Error', error.response?.data?.message || 'Could not update status.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1D976C" />
        </View>
      </SafeAreaView>
    );
  }

  if (!settlement) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text>Settlement not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const debtorName = settlement.debtor?.username || 'Someone';
  const amountPaid = settlement.paidAmount || settlement.amount || 0;
  const proofUrl = settlement.paymentProof 
    ? `${api.defaults.baseURL?.replace('/api', '')}${settlement.paymentProof}` 
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Verify Payment' }} />
      <ScrollView style={styles.container}>
        
        <View style={styles.header}>
          <Text style={styles.infoText}>
            <Text style={{fontWeight: 'bold'}}>{debtorName}</Text> claims they paid you
          </Text>
          <Text style={styles.amount}>₹{parseFloat(amountPaid).toFixed(2)}</Text>
        </View>
        
        <Text style={styles.subtitle}>Payment Proof Screenshot:</Text>
        
        {proofUrl ? (
          <Image
            source={{ uri: proofUrl }} 
            style={styles.proofImage}
          />
        ) : (
          <View style={styles.proofImageError}>
            <Ionicons name="image-outline" size={40} color="#ccc" />
            <Text>No proof image uploaded.</Text>
          </View>
        )}

        <View style={styles.detailsBox}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>From:</Text>
            <Text style={styles.detailValue}>{debtorName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.detailValue}>₹{parseFloat(amountPaid).toFixed(2)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={[styles.detailValue, {color: '#FFA500'}]}>
              {settlement.status === 'paid_pending_verification' ? 'Pending Verification' : settlement.status}
            </Text>
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.rejectButton]}
            onPress={() => handleVerification('reject')}
            disabled={verifying}
          >
            {verifying ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="close-outline" size={24} color="white" />
                <Text style={styles.buttonText}>Reject</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.approveButton]}
            onPress={() => handleVerification('accept')}
            disabled={verifying}
          >
            {verifying ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-outline" size={24} color="white" />
                <Text style={styles.buttonText}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  container: { flex: 1, padding: 20, backgroundColor: 'white' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoText: { fontSize: 18, marginBottom: 10, textAlign: 'center', color: '#333' },
  amount: { 
    fontSize: 42, 
    fontWeight: 'bold', 
    color: '#1D976C',
    textAlign: 'center'
  },
  
  subtitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 12, 
    color: '#333'
  },
  proofImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    resizeMode: 'contain', 
    borderColor: '#ddd',
    borderWidth: 1,
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
  },
  proofImageError: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    borderColor: '#ddd',
    borderWidth: 1,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  detailsBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 30,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  approveButton: {
    backgroundColor: '#1D976C',
  },
  rejectButton: {
    backgroundColor: '#D9534F',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  }
});