import { createSlice } from '@reduxjs/toolkit';

// Placeholder slice for socket events
// Main logic: Listen → dispatch myTask/taskSlice actions (optimistic updates)

const socketSlice = createSlice({
  name: 'socket',
  initialState: {
    isConnected: false,
    socketId: null,
    lastEvent: null,
    status: 'disconnected',
  },
  reducers: {
    socketConnected: (state, action) => {
      state.isConnected = true;
      state.socketId = action.payload;
      state.status = 'connected';
    },
    socketDisconnected: (state) => {
      state.isConnected = false;
      state.socketId = null;
      state.status = 'disconnected';
    },
    socketEventReceived: (state, action) => {
      state.lastEvent = action.payload;
    },
  },
});

export const { socketConnected, socketDisconnected, socketEventReceived } = socketSlice.actions;
export default socketSlice.reducer;

// THUNKS: Socket → Redux actions (optimistic)
export const handleNewTaskAssigned = (task) => (dispatch) => {
  // Optimistic add to myTasks
  dispatch({ type: 'myTasks/addMyTask/fulfilled', payload: task });
};

export const handleNewQuery = (query) => (dispatch) => {
  // Update task with new query or toast
  console.log('New query:', query);
  // dispatch(showToast({ type: 'query', data: query }));
};

export const handleNotification = (notif) => (dispatch) => {
  // Update unread count or toast
  console.log('Notification:', notif);
};

