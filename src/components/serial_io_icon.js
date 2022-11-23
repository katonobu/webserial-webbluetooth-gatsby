import React from 'react'
import SvgIcon from '@mui/material/SvgIcon';

// SVG PATh d
// https://developer.mozilla.org/ja/docs/Web/SVG/Attribute/d
function make_d_circle(x,y,r,w, isNorth) {
    return ("M "+
      (x-r-w).toString(10)+","+y.toString(10) +
      " A "+ (r+w).toString(10)+","+(r+w).toString(10) + " 0 0," + (isNorth?"0 ":"1 ") + (x+r+w).toString(10)+","+y.toString(10)+
      " h "+(-w*2).toString(10)+
      " A "+ (r-w).toString(10)+","+(r-w).toString(10) + " 0 0," + (isNorth?"1 ":"0 ") + (x-r+w).toString(10)+","+y.toString(10)+
      " z")
}

function make_d_vline(x,y_s,y_b,w) {
    return ("M "+
      (x-w).toString(10)+","+y_s.toString(10) +
      " h "+ (w*2).toString(10)+" v "+(y_b-y_s).toString(10) +
      " h "+ (-w*2).toString(10)+" z"
    )
}

function SerialIcon(props) {
    // https://material.io/design/iconography/system-icons.html#design-principles
    // https://www.iso.org/obp/ui#iec:grs:60417:5850
    // strokeは明示的に指定した色しか付かない。
    // fillさせることで、CSSが当たるっぽいので、path dで丹精込めてfillさせる。→出典なし、経験からのの推測。
    const line_width = 0.7
    const y_center = 12
    const line_y_len = 8.4
    const line_y_start = y_center - (line_y_len / 2)
    const line_y_end   = y_center + (line_y_len / 2)
    const circle_r = 4
    return (
      <SvgIcon {...props}>
        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
          <path d={make_d_vline( 1,line_y_start,line_y_end,line_width)}/>
          <path d={make_d_vline(12,line_y_start,line_y_end,line_width)}/>
          <path d={make_d_vline(23,line_y_start,line_y_end,line_width)}/>
          <path d={make_d_circle( 6.5,y_center,circle_r,line_width,true)}/>
          <path d={make_d_circle( 6.5,y_center,circle_r,line_width,false)}/>
          <path d={make_d_circle(17.5,y_center,circle_r,line_width,true)}/>
          <path d={make_d_circle(17.5,y_center,circle_r,line_width,false)}/>
        </svg>
      </SvgIcon>
    );
}

export default SerialIcon;