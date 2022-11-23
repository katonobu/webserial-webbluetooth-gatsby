/*
  Enabling BLE on MKR WiFi 1010

  This sketch controls an LED on a MKR WiFi 1010 board
  and makes a random reading of an analog pin.
   
  The data recorded can be accessed through Bluetooth,
  using an app such as LightBlue.
  
  Based on the Arduino BLE library, Battery Monitor example.

  (c) 2020 K. Söderby for Arduino

  Based upon license, Modified by Katonobu (c) 2022.

*/

#include <ArduinoBLE.h>

#define USB_IS_DATA_IF

#ifdef USB_IS_DATA_IF
#define DATA_SERIAL SerialUSB
#define LOG_SERIAL  Serial1
#else
#define DATA_SERIAL Serial1
#define LOG_SERIAL  SerialUSB
#endif

#define FW_VER_STR "1.0.1"
// GATT Service 0x180A Device Information
BLEService deviceInformationService("180A"); // creating the service
BLECharacteristic modelNumberChar("2A24", BLERead, "Sample Model SM-001A(JP)");
BLEDescriptor modelNumberCharDes("2901", "Model Number");
BLECharacteristic serialNumberChar("2A25", BLERead, "01234567");
BLEDescriptor serialNumberCharDes("2901","Serial Number");
BLECharacteristic firmwareRevisionChar("2A26", BLERead, FW_VER_STR);
BLEDescriptor firmwareRevisionCharDes("2901","Firmware Revision");
BLECharacteristic hardwareRevisionChar("2A27", BLERead, "1.0.0");
BLEDescriptor hardwareRevisionCharDes("2901","Hardware Revision");
BLECharacteristic softwareRevisionChar("2A28", BLERead, "1.0.0");
BLEDescriptor softwareRevisionCharDes("2901","Software Revision");
BLECharacteristic manufacturerName("2A29", BLERead, "Katonobu");
BLEDescriptor manufacturerNameDes("2901","Manufacturer Name");

// AE88xxxx-3336-4B92-8269-F978B9D4B5DB
BLEService         remoteControlService(  "AE880180-3336-4B92-8269-F978B9D4B5DB");
BLECharacteristic  remoteTargetSetStrChar("AE882C80-3336-4B92-8269-F978B9D4B5DB", BLEWrite | BLENotify, 17, true);
BLECharacteristic  remoteTargetGetStrChar("AE882C81-3336-4B92-8269-F978B9D4B5DB", BLERead  | BLENotify, 17, true);

const int ledPin = 2;
long previousMillis = 0;
static char rxBuff[256];
static char *startPtr;
static int rxLen;

void onRxLine(String rxLine){
  const int rxLineLen = rxLine.length();
  const int max_tx_size = 16;
  const int full_tx_count = rxLineLen / max_tx_size;

  for(int i = 0; i < full_tx_count; i++) {
    unsigned char buff[18] = {0};
    buff[0] = max_tx_size;
    rxLine.substring(i * max_tx_size, (i + 1) * max_tx_size).getBytes(&buff[1], 17);
    remoteTargetGetStrChar.writeValue(buff, 17);
  }
  int remain = rxLineLen - max_tx_size * full_tx_count;
  if (0 < remain) {
    uint8_t buff[18] = {0};
    buff[0] = remain;
    rxLine.substring(max_tx_size * full_tx_count).getBytes(&buff[1], 17);
    remoteTargetGetStrChar.writeValue(buff, 17);
  }
}

