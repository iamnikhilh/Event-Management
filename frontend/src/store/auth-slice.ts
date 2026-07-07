import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { api, type Envelope } from "@/lib/api-client";
import { tokenStore } from "@/lib/tokens";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated" | "error";
  error: string | null;
  hydrated: boolean;
}

const initialState: AuthState = {
  user: null,
  status: "idle",
  error: null,
  hydrated: false,
};

export const login = createAsyncThunk<
  User,
  { email: string; password: string },
  { rejectValue: string }
>("auth/login", async (creds, { rejectWithValue }) => {
  try {
    const res = await api<Envelope<{ accessToken: string; refreshToken: string }>>("/auth/login", {
      method: "POST",
      body: creds,
      auth: false,
    });
    tokenStore.setTokens(res.data.accessToken, res.data.refreshToken);
    const me = await api<Envelope<User>>("/auth/me");
    return me.data;
  } catch (e) {
    const err = e as Error;
    return rejectWithValue(err.message || "Login failed");
  }
});

export const fetchMe = createAsyncThunk<User | null, void>("auth/me", async () => {
  if (!tokenStore.getAccess() && !tokenStore.getRefresh()) return null;
  try {
    const res = await api<Envelope<User>>("/auth/me");
    return res.data;
  } catch {
    tokenStore.clear();
    return null;
  }
});

export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    await api("/auth/logout", { method: "POST" });
  } catch {
    // ignore
  }
  tokenStore.clear();
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      state.status = action.payload ? "authenticated" : "unauthenticated";
    },
  },
  extraReducers: (b) => {
    b.addCase(login.pending, (s) => {
      s.status = "loading";
      s.error = null;
    })
      .addCase(login.fulfilled, (s, a) => {
        s.status = "authenticated";
        s.user = a.payload;
        s.hydrated = true;
      })
      .addCase(login.rejected, (s, a) => {
        s.status = "error";
        s.error = a.payload || "Login failed";
      })
      .addCase(fetchMe.pending, (s) => {
        if (!s.hydrated) s.status = "loading";
      })
      .addCase(fetchMe.fulfilled, (s, a) => {
        s.user = a.payload;
        s.status = a.payload ? "authenticated" : "unauthenticated";
        s.hydrated = true;
      })
      .addCase(fetchMe.rejected, (s) => {
        s.user = null;
        s.status = "unauthenticated";
        s.hydrated = true;
      })
      .addCase(logout.fulfilled, (s) => {
        s.user = null;
        s.status = "unauthenticated";
      });
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;
