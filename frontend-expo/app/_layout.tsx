// app/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: 'Create Account', headerStyle: { backgroundColor: '#000000ff' }, headerTintColor: 'white' }} />
      <Stack.Screen name="groups" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="create-group" options={{ title: 'Create New Group' }} />
      <Stack.Screen name="add-members" options={{ title: 'Add Members' }} />
      <Stack.Screen name="add-expense" options={{ title: 'Add Expense' }} />
      
      {/* Dynamic Routes */}
      <Stack.Screen name="group/[id]" options={{ title: 'Group Details' }} />
      <Stack.Screen name="settle-payment" options={{ title: 'Settle Payment' }} />
      <Stack.Screen name="verify-payment/[settlementId]" options={{ title: 'Verify Payment' }} />
      
      {/* --- FIX: Register these missing routes --- */}
      <Stack.Screen name="expense/[expenseId]" options={{ title: 'Expense Details' }} />
      <Stack.Screen name="edit-profile" options={{ title: 'Edit Profile', presentation: 'modal' }} />
      <Stack.Screen name="edit-group/[id]" options={{ title: 'Edit Group', presentation: 'modal' }} />
    </Stack>
  );
}