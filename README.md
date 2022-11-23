# webserial-webbluetooth-gatsby
Gatsbyを使った静的サイト生成。
下記機能を実現。
- Xterm.jsによるコンソール。
- WebSerialによるシリアル通信。
- WebBluetoothによるBLE-GATTアクセス。

# 動作環境
- [ARUDINO MKR WIFIF 1010](https://store.arduino.cc/products/arduino-mkr-wifi-1010?_gl=1%2A1i2b483%2A_ga%2AMTQ5NDAxMDE1Ny4xNjQwMzQ4NTU3%2A_ga_NEXN8H46L5%2AMTY0MTUyODEzNy4xNi4xLjE2NDE1MjgxNTguMA..)
  - [スケッチ](https://github.com/katonobu/webserial-webbluetooth-gatsby/blob/main/tools/arduino/ble_serial_bridge_mkr/ble_serial_bridge_mkr.ino)を焼きこんでください。
- [制御デモページ](https://katonobu.github.io/webserial-webbluetooth-gatsby/)

# システム構成
[制御デモページ](https://katonobu.github.io/webserial-webbluetooth-gatsby/)がコントローラ兼、制御対象として動作します。
## コントローラ
各種ボタンに対応した制御文字列をBLE経由でARUDINOとやり取りをします。
制御文字列送信後、応答が帰ってくるまで制御ボタンがDISABLEされます。

## 制御対象
転送された文字列に応じて応答文字列を送信します。
制御内容に応じて、自発的に通知文字列を送信します。

# 制御/応答/通知 文字列仕様
- 制御文字列
  - "<" で始まる文字列です。
- 応答文字列
  - ">" で始まる文字列です。
- 通知文字列
  - "|" で始まる文字列です。

- "TEST RSP $WAITMS$"
  - 応答遅延指定可能な応答
    - $WAITMS$の文字列を10進整数と解釈し、その値[ms]経過後に応答文字列を返します。
    - 応答文字列は、制御文字列の1文字目を">"にした文字列です。
- "TEST EVT $ID$,$INTERVAL$,$COUNT$"
  - 送信間隔、回数指定指定可能な、繰り返し通知文字列送信
    - $ID$,$INTERVAL$,$COUNT$の文字列を10進整数と解釈します。
    - $ID$毎に下記制御を行います。
      - 0 < $INTERVAL$ のとき、
        - 0 < $COUNT$のとき、$INTERVAL$ [ms]毎に$COUNT$回、通知文字列を送信します。
        - 0 == $COUNT$のとき、$INTERVAL$ [ms]毎に$INTERVAL$=0が指定されるまで通知文字列を送信します。
      - 0 == $INTERVAL$ のとき、
        - 0 == $COUNT$が指定されていたら通知文字列送信を停止させます。
    - 処理が終わり次第応答文字列を送信します。
      - 応答文字列は、制御文字列の1文字目を">"にした文字列です。
    - 通知文字列は"| TEST EVT $ID$,$COUNT$"です。
      - $ID$は制御文字列で指定された$IDです。
      - $COUNT$は、当該$ID$のカウント回数です。

