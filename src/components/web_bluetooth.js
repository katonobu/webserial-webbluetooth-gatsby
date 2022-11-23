import React, {useState} from 'react'
import useWebBluetooth from './bluetooth.js'
import { toast } from 'react-toastify';
import Button from '@mui/material/Button';

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

let rspResolve = null;
let setResolve = null;
let getResolve = null;
let setEvtResolve = null;
let getEvtResolve = null;
function onNotify(event) {
    if (event.target.uuid === "ae882c08-3336-4b92-8269-f978b9d4b5db"){
        if (rspResolve){
            rspResolve(event.target.value);
            rspResolve = null;
        } else {
            console.log("rspResolve is null but callback is called");
        }
    } else if (event.target.uuid === "ae882c00-3336-4b92-8269-f978b9d4b5db"){
        if (setResolve){
            setResolve(event.target.value);
            setResolve = null;
        } else {
            console.log("setResolve is null but callback is called");
        }
    } else if (event.target.uuid === "ae882c01-3336-4b92-8269-f978b9d4b5db"){
        if (getResolve){
            getResolve(event.target.value);
            getResolve = null;
        } else {
            console.log("getResolve is null but callback is called");
        }
    } else if (event.target.uuid === "ae882c02-3336-4b92-8269-f978b9d4b5db"){
        if (setEvtResolve){
            setEvtResolve(event.target.value);
            setEvtResolve = null;
        } else {
            console.log("setEvtResolve is null but callback is called");
        }
    } else if (event.target.uuid === "ae882c03-3336-4b92-8269-f978b9d4b5db"){
        if (getEvtResolve){
            getEvtResolve(event.target.value);
            getEvtResolve = null;
        } else {
            console.log("getEvtResolve is null but callback is called");
        }
    }else{
        console.log(event.target.uuid)
    }
}

async function setWaitRsp(services, target_uuid, value, timeout) {
    const buff = new Uint16Array(2);
    buff[0] = target_uuid;
    buff[1] = value;
    findCharByUuid(services, "ae882c00-3336-4b92-8269-f978b9d4b5db").writeValue(buff);
    await new Promise((resolve, reject)=>{
        setResolve = resolve;
        setTimeout(() => {
            reject("timeout:set");
        }, 1000);
    })
    await new Promise((resolve, reject)=>{
        rspResolve = resolve;
        setTimeout(() => {
        reject("timeout:rsp");
        }, timeout);
    })
}
async function getWaitRsp(services, target_uuid, timeout) {
    const buff = new Uint16Array(1);
    buff[0] = target_uuid;
    findCharByUuid(services, "ae882c01-3336-4b92-8269-f978b9d4b5db").writeValue(buff);
    await new Promise((resolve, reject)=>{
        getResolve = resolve;
        setTimeout(() => {
           reject("timeout:get");
        }, 1000);
    })
    await new Promise((resolve, reject)=>{
        rspResolve = resolve;
        setTimeout(() => {
           reject("timeout:rsp");
        }, timeout);
    })
}
async function setEvtWaitRsp(services, target_uuid, value, timeout) {
    const buff = new Uint16Array(2);
    buff[0] = target_uuid;
    buff[1] = value;
    findCharByUuid(services, "ae882c02-3336-4b92-8269-f978b9d4b5db").writeValue(buff);
    await new Promise((resolve, reject)=>{
        setEvtResolve = resolve;
        setTimeout(() => {
           reject("timeout:setEvt");
        }, 1000);
    })
    await new Promise((resolve, reject)=>{
        rspResolve = resolve;
        setTimeout(() => {
           reject("timeout:rsp");
        }, timeout);
    })
}
async function getEvtWaitRsp(services, target_uuid, timeout) {
    const buff = new Uint16Array(1);
    buff[0] = target_uuid;
    findCharByUuid(services, "ae882c03-3336-4b92-8269-f978b9d4b5db").writeValue(buff);
    await new Promise((resolve, reject)=>{
        getEvtResolve = resolve;
        setTimeout(() => {
           reject("timeout:getEvt");
        }, 1000);
    })
    await new Promise((resolve, reject)=>{
        rspResolve = resolve;
        setTimeout(() => {
           reject("timeout:rsp");
        }, timeout);
    })
}

