import { createSlice } from '@reduxjs/toolkit'

export const evtSttSlice = createSlice({
  name: 'evtStt',
  initialState: {
    value: [
        {activated:false, count:-1, maxCount:-1},
        {activated:false, count:-1, maxCount:-1},
        {activated:false, count:-1, maxCount:-1},
        {activated:false, count:-1, maxCount:-1}
    ]
  },
  reducers: {
    updateActivate: (state, action) => {
        const tmp = state.value[action.payload.index];
        tmp.activated = action.payload.activated;
        if ('maxCount' in action.payload) {
            tmp.maxCount = action.payload.maxCount;
        }
        state.value[action.payload.index] = tmp;
    },
    updateCount: (state, action) => {
        const tmp = state.value[action.payload.index];
        tmp.count = action.payload.count;
        state.value[action.payload.index] = tmp;
    },
    resetEvt: (state) => {
        for(let i = 0; i < state.value.length; i++ ){
            state.value[i] = {activated:false, count:-1, maxCount:-1};
        }
    }
  },
})

const { updateActivate, updateCount , resetEvt} = evtSttSlice.actions;

const evtSttMiddleware = store => next => action => {
    next(action);
    if ( action.type === "cmdBusy/free") {
        const splittedPayload = action.payload.split(/ +/);
        if (splittedPayload[0] === ">" &&
            splittedPayload[1] === "TEST" &&
            splittedPayload[2] === "EVT"){
            const options = splittedPayload[3].replace(/ +/g, "").split(",")
            const index = parseInt(options[0], 10);
            const interval = parseInt(options[1], 10);
            const maxCount = parseInt(options[2], 10);
            if (0 < interval) {
                next(updateActivate({index, activated:true, maxCount}));
            } else {
                next(updateActivate({index, activated:false}));
            }
        } 
    } else if ( action.type === "serialTrx/trx" && action.payload.act === "rx") {
        const splittedPayload = action.payload.data.split(/ +/);
        if (splittedPayload[0] === "|" &&
            splittedPayload[1] === "TEST" &&
            splittedPayload[2] === "EVT"){
            const options = splittedPayload[3].replace(/ +/g, "").split(",")
            const index = parseInt(options[0], 10);
            const count = parseInt(options[1], 10);
            const maxCount = parseInt(options[2], 10);
            const stt = store.getState();
            if (0 <maxCount && (maxCount-1) <= count){
//                console.log("Finished", index)
                next(updateCount({index, count}));
                next(updateActivate({index, activated:false}));
            } else {
                next(updateCount({index, count}));
                if (stt.evtStt.value[index].activated === false) {
//                    console.log("Set activate to true", index)
                    next(updateActivate({index, activated:true}));
                }
//                console.log(index, maxCount, count);
            }
        } 
    }

};

export {evtSttMiddleware, updateActivate, updateCount, resetEvt}

export default evtSttSlice.reducer;