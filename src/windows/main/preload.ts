import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('isItWorking', 'Yes! It is!')
