import { useState, useEffect, useCallback } from "react";
import type { User } from "../types";
import { api } from "../lib/api";
import type { SignupConsent } from "../lib/legal";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = api.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await api.request<{ user: User }>("/api/auth/me");
        setUser(data.user);
      } catch {
        api.clearToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const signup = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      citizenship: string,
      residency: string,
      consent: SignupConsent
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.request<{ user: User; token: string }>("/api/auth/register", {
          method: "POST",
          // `consent` is evidence of informed consent. The backend may ignore it
          // today; it is still recorded here and can be persisted server-side later.
          body: JSON.stringify({ email, password, name, citizenship, residency, consent }),
        });
        api.setToken(data.token);
        setUser(data.user);
        return data.user;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Signup failed";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.request<{ user: User; token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      api.setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    api.clearToken();
  }, []);

  return {
    user,
    isLoading,
    error,
    signup,
    login,
    logout,
    isAuthenticated: !!user,
  };
};
