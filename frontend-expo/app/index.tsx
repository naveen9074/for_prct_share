// (app)/index.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar } from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';

export default function OnboardingScreen() {

  // This is the Glare/Shine animation
  // We simulate it with a moving gradient
  const Glare = () => (
    <Animatable.View
      animation={{
        from: { translateX: -200 },
        to: { translateX: 200 },
      }}
      duration={1500}
      iterationCount="infinite"
      style={styles.glare}
    >
      <LinearGradient
        colors={['transparent', 'rgba(255, 255, 255, 0.4)', 'transparent']}
        style={{ width: '100%', height: '100%' }}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      />
    </Animatable.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {/* Main content, centered */}
      <View style={styles.content}>
        
        {/* 1. Logo with Pulse Animation */}
        <Animatable.View 
          animation="" // No pulse, just static with glare
          easing="ease-in-out" 
          iterationCount="infinite"
          style={styles.logoContainer}
        >
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
          />
          {/* We apply the Glare animation on top */}
          <Glare />
        </Animatable.View>

        {/* 2. App Title with Fade-In Animation */}
        <Animatable.Text 
          animation="fadeIn" 
          delay={500} 
          style={styles.title}
        >
          ELLARUM PAY
        </Animatable.Text>

        {/* 3. Subtitle with Fade-In Animation */}
        <Animatable.Text 
          animation="fadeIn" 
          delay={800} 
          style={styles.subtitle}
        >
          Fairly settle group expenses. No confusion.
        </Animatable.Text>
      </View>

      {/* 4. "Get Started" Button with Slide-Up Animation */}
      <Animatable.View 
        animation="fadeInUp" 
        delay={1000} 
        style={styles.buttonContainer}
      >
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.replace('/login')} // Navigate to new login page
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </Animatable.View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Black background
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    width: 150,
    height: 150,
    borderRadius: 80, // Make it a circle
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111', // Dark grey circle
    marginBottom: 30,
    overflow: 'hidden', // This is key for the glare effect
    position: 'relative',
  },
  logo: {
    width: 140,
    height: 140,
  },
  glare: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    transform: [{ rotate: '45deg' }],
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginTop: 10,
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  button: {
    backgroundColor: '#1D976C', // Our green theme color
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});