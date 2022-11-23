import { configureStore } from '@reduxjs/toolkit'
import serialConnectionReducer from '../features/serial/serialConnectionSlice'
import cmdBusyReducer, {cmdBusyMiddleware} from '../features/cmdRsp/cmdBusySlice'
import serialTrxSliceReducer from '../features/cmdRsp/serialTrxSlice'
import evtSttSliceReducer, {evtSttMiddleware} from '../features/evtStt/evtSttSlice'

const createStore = () => configureStore({
  reducer: {
    serialConnection: serialConnectionReducer,
    cmdBusy: cmdBusyReducer,
    serialTrx: serialTrxSliceReducer,
    evtStt: evtSttSliceReducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat([cmdBusyMiddleware, evtSttMiddleware]),  
})  
export default createStore
