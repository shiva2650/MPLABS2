/**
 * Firebase Client Configuration & Service Initializer
 *
 * Configured according to the official MPLADS AI Integrity & Monitoring specification.
 * Falls back gracefully to the server REST API proxy when cloud credentials are in demo/offline mode.
 */

export const firebaseConfig = {
  apiKey: "AIzaSyDMCL3bTgZfZvoTjbmYCrNrfcuncbhgsfU",
  appId: "1:21452488941:web:7746c35a5721eb10f30ce4",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
};

export const isFirebaseConfigured = () => {
  return (
    firebaseConfig.projectId !== "YOUR_PROJECT_ID" &&
    !firebaseConfig.projectId.includes("YOUR_PROJECT")
  );
};
