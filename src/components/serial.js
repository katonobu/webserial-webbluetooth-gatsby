import {useRef, useCallback, useState} from 'react'

function useWebSerial(options){
    const [isOpened, setIsOpened] = useState(false);
    const port = useRef(undefined);
    const reader = useRef(undefined);
    const optionsCache = useRef(options)

//    console.log('useWebSerial is called');

    const markDisconnected = ()=>{
//        console.log('markDisconnected is called');
        setIsOpened(false);
        if ( optionsCache.current.onClose ) {
            optionsCache.current.onClose();
        }
    }    

    const openPort = useCallback(async (port_arg, opt) => {
//        console.log('openPort is called');
        try{
            await port_arg.open(opt);
            port.current = port_arg;
            setIsOpened(true);
            if (optionsCache.current.onOpen) {
                optionsCache.current.onOpen();
            }
        } catch (e) {
            if (optionsCache.current.onError) {
                optionsCache.current.onError(e);
            }
            markDisconnected();
            return;
        }

        while (port.current && port.current.readable) {
            try {
                reader.current = port.current.readable.getReader()
                for (;;) {
//                    console.log('before reader.current.read()');
                    const {value, done} = await reader.current.read();
//                    console.log('return from reader.current.read()');
                    if (value) {
                        if (optionsCache.current.onMessage){
                            optionsCache.current.onMessage(value);
                        }
                    }
                    if (done) {
                        break;
                    }
                }
                reader.current.releaseLock();
                reader.current = undefined;
            } catch (e) {
                if (optionsCache.current.onError) {
                    optionsCache.current.onError(e);
                }
            }
        }
        if (port.current) {
            try {
                await port.current.close();
            } catch (e) {
                if (optionsCache.current.onError) {
                    optionsCache.current.onError(e);
                }
            }
            markDisconnected();
        }
    },[]);

    const closePort = useCallback(async () => {
//        console.log('closePort is called');
        const localPort = port.current;
        port.current = undefined;
      
        if (reader.current) {
            await reader.current.cancel();
        }
      
        if (localPort) {
            try {
                await localPort.close();
            } catch (e) {
                if (optionsCache.current.onError) {
                    optionsCache.current.onError(e);
                }
            }
        }
        markDisconnected();        
    }, []);
      
    const sendMessage = useCallback((message) => {
//        console.log('sendMessage is called');
        if (port.current?.writable == null) {
            if (optionsCache.current.onError) {
                optionsCache.current.onError(new Error("Can't send message, serial pot may not open."));
            }
            return;
        }
        
        const writer = port.current.writable.getWriter();
        writer.write(message);
        writer.releaseLock();        
    }, []);

    return {
        isOpened,
        openPort,
        closePort,
        sendMessage
    };
}
export default useWebSerial;
