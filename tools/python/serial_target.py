import logging
import queue
import time

import serial
import serial.threaded
from serial.tools.list_ports import comports

LOG = logging.getLogger(__name__)
LOG.setLevel(logging.INFO)

class TestServiceProtocolException(Exception):
    pass

class TestServiceProtocol(serial.threaded.LineReader):
    TERMINATOR = b'\r\n'

    def __init__(self):
        super(TestServiceProtocol, self).__init__()
        self.cmd_queue = queue.Queue()
    
    def get_cmd_queue(self):
        return self.cmd_queue

    def handle_line(self, line):
        self.cmd_queue.put(line.rstrip())

    def connection_lost(self, exc):
        if exc:
            LOG.info("Catch :{}".format(exc))
        LOG.info('port closed\n')

class HandleEventServices():
    def __init__(self, send_func):
        self.services = []
        self.send_func = send_func

    def updateService(self, service):
        for _service in self.services:
            if _service.id == service.id:
                _service.interval = service.interval
                _service.repeat_num = service.repeat_num
                _service.exec_count = service.exec_count
                if 0 < service.interval:
                    _service.next_fire_time = service.next_fire_time
                else:
                    _service.next_fire_time = None
                return
        self.services.append(service)

    def fireEvents(self):
        now = time.time()
        for _service in self.services:
            if _service.next_fire_time and _service.next_fire_time < now:
                self.send_func("| TEST EVT {:d} {:d}".format(_service.id, _service.exec_count))
                _service.exec_count += 1
                if _service.repeat_num == 0 or _service.exec_count <= _service.repeat_num:
                    _service.next_fire_time += _service.interval/1000
                else:
                    _service.next_fire_time = None

class EventService():
    def __init__(self, id, interval, repeat_num):
        self.id = id
        self.interval = interval
        self.repeat_num = repeat_num
        self.exec_count = 0
        if 0 < interval:
            self.next_fire_time = time.time()
        else:
            self.next_fire_time = None



def test_service(test_protocol):
    def write_rsp(rsp_str):
        LOG.info("TxRSP:{}".format(rsp_str.rstrip()))
        test_protocol.write_line(rsp_str)

    cmd_queue = test_protocol.get_cmd_queue()
    cmd_busy = False
    rsp_time = None
    rsp_cmd_str = ""
    evts = HandleEventServices(write_rsp)
#    write_rsp("| TEST START")
    while True:
        if cmd_queue.empty() == False:
            rx_str = cmd_queue.get().upper()
            LOG.info("RxCMD:{}".format(rx_str.rstrip()))
# "< TEST RESET"
#  内部状態を初期化する。
#  5秒後にレスポンスを返す
            if rx_str.startswith("< TEST RESET"):
                cmd_busy = False
                evts = HandleEventServices(write_rsp)
                time.sleep(5)
                write_rsp("> TEST RESET")
            else:
                if cmd_busy:
                    LOG.error("Error:Rx cmd when cmd_busy!")
                    write_rsp("> ERROR CMD IN BUSY")
                else:
                    cmd_busy = True
# "< TEST EXIT"
#  サーバー動作を終了させる。
                    if rx_str.startswith("< TEST EXIT"):
                        write_rsp("> TEST EXIT")
                        cmd_busy = False
                        time.sleep(0.1)
                        break
# "< TEST RSP n"
#  n[ms]後にレスポンスを返す。
#  nが0のときは、レスポンスを返さない。
#  →"< TEST RESET"コマンドで状態を初期化するまでコマンドを受け付けなくなる。
                    elif rx_str.startswith("< TEST RSP"):
                        rsp_cmd_str = rx_str
                        rsp_msec = int(rx_str.split(' ')[-1])
                        if 0 < rsp_msec:
                            rsp_time = time.time() + rsp_msec/1000
                        pass
# "< TEST EVT n,m,p"
#  n種類目のイベントを起動させる。
#  m[ms]間隔でp回イベントを繰り返す。
#  mが0の時は当該イベントの動作停止
#  pが0の時は動作停止まで無限に繰り返す。
# "| TEST EVT n,i" // i回目のイベント
                    elif rx_str.startswith("< TEST EVT"):
                        args = [int(x) for x in rx_str.replace(","," ").split()[3:]]
                        LOG.info(args)
                        (evt_id, repeat_interval, repeat_num) = args
                        evts.updateService(EventService(evt_id, repeat_interval, repeat_num))
                        write_rsp(rx_str.replace("<",">"))
                        cmd_busy = False
                        pass
                    else:
#                        write_rsp("> TEST UNKNOW CMD")
                        cmd_busy = False

        time.sleep(0.001)
        if rsp_time and rsp_time < time.time():
            write_rsp(rsp_cmd_str.replace("<",">"))
            cmd_busy = False
            rsp_time = None
        evts.fireEvents()


def display_all_ports():
    for n, comport in enumerate(sorted(comports()), 1):
        LOG.info("-------------------------------------")
        LOG.info("  n:{}".format(n))
        LOG.info("  device:{}".format(comport.device))
        LOG.info("  name:{}".format(comport.name))
        LOG.info("  description:{}".format(comport.description))
        LOG.info("  hwid:{}".format(comport.hwid))
        LOG.info("  vid:{}".format(comport.vid))
        LOG.info("  pid:{}".format(comport.pid))
        LOG.info("  serial_number:{}".format(comport.serial_number))
        LOG.info("  location:{}".format(comport.location))
        LOG.info("  manufacturer:{}".format(comport.manufacturer))
        LOG.info("  product:{}".format(comport.product))
        LOG.info("  interface:{}".format(comport.interface))


def find_port(name = None, pid = None, vid = None, serial_number = None):
    found_comport = None
    for comport in comports():
        name_matched = False
        pid_matched = False
        vid_matched = False
        serial_number_matched = False
        if name and comport.name == name:
            name_matched = True
        if pid and comport.pid == pid:
            pid_matched = True
        if vid and comport.vid == vid:
            vid_matched = True
        if serial_number and comport.serial_number == serial_number:
            serial_number_matched = True
        if name_matched or pid_matched or vid_matched or serial_number_matched:
            found_comport = comport
            break
    return found_comport

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
def main():
    display_all_ports()
    LOG.info("==================")
    port = None
    port = find_port(vid=0x2341, pid=0x8054) # Arduino
    if port:
        LOG.info("{} {} found".format(port.name, port.description))
        try:
            ser = serial.Serial(port.name, baudrate=115200, timeout=1, rtscts = False)
            with serial.threaded.ReaderThread(ser, TestServiceProtocol) as test_if:
                test_service(test_if)
        except serial.serialutil.SerialException:
            LOG.critical('Port {} may already open'.format(port.name))
    else:
        LOG.info("Port is not found")
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    LOG = logging.getLogger(__name__)
    main()