import React, {useRef, useState, useEffect } from 'react'
import {XTerm} from 'xterm-for-react'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import WebSerial from './web_serial.js';
//import WebBluetooth from './web_bluetooth.js';
import WebBluetoothSerial from './web_bluetooth_serial';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import handleInputLine from './pseudo_serial_device_service.js'

//const toBlack   = "\x1b[30m"
const toRed     = "\x1b[31m"
const toGreen   = "\x1b[32m"
//const toYellow  = "\x1b[33m"
const toBlue    = "\x1b[34m"
//const toMagenta = "\x1b[35m"
//const toCyan    = "\x1b[36m"
//const toWhite   = "\x1b[37m"
const toDefault = "\x1b[0m"

const textColor_serial = (str)=>toGreen+str+toDefault
const textColor_ble = (str)=>toBlue+str+toDefault
const textColor_err = (str)=>toRed+str+toDefault

let serialInputLine = "";
const serialRxParser = (rxData) => {
    const decoder = new TextDecoder();
    const splitted = (serialInputLine + decoder.decode(rxData)).split('\r\n');
    serialInputLine = splitted.pop();
    return splitted;
};

const actions = [
    [
        {
            str:"SEND 2sec",
            cmd:"< TEST RSP 2000",
            timeout:3000
        },
        {
            str:"SEND 1sec",
            cmd:"< TEST RSP 1000",
            timeout:2000
        },
        {
            str:"SEND 500msec",
            cmd:"< TEST RSP 500",
            timeout:1000
        },
        {
            str:"SEND 100msec",
            cmd:"< TEST RSP 100",
            timeout:1000
        },
    ],[
        {
            str:"EVT 2sec infinit",
            cmd:"< TEST EVT 2,2000,0",
            timeout:0
        },
        {
            str:"STOP EVT 2sec infinit",
            cmd:"< TEST EVT 2,0,0",
            timeout:0
        },
    ],[
        {
            str:"EVT 1sec 10times",
            cmd:"< TEST EVT 0,1000,10",
            timeout:0
        },
        {
            str:"EVT 0.5sec 20times",
            cmd:"< TEST EVT 1,500,20",
            timeout:0
        },
        {
            str:"EVT 0.1sec 100times",
            cmd:"< TEST EVT 3,100,100",
            timeout:0
        },
    ]
]

let bleSerialInputLine = "";
let rspResolve = null;
let cancelWaitRsp = null;
const waitRsp = (txStr, timeout) => {
    const txStrs = txStr.split(' ')
    return new Promise((resolve, reject)=>{
        let timerId = null
        if (0 < timeout) {
            timerId = setTimeout(()=>{
                reject("timeout");
                rspResolve = null;
                cancelWaitRsp = null;
            }, timeout)
        }
        rspResolve = (rxStr)=>{
            const rxStrs = rxStr.split(' ')
            if(rxStrs[1] === txStrs[1] && rxStrs[2] === txStrs[2]){
                rspResolve = null;
                cancelWaitRsp = null;
                if (timerId) {
                    clearTimeout(timerId)
                }
                resolve()
            }
        }
        cancelWaitRsp = ()=>{
            rspResolve = null;
            cancelWaitRsp = null;
            if (timerId) {
                clearTimeout(timerId)
            }
            reject("canceled")
        }
    })
}

const buildActionButton = (str, actFunc, disabled, index) => {
    return (
        <Button 
        variant="outlined"
        size="small"
        key={index}    
        onClick={actFunc}
        disabled={disabled}
        >{str}
        </Button>
    )
}

function BleOnlyButtons({sendCmdWaitRsp, isOpen, cmdBusy, rstBusy, setRstBusy}) {
    if (isOpen) {
        return (
            <>
            {
            //                [/*actions[0],actions[1],*/actions[2]].map((acts, pindex)=>{return (
                actions.map((acts, pindex)=>{return (
                    <ButtonGroup variant="outlined" size="small">
                    {
                        acts.map((act, index)=>
                            buildActionButton(act.str, ()=>{
                                sendCmdWaitRsp(act.cmd, act.timeout)}, (!isOpen || cmdBusy), pindex.toString(10)+"_"+index.toString(10))
                            )
                    }
                    </ButtonGroup>
                )})
            }
            <ButtonGroup variant="outlined" size="small">
                <Button 
                    onClick={
                        ()=>{
                            sendCmdWaitRsp("< TEST RSP 0", 0)
                        }
                    }
                    disabled={(!isOpen || cmdBusy)}
                >SEND No RSP</Button>
                <Button 
                    onClick={
                        ()=>{
                            if(cancelWaitRsp) {
                                cancelWaitRsp()
                            }
                        }
                    }
                    disabled={(!isOpen || rstBusy)}
                >Clear CMD Busy</Button>
                <Button 
                    onClick={
                        async ()=>{
                            setRstBusy((old)=>true)
                            await sendCmdWaitRsp("< TEST RESET", 6000)
                            setRstBusy((old)=>false)
                        }
                    }
                    disabled={!isOpen || rstBusy}
                >RESET</Button>
            </ButtonGroup>
            </>
        )
    } else {
        return (<></>)
    }
}

