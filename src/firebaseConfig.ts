/**
 * Firebase Configuration for MPLADS AI Integrity & Monitoring System
 * Note: Replace YOUR_PROJECT_ID, YOUR_PROJECT.firebaseapp.com, etc. with your production Firebase credentials.
 */
export const firebaseConfig = {
  apiKey: "AIzaSyDMCL3bTgZfZvoTjbmYCrNrfcuncbhgsfU",
  appId: "1:21452488941:web:7746c35a5721eb10f30ce4",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
};

export const isFirebaseConfigured = (): boolean => {
  return (
    firebaseConfig.projectId !== "YOUR_PROJECT_ID" &&
    !firebaseConfig.projectId.includes("YOUR_")
  );
};
