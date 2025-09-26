

import { router } from "expo-router";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContextData, SignInProps } from "@/types/app-types";
import megbapi from "@/services/megbapi";

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const storageUserKey = '@megb:user';

    async function storageUser(data: any) {
        await AsyncStorage.setItem(storageUserKey, JSON.stringify(data));
    }

    useEffect(() => {
        const loadStorageData = async () => {
            try {
                const storedUser = await AsyncStorage.getItem(storageUserKey);
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error("Falha ao carregar dados do storage", error);
            };
        };
        loadStorageData();
    }, []);


    const signIn = async ({email, password}: SignInProps) => {
        setLoading(true);
        console.log(email,password);
        
        try {
            const response = await megbapi.post('login', {
                email: email,
                password: password
            });
            const { success, message, data } = response.data;
            console.log(message);
            if (success) {
                let userData = {
                    name: data.name,
                    token: data.token
                }
                await storageUser(userData);
                console.log(message);
                
            }
            

        } catch (error) {
            console.log(error);

        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            await AsyncStorage.removeItem(storageUserKey);
            setUser(null);
            router.replace('/(tabs)/home');
        } catch (error) {
            console.log(`Ocorreu um erro: ${error}`);
        }
    };

    async function disconnect() {
        const keys = ['Auth_user', 'deviceid']
        try {
            await AsyncStorage.multiRemove(keys)
            setUser(null);
            router.replace('/(tabs)/home');
        } catch (e) {
            console.log('Error removing keys from AsyncStorage:', e);
        }
    }

    return (
        <AuthContext.Provider
            value={{
                signedIn: !!user,
                user,
                setUser,
                signIn,
                signOut,
                disconnect
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => useContext(AuthContext);