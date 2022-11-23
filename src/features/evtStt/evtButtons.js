import React from 'react'
import Button from '@mui/material/Button';
import { useSelector, useDispatch } from 'react-redux'
import { trx } from '../cmdRsp/serialTrxSlice'


const SerialEventButtons = ({cmdBusyDisabled, sendMsg})=>{
    const evtStt = useSelector((state) => state.evtStt.value);
    const dispatch = useDispatch();
    const evtActionStt = [
        [
            {
                str:evtStt[2].activated?("EVT 2sec Acrivated : "+evtStt[2].count.toString(10)):"EVT 2sec infinit",
                cmd:"< TEST EVT 2,2000,0",
                timeout:100,
                color:evtStt[2].activated?'secondary':'primary'
            },
            {
                str:evtStt[2].activated?"STOP EVT 2sec infinit":"EVT 2sec Not Acrivated",
                cmd:"< TEST EVT 2,0,0",
                timeout:100,
                color:evtStt[2].activated?'secondary':'primary'
            },
        ],[
            {
                str:"EVT 1sec 10times" + (evtStt[0].activated?(" : "+evtStt[0].count.toString(10)):""),
                cmd:"< TEST EVT 0,1000,10",
                timeout:100,
                color:evtStt[0].activated?'secondary':'primary'
            },
            {
                str:"EVT 0.5sec 20times" + (evtStt[1].activated?(" : "+evtStt[1].count.toString(10)):""),
                cmd:"< TEST EVT 1,500,20",
                timeout:100,
                color:evtStt[1].activated?'secondary':'primary'
            },
            {
                str:"EVT 0.1sec 100times"  + (evtStt[3].activated?(" : "+evtStt[3].count.toString(10)):""),
                cmd:"< TEST EVT 3,100,100",
                timeout:100,
                color:evtStt[3].activated?'secondary':'primary'
            },
        ]
    ];
    
    return (
        evtActionStt.map((el, pindex)=><p>{
            el.map(({str,cmd,timeout,color}, index)=>
            <Button 
            key={"EVT_" + ('00'+pindex.toString(10)).slice(-2) + ('00'+index.toString(10)).slice(-2)}
            variant="outlined"
            size="small"         
            disabled={cmdBusyDisabled}
            onClick={()=>{
                dispatch(trx({act:"tx", data:cmd, time:Date.now(), timeout}));
                sendMsg(cmd);
            }}
            color = {color}
            style = {{width:'180px'}}
            >{str}</Button>
        )
        }</p>)

    );
}
export default SerialEventButtons;

