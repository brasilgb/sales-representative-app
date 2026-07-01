import { Redirect } from 'expo-router';

export default function CustomersRedirect() {
  return <Redirect href="/(tabs)/orders/manage-order" />;
}
