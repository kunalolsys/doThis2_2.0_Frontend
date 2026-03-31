import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  departments: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  },
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

// Async thunks
export const fetchDepartments = createAsyncThunk(
  "departments/fetchDepartments",
  async (params = {}, { rejectWithValue }) => {
    try {
      const {
        departmentPage = "",
        departmentLimit = "",
        departmentSearchTerm = "",
      } = params;

      const payload = {
        page: departmentPage || undefined,
        limit: departmentLimit || undefined,
        search: departmentSearchTerm || undefined,
      };
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/setup/departments/list`,
        payload,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const addDepartment = createAsyncThunk(
  "departments/addDepartment",
  async (department) => {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/setup/departments`,
      department,
    );
    return response.data.department;
  },
);

export const updateDepartment = createAsyncThunk(
  "departments/updateDepartment",
  async (department) => {
    const response = await axios.put(
      `${import.meta.env.VITE_API_BASE_URL}/setup/departments/${department._id}`,
      { name: department.name },
    );
    return response.data.data;
  },
);

export const deleteDepartment = createAsyncThunk(
  "departments/deleteDepartment",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/setup/departments/${id}`,
      );
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);
export const exportDepts = createAsyncThunk(
  "departments/exportDepartments",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { departmentSearchTerm = "" } = params;

      const payload = {
        search: departmentSearchTerm || undefined,
      };
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/setup/departments/export`,
        payload,
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);
const departmentSlice = createSlice({
  name: "departments",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepartments.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.departments = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(addDepartment.fulfilled, (state, action) => {
        state.departments.push(action.payload);
      })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        const index = state.departments.findIndex(
          (dept) => dept._id === action.payload._id,
        );
        if (index !== -1) {
          state.departments[index] = action.payload;
        }
      })
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.departments = state.departments.filter(
          (dept) => dept._id !== action.payload,
        );
      });
  },
});

export default departmentSlice.reducer;
