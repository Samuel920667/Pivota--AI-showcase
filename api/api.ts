import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// ⚠️ REPLACE WITH YOUR COMPUTER'S CURRENT IP ADDRESS
// Use 'ipconfig' (Windows) or 'ifconfig' (Mac) to check.
const BASE_URL = 'http://10.236.149.26:3000'; 

const API = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// 1. REQUEST INTERCEPTOR (Attach Token to every request)
API.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 2. RESPONSE INTERCEPTOR (Handle Session Expiry)
API.interceptors.response.use(
    (response) => response, // Return successful responses directly
    async (error) => {
        if (error.response) {
            // 401 = Unauthorized (No Token)
            // 403 = Forbidden (Token Invalid/Expired)
            if (error.response.status === 401 || error.response.status === 403) {
                console.log(`⛔ API Error ${error.response.status}: Session Expired. Logging out...`);
                
                // A. Wipe Data immediately
                await AsyncStorage.removeItem('userToken');
                await AsyncStorage.removeItem('userInfo');
                
                // B. Force Navigation to Login
                // We use a short timeout to let the UI update before switching screens
                setTimeout(() => {
                    try {
                        router.replace('/login');
                    } catch (e) {
                        console.log("Navigation Error:", e);
                    }
                }, 100);
            }
        }
        
        // IMPORTANT: We must reject the error so the Dashboard knows to stop its loading spinner
        return Promise.reject(error);
    }
);

export default API;