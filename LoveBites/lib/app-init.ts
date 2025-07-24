import { initAnalytics } from './analytics';
import { getFirebaseApp } from './firebase';

let alreadyRan = false; 

export async function initializeAppServices() {
    if (alreadyRan) return; 
    alreadyRan = true; 

    // Ensure native app exists 
    getFirebaseApp();

    await initAnalytics();

    console.log('[AppInit] done');
}