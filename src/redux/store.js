import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/user/userSlice';
import departmentReducer from './slices/department/departmentSlice';
import roleReducer from './slices/role/roleSlice';
import workShiftReducer from './slices/workShift/workShiftSlice';
import holidayReducer from './slices/holiday/holidaySlice';
import taskReducer from './slices/task/taskSlice';
import myTaskReducer from './slices/myTask/myTaskSlice';
import workingWeekReducer from './slices/workingWeek/workingWeekSlice';
import scheduleHolidayTaskReducer from './slices/scheduleHolidayTask/scheduleHolidayTaskSlice';
import fmsReducer from './slices/fms/fmsSlice';
import notificationReducer from './slices/notification/notificationSlice';
import socketReducer from './slices/socket/socketSlice';

const store = configureStore({
    reducer: {
        users: userReducer,
        departments: departmentReducer,
        roles: roleReducer,
        workShifts: workShiftReducer,
        holidays: holidayReducer,
        workingWeek: workingWeekReducer,
        tasks: taskReducer,
        myTasks: myTaskReducer,
        scheduleHolidayTask: scheduleHolidayTaskReducer,
        fms:fmsReducer,
        notifications: notificationReducer,
        socket: socketReducer
    },
});

export default store;