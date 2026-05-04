import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedTextInput } from "@/components/themed-text-input";
import { ThemedView } from "@/components/themed-view";
import { IpKey } from "@/constants/secureStore";
import { KeyContext } from "@/contexts/keyContext";
import { SendMessage } from "@/hooks/sendMessage";
import * as Crypto from 'expo-crypto';
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { useContext, useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Buffer as cryptBuffer } from 'react-native-quick-crypto';

export type PassProps = {
 SetEnc: (input:ArrayBuffer) => unknown
};

export default function PassScreen({ SetEnc }:PassProps) {
  const cntxt = useContext(KeyContext)
    const router = useRouter()
    const ip = SecureStore.getItem(IpKey)
    const [pass, setPass] = useState('')
    const [loading, setLoading] = useState(false)
    const [errMessage, setErrMessage] = useState('')
    if (ip === null) {
        router.push("/setup")
    }
    return(
        <ParallaxScrollView>
        <ThemedView style={styles.titleContainer}>
            <ThemedText type="title">Welcome! Please log in</ThemedText>
        </ThemedView>

         <ThemedView style={styles.stepContainer}>
                  <ThemedTextInput
                  onChangeText={setPass}
                  value={pass}
                  style={styles.input}
                  />
          </ThemedView>

        <ThemedView style={styles.stepContainer}>
            <TouchableOpacity style={styles.mainButtonStyle} disabled={loading} onPress={async () =>{
                setLoading(true)
                const SecretAsAscii = []
                for (let i = 0; i < pass.length; i++) {
                    SecretAsAscii[i] = pass.charCodeAt(i)
                }
                const secretBuff = cryptBuffer.from(SecretAsAscii)
                const key = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, secretBuff)
                try {
                  const resp = await SendMessage(ip as string, "Ch", key)
                  if (resp !== 'ok') {
                    setLoading(false)
                    setErrMessage('Wrong pass. Sorry')
                    return
                  }
                  cntxt.setEncKey(key)
                  // just in case clear pass since this screens memory might not be
                  // cleared
                  setPass('')
                  router.replace('/main')
                  setLoading(false)
                } catch {
                  setLoading(false)
                  setErrMessage('Wrong pass. Sorry')
                  return
                }
            }}>
              <ThemedText type="btnText">Log in</ThemedText>
            </TouchableOpacity>
        </ThemedView>
        <ThemedView style={styles.stepContainer}>
          <TouchableOpacity style={styles.secondButtonStyle} onPress={async () =>{
            SecureStore.deleteItemAsync(IpKey)
            cntxt.setEncKey(new ArrayBuffer)
            router.replace('/setup')
          }}>
              <ThemedText type="btnText">Reset</ThemedText>
          </TouchableOpacity>
        </ThemedView>
        {(errMessage !== '') &&
        <ThemedView style={styles.stepContainer}>
            <ThemedText>
              {errMessage}
            </ThemedText>
        </ThemedView> }    

        </ParallaxScrollView>
    )
}
const styles = StyleSheet.create({
  mainButtonStyle: {
    backgroundColor: '#88D18A',
    width: '50%',
    padding: 3,
    borderRadius:'5%',
    alignSelf: 'center',
    alignContent: 'center',
    textAlign: 'center',
  },
  secondButtonStyle: {
    backgroundColor: '#596869',
    width: '30%',
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
    borderColor: '#000000',
    borderStyle: 'solid',
    borderWidth: 2,
    padding: 10,
  },
});