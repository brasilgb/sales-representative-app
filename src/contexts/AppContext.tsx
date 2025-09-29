

import { login } from "@/services/AuthService";
import { AuthContextData, SignInProps } from "@/types/app-types";
import megbapi from "@/utils/megbapi";
import { router } from "expo-router";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);


    const signIn = async ({ email, password }: SignInProps) => {
        setLoading(true);
        try {
            const credentials = {
                email: email,
                password: password,
                device_name: `${Platform.OS} ${Platform.Version}`
            };
            await login(credentials)
        } catch (error: any) {
            console.log(error);
        } finally { () => setLoading(false) };
    };


    const signOut = async () => {
        try {

            setUser(null);
            router.replace('/(auth)/sign-in');
        } catch (error) {
            console.log(`Ocorreu um erro: ${error}`);
        }
    };

    useEffect(() => {
        if (user === null) {
            router.replace('/(auth)/sign-in');
        } else {
            router.replace('/(tabs)/home');
        }
    }, [router, user]);

    async function disconnect() {
        try {

            setUser(null);
            router.replace('/(auth)/sign-in');
        } catch (e) {
            console.log('Error removing keys from AsyncStorage:', e);
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                signIn,
                signOut,
                disconnect,
                loading,
                setLoading
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => useContext(AuthContext);