function WebBluetooth({onInfo, onError, onConsoleOut}){
    const [buttonDisabled, setButtonDisabled] = useState(false);
    const [cmdBusy, setCmdBusy] = useState(false);

    const {
        isConnected,
        connectDevice,
        disconnectDevice,
        services
    } = useWebBluetooth({
        onConnected:()=>{
//            onInfo("Device Connected");
        },
        onDisconnected:()=>{
            onInfo("Device Disconnected");
        },
        onConsoleOut:onConsoleOut,
//        onConsoleOut:console.log,
        onInfo:onInfo,
        onError:onError,
        onNotify:onNotify
    });


    return (
        <>
        <div>
        <Button onClick={
            async ()=>{
                setButtonDisabled((old)=>true)
                if(isConnected) {
                    try{
                        await disconnectDevice();
                        setButtonDisabled((old)=>false)
                    } catch (e) {
                        onError(e);
                        setButtonDisabled((old)=>false)
                    }
                } else {
                    try {
                        await toast.promise(
                            connectDevice,
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
            }
        }
        variant="outlined"
        size="small"         
        disabled = {buttonDisabled}
        >{buttonDisabled?"CONNECTING":(isConnected?"DISCONNECT":"CONNECT")}</Button>
        <br></br>
        <Button onClick={
            async ()=>{
                try{
                    setCmdBusy((old)=>true)
                    await setWaitRsp(services, 0x2c10, 5000, 5500);
                    setCmdBusy((old)=>false)
                } catch(e) {
                    console.log(e)
                    setCmdBusy((old)=>false)
                }
            }
        }
        variant="outlined"
        size="small"         
        disabled = {buttonDisabled || !isConnected || cmdBusy}
        >Rsp 5Sec</Button>
        <Button onClick={
            async ()=>{
                try{
                    setCmdBusy((old)=>true)
                    await setWaitRsp(services, 0x2c10, 2000, 2200);
                    setCmdBusy((old)=>false)
                } catch(e) {
                    console.log(e)
                    setCmdBusy((old)=>false)
                }
            }
        }
        variant="outlined"
        size="small"         
        disabled = {buttonDisabled || !isConnected || cmdBusy}
        >Rsp 2Sec</Button>
        <Button onClick={
            async ()=>{
                try{
                    setCmdBusy((old)=>true)
                    await getWaitRsp(services, 0x2c10, 6000)
                    let rsp = await findCharByUuid(services, "ae882c10-3336-4b92-8269-f978b9d4b5db").readValue()
                    console.log(rsp.getUint16(0, true))
                    setCmdBusy((old)=>false)
                } catch(e) {
                    console.log(e)
                    setCmdBusy((old)=>false)
                }
            }
        }
        variant="outlined"
        size="small"         
        disabled = {buttonDisabled || !isConnected || cmdBusy}
        >Rsp Get</Button>
        <Button onClick={
            async ()=>{
                try{
                    setCmdBusy((old)=>true)
                    await setEvtWaitRsp(services, 0x2c21, 0, 1000)
                    setCmdBusy((old)=>false)
                } catch(e) {
                    console.log(e)
                    setCmdBusy((old)=>false)
                }
            }
        }
        variant="outlined"
        size="small"         
        disabled = {buttonDisabled || !isConnected || cmdBusy}
        >EVT0 Off</Button>
        <Button onClick={
            async ()=>{
                try{
                    setCmdBusy((old)=>true)
                    await setEvtWaitRsp(services, 0x2c21, 1, 1000)
                    setCmdBusy((old)=>false)
                } catch(e) {
                    console.log(e)
                    setCmdBusy((old)=>false)
                }
            }
        }
        variant="outlined"
        size="small"         
        disabled = {buttonDisabled || !isConnected || cmdBusy}
        >EVT0 On</Button>
        <Button onClick={
            async ()=>{
                try{
                    setCmdBusy((old)=>true)
                    await getEvtWaitRsp(services, 0x2c21, 1000);
                    let rsp = await findCharByUuid(services, "ae882c21-3336-4b92-8269-f978b9d4b5db").readValue()
                    console.log(rsp.getUint8(0))
                    setCmdBusy((old)=>false)
                } catch(e) {
                    console.log(e)
                    setCmdBusy((old)=>false)
                }
            }
        }
        variant="outlined"
        size="small"         
        disabled = {buttonDisabled || !isConnected || cmdBusy}
        >EVT0 Get</Button>
        <Button onClick={
            async ()=>{
                try{
                    setCmdBusy((old)=>true)
                    await setEvtWaitRsp(services, 0x2c25, 0, 1000)
                    setCmdBusy((old)=>false)
                } catch(e) {
                    console.log(e)
                    setCmdBusy((old)=>false)
                }
            }
        }
        variant="outlined"
        size="small"         
        disabled = {buttonDisabled || !isConnected || cmdBusy}
        >EVT1 Off</Button>
        <Button onClick={
            async ()=>{
                try{
                    setCmdBusy((old)=>true)
                    await setEvtWaitRsp(services, 0x2c25, 1, 1000)
                    setCmdBusy((old)=>false)
                } catch(e) {
                    console.log(e)
                    setCmdBusy((old)=>false)
                }
            }
        }
        variant="outlined"
        size="small"         
        disabled = {buttonDisabled || !isConnected || cmdBusy}
        >EVT1 On</Button>
        <Button onClick={
            async ()=>{
                try{
                    setCmdBusy((old)=>true)
                    await getEvtWaitRsp(services, 0x2c25, 1000);
                    let rsp = await findCharByUuid(services, "ae882c25-3336-4b92-8269-f978b9d4b5db").readValue()
                    console.log(rsp.getUint8(0))
                    setCmdBusy((old)=>false)
                } catch(e) {
                    console.log(e)
                    setCmdBusy((old)=>false)
                }
            }
        }
        variant="outlined"
        size="small"         
        disabled = {buttonDisabled || !isConnected || cmdBusy}
        >EVT1 Get</Button>
        <Button onClick={
            async ()=>{
                try{
                    const target_uuid = 0x1234;
                    const buff = new Uint8Array(12);
                    buff[0] = target_uuid & 0x0000FF;
                    buff[1] = (target_uuid & 0x0000FF00) >> 8;
                    buff[2] = 12;
                    for(let count = 3; count < 12; count++) {
                        buff[count] = count;
                    }
                    findCharByUuid(services, "ae882c04-3336-4b92-8269-f978b9d4b5db").writeValue(buff);
                    await new Promise((resolve, reject)=>{
                        setResolve = resolve;
                        setTimeout(() => {
                            reject("timeout:set");
                        }, 1000);
                    })
                } catch(e) {
                    console.log(e)
                }
            }
        }
        variant="outlined"
        size="small"         
        disabled = {buttonDisabled || !isConnected || cmdBusy}
        >TEST</Button>
        </div>
        </>
    );
}
export default WebBluetooth;


// アクセスシーケンス
//  1. Setの場合
//     1. UUID=2c00に32bitを書き込む。
//         value[31:16] = settingValue, value[15:0] = settingTarget UUID
//     2. UUID=2c00が書き込み要求を認識すると、Notificationを返す。
//     3. 指定されたUUIDに対応するリモート機器への書き込みが完了すると、UUID=2c08からNotificationを返す。
//         value[31:16] = rsponse result(0:OK, other:Error), value[15:0] = settingTarget UUID
//  2. Getの場合
//     1. UUID=2c01に16bitを書き込む。
//         value[15:0] = settingTarget UUID
//     2. UUID=2c0xが書き込み要求を認識すると、Notificationを返す。
//     3. 指定されたUUIDに対応するリモート機器からの読み出しが完了すると、UUID=2c08からNotificationを返す。
//         value[31:16] = rsponse result(0:OK, other:Error), value[15:0] = settingTarget UUID
//     4. 読み出したいUUIDの値を読み出す。
//  3. SetEvtの場合
//     1. UUID=2c02に32bitを書き込む。
//         value[16] = settingValue, value[15:0] = settingTarget UUID
//     2. UUID=2c02が書き込み要求を認識すると、Notificationを返す。
//     3. 指定されたUUIDに対応するリモート機器への書き込みが完了すると、UUID=2c08からNotificationを返す。
//         value[31:16] = rsponse result(0:OK, other:Error), value[15:0] = settingTarget UUID
//  2. GetEvtの場合
//     1. UUID=2c03に32bitを書き込む。
//         value[15:0] = settingTarget UUID
//     2. UUID=2c0xが書き込み要求を認識すると、Notificationを返す。
//     3. 指定されたUUIDに対応するリモート機器からの読み出しが完了すると、UUID=2c08からNotificationを返す。
//         value[31:16] = rsponse result(0:OK, other:Error), value[15:0] = settingTarget UUID
//     4. 読み出したいUUIDの値を読み出す。
