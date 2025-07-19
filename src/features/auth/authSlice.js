import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';
import Cookies from 'js-cookie';

// Get token from cookies if available
const token = Cookies.get('token');

const initialState = {
  user: null,
  token: token || null,
  isAuthenticated: !!token,
  isLoading: false,
  error: null,
};

// Login Thunk - Changed type prefix to 'auth/login'
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, thunkAPI) => {
    try {
      const data = await authService.login(credentials);
 
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

// Signup Thunk - Changed type prefix to 'auth/signup'
export const signupUser = createAsyncThunk(
  'auth/signup',
  async (userData, thunkAPI) => {
    try {
      const data = await authService.register(userData);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || 'Signup failed');
    }
  }
);

// Logout Action
export const logoutUser = () => (dispatch) => {
  authService.logout();
  dispatch(authSlice.actions.logout());
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
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
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;