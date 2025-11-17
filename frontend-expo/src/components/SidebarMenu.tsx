// src/components/SidebarMenu.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, Text, Modal, TouchableOpacity, 
  StyleSheet, TouchableWithoutFeedback 
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';

// Define the props our component will accept
interface SidebarMenuProps {
  isVisible: boolean;
  onClose: () => void;
  onLogout: () => void;
}

type UserInfo = {
  username: string;
  email: string;
};

export default function SidebarMenu({ isVisible, onClose, onLogout }: SidebarMenuProps) {
  const [user, setUser] = useState<UserInfo | null>(null);
  
  // This state controls the smooth exit animation
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimatingOut(false); // Reset animation state when opening
      
      const loadUser = async () => {
        const userInfo = await SecureStore.getItemAsync('userInfo');
        if (userInfo) {
          const parsed = JSON.parse(userInfo);
          setUser(parsed.user || parsed);
        }
      };
      loadUser();
    }
  }, [isVisible]);

  // This function creates the smooth "slide-out"
  const handleClose = () => {
    setIsAnimatingOut(true); // Just trigger the "out" animation
  };

  // This runs AFTER the slide-out animation finishes
  const onAnimationEnd = () => {
    if (isAnimatingOut) {
      onClose(); // Call the parent's onClose
    }
  };
  
  const handleLogoutPress = () => {
    handleClose(); // Trigger animation
    setTimeout(onLogout, 300); // Logout after animation starts
  }

  return (
    <Modal
      transparent={true}
      visible={isVisible}
      animationType="none" // We control the animation
      onRequestClose={handleClose}
    >
      
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animatable.View
          animation={isAnimatingOut ? "fadeOut" : "fadeIn"}
          duration={300}
          style={styles.backdrop} 
          // This zIndex ensures it's on top of the FAB
        />
      </TouchableWithoutFeedback>
      
      {/* 2. The Menu Content (slides from the RIGHT) */}
      <Animatable.View 
        animation={isAnimatingOut ? "slideOutRight" : "slideInRight"} // <-- FIX
        duration={300} 
        style={styles.menuContainer}
        onAnimationEnd={onAnimationEnd} // <-- FIX for smooth close
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.menuHeader}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#1D976C" />
            </View>
            <Text style={styles.username}>{user?.username || 'User'}</Text>
            <Text style={styles.email}>{user?.email || 'email@example.com'}</Text>

            {/* --- FIX: ADDED CLOSE BUTTON --- */}
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={30} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Navigation Buttons */}
          <View style={styles.navSection}>
            <Link href="/groups" asChild>
              <TouchableOpacity style={styles.navButton} onPress={handleClose}>
                <Ionicons name="home-outline" size={24} color="#333" />
                <Text style={styles.navText}>Dashboard</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/profile" asChild>
              <TouchableOpacity style={styles.navButton} onPress={handleClose}>
                <Ionicons name="person-outline" size={24} color="#333" />
                <Text style={styles.navText}>Profile</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Footer (Logout Button) */}
          <View style={styles.menuFooter}>
            <TouchableOpacity style={styles.navButton} onPress={handleLogoutPress}>
              <Ionicons name="log-out-outline" size={24} color="#D9534F" />
              <Text style={[styles.navText, { color: '#D9534F' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animatable.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject, // Fills the entire screen
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1, // Sits behind the menu, but on top of app
  },
  menuContainer: {
    position: 'absolute', // Sits on top of the backdrop
    right: 0, // <-- FIX: Aligns to the right
    top: 0,
    bottom: 0,
    width: 280, // Standard sidebar width
    backgroundColor: 'white',
    zIndex: 2, // On top of the backdrop
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 20,
  },
  safeArea: {
    flex: 1,
  },
  menuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: { // --- NEW STYLE ---
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
    zIndex: 3,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#e6fff0', // Light green
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    fontSize: 14,
    color: 'gray',
  },
  navSection: {
    flex: 1,
    paddingTop: 15,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  navText: {
    fontSize: 18,
    marginLeft: 15,
    color: '#333',
    fontWeight: '500',
  },
  menuFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
});