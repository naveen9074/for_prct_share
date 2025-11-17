// (app)/settle-payment.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, Alert, 
  Image, ScrollView, Platform, Linking, 
  TouchableOpacity, ActivityIndicator, KeyboardAvoidingView 
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../src/api';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettlePaymentScreen() {
  const { settlementId, amount, creditorName, creditorId, groupId } = useLocalSearchParams<{
    settlementId: string, 
    amount: string, 
    creditorName: string, 
    creditorId: string,
    groupId?: string
  }>();

  const [customAmount, setCustomAmount] = useState(amount);
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [creditorUpiId, setCreditorUpiId] = useState('');
  const [upiLoading, setUpiLoading] = useState(true);

  useEffect(() => {
    const fetchCreditorUpi = async () => {
      if (!creditorId) {
        Alert.alert('Error', 'Creditor ID is missing.');
        setUpiLoading(false);
        return;
      }
      try {
        const response = await api.get(`/users/upi/${creditorId}`); 
        if (response.data.upiId) {
          setCreditorUpiId(response.data.upiId);
        } else {
          Alert.alert('Warning', `${creditorName} has not added their UPI ID yet. You can still submit proof manually.`);
        }
      } catch (error: any) {
        console.log('UPI fetch error:', error);
        Alert.alert('Warning', 'Could not fetch UPI ID. You can still submit proof manually.');
      } finally {
        setUpiLoading(false);
      }
    };
    fetchCreditorUpi();
  }, [creditorId]);

  const handlePayWithUPI = async () => {
    if (!customAmount || parseFloat(customAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }
    if (!creditorUpiId) {
      Alert.alert('Error', 'Creditor UPI ID not available.');
      return;
    }
    const upiUrl = `upi://pay?pa=${creditorUpiId}&pn=${creditorName}&am=${customAmount}&cu=INR&tn=Group split payment`;
    try {
      const supported = await Linking.canOpenURL(upiUrl);
      if (supported) {
        await Linking.openURL(upiUrl);
      } else {
        Alert.alert('Error', 'No UPI app is installed on your device.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open UPI app.');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Sorry', 'We need camera roll permissions to upload proof.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handleSubmitProof = async () => {
    if (!image) {
      Alert.alert('Error', 'Please upload a payment proof screenshot.');
      return;
    }
    if (!customAmount || parseFloat(customAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('amount', customAmount);
    
    // Append image
    formData.append('paymentProof', {
      uri: image.uri,
      type: 'image/jpeg',
      name: `payment_proof_${Date.now()}.jpg`,
    } as any);

    try {
      // Use the actual settlementId from params (not 'new')
      if (!settlementId) {
        Alert.alert('Error', 'Settlement ID is missing.');
        setLoading(false);
        return;
      }

      const response = await api.patch(`/settlements/${settlementId}/pay`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      Alert.alert('Success', 'Payment proof submitted! Waiting for verification...');
      router.back(); 
    } catch (error: any) {
      console.error('Submission error:', error.response?.data || error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit proof.');
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
          <Stack.Screen options={{ title: `Pay ${creditorName}` }} />
          <Text style={styles.title}>Settle Payment</Text>
          <Text style={styles.subtitle}>You are paying <Text style={{fontWeight: 'bold'}}>{creditorName}</Text></Text>
          
          <Text style={styles.label}>Amount to Pay (₹)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={customAmount}
              onChangeText={setCustomAmount}
              keyboardType="numeric"
              placeholder="0.00"
            />
          </View>
          
          {upiLoading ? (
            <ActivityIndicator color="#1D976C" style={{marginTop: 20}} />
          ) : creditorUpiId ? (
            <TouchableOpacity 
              style={styles.upiButton}
              onPress={handlePayWithUPI}
            >
              <Ionicons name="logo-uikit" size={20} color="white" />
              <Text style={styles.upiButtonText}>Pay ₹{customAmount || 0} with UPI</Text>
            </TouchableOpacity>
          ) : null}
          
          <Text style={styles.infoText}>After paying, upload the screenshot below.</Text>
          
          <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
            <Ionicons name="camera-outline" size={20} color="#1D976C" />
            <Text style={styles.imagePickerText}>{image ? 'Change Proof' : 'Upload Payment Screenshot'}</Text>
          </TouchableOpacity>

          {image && (
            <Image source={{ uri: image.uri }} style={styles.imagePreview} />
          )}

          <View style={{ marginTop: 20 }}>
            <TouchableOpacity 
              style={[styles.button, (!image || loading) && styles.disabledButton]} 
              onPress={handleSubmitProof} 
              disabled={!image || loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Submit Proof for Verification</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  container: { flex: 1, padding: 20, backgroundColor: 'white' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { fontSize: 18, marginBottom: 20, color: 'gray' },
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
  upiButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 20,
    flexDirection: 'row',
  },
  upiButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  infoText: {
    textAlign: 'center',
    color: 'gray',
    marginBottom: 20,
    fontStyle: 'italic',
    marginTop: 20,
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
    backgroundColor: '#f6fffa',
  },
  imagePickerText: {
    color: '#1D976C',
    fontSize: 16,
    marginLeft: 10,
  },
  imagePreview: {
    width: '100%', height: 200, borderRadius: 10,
    marginTop: 20, resizeMode: 'cover',
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
  },
});