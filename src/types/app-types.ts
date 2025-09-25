interface SignInProps {
    cnpj: string;
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
    user: UserProps;
    signIn: (data: SignInProps) => Promise<void>;
    signOut: () => void;
    signedIn: boolean;
    disconnect: () => void;
}

export {
    SignInProps,
    UserProps,
    AuthContextData
}