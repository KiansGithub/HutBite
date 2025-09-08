import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export async function getDevicePushToken(): Promise<string | null> {
    if(!Device.isDevice) {
        console.warn('Must use physical device for Push Notifications');
        return null; 
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus; 

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status; 
    }

    if (finalStatus !== 'granted') {
        console.warn('Push notification permissions not granted');
        return null;
    }

    const pushToken = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push Token:', pushToken);
    return pushToken; 
}