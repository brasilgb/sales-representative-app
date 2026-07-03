import { CustomerProps } from '@/types/app-types';
import { Alert, Linking } from 'react-native';

export function formatCustomerAddress(customer?: Partial<CustomerProps> | null) {
  if (!customer) return '';

  const street = [customer.street, customer.number].filter(Boolean).join(', ');

  return [
    street,
    customer.district,
    [customer.city, customer.state].filter(Boolean).join(' - '),
    customer.zip_code,
  ].filter(Boolean).join(', ');
}

export async function openRouteToCustomer(customer?: Partial<CustomerProps> | null) {
  const destination = formatCustomerAddress(customer);

  if (!destination) {
    Alert.alert('Endereço não informado', 'Cadastre o endereço do cliente para traçar uma rota.');
    return;
  }

  // Sem `origin`, o Google Maps usa a localização atual do aparelho como partida.
  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving&dir_action=navigate`;

  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Não foi possível abrir o mapa', 'Verifique se há um aplicativo de mapas ou navegador disponível.');
  }
}
