import megbapi from "@/utils/megbapi";
import { setToken } from "./TokenService";
import { router } from "expo-router";

export async function login(credentials: any) {
    const { data } = await megbapi.post("/login", credentials);
    await setToken(data.token);
    return loadUser();
}

export async function register(registers: any) {
    const { data } = await megbapi.post("/register", registers);
    await setToken(data.token);
}

export async function sendPasswordResetLink(email: string) {
    const { data } = await megbapi.post('/forgot-password', { email });
    return data.status;
}

export async function loadUser() {
    const { data: user } = await megbapi.get("/user");
    return user;
}

export async function logout() {

    await megbapi.post('/logout', {});

    await setToken(null);

    router.replace('/(auth)/sign-in')
}