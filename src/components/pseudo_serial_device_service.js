const evts = []
const handleInputLine = async (str, setTxStr) => {
// "< TEST RESET"
//  内部状態を初期化する。
//  5秒後にレスポンスを返す
    if (str.startsWith("< TEST RESET")) {
        setTimeout(()=>setTxStr(str.replace('<','>')), 5000)
        for(let i = 0; i < evts.length; i++){
            const evt = evts[i];
            if( evt && 'timerId' in evt && 0 < evt.timerId) {
                clearInterval(evt.timerId)
            }
            evts[i] = undefined
        }
// "< TEST RSP n"
//  n[ms]後にレスポンスを返す。
//  nが0のときは、レスポンスを返さない。
//  →"< TEST RESET"コマンドで状態を初期化するまでコマンドを受け付けなくなる。
    } else if (str.startsWith("< TEST RSP")) {
        const splits = str.split(' ');
        if (3 < splits.length) {
            const waitMs = parseInt(splits[3])
            if(0 < waitMs) {
                setTimeout(()=>setTxStr(str.replace('<','>')), waitMs)
            }
        } else {
            setTxStr("> ERR INVALID ARG")
        }
// "< TEST EVT n,m,p"
//  n種類目のイベントを起動させる。
//  m[ms]間隔でp回イベントを繰り返す。
//  mが0の時は当該イベントの動作停止
//  pが0の時は動作停止まで無限に繰り返す。
// "| TEST EVT n,i" // i回目のイベント
    } else if (str.startsWith("< TEST EVT")) {
        const splits = str.split(' ');
        if (3 < splits.length) {
            const [id, intervalMs, maxCount] = splits[3].split(',').map((val)=>parseInt(val))
            // console.log(id, intervalMs, maxCount, evts[id])
            if(id !== undefined) {
                if (evts[id] && 'timerId' in evts[id] && evts[id].timerId !== 0) {
                    clearInterval(evts[id].timerId)
                }
                evts[id] = {
                    interval:intervalMs,
                    currentCount:0,
                    maxCount:maxCount,
                    timerId:(0 < intervalMs)?
                        setInterval(()=>{
                            evts[id].currentCount += 1;
                            // console.log(evts[id])
                            if (0 === evts[id].maxCount){
                                setTxStr("| TEST EVT " + id.toString(10) + "," + evts[id].currentCount.toString(10))
                            } else {
                                if (evts[id].currentCount < evts[id].maxCount) {                                
                                    setTxStr("| TEST EVT " + id.toString(10) + "," + evts[id].currentCount.toString(10))
                                } else {
                                    // console.log("Terminate")
                                    clearInterval(evts[id].timerId)
                                }
                            }
                        }, intervalMs)
                    :
                        0
                }
                setTxStr(str.replace('<','>'))
                if (intervalMs !== 0) {
                    setTxStr("| TEST EVT " + id.toString(10) + "," + evts[id].currentCount.toString(10))
                }
            } else {
                setTxStr("> ERR INVALID ARG")
            }
        } else {
            setTxStr("> ERR INVALID ARG")
        }
    }
}

export default handleInputLine;
