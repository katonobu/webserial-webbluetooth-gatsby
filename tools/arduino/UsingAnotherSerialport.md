# ARUDINO MKR WIFIF 1010 BLE-SERIAL 仕様
## HWリソース
- USB-Serial:BLEとシリアルをブリッジするシリアル側 I/F
- BLE:BLEとシリアルをブリッジするBLE側 I/F
- 

# ARUDINO MKR WIFIF 1010 のシリアルをUSB以外のピンから出す。
[ARUDINO MKR WIFIF 1010](https://store.arduino.cc/products/arduino-mkr-wifi-1010?_gl=1%2A1i2b483%2A_ga%2AMTQ5NDAxMDE1Ny4xNjQwMzQ4NTU3%2A_ga_NEXN8H46L5%2AMTY0MTUyODEzNy4xNi4xLjE2NDE1MjgxNTguMA..)

[mkrwifi1010/variant.h](https://github.com/arduino/ArduinoCore-samd/blob/master/variants/mkrwifi1010/variant.h#L201)によれば、
```
#define SERIAL_PORT_HARDWARE_OPEN   Serial1
```
とあり、
コメントによれば、
```
// These serial port names are intended to allow libraries and architecture-neutral
// sketches to automatically default to the correct port name for a particular type
// of use.  For example, a GPS module would normally connect to SERIAL_PORT_HARDWARE_OPEN,
// the first hardware serial port whose RX/TX pins are not dedicated to another use.
:
// SERIAL_PORT_HARDWARE_OPEN  Hardware serial ports which are open for use.  Their RX & TX
//                            pins are NOT connected to anything by default.
```
とあるので、
```
#define DATA_SERIAL SERIAL_PORT_HARDWARE_OPEN
```
としておくのがよさそう。
これで
D14:Tx
D13:Rx
になってくれるはず。

