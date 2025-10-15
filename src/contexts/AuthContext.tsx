import { loadUser, login, logout } from "@/services/AuthService";
import { SignInProps } from "@/types/app-types";
import { SplashScreen, useRouter, useSegments } from "expo-router";
import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

SplashScreen.preventAutoHideAsync();

type AuthContextData = {
    user: any | null;
    signIn: (credentials: SignInProps) => Promise<void>;
    signOut: () => void;
    isLoading: boolean;
};

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const useAuth = () => {
    return useContext(AuthContext);
};

export function AuthProvider({ children }: PropsWithChildren) {
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            try {
                const loadedUser = await loadUser();
                setUser(loadedUser);
            } catch (error) {
                // O usuário não está logado, o que é normal.
                setUser(null);
            } finally {
                setIsLoading(false);
                SplashScreen.hideAsync();
            }
        };
        checkUser();
    }, []);

    const signIn = async ({ email, password }: SignInProps) => {
        const credentials = { email, password, device_name: `${Platform.OS} ${Platform.Version}` };
        const loggedUser = await login(credentials);
        setUser(loggedUser);
        router.replace('/(tabs)/home');
    };

    const signOut = async () => {
        await logout();
        setUser(null);
        router.replace('/(auth)/sign-in');
    };

    return (
        <AuthContext.Provider value={{
            user,
            signIn,
            signOut,
            isLoading
        }} >
            {children}
        </AuthContext.Provider>
    );
}