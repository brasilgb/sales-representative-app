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

interface RetypePasswordProps {
    email: string;
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
    enabled: boolean;
    observations: string;
};

interface OrderProps {
    id: string;
    customer_id: string;
    order_number: string;
    flex: string;
    total: string;
    status: string;
    items: [];
    customer: CustomerProps;
    created_at: string;
}

interface OrderItem {
    product_id: number;
    name: string;
    quantity: number;
    price: number;
    total: number;
}

export {
    SignInProps,
    UserProps,
    AuthContextData,
    CustomerProps,
    ProductProps,
    RegisterProps,
    RetypePasswordProps,
    OrderProps,
    OrderItem
}