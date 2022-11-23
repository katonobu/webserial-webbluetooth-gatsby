import React from 'react'
import webSerialIo from './webSerialIo';

const WebSerialContext = React.createContext();
const {openPort,closePort,sendMessage,updateCallbacks} = webSerialIo();

const WebSerialProvider = (props) => {
    return (
        <WebSerialContext.Provider value = {{openPort, closePort, sendMessage, updateCallbacks}}>
            { props.children }
        </WebSerialContext.Provider>
    )
}
export default WebSerialProvider;
export {WebSerialContext};