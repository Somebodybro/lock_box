#include <WiFiNINA.h>
#include <FastLED.h>
#include <EEPROM.h>

#include <Arduino.h>
#include <Crypto.h>
#include <ChaChaPoly.h>
#include <ArduinoECCX08.h>
#include <Hash.h>
#include <SHA256.h>
#include <string.h>

#if defined(ESP8266) || defined(ESP32)
#include <pgmspace.h>
#else
#include <avr/pgmspace.h>
#endif

#define PIN 6
#define NUMPIXELS 1
#define NONCE_SIZE 12
#define MAX_PLAINTEXT_LEN 25
#define TAG_SIZE 16

CRGB leds[NUMPIXELS];
char ssid[] = "**";          // your network SSID (name)
char pass[] = "**";          // your network password (use for WPA, or use as key for WEP)
int keyIndex = 0;            // your network key Index number (needed only for WEP)
int status = WL_IDLE_STATUS; // connection status
WiFiServer server(80);       // server socket
WiFiClient client = server.available();
SHA256 sha256;
#define HASH_SIZE 32
ChaChaPoly cha;
#define EEPROMOffset 1
#define NonceOffset EEPROMOffset + 50
byte key[HASH_SIZE];
// This is simulating a default key that is put into all devices
// due to this being a personal project, I put a default value here that I use
// for debugging, but I want to note, that in other implementations
// The connection secret would always be retrieved from the EEPROM
// And the device would refuse start, if none was present.
// Then during assembly there would be a separate step, where a randomised
// key/code is saved on the device and would come on printed format
// Along with the device itself.
char ConnectionSecret[] = "SuprSecrtChane";

void setup()
{
    FastLED.addLeds<WS2812, PIN, GRB>(leds, NUMPIXELS);
    leds[0] = CRGB(0, 0, 0);
    FastLED.show();
    Serial.begin(9600);
    while (!Serial)
        ;
    // Safety checks on the ECC chip
    if (!ECCX08.begin())
    {
        Serial.println("Failed to communicate with ECC508/ECC608!");
        while (1)
            ;
    }

    if (!ECCX08.locked())
    {
        Serial.println("The ECC508/ECC608 is not locked!");
        while (1)
            ;
    }

    if (EEPROM.length() == 0)
    {
        Serial.println("No EEPROM length! This board is not supported");
        while (1)
            ;
    }

    byte c = EEPROM.read(EEPROMOffset);
    // If the first byte is 1
    if (c == 0x01)
    {
        Serial.println("Retrieving key from memory");
        byte inStorKey[HASH_SIZE];
        // Hahaa! Secure programming achieved.
        // I had made an off by one error here and it was
        // caught by arduino github actions.
        // Marvel at my big brain and secure attitudes for
        // taking the time to set that up.

        for (unsigned int i = 0; i < HASH_SIZE; i++)
        {
            c = EEPROM.read(i + EEPROMOffset + 1);
            inStorKey[i] = (byte)c;
        }
        memcpy(key, inStorKey, sizeof(inStorKey));
    }
    else
    {
        char keyIn[15];
        memcpy(keyIn, ConnectionSecret, sizeof(keyIn));
        byte asCodes[sizeof(ConnectionSecret) - 1];
        for (unsigned int i = 0; i < sizeof(ConnectionSecret) - 1; i++)
        {
            asCodes[i] = (int)ConnectionSecret[i];
        }

        sha256.update(asCodes, sizeof(asCodes));
        sha256.finalize(key, 32);
        sha256.clear();
    }

    enable_WiFi();
    connect_WiFi();

    server.begin();
    printWiFiStatus();
}

void loop()
{
    client = server.available();

    if (client)
    {
        printWEB();
    }
}

void printWiFiStatus()
{
    // print the SSID of the network you're attached to:
    Serial.print("SSID: ");
    Serial.println(WiFi.SSID());

    // print your board's IP address:
    IPAddress ip = WiFi.localIP();
    Serial.print("IP Address: ");
    Serial.println(ip);

    // print the received signal strength:
    long rssi = WiFi.RSSI();
    Serial.print("signal strength (RSSI):");
    Serial.print(rssi);
    Serial.println(" dBm");

    Serial.print("Address is http://");
    Serial.println(ip);
}

