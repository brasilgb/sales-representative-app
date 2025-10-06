interface RegisterProps {
    cnpj: string;
    company: string;
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
};

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

// register customers
interface CustomerProps {
    id: string;
    cnpj: string;
    name: string;
    email: string;
    phone: string;
    zip_code: string;
    state: string;
    city: string;
    district: string;
    street: string;
    complement: string;
    number: string;
    whatsapp: string;
    observations: string;
};

// register products
interface ProductProps {
    id: string;
    reference: string;
    name: string;
    description: string;
    unity: string;
    measure: string;
    price: string;
    quantity: string;
    min_quantity: string;
    enabled: string;
    observations: string;
};

export {
    SignInProps,
    UserProps,
    AuthContextData,
    CustomerProps,
    ProductProps,
    RegisterProps
}