const LoadedXterm  = function(){
    const xtermRef = useRef(null);
    const encoder = useRef(new TextEncoder());

    const [termInputLine, setTermInputLine] = useState("");
    const [messageToSendBySerial, setMessageToSendBySerial] = useState("");
    const [messageToSendByBle,    setMessageToSendByBle] = useState("");
    const [isOpen, setIsOpen] = useState(false)
    const [cmdBusy, setCmdBusy] = useState(false);
    const [rstBusy, setRstBusy] = useState(false);
    const [dispTerminal, setDispTerminal] = useState(true);

    useEffect(()=>{
        if(messageToSendBySerial !== "") {
            setMessageToSendBySerial("");
        }
    },[messageToSendBySerial])
    useEffect(()=>{
        if(messageToSendByBle !== "") {
            setMessageToSendByBle("");
        }
    },[messageToSendByBle])

    /*
    {
        sendCmdWaitRsp,
        onRsp
    } = useCmdRspIo (
        consoleOut:(str) =>xtermRef.current.terminal.writeln(textColor_ble(str))
        setMessageToSendByBle:setMessageToSendByBle
        setCmdBusy:
    )
    */
    const sendCmdWaitRsp = async (txData, timeout = 0) => {
        setCmdBusy((old)=>true)
        xtermRef.current.terminal.writeln(textColor_ble(txData))
        setMessageToSendByBle((old)=>txData)
        try{
            await waitRsp(txData, timeout)
            setCmdBusy((old)=>false)
        }catch(e) {
            console.log(e)
            if (e === "canceled") {
                setCmdBusy((old)=>false)
            } else if (e === "timeout") {
            }
        }
    }
        
    return (
        <>
            <ToastContainer
                position="top-center"
                autoClose={2000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                draggable
                pauseOnHover
            />        
            <WebSerial
                onRxMessage={
                    (data) => {
                        serialRxParser(data).forEach((str)=>{
                            xtermRef.current.terminal.writeln(textColor_serial(str))
                            handleInputLine(str.toUpperCase(), (str)=>{setMessageToSendBySerial(str);xtermRef.current.terminal.writeln(textColor_serial(str));})
                        })
                    }
                }
                onInfo={
                    (e) => {
                        console.log('WebSerial:INFO:' + e.toString());
                        toast.success(e.toString());
                    }                    
                }
                onError={
                    (e) => {
                        console.log('WebSerial:ERROR:' + e.toString());
                        xtermRef.current.terminal.writeln(textColor_err('WebSerial:' + e.toString()));
                        toast.error(e.toString());
                    }                    
                }
                onSttChange={() => {}}
                messageToSend={messageToSendBySerial}
                color = 'secondary'
            />
            <WebBluetoothSerial
                onInfo={
                    (e) => {
                        console.log('WebBluetooth:INFO:' + e.toString());
                        toast.success(e.toString());
                    }                    
                }
                onError={
                    (e) => {
                        console.log('WebBluetooth:ERROR:' + e.toString());
                        xtermRef.current.terminal.writeln(textColor_err('WebBluetooth:' + e.toString()));
                        toast.error(e.toString());
                    }                    
                }
                onSttChange={
                    (msg) => {
                        console.log("WebBluetooth:SttChange:" + msg)
                        if (msg === "Connected") {
                            setIsOpen((old)=>true)
                        } else if (msg === "Disconnected") {
                            setIsOpen((old)=>false)
                            setCmdBusy((old)=>false)
                            setRstBusy((old)=>false)
                            if (cancelWaitRsp) {
                                cancelWaitRsp()
                            }
                        } else if (msg === "Connecting") {

                        } else if (msg === "Disconnecting") {
                            setIsOpen((old)=>false)
                        }
                    }
                }
                onConsoleOut={
                    (msg) => {
//                        xtermRef.current.terminal.writeln(textColor_ble(msg))
                    }                    
                }
                messageToSend={messageToSendByBle}
                onRxMessage={
                    (rxData) => {
                        const decoder = new TextDecoder();
                        const splitted = (bleSerialInputLine + decoder.decode(rxData)).split('\r\n');
                        bleSerialInputLine = splitted.pop();
                        splitted.forEach((str)=>{
//                            console.log(str)
                            xtermRef.current.terminal.writeln(textColor_ble(str))
                            if(rspResolve) {
                                rspResolve(str)
                            }                            
                        })
                    }
                }
            />
            <BleOnlyButtons
                sendCmdWaitRsp = {sendCmdWaitRsp}
                isOpen = {isOpen}
                cmdBusy = {cmdBusy}
                rstBusy = {rstBusy}
                setRstBusy = {setRstBusy}
            ></BleOnlyButtons>
            <FormGroup>
                <FormControlLabel control={
                    <Switch
                        checked={dispTerminal}
                        onChange={(event) => setDispTerminal(event.target.checked)}
                    />
                } label="Display Monitor terminal" />
            </FormGroup>            
            <div hidden={!dispTerminal}>
                <XTerm
                    ref={xtermRef}
                    options={{
                        theme: {
                            background: '#fdf6e3',
                            blue: '#3498db',
                            red:  '#a40000',
                            green:'#19857b'
                          }                    
                    }}
                    onData={
                        (data) => {
                            xtermRef.current.terminal.writeUtf8(encoder.current.encode(data));
                            setTermInputLine((old)=>old + data);
                            if (data === '\r' && 1 < termInputLine.length) {
                                xtermRef.current.terminal.writeln("");
                                setMessageToSendByBle((old)=>termInputLine);
                                setTermInputLine((old)=>"")
                            }
                        }                    
                    }
                />
            </div>
        </>
    )
}

export default LoadedXterm;
