import React, {useState} from 'react'
import useWebBluetooth from './bluetooth.js'
import { toast } from 'react-toastify';
import Button from '@mui/material/Button';
import BluetoothIcon from '@mui/icons-material/Bluetooth';

function findCharByUuid(services, uuid) {
    for(const service of services) {
        for(const char of service.characteristics) {
            if (char.uuid === uuid) {
                return char.characteristic;
            }
        }
    }
    return new Promise.reject();
}

async function sendMessages(services, msgs) {
    const char = findCharByUuid(services, "ae882c80-3336-4b92-8269-f978b9d4b5db")
    for(const msg of msgs) {
        await char.writeValue(msg)
    }
}

function WebBluetoothSerial({onInfo, onError, onConsoleOut, onSttChange, onRxMessage, messageToSend}){
    const [buttonDisabled, setButtonDisabled] = useState(false);

    const {
        isConnected,
        connectDevice,
        disconnectDevice,
        services
    } = useWebBluetooth({
        onConnected:()=>{
            onSttChange("Connected");
        },
        onDisconnected:()=>{
            onInfo("Device Disconnected");
            onSttChange("Disconnected")
        },
//        onConsoleOut:onConsoleOut,
//        onConsoleOut:console.log,
        onConsoleOut:()=>{},
        onInfo:onInfo,
        onError:onError,
        onNotify:(event)=>{
            if (event.target.uuid === "ae882c81-3336-4b92-8269-f978b9d4b5db"){
                if (onRxMessage) {
                    const len = event.target.value.getUint8(0);
                    const data = event.target.value.buffer.slice(1, 1+len)
//                    console.log(len, data)
                    onRxMessage(data)
                }
            }
        }
    });

    if (messageToSend) {
        const max_tx_size = 16
        const encoder = new TextEncoder()
        const tx_u8A = encoder.encode(messageToSend + "\r\n")
        const fullTxCount = Math.trunc(tx_u8A.byteLength / max_tx_size)

        const tx_bytes = []
        for(let i = 0; i < fullTxCount; i++) {
            const tmp = new Uint8Array(max_tx_size + 1) 
            tmp[0] = max_tx_size
            tmp.set(tx_u8A.slice(i * max_tx_size, (i + 1) * max_tx_size), 1)
            tx_bytes.push(tmp)
        }
        const tmp = new Uint8Array(max_tx_size + 1).fill(0)
        tmp[0] = tx_u8A.byteLength - max_tx_size * fullTxCount
        tmp.set(tx_u8A.slice(fullTxCount * max_tx_size), 1)
        tx_bytes.push(tmp)
        sendMessages(services, tx_bytes)
    }

    return (
        <Button onClick={
            async ()=>{
                setButtonDisabled((old)=>true)
                if(isConnected) {
                    onSttChange("Disconnecting");
                    try{
                        await disconnectDevice();
                        setButtonDisabled((old)=>false)
                    } catch (e) {
                        onError(e);
                        setButtonDisabled((old)=>false)
                    }
                } else {
                    onSttChange("Connecting");
                    try{
                        var device = await navigator.bluetooth.requestDevice({
                            filters:[
                                {
                                    services: [
                                        "0000180a-0000-1000-8000-00805f9b34fb", // Device Information
                                    ]
                                },{
                                    services: [
                                        "ae880180-3336-4b92-8269-f978b9d4b5db", // proprietary service
                                    ]
                                },
                            ],
                            optionalServices:[
                            ]
                        });        
                        try {
                            await toast.promise(
                                connectDevice(device),
                                {
                                  pending: 'Connecting...',
                                  success: 'Connected',
                                  error: 'Connection failed'
                                }
                            )
                            setButtonDisabled((old)=>false)
                            // ここではまだservicesに値が入っていない。。。
                        } catch (e) {
                            // for example, "NotFoundError: No port selected by the user." if user select cancel.
                            onError(e);
                            setButtonDisabled((old)=>false)
                        }        
                    }
                    catch (error) {
                        setButtonDisabled((old)=>false)
                        onConsoleOut("  requestDevice... Fail");
                        onConsoleOut("    " + error.toString());
                        onError(error.toString())
                        return;
                    }
                }
            }
        }
        variant="outlined"
        size="small"         
        disabled = {buttonDisabled}
        startIcon={<BluetoothIcon />}        
        >{buttonDisabled?"CONNECTING BLE":(isConnected?"DISCONNECT BLE":"CONNECT BLE")}</Button>
    );
}
export default WebBluetoothSerial;
