interface RegisterProps {
    cnpj: string;
    company: string;
    name: string;
    phone: string;
    whatsapp: string;
    email: string;
    password: string;
    password_confirmation: string;
    plan_type: 'individual' | 'team';
};

interface SignInProps {
    email: string;
    password: string;
    useBiometrics?: boolean;
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
    region_id?: number | string | null;
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
    commercial_condition?: {
        id: number;
        name: string;
        price_adjustment_percentage: string | number;
        max_discount_percentage: string | number;
        minimum_order_amount: string | number;
        payment_terms?: string;
        commission_percentage: string | number;
    } | null;
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
    image_url?: string | null;
    brand?: string | null;
    package_size?: string | null;
};

interface OrderProps {
    id: string;
    customer_id: string;
    order_number: string;
    flex: string;
    discount: string;
    subtotal: string;
    adjusted_total: string;
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

interface VisitProps {
    id: number;
    customer_id: number;
    scheduled_at: string;
    check_in_at?: string | null;
    check_out_at?: string | null;
    status: 'scheduled' | 'checked_in' | 'completed' | 'canceled';
    result?: 'sold' | 'no_sale' | 'follow_up' | null;
    notes?: string | null;
    customer: CustomerProps & { region?: { id: number; name: string } };
    user?: { id: number; name: string };
}

interface ExpenseProps {
    id: number;
    expense_date: string;
    category: 'mileage' | 'food' | 'lodging' | 'other';
    amount: string;
    kilometers?: string | null;
    origin?: string | null;
    destination?: string | null;
    description?: string | null;
    receipt_url?: string | null;
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
    OrderItem,
    VisitProps,
    ExpenseProps
}
