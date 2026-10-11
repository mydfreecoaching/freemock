/** Firebase web config (public by design – it is visible in every browser; access is controlled in the Firebase console). */
export const firebaseConfig = {
  apiKey: 'AIzaSyA_KFquSxbB4Vsv8LoxdWdoRXVIiFNI9g8',
  authDomain: 'freemock-mu.firebaseapp.com',
  projectId: 'freemock-mu',
  storageBucket: 'freemock-mu.firebasestorage.app',
  messagingSenderId: '718373824113',
  appId: '1:718373824113:web:3a5955c63a8cbb3e129dd0',
  measurementId: 'G-W40VS29M5X',
};
/** Web Push certificate key pair (Firebase console → Project settings → Cloud Messaging → Web Push certificates). */
export const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';