void enable_WiFi()
{
    // check for the WiFi module:
    if (WiFi.status() == WL_NO_MODULE)
    {
        Serial.println("Communication with WiFi module failed!");
        // don't continue
        while (true)
            ;
    }

    String fv = WiFi.firmwareVersion();
    if (fv < "1.0.0")
    {
        Serial.println("Please upgrade the firmware");
    }
}

void connect_WiFi()
{
    // attempt to connect to Wifi network:
    while (status != WL_CONNECTED)
    {
        Serial.print("Attempting to connect to SSID: ");
        Serial.println(ssid);
        // Connect to WPA/WPA2 network. Change this line if using open or WEP network:
        status = WiFi.begin(ssid, pass);

        // wait 10 seconds for connection:
        delay(10000);
    }
}

void printWEB()
{
    if (client)
    {                                 // if you get a client,
        Serial.println("new client"); // print a message out the serial port
        String currentLine = "";      // make a String to hold incoming data from the client
        size_t linesize = 0;
        while (client.connected())
        { // loop while the client's connected
            if (client.available())
            {                           // if there's bytes to read from the client,
                char c = client.read(); // read a byte, then
                Serial.write(c);        // print it out the serial monitor
                if (c == '\n')
                { // if the byte is a newline character
                    // if the current line is blank, you got two newline characters in a row.
                    // that's the end of the client HTTP request, so send a response:
                    if (linesize == 0)
                    {
                        break;
                    }
                    else
                    { // if you got a newline, then break to handle command
                        break;
                    }
                }
                else if (c != '\r')
                {                     // if you got anything else but a carriage return character,
                    currentLine += c; // add it to the end of the currentLine
                    linesize++;
                }

                // At this point we actually do not care. The message is far too large to matter
                if (linesize > 100)
                {
                    break;
                }
            }
        }
        Serial.println(currentLine);
        byte decoded[linesize / 2];
        bool isZero = true;
        for (unsigned int i = 0; i < linesize / 2; i++)
        {
            byte extract = 0;
            char a = currentLine[2 * i];
            char b = currentLine[2 * i + 1];
            extract = convertCharToHex(a) << 4 | convertCharToHex(b);
            decoded[i] = extract;
            if (extract != 0)
            {
                isZero = false;
            }
        }

        Serial.print("Decoded as ints: ");
        for (unsigned int i = 0; i < sizeof(decoded); i++)
        {
            Serial.print(byte(decoded[i]));
        }
        Serial.println("");
        if (isZero)
        {
            byte nonce[NONCE_SIZE] = {};
            for (unsigned int i = 0; i < NONCE_SIZE; i++)
            {
                byte num = EEPROM.read(i + NonceOffset);
                nonce[i] = num;
            }
            for (unsigned int i = 0; i < NONCE_SIZE; i++)
            {
                if (nonce[i] < 16)
                {
                    client.print(0);
                }
                client.print(nonce[i], 16);
            }
            delay(550);
            client.stop();
            Serial.println("Closed connection");
            return;
        }
        String message = decryptCommand(&cha, decoded, linesize / 2);
        // String messageStr = "";
        // Serial.print("decrypted when converted: ");
        // for (unsigned int i = 0; i < linesize/2;i++) {
        //  Serial.print(char(message[i]));
        // messageStr = messageStr+ char(message[i]);
        //}
        // Serial.println("");
        // Serial.println(messageStr);
        Serial.print("message: ");
        Serial.println(message);
        if (message.startsWith("Check"))
        {
            SendOk();
        }
        if (message.startsWith("On"))
        {
            ledOn();
            SendOk();
        }
        if (message.startsWith("Off"))
        {
            ledOff();
            SendOk();
        }

        if (message.startsWith("CPass"))
        {
            // We want a secret at least 15 chars for entropy
            if (message.length() < 15)
            {
                SendNok();
            }
            else
            {
                message.remove(0, 5);
                byte asCodes[message.length()];
                for (unsigned int i = 0; i < message.length(); i++)
                {
                    asCodes[i] = (int)message[i];
                }
                sha256.clear();
                sha256.update(asCodes, message.length());
                sha256.finalize(key, 32);
                sha256.clear();
                Serial.println("");
                for (unsigned int i = 0; i < HASH_SIZE; i++)
                {
                    // There is a slim chance we might be able to
                    // save on writing. Yes there is a small performance cost
                    // but it's fine.
                    EEPROM.update(i + EEPROMOffset + 1, key[i]);
                    // The write takes about 3.3ms, so we need to wait 4ms after each write
                    delay(4);
                }
                EEPROM.update(EEPROMOffset, 1);
                // Delay so that the write gets done.
                delay(4);
                SendOk();
            }
        }

        delay(550);
        client.stop();
        Serial.println("Closed connection");
    }
}

