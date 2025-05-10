import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "../types/user";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: () => {},
  loading: false,
  error: null,
});

// Mock users for demonstration
const mockUsers = [
  {
    id: "1",
    name: "John Employee",
    email: "employee@pmi.com",
    role: "employee" as UserRole,
    department: "Marketing",
    startDate: "2023-06-15",
    programType: "earlyTalent",
    onboardingStage: "land",
    onboardingProgress: 65,
  },
  {
    id: "2",
    name: "Sarah Supervisor",
    email: "supervisor@pmi.com",
    role: "supervisor" as UserRole,
    department: "Operations",
  },
  {
    id: "3",
    name: "Maria HR",
    email: "hr@pmi.com",
    role: "hr" as UserRole,
    department: "Human Resources",
  },
  {
    id: "4",
    name: "Tom Manager",
    email: "manager@pmi.com",
    role: "manager" as UserRole,
    department: "Product Development",
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem("pmiUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Find user by email
      const foundUser = mockUsers.find((u) => u.email === email);

      if (foundUser && password === "password") {
        // Simple password validation for demo
        setUser(foundUser);
        localStorage.setItem("pmiUser", JSON.stringify(foundUser));
      } else {
        throw new Error("Invalid email or password");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("pmiUser");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
