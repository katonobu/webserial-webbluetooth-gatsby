import React, {useRef, useState, useEffect} from 'react'
import {XTerm} from 'xterm-for-react'
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { useSelector } from 'react-redux'

//const toBlack   = "\x1b[30m"
const toRed     = "\x1b[31m"
const toGreen   = "\x1b[32m"
//const toYellow  = "\x1b[33m"
const toBlue    = "\x1b[34m"
//const toMagenta = "\x1b[35m"
//const toCyan    = "\x1b[36m"
//const toWhite   = "\x1b[37m"
//const toDefault = "\x1b[0m"

const textColor_serial = (str)=>toGreen+str+toBlue
//const textColor_ble = (str)=>toBlue+str+toDefault
const textColor_err = (str)=>toRed+str+toBlue

let lastTrxDisp = {data:undefined, time:undefined}
const TrxDisp = ({xtermRef})=>{
    const trxData = useSelector((state) => state.serialTrx.value);
    if (xtermRef?.current?.terminal){
        if (trxData.data && trxData.time != lastTrxDisp.time) {
            const date = new Date(trxData.time)
            const msStr = ("000" + date.getMilliseconds().toString(10)).slice(-3)
            xtermRef.current.terminal.writeln(toBlue + date.toLocaleTimeString() + "." + msStr + " :\"" + textColor_serial(trxData.data)+ "\"");
            lastTrxDisp = trxData;
        }
    }
    return null;
}

const CmdRspErrDisp = ({xtermRef})=>{
    const cmdRsp = useSelector((state) => state.cmdBusy.value);
    if (xtermRef?.current?.terminal){
        if (cmdRsp?.err) {
            const date = new Date(cmdRsp.time)
            const msStr = ("000" + date.getMilliseconds().toString(10)).slice(-3)
            xtermRef.current.terminal.writeln(toBlue + date.toLocaleTimeString() + "." + msStr + " :" + textColor_err(cmdRsp.err));
        }
    }
    return null;
}

const LoadedXterm  = function(){
    const xtermRef = useRef(null);
    const encoder = useRef(new TextEncoder());
    const [dispTerminal, setDispTerminal] = useState(true);
    useEffect(()=>{
        console.log("Xterm:Mounted");
        return ()=>{
            console.log("Xterm:Unmounted");
        }
    },[]);

    return (
        <>
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
                            // local echo
                            xtermRef.current.terminal.writeUtf8(encoder.current.encode(data));
                            console.log("from terminal:", data);
                        }                    
                    }
                />
            </div>
            <TrxDisp
                xtermRef = {xtermRef}
            ></TrxDisp>
            <CmdRspErrDisp
                xtermRef = {xtermRef}
            ></CmdRspErrDisp>
        </>
    )
}

export default LoadedXterm;