// We want fail and success messages to be the same size due to
// not exposing information through ciphertext length
void SendNok()
{
    byte anwser[3] = "nk";
    byte encrypted[2 + NONCE_SIZE + TAG_SIZE];
    encryptAnwser(&cha, encrypted, anwser, 2);
    for (unsigned int i = 0; i < 2 + NONCE_SIZE + TAG_SIZE; i++)
    {
        if (encrypted[i] < 16)
        {
            client.print(0);
        }
        client.print(encrypted[i], 16);
    }
}

void SendOk()
{
    byte anwser[3] = "ok";
    byte encrypted[2 + NONCE_SIZE + TAG_SIZE];
    encryptAnwser(&cha, encrypted, anwser, 2);
    for (unsigned int i = 0; i < 2 + NONCE_SIZE + TAG_SIZE; i++)
    {
        if (encrypted[i] < 16)
        {
            client.print(0);
        }
        client.print(encrypted[i], 16);
    }
}

String decryptCommand(ChaChaPoly *cipher, byte *cipherText, size_t size)
{
    cipher->clear();
    byte nonce[NONCE_SIZE] = {};
    byte tag[TAG_SIZE] = {};
    String messageStr;
    if (size <= NONCE_SIZE + TAG_SIZE)
    {
        Serial.println("Too small cipher. Aborting");
        return messageStr;
    }
    for (unsigned int i = 0; i < NONCE_SIZE; i++)
    {
        nonce[i] = cipherText[i];
    }

    for (unsigned int i = NONCE_SIZE; i < NONCE_SIZE + TAG_SIZE; i++)
    {
        tag[i - NONCE_SIZE] = cipherText[i];
    }

    if (!cipher->setKey(key, HASH_SIZE))
    {
        Serial.print("setKey failed");
        return messageStr;
    }

    if (!cipher->setIV(nonce, NONCE_SIZE))
    {
        Serial.print("setIV Failed");
        return messageStr;
    }
    size_t msgSize = size - NONCE_SIZE - TAG_SIZE;
    byte actualMsg[msgSize];
    for (unsigned int i = NONCE_SIZE + TAG_SIZE; i < size; i++)
    {
        actualMsg[i - NONCE_SIZE - TAG_SIZE] = cipherText[i];
    }
    cipher->decrypt(actualMsg, actualMsg, msgSize);

    bool valid = cipher->checkTag(tag, TAG_SIZE);
    if (!valid)
    {
        Serial.println("Authenticating cipher text failed");
        return "";
    }

    bool validN = CheckAndUpdateNonce(nonce);
    if (!validN)
    {
        Serial.println("Nonce too small. Possible replay");
        return "";
    }

    for (unsigned int i = 0; i < msgSize; i++)
    {
        messageStr += (char)actualMsg[i];
    }
    // Add the nllptr back
    messageStr += "";
    return messageStr;
}

