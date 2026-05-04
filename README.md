# Lock_box for COMP.SEC.300-2025-2026-1
Hello! This is a toy application that connects to an arduino wifi (code for that attached)
and turns a light on/off. All communication uses a basic TCP port on both devices
and encrypts all communication using the ChaCha20-Poly1305 algorithm for communication.

The security depends on the keys being secure, but otherwise it is a pretty nice little
showcase of arduino capabilities.
It uses the inbuilt ECC chip for cryptographic random and is guite nice.

## Why is this secure programming?
I believe that analysing this implementations security in my report and
showcasing arduino programming, (which needs to be memory secure as it's basically
funky c++ code) I can get a decent grade. 
In the end the time limit kind of hit me (as always) so I couldn't implement everything I wanted. I might continue with this project later, if It strikes me.

## Lock_box is a weird name for a fancy LED?
Yeah... It simulates a "lock" in the sense that it has two modes, on and off. I was
supposed to actually wire a servo into a 3d printed box, but in the end I got too busy and decided to simulate that behaviour with a simple LED.

## Can I use this myself?
Yes I don't mind and the license speaks for itself, but even though this is for the "secure
programming" course, I wouldn't consider this implementation secure.

There is the possibility of sidechannel attacks, since I did not have time to make sure
that all implementations are constant-time. And while I will have scripts to check the 
update status of all packages and a "plan for updates", I will not be actually "maintaining"
this toy repository so... Not actually very secure, but this repository can be considered
abandoned on publish.

There is also two big factors that make this less than ideal that I do not have time
to fix. 1. I am using a simple sha-256 hash for deriving a key from a password with 
_no salt_ bum bum bummm. This could be easily fixed, with time... That I don't have before
the deadline. If I were to do it correctly I would use something like argon2id to derive the key with a salt that one could get unencrypted from the device.

## The crypto library
[The library](https://github.com/rweather/arduinolibs/) is the rweather arduinolibs
library. I added their license just in case, but the reason why I'm committing it is because
the default download from the IDE is broken. This application was made with that specific
library and while all other libraries have an easy setup, the crypto library needs to be that version for this to function. I did not write this library, but I am gratefully using it.

## Setup
The react-native application can be ran by installing all the requirements for react-natives
android development. IOS is not officially supported by this repository and will never be.

The arduino script follows the following steps:
1. Download the Arduino IDE (last tested with V2.3.8)
1. Install the following libraries with the library browser, if not included by default:
   - WiFiNinna
   - FastLED
   - ArduinoECCX08
1. Copy the folder /Arduino device code/libraries/Crypto into your arduino/libraries folder
