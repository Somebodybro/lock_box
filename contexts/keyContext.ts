import { createContext } from 'react';

export const KeyContext = createContext({encKey:new ArrayBuffer,setEncKey:(key:ArrayBuffer) => {}});