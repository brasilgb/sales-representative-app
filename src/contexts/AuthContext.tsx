import { loadUser, login, logout, register } from "@/services/AuthService";
import { authenticateWithBiometrics, canUseBiometrics, isBiometricLoginEnabled, setBiometricLoginEnabled } from "@/services/BiometricService";
import { getToken, setToken } from "@/services/TokenService";
import { onSessionExpired } from "@/services/session-events";
import { getOfflineSession } from "@/offline/session-bridge";
import { RegisterProps, SignInProps } from "@/types/app-types";
import { SplashScreen, useRouter } from "expo-router";
import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";

SplashScreen.preventAutoHideAsync();

type AuthContextData = {
    user: any | null;
    signIn: (credentials: SignInProps) => Promise<void>;
    signUp: (data: RegisterProps) => Promise<void>;
    signOut: () => void;
    unlockWithBiometrics: () => Promise<boolean>;
    biometricAvailable: boolean;
    biometricConfigured: boolean;
    isLoading: boolean;
};

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const useAuth = () => {
    return useContext(AuthContext);
};

export function AuthProvider({ children }: PropsWithChildren) {
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricConfigured, setBiometricConfigured] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            try {
                const [available, enabled, savedToken] = await Promise.all([
                    canUseBiometrics(),
                    isBiometricLoginEnabled(),
                    getToken(),
                ]);
                const configured = available && enabled && savedToken !== null;
                setBiometricAvailable(available);
                setBiometricConfigured(configured);

                if (configured) {
                    // A tela de login dispara a biometria depois que a splash já foi
                    // encerrada. No Android, abrir o prompt durante o bootstrap pode
                    // fazer com que ele seja descartado atrás da tela inicial.
                    return;
                }

                const loadedUser = await loadUser();
                setUser(loadedUser);
            } catch (error: any) {
                if (error.response?.status === 401) {
                    await Promise.all([setToken(null), setBiometricLoginEnabled(false)]);
                    setBiometricConfigured(false);
                }

                // O usuário não está logado, o que é normal.
                setUser(null);
            } finally {
                setIsLoading(false);
                SplashScreen.hideAsync();
            }
        };
        checkUser();
    }, [router]);

    const signIn = async ({ email, password, useBiometrics = false }: SignInProps) => {
        const credentials = { email, password, device_name: `${Platform.OS} ${Platform.Version}` };
        const loggedUser = await login(credentials);
        const enableBiometrics = useBiometrics && biometricAvailable;
        await setBiometricLoginEnabled(enableBiometrics);
        setBiometricConfigured(enableBiometrics);
        setUser(loggedUser);
        router.replace('/(tabs)/home');
    };

    const unlockWithBiometrics = async () => {
        try {
            if (!biometricConfigured || !await authenticateWithBiometrics()) {
                return false;
            }

            const loadedUser = await loadUser();
            setUser(loadedUser);
            router.replace('/(tabs)/home');
            return true;
        } catch (error: any) {
            if (error.response?.status === 401) {
                await Promise.all([setToken(null), setBiometricLoginEnabled(false)]);
                setBiometricConfigured(false);
            }
            setUser(null);
            return false;
        }
    };

    // Logout explícito: pedidos pendentes exigem confirmação, pois serão descartados deste aparelho.
    const signOut = async () => {
        const pending = (await getOfflineSession()?.pendingCount()) ?? 0;

        if (pending === 0) {
            await finishSignOut();
            return;
        }

        Alert.alert(
            'Pedidos não enviados',
            `Há ${pending} pedido(s) que ainda não foram enviados. Se você sair, eles serão descartados deste aparelho e não serão enviados.`,
            [
                { text: 'Continuar no aplicativo', style: 'cancel' },
                { text: 'Sair e descartar', style: 'destructive', onPress: () => void finishSignOut() },
            ],
        );
    };

    const finishSignOut = async () => {
        await getOfflineSession()?.purgeCurrent();
        await logout();
        await setBiometricLoginEnabled(false);
        setBiometricConfigured(false);
        setUser(null);
        router.replace('/');
    };

    // Sessão expirada (token revogado): encerra a sessão local, mas preserva os dados pendentes.
    const expireSession = async () => {
        getOfflineSession()?.closeCurrent();
        await setToken(null);
        await setBiometricLoginEnabled(false);
        setBiometricConfigured(false);
        setUser(null);
        router.replace('/');
    };

    // expireSession só usa setters e o roteador (estáveis); a assinatura é feita uma vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => onSessionExpired(() => { void expireSession(); }), []);

    const signUp = async (data: RegisterProps) => {
        const registeredUser = await register({
            ...data,
            device_name: `${Platform.OS} ${Platform.Version}`,
        });
        setUser(registeredUser);
        router.replace('/(tabs)/home');
    };

    return (
        <AuthContext.Provider value={{
            user,
            signIn,
            signUp,
            signOut,
            unlockWithBiometrics,
            biometricAvailable,
            biometricConfigured,
            isLoading
        }} >
            {children}
        </AuthContext.Provider>
    );
}
