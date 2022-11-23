import React, {useRef, useState, useEffect} from 'react'
import useWebSerial from './serial.js'
import SerialIcon from './serial_io_icon.js'
import Button from '@mui/material/Button';
import SvgIcon from '@mui/material/SvgIcon';

function WebSerial({onInfo, onError, onSttChange, onRxMessage, messageToSend, color}){
    const encoder = useRef(new TextEncoder());
    const [serialAvailable, setSerialAvailable] = useState(false);
    useEffect(()=>{
        setSerialAvailable("serial" in navigator)
//        setSerialAvailable(false)
    },[])

    const {
        isOpened,
        openPort,
        closePort,
        sendMessage
    } = useWebSerial({
        onOpen:()=>{onInfo("Port Opened");onSttChange("Open")},
        onClose:()=>{onInfo("Port Closed");onSttChange("Close")},
        onMessage:onRxMessage,
        onError:onError
    });

    if (messageToSend && isOpened) {
        sendMessage(encoder.current.encode(messageToSend + "\r\n"));
    }

    return (
        <Button 
        variant="outlined"
        size="small"         
        color={color}
        startIcon={<SerialIcon color={serialAvailable?color:'disabled'}/>} 
        disabled={!serialAvailable}       
        onClick={
            async ()=>{
                if (isOpened) {
                    try{
                        onSttChange("Closing");
                        await closePort();
                    } catch (e) {
                        onError(e);
                    }
                } else {
                    try {
                        let tmpPort = await navigator.serial.requestPort({
                            filters: [{usbVendorId:0x2341, usbProductId:0x8054}]
                        });
                        try{
                            onSttChange("Openning");
                            openPort(tmpPort, {
                                    baudRate:115200,
                                    dataBits:8,
                                    stopBits:1,
                                    parity:"none",
                                    bufferSize:255,
                                    flowControl:"none"
                                });
                        } catch (e) {
                            // for example, "NetworkError: Failed to open serial port." if specified port is already used.
                            onError(e);
                        }
                    } catch (e) {
                        // for example, "NotFoundError: No port selected by the user." if user select cancel.
                        onError(e);
                    }        
                }
            }
        }
        >{isOpened?"CLOSE Serial":"OPEN Serial"}</Button>
    );
}
export default WebSerial;
