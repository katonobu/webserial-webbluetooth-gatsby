import {useRef, useState} from 'react'

function useWebBluetooth(options){
    const [isConnected, setIsConnected] = useState(false);
    const [services, setServices] = useState([]);
    const [device, setDevice] = useState(null);
    const optionsCache = useRef(options)

    const ble_onDisconnect = async ()=>{
        optionsCache.current.onConsoleOut('onDisconnect is called');
        if (device) {
            setDevice((old)=>{return null});
            setServices((old)=>{return []})
            setIsConnected((old)=>{return false});
            if(optionsCache.current.onDisconnected){
                optionsCache.current.onDisconnected()
            }
            optionsCache.current.onConsoleOut('  Device Disconnected by onDisconnect')
        }
    }

/*
    const ble_onServiceChanged = (event) =>{
        optionsCache.current.onConsoleOut('Service Changed');
    }
*/
    const ble_onDataChanged = (event) => {
        optionsCache.current.onConsoleOut('Receive Notify');
        optionsCache.current.onConsoleOut('  SerivceUUID:' + event.target.service.uuid);
        optionsCache.current.onConsoleOut('  CharacteristicUUID:' + event.target.uuid);
        let value = event.target.value;
        let data = [];
        for (let i = 0; i < value.byteLength; i++) {
            data.push('0x' + ('00' + value.getUint8(i).toString(16)).slice(-2));
        }        
        optionsCache.current.onConsoleOut('  Value:' + data.join(', '))
        optionsCache.current.onConsoleOut('  TimeStamp:' + event.timeStamp);
        if (optionsCache.current.onNotify){
            optionsCache.current.onNotify(event);
        }
    }

    const ble_getDescriptors = async (descriptors_to_add, characteristic) => {
        optionsCache.current.onConsoleOut('          Getting descriptors');
        try {
            const descriptors = await characteristic.getDescriptors()
            try {
                optionsCache.current.onConsoleOut('          Got ' + descriptors.length + ' descriptors');
                for (let i = 0; i < descriptors.length; i++) {
                    const item = {}
                    const descriptor = descriptors[i];
                    optionsCache.current.onConsoleOut('            Descriptor[' + i + ']');
                    optionsCache.current.onConsoleOut('              UUID:' + descriptor.uuid)
                    item.descriptor = descriptor
                    item.uuid = descriptor.uuid

                    let value = null;
                    try{
                        value = await descriptor.readValue();
                    } catch (error) {
                        optionsCache.current.onConsoleOut("                " + error.toString());
                        continue
                    }
                    item.value = value
                    if (descriptor.uuid === "00002901-0000-1000-8000-00805f9b34fb"){
                        let decoder = new TextDecoder('utf-8');
                        const decoded = decoder.decode(value)
                        optionsCache.current.onConsoleOut('              Value:' + decoded);
                        item.userDescription = decoded
                    } else {
                        let data = [];
                        for (let i = 0; i < value.byteLength; i++) {
                            data.push('0x' + ('00' + value.getUint8(i).toString(16)).slice(-2));
                        }
                        if (descriptor.uuid === "00002902-0000-1000-8000-00805f9b34fb"){
                            optionsCache.current.onConsoleOut('              Value:' + data.join(', '));
                            item.clientCharacteristicConfiguration = data.join(', ')
                            let notificationsBit = value.getUint8(0) & 0b01;
                            optionsCache.current.onConsoleOut('              Notifications: ' + (notificationsBit ? 'ON' : 'OFF'));
                            let indicationsBit = value.getUint8(0) & 0b10;
                            optionsCache.current.onConsoleOut('              Indications: ' + (indicationsBit ? 'ON' : 'OFF'));                    
                        }
                    }
                    descriptors_to_add.push(item)
                }
            } catch (error) {
                optionsCache.current.onConsoleOut("    " + error.toString());
                optionsCache.current.onError(error.toString())
            }
        } catch (error) {
            optionsCache.current.onConsoleOut('          Got 0 descriptors');
        }
    }

    const ble_setupCharacteristic = async (characteristics, characteristic) => {
        var item = {
            uuid: characteristic.uuid,
            characteristic: characteristic,
            descriptors: []
        };
        item.properties = "Properties:";
        if (characteristic.properties.broadacast)
            item.properties += " broadcast";
        if (characteristic.properties.read)
            item.properties += " read";
        if (characteristic.properties.writeWithoutResponse)
            item.properties += " writeWithoutResponse";
        if (characteristic.properties.write)
            item.properties += " write";
        if (characteristic.properties.notify)
            item.properties += " notify";
        if (characteristic.properties.indicate)
            item.properties += " indicate";
        if (characteristic.properties.authenticatedSignedWrites)
            item.properties += " authenticatedSignedWrites";
        optionsCache.current.onConsoleOut('          UUDI: ' + item.uuid);
        optionsCache.current.onConsoleOut('          ' + item.properties);
        await ble_getDescriptors(item.descriptors, characteristic);
        characteristics.push(item);
    }    


    const ble_setService = async(service)=>{
        var item = {
            uuid: service.uuid,
            service: service,
            characteristics: []
        };
        try {
            optionsCache.current.onConsoleOut('      Geting Characteristics');
            var characteristics = await service.getCharacteristics();
            optionsCache.current.onConsoleOut('      Got ' + characteristics.length + ' Characteristics');
            for (var i = 0; i < characteristics.length; i++){
                optionsCache.current.onConsoleOut('        Characteristic[' + i + ']');
                await ble_setupCharacteristic(item.characteristics, characteristics[i]);
            }
        } catch (error) {
            optionsCache.current.onConsoleOut("        " + error.toString());
            optionsCache.current.onError(error.toString())
        }
        return item;
    }

    const connectDevice = async (device)=>{
        optionsCache.current.onConsoleOut("Connect is clicked.")
        try {
            optionsCache.current.onConsoleOut("  requestDevice... OK");
            setServices((old)=>{return []});
            setDevice((old)=>{return device});
            optionsCache.current.onConsoleOut("    Device.Name:" + device.name);
            optionsCache.current.onConsoleOut("    Device.Id:"   + device.id);
            device.addEventListener('gattserverdisconnected', ()=>ble_onDisconnect());
            optionsCache.current.onConsoleOut('  Connecting GATT service..')
            var server = await device.gatt.connect()
            optionsCache.current.onConsoleOut('  GATT connected.')
            setIsConnected((old)=>{return true});
//            server.addEventListener('onservicechanged', (event)=>ble_onServiceChanged(event));
            optionsCache.current.onConsoleOut('  Getting PrimaryServices');
            var services = await server.getPrimaryServices();
            optionsCache.current.onConsoleOut('  Got ' + parseInt(services.length, 10) + ' services');
            var list = [];
            for (var i = 0; i < services.length; i++) {
                optionsCache.current.onConsoleOut('    Service[' + i + ']');
                optionsCache.current.onConsoleOut('      UUID:'+services[i].uuid);
                var service = await ble_setService(services[i]);
                list.push(service);
            }
            setServices((old)=>{return list});
/*
            const decoder = new TextDecoder('utf-8');
            for(const service of list) {
                console.log(service.uuid)
                if ((service.uuid === "0000180a-0000-1000-8000-00805f9b34fb") || (service.uuid === "ae881800-3336-4b92-8269-f978b9d4b5db")){
                    for(const char of service.characteristics) {
                        let characteristicUserDescription = ""
                        for(const desc of char.descriptors) {
                            if(desc.uuid === "00002901-0000-1000-8000-00805f9b34fb"){
                                characteristicUserDescription = decoder.decode(await desc.descriptor.readValue())
                                break
                            }
                        }
                        let valueStr = "";
                        if (service.uuid === "0000180a-0000-1000-8000-00805f9b34fb") {
                            valueStr = decoder.decode(await char.characteristic.readValue())    
                        } else {
                            let data = [];
                            const value = await char.characteristic.readValue()
                            for (let i = 0; i < value.byteLength; i++) {
                                data.push('0x' + ('00' + value.getUint8(i).toString(16)).slice(-2));
                            }
                            valueStr = data.join(", ")
                        }
                        
                        console.log("  " + char.uuid + ":" + characteristicUserDescription + ":" + valueStr)
                    }
                }
            }
            */
            optionsCache.current.onConsoleOut('  Try to Notification Enable');
            for(const service of list) {
                for(const characteristic of service.characteristics) {
                    if(characteristic.characteristic.properties.notify) {
                        optionsCache.current.onConsoleOut('    Request starting Notification..');
                        optionsCache.current.onConsoleOut('      UUDI:' + characteristic.characteristic.uuid);
                        characteristic.characteristic.addEventListener('characteristicvaluechanged', (event)=>ble_onDataChanged(event));
                        try{
                            await characteristic.characteristic.startNotifications();
                        } catch (error) {
                            optionsCache.current.onConsoleOut("    at characteristic.characteristic.startNotifications()");
                            optionsCache.current.onConsoleOut("      " + error.toString());
                        }
                        //const tmp = navigator.BluetoothUUID.getDescriptor('gatt.client_characteristic_configuration');
                        const tmp = "00002902-0000-1000-8000-00805f9b34fb";
                        const descriptor = await characteristic.characteristic.getDescriptor(tmp);
                        const value = await descriptor.readValue();
                        if((value.getUint8(0) & 0b01) !== 0){
                            optionsCache.current.onConsoleOut('    Notification started');
                        } else {
                            optionsCache.current.onConsoleOut('    Notification start failed');
                        }
                    }
                }
            }
            optionsCache.current.onConsoleOut('  Device Connected')
            if(optionsCache.current.onConnected){
                optionsCache.current.onConnected()
            }
        } catch (error) {
            optionsCache.current.onConsoleOut("CCC    " + error.toString());
            optionsCache.current.onError(error.toString())
            await disconnectDevice();
        }
    }

    const disconnectDevice = async () =>{
        optionsCache.current.onConsoleOut("Disonnect is clicked.")
        if (device != null && device.gatt.connected) {
            optionsCache.current.onConsoleOut("  device is connectted, disconnect")
            device.gatt.disconnect();
            optionsCache.current.onConsoleOut('  Device Disconnected')
            if(optionsCache.current.onDisconnected){
                optionsCache.current.onDisconnected()
            }
        } else {
            optionsCache.current.onConsoleOut("  device is not connectted")
        }
        setDevice((old)=>{return null});
        setServices((old)=>{return []});
        setIsConnected((old)=>{return false});
    }

    return {
        isConnected,
        connectDevice,
        disconnectDevice,
        services
    };
}

export default useWebBluetooth
