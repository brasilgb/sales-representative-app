import * as SecureStore from "expo-secure-store";

let token: string | null = null;

export async function setToken(newToken: string | null = null) {
    token = newToken;

    if (token !== null) {
        await SecureStore.setItemAsync("token", token);
    } else {
        await SecureStore.deleteItemAsync("token");
    }
}

export async function getToken() {
    if (token !== null) {
        return token;
    }

    token = await SecureStore.getItemAsync("token");

    return token;
}