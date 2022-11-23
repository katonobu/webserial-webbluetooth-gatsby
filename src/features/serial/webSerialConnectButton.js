import React, {useState, useEffect, useContext, useCallback} from 'react'
import SerialIcon from './serial_io_icon.js'
import { useSelector, useDispatch } from 'react-redux'
import { connected, disconnected } from './serialConnectionSlice'
import Button from '@mui/material/Button';
import {WebSerialContext} from './webSerialProvider'
import { navigate } from "gatsby"

const WebSerialConnectButton = ({color, requestPortFilters, openOptions})=>{
    const isConnected = useSelector((state) => state.serialConnection.value)
    const dispatch = useDispatch()
    const {openPort,closePort,updateCallbacks} = useContext(WebSerialContext);
    const onError = useCallback(
        (e) => {console.log(e)},[]
    );
    const [serialAvailable, setSerialAvailable] = useState(true)
    useEffect(()=>{
        updateCallbacks({
            onOpen:()=>{
                console.log("onOpen()");
                dispatch(connected())
                navigate("/control")
            },
            onClose:()=>{
                console.log("onClose()");
                dispatch(disconnected())
                navigate("/")
            }
        });
        setSerialAvailable("serial" in navigator)
    },[updateCallbacks, dispatch]);
    return (
        <Button 
        variant="outlined"
        size="small"         
        color={color}
        startIcon={<SerialIcon color={serialAvailable?color:'disabled'}/>}
        disabled={!serialAvailable}       
        onClick={
            async ()=>{
                if (isConnected) {
                    try{
                        await closePort();
                    } catch (e) {
                        onError(e);
                    }
                } else {
                    try {
                        // requestPortFilters may like this [{usbVendorId:0x2341, usbProductId:0x8054}]
                        // default value, [] accepts all vid/pid.
                        const filters = requestPortFilters?requestPortFilters:[]; 
                        let tmpPort = await navigator.serial.requestPort({
                            filters: filters 
                        });
                        try{
                            const options = openOptions?openOptions:{
                                baudRate:115200,
                                dataBits:8,
                                stopBits:1,
                                parity:"none",
                                bufferSize:255,
                                flowControl:"none"
                            }
                            openPort(tmpPort, options);
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
        >{isConnected?"CLOSE":"OPEN"}</Button>
    );
}
export default WebSerialConnectButton;
