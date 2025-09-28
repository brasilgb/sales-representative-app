

import { router } from "expo-router";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContextData, SignInProps } from "@/types/app-types";
import megbapi from "@/services/megbapi";

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>([]);
    const [token, setToken] = useState<any>(undefined);
    const [loading, setLoading] = useState<boolean>(false);
    const storageUserKey = '@megb:user';
    const storageTokenKey = '@megb:token';

    async function storageUser(data: any) {
        await AsyncStorage.setItem(storageUserKey, JSON.stringify(data));
    }
    async function storageToken(token: any) {
        await AsyncStorage.setItem(storageTokenKey, JSON.stringify(token));
    }

    useEffect(() => {
        const loadStorageData = async () => {
            try {
                const storedUser = await AsyncStorage.getItem(storageUserKey);
                const storedToken = await AsyncStorage.getItem(storageTokenKey);
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
                if (storedToken) {
                    setToken(JSON.parse(storedToken));
                }
            } catch (error) {
                console.error("Falha ao carregar dados do storage", error);
            };
        };
        loadStorageData();
    }, []);

    const signIn = async ({ email, password }: SignInProps) => {
        setLoading(true);
        let data = JSON.stringify({
            email: email,
            password: password
        });
        await megbapi.post('https://sales.megb.com.br/api/login', data, {
            headers:{"Content-Type" : "application/json"}
        }).then((response) => {
            const { success, message, data } = response.data;
            if (success) {
                let userData = {
                    name: data.name
                }
                storageToken(data?.token);
                storageUser(userData);
            }
        }).catch((error) => {
            console.log(error);
        }).finally(() => setLoading(false));
    };

    useEffect(() => {
        if (!token) {
            router.replace('/(auth)/sign-in');
        } else {
            router.replace('/(tabs)/home');
        }
    }, [router, token]);

    const signOut = async () => {
        try {
            await AsyncStorage.removeItem(storageUserKey);
            setUser(null);
            router.replace('/(auth)/sign-in');
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
                user,
                token,
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