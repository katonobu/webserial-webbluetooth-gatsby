import { createSlice } from '@reduxjs/toolkit'

export const serialConnectionSlice = createSlice({
  name: 'serialConnection',
  initialState: {
    value: false,
  },
  reducers: {
    connected: (state) => {
      state.value = true;
    },
    disconnected: (state) => {
      state.value = false;
    },
  },
})

// Action creators are generated for each case reducer function
export const { connected, disconnected } = serialConnectionSlice.actions

export default serialConnectionSlice.reducer