import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// const API_BASE_URL = 'http://localhost:4000/api/setup';

// Async thunks
export const fetchWorkingWeek = createAsyncThunk(
  'workingWeek/fetchWorkingWeek',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/setup/working-week`);
      return response.data.data.workingWeek;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch working week');
    }
  }
);

export const updateWorkingWeek = createAsyncThunk(
  'workingWeek/updateWorkingWeek',
  async (workingWeekData, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/setup/working-week`, workingWeekData);
      return response.data.data.workingWeek;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update working week');
    }
  }
);

// Slice
const workingWeekSlice = createSlice({
  name: 'workingWeek',
  initialState: {
    workingWeek: {
      workingDays: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false
      }
    },
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    updateWorkingDay: (state, action) => {
      const { day, value } = action.payload;
      state.workingWeek.workingDays[day] = value;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkingWeek.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchWorkingWeek.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.workingWeek = action.payload;
        state.error = null;
      })
      .addCase(fetchWorkingWeek.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(updateWorkingWeek.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateWorkingWeek.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.workingWeek = action.payload;
        state.error = null;
      })
      .addCase(updateWorkingWeek.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { updateWorkingDay } = workingWeekSlice.actions;
export default workingWeekSlice.reducer;
