
import * as Crypto from 'expo-crypto';
import { createCipheriv, createDecipheriv, Buffer as cryptBuffer, randomBytes } from 'react-native-quick-crypto';
import TcpSockets from 'react-native-tcp-socket';

export function SendMessage(ip:string, message:string, key:ArrayBuffer): Promise<string> {

    const buffer:string[] = [];
    let inUse = false
    const options = {
        port: 80,
        host: ip,
        reuseAddress: true
    }
    return new Promise<string>((resolve, reject) => {
        const nonce = cryptBuffer.from(randomBytes(12))
        const cipher = createCipheriv('chacha20-poly1305', key, nonce)
        const updated = cipher.update(cryptBuffer.from(message, 'ascii'))
        const final = cipher.final()
        const tag = cipher.getAuthTag()
        const actualCipherText = cryptBuffer.concat([
            nonce,
            tag,
            updated,
            final,
        ])

        const client = TcpSockets.createConnection(options, ()=> {
            let text = ""
            for(let i = 0; i < actualCipherText.byteLength; i++) {
            text += actualCipherText.slice(i,i+1).toString('hex')
            }
            client.write(text + '\n');
        })
        
        client.on('data', (data) => {
            const received = client.bytesRead
            const buff = data as Buffer<ArrayBufferLike>
            while(inUse) {

            }
            inUse = true
            for(let i = 0; i < buff.length; i++) {
            buffer[received-buff.length+i] = String.fromCharCode(buff.at(i) as number)
            }
            inUse = false
            
        })

        client.on('close', ()=> {
                try {
                const msg = buffer.join('')
                
                const msgBuff = cryptBuffer.from(msg, 'hex')
                const nonce2 =  msgBuff.slice(0,12)
                const tag = msgBuff.slice(12, 12+16)
                const actualmsgBuff = msgBuff.slice(12+16, msgBuff.length)
                const decrypt = createDecipheriv('chacha20-poly1305', key, nonce2)
                decrypt.setAuthTag(tag)
                const decryptedPart1: cryptBuffer = decrypt.update(actualmsgBuff) as cryptBuffer;
                const decryptedPart2: cryptBuffer = decrypt.final() as cryptBuffer;
                const decrypted = cryptBuffer.concat([decryptedPart1, decryptedPart2]);
                resolve(decrypted.toString())
                } catch(e) {
                    console.log(e)
                    reject("Could not decrypt")
                }
                client.destroy();
        })
    })
    
}

export function SendChangePass(ip:string, pass:string, key:ArrayBuffer): Promise<string> {
    const buffer:string[] = [];
    let inUse = false
    const options = {
        port: 80,
        host: ip,
        reuseAddress: true
    }
    return new Promise<string>((resolve, reject) => {
        const nonce = cryptBuffer.from(randomBytes(12))
        const cipher = createCipheriv('chacha20-poly1305', key, nonce)
        const updated = cipher.update(cryptBuffer.from("CPass"+pass, 'ascii'))
        const final = cipher.final()
        const tag = cipher.getAuthTag()
        const actualCipherText = cryptBuffer.concat([
            nonce,
            tag,
            updated,
            final,
        ])

        const client = TcpSockets.createConnection(options, ()=> {
            let text = ""
            for(let i = 0; i < actualCipherText.byteLength; i++) {
            text += actualCipherText.slice(i,i+1).toString('hex')
            }
            client.write(text + '\n');
        })
        
        client.on('data', (data) => {
            const received = client.bytesRead
            const buff = data as Buffer<ArrayBufferLike>
            while(inUse) {

            }
            inUse = true
            for(let i = 0; i < buff.length; i++) {
            buffer[received-buff.length+i] = String.fromCharCode(buff.at(i) as number)
            }
            inUse = false
            
        })

        client.on('close', async ()=> {
                try {

                const SecretAsAscii = []
                for (let i = 0; i < pass.length; i++) {
                    SecretAsAscii[i] = pass.charCodeAt(i)
                }
                const secretBuff = cryptBuffer.from(SecretAsAscii)
                const newKey = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, secretBuff)

                const msg = buffer.join('')
                
                const msgBuff = cryptBuffer.from(msg, 'hex')
                const nonce2 =  msgBuff.slice(0,12)
                const tag = msgBuff.slice(12, 12+16)
                const actualmsgBuff = msgBuff.slice(12+16, msgBuff.length)
                const decrypt = createDecipheriv('chacha20-poly1305', newKey, nonce2)
                decrypt.setAuthTag(tag)
                const decryptedPart1: cryptBuffer = decrypt.update(actualmsgBuff) as cryptBuffer;
                const decryptedPart2: cryptBuffer = decrypt.final() as cryptBuffer;
                const decrypted = cryptBuffer.concat([decryptedPart1, decryptedPart2]);
                resolve(decrypted.toString())
                } catch(e) {
                    console.log(e)
                    reject("Could not decrypt")
                }
                client.destroy();
        })
    })
    
}