
import { IpKey } from '@/constants/secureStore';
import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function HomeScreen() {
   const Ip = SecureStore.getItem(IpKey);

  if (Ip === null) {
    return <Redirect href='/setup'></Redirect>
  }

  
  return (
      <Redirect href='/pass'></Redirect>
  );
}