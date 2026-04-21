import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { IpKey } from '@/constants/secureStore';
import { KeyContext } from '@/contexts/keyContext';
import { SendChangePass, SendMessage } from '@/hooks/sendMessage';
import * as Crypto from 'expo-crypto';
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { useContext, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Buffer as cryptBuffer } from 'react-native-quick-crypto';

export default function SetupScreen() {

  const [ip, setIp] = useState('') 
  const [regCode, setRegCode] = useState('')
  const [errMessage, SetErrMessage] = useState('')
  const [passMode, SetPassMode] = useState(false)
  const [newPass, SetNewPass] = useState('')
  const router = useRouter()
  const cntxt = useContext(KeyContext)
  return (
    <ParallaxScrollView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Setup!</ThemedText>
      </ThemedView>
      {!passMode && <>
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Please input the registration code of the device</ThemedText>
        </ThemedView>
        <ThemedView style={styles.stepContainer}>
          <ThemedTextInput
          onChangeText={setRegCode}
          value={regCode}
          style={styles.input}
          />
       </ThemedView>
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Please input the IP of the device</ThemedText>
        </ThemedView>
        <ThemedView style={styles.stepContainer}>
          <ThemedTextInput
          onChangeText={setIp}
          value={ip}
          style={styles.input}
          keyboardType='numeric'
          />
          <TouchableOpacity style={styles.mainButtonStyle} onPress={async () =>{
                SetErrMessage('')
                if(ip === '') {
                  SetErrMessage('Ip cannot be empty')
                  return
                }
                if (!/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip)) {
                  SetErrMessage('Invalid IP address')
                  return
                }
                if(regCode === '') { 
                   SetErrMessage('Reg code cannot be empty')
                  return
                }
                try {
                const SecretAsAscii = []
                for (let i = 0; i < regCode.length; i++) {
                    SecretAsAscii[i] = regCode.charCodeAt(i)
                }
                const secretBuff = cryptBuffer.from(SecretAsAscii)
                const key = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, secretBuff)
                const res = await SendMessage(ip, "Check", key)
                if(res === 'ok') {
                  SetPassMode(true)
                } else {
                   SetErrMessage('Something went wrong. Please make sure that your device is set up correctly.')
                }
                } catch(err) {
                  console.log(err)
                  SetErrMessage('Invalid reg code! ):')
                }
          }}>
             <ThemedText type="btnText">Connect!</ThemedText>
          </TouchableOpacity>

        </ThemedView>
      </>}
      {passMode && <>
       <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Please input a new password for your device</ThemedText>
            <ThemedView style={styles.stepContainer}>
            <ThemedTextInput
            onChangeText={SetNewPass}
            value={newPass}
            style={styles.input}
            />
          </ThemedView>

            <TouchableOpacity style={styles.mainButtonStyle} onPress={async () =>{
                SetErrMessage('')
                if (newPass.length < 10) {
                  SetErrMessage('Password has to be at least 10 characters long.')
                  return
                }
                try {
                const SecretAsAscii = []
                for (let i = 0; i < regCode.length; i++) {
                    SecretAsAscii[i] = regCode.charCodeAt(i)
                }
                const secretBuff = cryptBuffer.from(SecretAsAscii)
                const key = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, secretBuff)
                console.log('key: ', key)
                const res = await SendChangePass(ip, newPass, key)
                if (res === "nk") {
                   SetErrMessage('Invalid pass! Choose a better one.')
                   return
                }
                if (res === "ok") {
                  const SecretAsAscii2 = []
                  for (let i = 0; i < newPass.length; i++) {
                      SecretAsAscii2[i] = newPass.charCodeAt(i)
                  }
                  const secretBuff2 = cryptBuffer.from(SecretAsAscii2)
                  const key2 = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, secretBuff2)
                  console.log('secretBuff2', secretBuff2)
                   console.log('newPass: ', newPass)
                  console.log('key2: ', cryptBuffer.from(key2))
                  SecureStore.setItem(IpKey, ip)
                  cntxt.setEncKey(key2)
                  router.replace('main')
                }
                } catch(err) {
                  console.log(err)
                  SetErrMessage('Something went wrong. Restarting setup.')
                  SetPassMode(false)
                }
          }}>
            <ThemedText type="btnText">Change pass</ThemedText>
          </TouchableOpacity>

        </ThemedView>
      </>}
      {(errMessage !== '') &&
      <ThemedView style={styles.stepContainer}>
          <ThemedText>
            {errMessage}
          </ThemedText>
      </ThemedView> }


    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  mainButtonStyle: {
    backgroundColor: '#88D18A',
    width: '100%',
    padding: 3,
    borderRadius:'5%',
    alignSelf: 'center',
    alignContent: 'center',
    textAlign: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
   input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});
