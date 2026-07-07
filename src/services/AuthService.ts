import megbapi from "@/utils/megbapi";
import { router } from "expo-router";
import { setToken } from "./TokenService";

export async function login(credentials: any) {
    const { data } = await megbapi.post("/login", credentials);
    await setToken(data.token);
    return loadUser();
}

export async function register(registers: any) {
    const { data } = await megbapi.post("/register", registers);
    await setToken(data.token);
    return loadUser();
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
    try {
        await megbapi.post('/logout', {});
    } catch {
        // Um token expirado ou revogado também retorna 401 no endpoint de logout.
        // O encerramento local da sessão deve ocorrer mesmo sem resposta da API.
    } finally {
        await setToken(null);
        router.replace('/');
    }
}
