import { Platform } from 'react-native';

// expo-notifications is unavailable in Expo Go (SDK 53+). Use a dev build for push notifications.
let Notifications = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  // silently unavailable
}

export async function registerForPushNotificationsAsync() {
  if (!Notifications || Platform.OS === 'web') return;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  } catch (e) {
    console.log('Notifications unavailable:', e.message);
  }
}

export async function scheduleRaffleNotification(winnerName) {
  if (!Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Raffle Completed! 🎉",
        body: `${winnerName} and others have been picked for this week's P&W!`,
        data: { type: 'raffle' },
      },
      trigger: null,
    });
  } catch (e) {
    console.log('Notifications unavailable:', e.message);
  }
}
