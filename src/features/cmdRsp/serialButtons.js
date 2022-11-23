import React, {useState, useEffect, useContext, useCallback} from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { trx } from './serialTrxSlice'
import Button from '@mui/material/Button';
import {WebSerialContext} from '../serial/webSerialProvider'
import buttonActions from './buttonActions'
import SerialEventButtons from '../evtStt/evtButtons'

const SeriqlSequenceCtrler = ({index, cmdBusyDisabled, sendMsg, name}) => {
    const [isActive, setIsActive] = useState(false);
    const [seqCount, setSeqCount] = useState(0);
    const cmdBusy = useSelector((state) => state.cmdBusy.value);
    const dispatch = useDispatch();
    useEffect(()=>{
        if (isActive === true) {
            if (cmdBusy.resetting) {
                console.log("SeriqlSequenceCtrler:reset detected terminated.");
                setSeqCount(0);
                setIsActive(false);
            } else if (cmdBusy.stt === false) {
                if (cmdBusy.err) {
                    console.log("SeriqlSequenceCtrler:terminated by error");
                    setSeqCount(0);
                    setIsActive(false);
                } else {
                    if (seqCount < buttonActions[index].length) {
                        const {cmd, timeout, str} = buttonActions[index][seqCount];
                        console.log("SeriqlSequenceCtrler:send \"" + str + "\" seqCount = " + seqCount.toString(10));
                        dispatch(trx({act:"tx", data:cmd, time:Date.now(), timeout}));
                        sendMsg(cmd);
                        setSeqCount((old)=>old+1);
                        setIsActive(true);
                    } else {
                        console.log("SeriqlSequenceCtrler:terminated.");
                        setSeqCount(0);
                        setIsActive(false);
                    }
                }
            }
        }
    },[cmdBusy.err, cmdBusy.stt, cmdBusy.resetting, dispatch, index, isActive, sendMsg, seqCount])
    return (
        <Button 
        variant="outlined"
        size="small"         
        disabled={cmdBusyDisabled}
        onClick={()=>{
            const {cmd, timeout, str} = buttonActions[index][0];
            console.log("SeriqlSequenceCtrler:send \"" + str + "\" seqCount = " + seqCount.toString(10));
            dispatch(trx({act:"tx", data:cmd, time:Date.now(), timeout}));
            sendMsg(cmd);
            setSeqCount(1);
            setIsActive(true);
        }}
        style={{width:'180px'}}
        >{name}</Button>
    );
}

const SerialCtrlButtons = ({nonConnectDisabled, cmdBusyDisabled, sendMsg})=>{
    const dispatch = useDispatch()
    return (
        buttonActions.slice(0,2).map((el, pindex)=><p>{
            el.map(({str,cmd,timeout}, index)=>
                <Button 
                key={"CMD_RSP_" + ('00'+pindex.toString(10)).slice(-2) + ('00'+index.toString(10)).slice(-2)}
                variant="outlined"
                size="small"         
                disabled={0 < pindex?cmdBusyDisabled:nonConnectDisabled}
                onClick={()=>{
                    dispatch(trx({act:"tx", data:cmd, time:Date.now(), timeout}));
                    sendMsg(cmd);
                }}
                style={{width:'180px'}}
                >{str}</Button>
            )
        }</p>)
    );
}

let serialInputLine = "";
const lineSeparator = "\r\n";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const lineParser = (rxUint8Array) => {
    const splitted = (serialInputLine + decoder.decode(rxUint8Array)).split(lineSeparator);
    serialInputLine = splitted.pop();
    return splitted;
};

const SerialButtons = ()=>{
    const isConnected = useSelector((state) => state.serialConnection.value)
    const isCmdBusy = useSelector((state) => state.cmdBusy.value.stt)
    const dispatch = useDispatch()
    const {sendMessage, updateCallbacks} = useContext(WebSerialContext);
    const [serialAvailable, setSerialAvailable] = useState(true)
    useEffect(()=>{
        updateCallbacks({
            onMessage:(msgU8a)=>{
                const lines = lineParser(msgU8a);
                for(const line of lines){
                    const strippedLine = line.replace(lineSeparator,"")
                    dispatch(trx({act:"rx", data:strippedLine, time:Date.now()}));
                }
            },
        });
        setSerialAvailable("serial" in navigator)
    },[updateCallbacks, dispatch]);
    const sendMsg = useCallback((msg)=>{
        const u8a = encoder.encode(msg+lineSeparator);
        sendMessage(u8a);
    },[sendMessage]);
    return (
        <>
        <SerialCtrlButtons
            nonConnectDisabled = {!serialAvailable || !isConnected}
            cmdBusyDisabled = {!serialAvailable || !isConnected || isCmdBusy}
            sendMsg = {sendMsg}
        ></SerialCtrlButtons>
        <SerialEventButtons
            cmdBusyDisabled = {!serialAvailable || !isConnected || isCmdBusy}
            sendMsg = {sendMsg}
        ></SerialEventButtons>
        <SeriqlSequenceCtrler
            name = {"SEND All"}
            index = {1}
            sendMsg = {sendMsg}
            cmdBusyDisabled = {!serialAvailable || !isConnected || isCmdBusy}
        ></SeriqlSequenceCtrler>
        <SeriqlSequenceCtrler
            name = {"EVT 10Sec All"}
            index = {3}
            sendMsg = {sendMsg}
            cmdBusyDisabled = {!serialAvailable || !isConnected || isCmdBusy}
        ></SeriqlSequenceCtrler>
        </>
    );
}
export default SerialButtons;
