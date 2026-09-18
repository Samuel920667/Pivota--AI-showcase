import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api/api';
import { useRouter } from 'expo-router';

interface AuthContextType {
    userToken: string | null;
    userInfo: any | null;
    isLoading: boolean;
    login: (userOrEmail: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUserData: () => Promise<void>; // ✅ Added
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [userToken, setUserToken] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // 1. CHECK LOGIN STATUS
    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            let token = await AsyncStorage.getItem('userToken');
            let userInfoStr = await AsyncStorage.getItem('userInfo');

            if (token) {
                console.log("✅ Restore: Token found");
                setUserToken(token);
                if (userInfoStr) {
                    setUserInfo(JSON.parse(userInfoStr));
                }
                // Auto-refresh to get latest balance
                await refreshUserData(token); 
            }
        } catch (e) {
            console.log(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    // 2. LOGIN FUNCTION
    const login = async (userOrEmail: string, pass: string) => {
        setIsLoading(true);
        try {
            const res = await API.post('/api/auth/login', {
                email: userOrEmail, 
                password: pass
            });

            const { token, user } = res.data;

            setUserToken(token);
            setUserInfo(user);
            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userInfo', JSON.stringify(user));
            
            console.log("✅ Login Success");

        } catch (error: any) {
            console.log("❌ Login Context Error:", error.response?.data || error.message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // 3. LOGOUT FUNCTION
    const logout = async () => {
        setIsLoading(true);
        try {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userInfo');
            setUserToken(null);
            setUserInfo(null);
            
            setTimeout(() => {
                router.replace('/login');
            }, 100);
        } catch (e) {
            console.log(e);
        } finally {
            setIsLoading(false);
        }
    };

    // 4. REFRESH DATA (Updates Balance Instantly)
    const refreshUserData = async (passedToken?: string) => {
        try {
            const tokenToUse = passedToken || userToken;
            if (!tokenToUse) return;

            const res = await API.get('/api/users/profile', {
                headers: { Authorization: `Bearer ${tokenToUse}` }
            });

            const updatedUser = res.data;
            setUserInfo(updatedUser);
            await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUser));
            console.log("🔄 Data Refreshed. Balance:", updatedUser.wallet_balance);
            
        } catch (e) {
            console.log("Failed to refresh user data:", e);
        }
    };

    return (
        <AuthContext.Provider value={{ 
            userToken, 
            userInfo, 
            isLoading, 
            login, 
            logout, 
            refreshUserData 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);