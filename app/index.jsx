import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { getMemberByNameAndPin } from '../src/lib/db';
import { syncIfOnline } from '../src/lib/sync';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export default function LoginScreen() {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { theme } = useTheme();

  const handleBiometricLogin = useCallback(async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login with Biometrics',
        fallbackLabel: 'Enter PIN',
      });
      if (result.success) {
        const storedName = await SecureStore.getItemAsync('user_name');
        const storedPin = await SecureStore.getItemAsync('user_pin');
        if (storedName && storedPin) {
          const member = getMemberByNameAndPin(storedName, storedPin);
          if (member) {
            await login(member);
            router.replace('/home');
          }
        }
      }
    } catch (e) {
      console.log('Biometric error', e);
    }
  }, [login, router]);

  const checkBiometrics = useCallback(async () => {
    try {
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const isEnabled = await SecureStore.getItemAsync('biometrics_enabled');
      if (isEnrolled && isEnabled === 'true') {
        setIsBiometricSupported(true);
        handleBiometricLogin();
      }
    } catch (e) {
      console.log('Check biometrics error', e);
    }
  }, [handleBiometricLogin]);

  useEffect(() => {
    checkBiometrics();
    syncIfOnline();
  }, [checkBiometrics]);

  const handleLogin = async () => {
    if (!name || !pin) {
      setError('Please enter both name and PIN');
      return;
    }
    const normalizedName = name.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join(' ');
    const member = getMemberByNameAndPin(normalizedName, pin);
    if (member) {
      await login(member);
      router.replace('/home');
    } else {
      setError('Invalid name or PIN');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <View style={[styles.logoCircle, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="musical-notes" size={32} color="#FFF" />
        </View>
        <Text style={[styles.title, { color: theme.colors.primary }]}>ECWA Bayeku Choir</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textLight }]}>The Harmonic Editorial Suite</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.colors.textLight }]}>FULL NAME</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="Name....."
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError('');
            }}
            autoCapitalize="words"
            placeholderTextColor={theme.colors.textLight}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.colors.textLight }]}>ACCESS PIN</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="••••"
            value={pin}
            onChangeText={setPin}
            secureTextEntry
            keyboardType="numeric"
            placeholderTextColor={theme.colors.textLight}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={handleLogin}>
          <Text style={styles.buttonText}>ENTER STUDIO</Text>
        </TouchableOpacity>

        {isBiometricSupported && (
          <TouchableOpacity style={styles.bioButton} onPress={handleBiometricLogin}>
            <Ionicons name="finger-print" size={24} color={theme.colors.primary} />
            <Text style={[styles.bioText, { color: theme.colors.primary }]}>Use Biometrics</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textLight }]}>Developed by olaolubalogs • v2.4.1</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 1.5,
  },
  input: {
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    fontWeight: '600',
  },
  button: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  bioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    padding: 12,
  },
  bioText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  }
});