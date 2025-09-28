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
    setUser: React.Dispatch<React.SetStateAction<UserProps | null>>;
    token: string;
    user: UserProps;
    signIn: (data: SignInProps) => Promise<void>;
    signOut: () => void;
    disconnect: () => void;
}

export {
    SignInProps,
    UserProps,
    AuthContextData
}