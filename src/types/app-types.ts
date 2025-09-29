interface SignInProps {
    email: string;
    password: string;
}

interface UserProps {
    cnpj: string
    name: string
    token: string
    connected: boolean
}

interface AuthContextData {
    signIn: (data: SignInProps) => Promise<void>;
    signOut: () => void;
    disconnect: () => void;
    loading: any;
    setLoading: any;
    user: any;
    setUser: any;
}

export {
    SignInProps,
    UserProps,
    AuthContextData
}