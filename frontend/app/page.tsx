"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import apiClient from "../lib/api-client";
import { setToken } from "../lib/auth-storage";

// Layout & Components
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import HowItWorks from "@/components/home/HowItWorks";
import CodeShowcase from "@/components/home/CodeShowcase";
import FinalCTA from "@/components/home/FinalCTA";
import DashboardContent from "@/components/dashboard/DashboardContent";
import AuthModals from "@/components/auth/AuthModals";

interface User {
  id: string;
  email: string;
  fullname: string;
}

interface AppInfo {
  id: string;
  appName: string;
  clientId: string;
  redirectUris: string[];
  websiteUrl: string;
  createdAt: string;
}

interface ClientCredentials {
  clientId: string;
  clientSecret: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<
    "login" | "register" | "registerApp" | "credentials" | null
  >(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [dateofbirth, setDateofbirth] = useState("");
  const [gender, setGender] = useState("other");

  const [appName, setAppName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [redirectUris, setRedirectUris] = useState("");

  const [credentials, setCredentials] = useState<ClientCredentials | null>(
    null,
  );

  const fetchApps = useCallback(async () => {
    try {
      const response = await apiClient.get("/oauth/clients");
      if (response.status >= 200 && response.status < 300) {
        setApps(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch apps", error);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const response = await apiClient.get(`/auth/me`);
      if (response.status >= 200 && response.status < 300) {
        setUser(response.data.data);
        await fetchApps();
      } else {
        setToken(null);
      }
    } catch (error) {
      console.error("Auth check failed", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchApps]);

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) {
        checkAuth();
      }
    });
    return () => {
      ignore = true;
    };
  }, [checkAuth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading("Logging in...");
    try {
      const response = await apiClient.post(`/auth/sign-in`, {
        email,
        password,
      });
      if (response.status >= 200 && response.status < 300) {
        setToken(response.data.data.accessToken);
        toast.success("Logged in successfully!", { id: loadingToast });
        setActiveModal(null);
        await checkAuth();
      } else {
        toast.error(response.data.message || "Failed to log in", {
          id: loadingToast,
        });
      }
    } catch (error) {
      toast.error("An error occurred during login", { id: loadingToast });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading("Registering...");
    try {
      const response = await apiClient.post(`/auth/sign-up`, {
        email,
        password,
        fullname,
        username: username || undefined,
        dateofbirth,
        gender,
      });
      if (response.status >= 200 && response.status < 300) {
        toast.success("Registered successfully! Please log in.", {
          id: loadingToast,
        });
        setActiveModal("login");
      } else {
        toast.error(response.data.message || "Failed to register", {
          id: loadingToast,
        });
      }
    } catch (error) {
      toast.error("An error occurred during registration", {
        id: loadingToast,
      });
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/sign-out");
    } catch (e) {}
    setToken(null);
    setUser(null);
    setApps([]);
    toast.success("Logged out successfully");
  };

  const handleRegisterApp = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading("Registering app...");
    try {
      const response = await apiClient.post(`/oauth/clients`, {
        appName,
        websiteUrl,
        redirectUris: redirectUris
          .split(",")
          .map((uri) => uri.trim())
          .filter(Boolean),
      });
      if (response.status >= 200 && response.status < 300) {
        toast.success("App registered successfully!", { id: loadingToast });
        setCredentials({
          clientId: response.data.data.clientId,
          clientSecret: response.data.data.clientSecret,
        });
        setActiveModal("credentials");
        setAppName("");
        setWebsiteUrl("");
        setRedirectUris("");
        await fetchApps();
      } else {
        toast.error(response.data.message || "Failed to register app", {
          id: loadingToast,
        });
      }
    } catch (error) {
      toast.error("An error occurred", { id: loadingToast });
    }
  };

  const resetFormStates = () => {
    setEmail("");
    setPassword("");
    setFullname("");
    setUsername("");
    setDateofbirth("");
    setGender("other");
  };

  const openModal = (modal: "login" | "register" | "registerApp") => {
    resetFormStates();
    setActiveModal(modal);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary/20">
      <Header
        user={user}
        onLogout={handleLogout}
        onOpenLogin={() => openModal("login")}
        onOpenRegister={() => openModal("register")}
        onOpenCreateApp={() => openModal("registerApp")}
      />

      <main className="flex-grow">
        {!user ? (
          <>
            <Hero
              onOpenRegister={() => openModal("register")}
              onOpenLogin={() => openModal("login")}
            />
            <Features />
            <HowItWorks />
            <CodeShowcase />
            <FinalCTA onOpenRegister={() => openModal("register")} />
          </>
        ) : (
          <DashboardContent
            user={user}
            apps={apps}
            onOpenCreateApp={() => openModal("registerApp")}
          />
        )}
      </main>

      <Footer />

      <AuthModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        fullname={fullname}
        setFullname={setFullname}
        username={username}
        setUsername={setUsername}
        dateofbirth={dateofbirth}
        setDateofbirth={setDateofbirth}
        gender={gender}
        setGender={setGender}
        handleLogin={handleLogin}
        handleRegister={handleRegister}
        appName={appName}
        setAppName={setAppName}
        websiteUrl={websiteUrl}
        setWebsiteUrl={setWebsiteUrl}
        redirectUris={redirectUris}
        setRedirectUris={setRedirectUris}
        handleRegisterApp={handleRegisterApp}
        credentials={credentials}
        onSwitchToRegister={() => openModal("register")}
        onSwitchToLogin={() => openModal("login")}
      />
    </div>
  );
}
