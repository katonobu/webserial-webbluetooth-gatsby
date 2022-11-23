import { createSlice } from '@reduxjs/toolkit'

export const serialTrxSlice = createSlice({
  name: 'serialTrx',
  initialState: {
    value: {},
  },
  reducers: {
    trx: (state, action) => {
      state.value = action.payload;
    },
  },
})

// Action creators are generated for each case reducer function
export const { trx } = serialTrxSlice.actions

export default serialTrxSlice.reducer