void getNonce(byte *output)
{
    byte nonce[NONCE_SIZE] = {};
    Serial.println("");
    for (unsigned int i = 0; i < NONCE_SIZE; i++)
    {
        byte num = EEPROM.read(i + NonceOffset);
        output[i] = num;
        nonce[i] = num;
    }
    bool validN = UppByteArray(nonce, NONCE_SIZE);
    if (!validN)
    {
        Serial.print("Ran out of nonces. Key rotation in this case not implemented. Pausing app");
        while (true)
        {
        }
    }
    for (unsigned int i = 0; i < NONCE_SIZE; i++)
    {
        EEPROM.update(i + NonceOffset, nonce[i]);
    }
}

bool CheckAndUpdateNonce(byte *input)
{
    byte nonce[NONCE_SIZE] = {};
    Serial.println("");
    for (unsigned int i = 0; i < NONCE_SIZE; i++)
    {
        byte num = EEPROM.read(i + NonceOffset);
        nonce[i] = num;
    }
    for (unsigned int i = 0; i < NONCE_SIZE; i++)
    {
        byte inputByte = input[i];
        byte nonceByte = nonce[i];
        if (inputByte > nonceByte)
        {
            break;
        }
        if (nonceByte > inputByte)
        {
            return false;
        }
    }
    bool validN = UppByteArray(input, NONCE_SIZE);
    if (!validN)
    {
        Serial.print("Ran out of nonces. Key rotation in this case not implemented. Pausing app");
        while (true)
        {
        }
    }
    for (int i = 0; i < NONCE_SIZE; i++)
    {
        EEPROM.update(NonceOffset + i, input[i]);
    }
    return true;
}
// returns false if array rolls over
bool UppByteArray(byte *input, size_t size)
{
    unsigned int lastIndex = size - 1;
    while (lastIndex >= 0 && input[lastIndex] == 255)
    {
        input[lastIndex] = 0;
        lastIndex = lastIndex - 1;
    }
    if (lastIndex == 0 && input[0] == 255)
    {
        input[0] = 0;
        return false;
    }
    input[lastIndex] = input[lastIndex] + 1;
    return true;
}

void encryptAnwser(ChaChaPoly *cipher, byte *output, byte *plaintext, size_t size)
{
    byte cipherText[size];
    byte nonce[NONCE_SIZE];
    byte tag[TAG_SIZE];
    // Gets nonce from counter
    getNonce(nonce);
    cipher->clear();
    if (!cipher->setKey(key, HASH_SIZE))
    {
        Serial.print("setKey failed");
        return;
    }
    if (!cipher->setIV(nonce, NONCE_SIZE))
    {
        Serial.print("setIV Failed");
        return;
    }

    cipher->encrypt(cipherText, plaintext, size);
    cipher->computeTag(tag, sizeof(tag));

    for (unsigned int i = 0; i < TAG_SIZE + NONCE_SIZE + size; i++)
    {
        if (i < NONCE_SIZE)
        {
            output[i] = nonce[i];
        }
        else if (i < NONCE_SIZE + TAG_SIZE)
        {
            output[i] = tag[i - NONCE_SIZE];
        }
        else
        {
            output[i] = cipherText[i - (NONCE_SIZE + TAG_SIZE)];
        }
    }
}

byte convertCharToHex(char ch)
{
    ch = toupper(ch);
    switch (ch)
    {
    case '0':
        return 0;
        break;
    case '1':
        return 1;
        break;
    case '2':
        return 2;
        break;
    case '3':
        return 3;
        break;
    case '4':
        return 4;
        break;
    case '5':
        return 5;
        break;
    case '6':
        return 6;
        break;
    case '7':
        return 7;
        break;
    case '8':
        return 8;
        break;
    case '9':
        return 9;
        break;
    case 'A':
        return 10;
        break;
    case 'B':
        return 11;
        break;
    case 'C':
        return 12;
        break;
    case 'd':
        return 13;
        break;
    case 'D':
        return 13;
        break;
    case 'E':
        return 14;
        break;
    case 'F':
        return 15;
        break;
    default:
        return 0;
        break;
    }
}

void ledOn()
{
    leds[0] = CRGB(1, 1, 1);
    FastLED.show();
}

void ledOff()
{
    leds[0] = CRGB(0, 0, 0);
    FastLED.show();
}