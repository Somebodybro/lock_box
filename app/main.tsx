import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IpKey } from "@/constants/secureStore";
import { KeyContext } from "@/contexts/keyContext";
import { SendMessage } from "@/hooks/sendMessage";
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { useContext } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
export type MainProps = {
 SetEnc: (input:ArrayBuffer) => unknown
 EncKey: ArrayBuffer
};

export default function MainScreen({ SetEnc, EncKey }:MainProps) {
    const cntxt = useContext(KeyContext)
    const router = useRouter()
    const ip = SecureStore.getItem(IpKey)
    
    if (ip === null) {
        router.push("/setup")
    }
    return(
        <ParallaxScrollView>
        <ThemedView style={styles.titleContainer}>
            <ThemedText type="title">Welcome!</ThemedText>
        </ThemedView>
        <ThemedView style={styles.stepContainer}>
            <TouchableOpacity style={styles.mainButtonStyle} onPress={async () =>{
                try {
                    await SendMessage(ip as string, "On", cntxt.encKey)
                } catch {
                    SecureStore.deleteItemAsync(IpKey)
                    cntxt.setEncKey(new ArrayBuffer)
                    router.replace('/setup')
                }
            }}>
                <ThemedText type="btnText">Turn on</ThemedText>
            </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.stepContainer}>
            <TouchableOpacity style={styles.mainButtonStyle} onPress={async () =>{
                try {
                    await SendMessage(ip as string, "Of", cntxt.encKey)
                } catch {
                    SecureStore.deleteItemAsync(IpKey)
                    cntxt.setEncKey(new ArrayBuffer)
                    router.replace('/setup')
                }
            }}>
                <ThemedText type="btnText">Turn off</ThemedText>
            </TouchableOpacity>
        </ThemedView>
        
        <ThemedView style={styles.stepContainer}>
            <TouchableOpacity style={styles.secondButtonStyle} onPress={async () =>{
                // Clears the key from context.
                cntxt.setEncKey(new ArrayBuffer)
                router.replace('/pass')
            }}>
                <ThemedText type="btnText">log out</ThemedText>
            </TouchableOpacity>
        </ThemedView>

        </ParallaxScrollView>
    )
}
const styles = StyleSheet.create({
 mainButtonStyle: {
    backgroundColor: '#88D18A',
    width: '75%',
    padding: 3,
    borderRadius:'5%',
    alignSelf: 'center',
    alignContent: 'center',
    textAlign: 'center',
  },
  secondButtonStyle: {
    backgroundColor: '#596869',
    width: '50%',
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
    marginBottom:35,
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