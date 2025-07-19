import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "../../services/authService";

// Helper function to get initial auth state
const getInitialAuthState = () => {
  const token = localStorage.getItem("token");
  return {
    user: null,
    token: token || null,
    isAuthenticated: !!token,
    isLoading: false,
    error: null,
  };
};

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, thunkAPI) => {
    try {
      const response = await authService.login(credentials);
      
      // Store token in localStorage (for now)
      if (response.token) {
        localStorage.setItem("token", response.token);
      }
      
      return {
        user: response.user,
        token: response.token
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Login failed"
      );
    }
  }
);

export const signupUser = createAsyncThunk(
  "auth/signup",
  async (userData, thunkAPI) => {
    try {
      const response = await authService.register(userData);
      
      // Store token in localStorage (for now)
      if (response.token) {
        localStorage.setItem("token", response.token);
      }
      
      return {
        user: response.user,
        token: response.token
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Signup failed"
      );
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, thunkAPI) => {
    try {
      await authService.logout();
    } catch (err) {
      console.error("Logout error:", err);
      // Even if backend logout fails, we'll still clear frontend state
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: getInitialAuthState(),
  reducers: {
    // Synchronous logout action
    clearAuthState: (state) => {
      localStorage.removeItem("token");
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Signup cases
      .addCase(signupUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Logout case
      .addCase(logoutUser.fulfilled, (state) => {
        localStorage.removeItem("token");
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearAuthState } = authSlice.actions;
export default authSlice.reducer;