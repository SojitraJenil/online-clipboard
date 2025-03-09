import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAQNACyuE-vYnZW3SxqQDE-OeSpuOESPNM",
    authDomain: "online-clipboard-1a5b3.firebaseapp.com",
    projectId: "online-clipboard-1a5b3",
    storageBucket: "online-clipboard-1a5b3.appspot.com",
    messagingSenderId: "278396914868",
    appId: "1:278396914868:web:2068542b5ddf104e975be1",
};

// Check if Firebase is already initialized
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
