import { useState, useEffect, useCallback } from "react";
import type { User } from "../types";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ponytail: localStorage for MVP, switch to backend API when ready
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const signup = useCallback(
    async (email: string, password: string, name: string, citizenship: string, residency: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const newUser: User = {
          id: `user_${Date.now()}`,
          email,
          name,
          citizenship,
          residency,
          itinStatus: false,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem("user", JSON.stringify(newUser));
        localStorage.setItem("password", password);
        setUser(newUser);
        return newUser;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Signup failed");
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
      const stored = localStorage.getItem("user");
      const storedPassword = localStorage.getItem("password");

      if (!stored || !storedPassword) {
        throw new Error("User not found");
      }

      const storedUser = JSON.parse(stored);
      if (storedUser.email !== email || storedPassword !== password) {
        throw new Error("Invalid email or password");
      }

      setUser(storedUser);
      return storedUser;
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
    localStorage.removeItem("user");
    localStorage.removeItem("password");
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
