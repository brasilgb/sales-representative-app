import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_LOGIN_KEY = 'biometric-login-enabled';

export async function canUseBiometrics() {
    const [hasHardware, isEnrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
    ]);

    return hasHardware && isEnrolled;
}

export async function isBiometricLoginEnabled() {
    return (await SecureStore.getItemAsync(BIOMETRIC_LOGIN_KEY)) === 'true';
}

export async function setBiometricLoginEnabled(enabled: boolean) {
    if (enabled) {
        await SecureStore.setItemAsync(BIOMETRIC_LOGIN_KEY, 'true');
        return;
    }

    await SecureStore.deleteItemAsync(BIOMETRIC_LOGIN_KEY);
}

export async function authenticateWithBiometrics() {
    try {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Entrar no VetorPet',
            promptSubtitle: 'Confirme sua identidade para acessar o aplicativo',
            cancelLabel: 'Usar senha',
            disableDeviceFallback: true,
        });

        return result.success;
    } catch {
        return false;
    }
}