void setup() {
  LOG_SERIAL.begin(115200);    // initialize serial communication
  if (LOG_SERIAL == SERIAL_PORT_HARDWARE_OPEN) {
    while (!LOG_SERIAL);       //starts the program if we open the serial monitor.
  }

  DATA_SERIAL.begin(115200);
  if (LOG_SERIAL) {
    LOG_SERIAL.println("DATA Serial started");
  }

  rxLen = 0;
  startPtr = rxBuff;

  pinMode(LED_BUILTIN, OUTPUT); // initialize the built-in LED pin to indicate when a central is connected

  //initialize BLE library
  if (!BLE.begin()) {
    if (LOG_SERIAL) {
      LOG_SERIAL.println("starting BLE failed!");
    }
    while (1) {
      digitalWrite(LED_BUILTIN, HIGH);   // turn the LED on (HIGH is the voltage level)
      delay(50);                       // wait for a second
      digitalWrite(LED_BUILTIN, LOW);    // turn the LED off by making the voltage LOW
      delay(50);                       // wait for a second      
    }
  }

  BLE.setLocalName("ABCD"); //Setting a name that will appear when scanning for bluetooth devices
  BLE.setDeviceName("ABCD-Controller");

  // https://specificationrefs.bluetooth.com/assigned-values/Appearance%20Values.pdf  
  BLE.setAppearance(0x0180); // 0x0180 = Generic Remote Contro,
  
  
  BLE.setAdvertisedService(deviceInformationService);

  modelNumberChar.addDescriptor(modelNumberCharDes);
  //serialNumberChar.addDescriptor(serialNumberCharDes);
  firmwareRevisionChar.addDescriptor(firmwareRevisionCharDes);
  hardwareRevisionChar.addDescriptor(hardwareRevisionCharDes);
  softwareRevisionChar.addDescriptor(softwareRevisionCharDes);
  manufacturerName.addDescriptor(manufacturerNameDes);

  deviceInformationService.addCharacteristic(modelNumberChar);
  //deviceInformationService.addCharacteristic(serialNumberChar);
  deviceInformationService.addCharacteristic(firmwareRevisionChar);
  deviceInformationService.addCharacteristic(hardwareRevisionChar);
  deviceInformationService.addCharacteristic(softwareRevisionChar);
  deviceInformationService.addCharacteristic(manufacturerName);

  BLE.addService(deviceInformationService);  // adding the service
  

  remoteControlService.addCharacteristic(remoteTargetSetStrChar);
  remoteControlService.addCharacteristic(remoteTargetGetStrChar);
  BLE.addService(remoteControlService);

  const uint8_t init_buff[17] = {0};
  remoteTargetSetStrChar.writeValue(init_buff, 17);
  remoteTargetGetStrChar.writeValue(init_buff, 17);
  
  BLE.advertise(); //start advertising the service
  if (LOG_SERIAL){
    LOG_SERIAL.println("[BLE]Bluetooth device active, waiting for connections...");
  }
}

void loop() {
  BLEDevice central = BLE.central(); // wait for a BLE central

  if (central) {  // if a central is connected to the peripheral
    if (LOG_SERIAL) {
      LOG_SERIAL.print("[BLE]Connected to central: ");
      LOG_SERIAL.println(central.address()); // print the central's BT address
      if (DATA_SERIAL){
        LOG_SERIAL.println("DATA Serial is available");
      } else {
        LOG_SERIAL.println("DATA Serial is not available");
      }
      LOG_SERIAL.print("Build at ");
      LOG_SERIAL.println(__DATE__ " " __TIME__ ", FW Ver:" FW_VER_STR);
      
    }
    
    digitalWrite(LED_BUILTIN, HIGH); // turn on the LED to indicate the connection

    long updateTime = 0;
    while (central.connected()) {
      long currentMillis = millis();
      
      if (remoteTargetSetStrChar.written()){
        const uint8_t *value_start_ptr = remoteTargetSetStrChar.value();
        uint8_t len = remoteTargetSetStrChar[0];
        if (DATA_SERIAL){
          for(int i = 0; i < len; i++) {
            DATA_SERIAL.write(remoteTargetSetStrChar[i+1]);
          }
        }
        if (LOG_SERIAL && 0 < len){
          LOG_SERIAL.print("B=>U:\"");
          for(int i = 0; i < len; i++) {
            if (remoteTargetSetStrChar[i+1] == '\r'){
              LOG_SERIAL.write("\\r");
            } else if (remoteTargetSetStrChar[i+1] == '\n'){
              LOG_SERIAL.write("\\n");
            } else {
              LOG_SERIAL.write(remoteTargetSetStrChar[i+1]);
            }
          }
          LOG_SERIAL.println("\"");
        }
      }

      if (DATA_SERIAL){
        while (DATA_SERIAL.available() > 0) { // 受信したデータが存在する
          int rxChar = DATA_SERIAL.read(); // 受信データを読み込む
          if (rxChar != '\r'){
            if (rxChar == '\n'){
              rxBuff[rxLen] = '\0';
              String rxString = String(rxBuff);
              if (LOG_SERIAL){
                LOG_SERIAL.print("U=>B:\"");
                LOG_SERIAL.print(rxString);
                LOG_SERIAL.println("\"");
              }
              onRxLine(rxString + "\r\n");
              rxLen = 0;
            } else {
              rxBuff[rxLen] = rxChar;
              rxLen += 1;        
            }
          }
          if(255 < rxLen) {
            if (LOG_SERIAL){
              LOG_SERIAL.println("RxBuffer Overflow");
            }
          }
        }
      }
    }
    
    digitalWrite(LED_BUILTIN, LOW); // when the central disconnects, turn off the LED
    if (LOG_SERIAL) {
      LOG_SERIAL.print("[BLE]Disconnected from central: ");
      LOG_SERIAL.println(central.address());
    }
  }
}
