import { createSlice } from '@reduxjs/toolkit'
import {resetEvt} from '../evtStt/evtSttSlice'

export const cmdBusySlice = createSlice({
  name: 'cmdBusy',
  initialState: {
    value: {stt:false, err:undefined, cmd:undefined, rsp:undefined, time:undefined, resetting:false},
  },
  reducers: {
    busy: (state, action) => {
      state.value = {stt:true, cmd:action.payload, rsp:undefined, err:undefined, time:Date.now(), resetting:false};
    },
    free: (state, action) => {
      state.value = {stt:false, rsp:action.payload, cmd:state.value.cmd, err:undefined, time:Date.now(), resetting:false};
    },
    error: (state, action) => {
      state.value = {stt:false, err:action.payload, cmd:state.value.cmd, rsp:state.value.rsp, time:Date.now(), resetting:false};
    },
    resetCmdBusy: (state, action) => {
      state.value = {stt:true, cmd:action.payload, rsp:undefined, err:undefined, time:Date.now(), resetting:true};
    },
    releaseResetCmdBusy: (state) => {
      state.value = {stt:false, err:undefined, cmd:undefined, rsp:undefined, time:undefined, resetting:false};
    }
  },
})

const { busy, free, error, resetCmdBusy, releaseResetCmdBusy} = cmdBusySlice.actions

let expRsp = [];
let timerId = 0;
const cmdBusyMiddleware = store => next => action => {
  next(action);
  if ( action.type === "serialTrx/trx") {
    const stt = store.getState();
    if (action.payload.act === "tx") {
      if ('timeout' in action.payload && action.payload.timeout) {
        if (stt.cmdBusy.value.resetting === false) {
          expRsp = action.payload.data.replace("<",">").split(/ +/).slice(0, 3);
          if (timerId) {
            clearTimeout(timerId);
          }
          timerId = setTimeout(
            (next, payload)=>{
  //            console.log("RSP_TO:", expRsp);
              expRsp = [];
              next(error("RSP Timeout "+ payload.timeout.toString(10)))
            },
            action.payload.timeout,
            next,
            action.payload
          );
          if (expRsp[0] === ">" && expRsp[1] === "TEST" && expRsp[2] === "RESET"){
            next(resetCmdBusy(action.payload.data));
          } else {
            next(busy(action.payload.data));
          }
        }
//        console.log("TX_CMD:",action.payload.timeout, expRsp);
//        console.log("TimerId:",timerId);
      }
    } else if (action.payload.act === "rx") {
      if (stt.cmdBusy.value.resetting === true) {
        const splittedRx = action.payload.data.split(/ +/);
        if (splittedRx[0] === ">" && 
            splittedRx[1] === expRsp[1] &&
            splittedRx[2] === expRsp[2]
        ) {
//          console.log("Rx: RST RSP");
          if (timerId) {
            clearTimeout(timerId);
            timerId = 0;
          }
          next(releaseResetCmdBusy());
          next(resetEvt());
        } else {
//          console.log("Rx: while Waiting RST RSP" + action.payload.data);
        }
      } else {
        const splittedRx = action.payload.data.split(/ +/);
        if (0 < expRsp.length && splittedRx[0] === ">"){
          if (splittedRx[1] === expRsp[1] &&
              splittedRx[2] === expRsp[2]
          ) {
            if (timerId) {
              clearTimeout(timerId);
              timerId = 0;
            }
  //          console.log("RX_RSP:",splittedRx);
            expRsp = [];
            next(free(action.payload.data));
          } else{
  //          console.log("Different RSP:", action.payload.data);
            expRsp = [];
            next(error("Diffeerent RSP"+ action.payload.data));
          }
        } else if (splittedRx[0] === ">"){
  //        console.log("Unexpected RSP:", action.payload.data);
          next(error("Unexpected RSP:"+ action.payload.data));
        } else {
  //        console.log("RX_EVT:",action.payload.data);
        }
      }
    }
  }
};

export {cmdBusyMiddleware, busy, free, resetCmdBusy}

export default cmdBusySlice.reducer