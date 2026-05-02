"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Copy, X, Loader2 } from "lucide-react";
import apiClient from "../lib/api-client";
import { setToken, getToken } from "../lib/auth-storage";

interface User {
  id: string;
  email: string;
  fullname: string;
}

interface ClientCredentials {
  clientId: string;
  clientSecret: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<
    "login" | "register" | "registerApp" | "credentials" | null
  >(null);

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

  const checkAuth = async () => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.get(`/auth/me`, {
        validateStatus: () => true,
      });
      if (response.status >= 200 && response.status < 300) {
        setUser(response.data.data);
      } else {
        setToken(null);
      }
    } catch (error) {
      console.error("Auth check failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await checkAuth();
    })();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading("Logging in...");
    try {
      const response = await apiClient.post(
        `/auth/sign-in`,
        { email, password },
        {
          validateStatus: () => true,
        },
      );

      const data = response.data;
      if (response.status >= 200 && response.status < 300) {
        setToken(data.data.accessToken);
        toast.success("Logged in successfully!", { id: loadingToast });
        setActiveModal(null);
        checkAuth();
      } else {
        toast.error(data.message || "Failed to log in", { id: loadingToast });
      }
    } catch (error) {
      toast.error("An error occurred during login", { id: loadingToast });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading("Registering...");
    try {
      const response = await apiClient.post(
        `/auth/sign-up`,
        {
          email,
          password,
          fullname,
          username: username || undefined,
          dateofbirth,
          gender,
        },
        {
          validateStatus: () => true,
        },
      );

      const data = response.data;
      if (response.status >= 200 && response.status < 300) {
        toast.success("Registered successfully! Please log in.", {
          id: loadingToast,
        });
        setActiveModal("login");
      } else {
        toast.error(data.message || "Failed to register", { id: loadingToast });
      }
    } catch (error) {
      console.log(error);
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
    toast.success("Logged out successfully");
  };

  const handleRegisterApp = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading("Registering app...");
    try {
      const response = await apiClient.post(
        `/oauth/clients`,
        {
          appName,
          websiteUrl,
          redirectUris: redirectUris
            .split(",")
            .map((uri) => uri.trim())
            .filter(Boolean),
        },
        {
          validateStatus: () => true,
        },
      );

      const data = response.data;
      if (response.status >= 200 && response.status < 300) {
        toast.success("App registered successfully!", { id: loadingToast });
        setCredentials({
          clientId: data.data.clientId,
          clientSecret: data.data.clientSecret,
        });
        setActiveModal("credentials");
        setAppName("");
        setWebsiteUrl("");
        setRedirectUris("");
      } else {
        toast.error(data.message || "Failed to register app", {
          id: loadingToast,
        });
      }
    } catch (error) {
      toast.error("An error occurred", { id: loadingToast });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
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
      <div className="h-screen w-full flex items-center justify-center bg-black text-white">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-indigo-500/30">
      <header className="fixed top-0 w-full z-10 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-white">
              DC
            </div>
            <span className="font-semibold text-lg tracking-tight">
              Developer Console
            </span>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <button
                  onClick={() => openModal("registerApp")}
                  className="px-4 py-2 text-sm font-medium bg-white text-black rounded-lg hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                >
                  Register App
                </button>
                <div className="relative group">
                  <button className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-lg border-2 border-indigo-400 hover:border-indigo-300 transition-colors uppercase">
                    {user.fullname.charAt(0)}
                  </button>
                  <div className="absolute right-0 mt-2 w-48 py-2 bg-zinc-900 rounded-lg shadow-xl border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="px-4 py-2 text-sm text-gray-400 border-b border-white/10 mb-1 truncate">
                      {user.email}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => openModal("login")}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={() => openModal("register")}
                  className="px-4 py-2 text-sm font-medium bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pt-32 pb-16 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mt-20 max-w-3xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-indigo-400 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            OAuth 2.0 & OIDC Ready
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-br from-white via-white to-gray-500 bg-clip-text text-transparent">
            Build Secure Integrations
          </h1>
          <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl">
            Register your applications, manage OAuth credentials, and easily
            authenticate users with our high-performance identity platform.
          </p>
          {!user && (
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => openModal("register")}
                className="px-8 py-4 text-base font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_40px_rgba(79,70,229,0.5)] transform hover:-translate-y-1"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </main>

      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            {activeModal === "login" && (
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Welcome back</h2>
                  <p className="text-gray-400 text-sm">
                    Log in to manage your applications
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Log In
                </button>
                <p className="text-center text-sm text-gray-400">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => openModal("register")}
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    Sign up
                  </button>
                </p>
              </form>
            )}

            {activeModal === "register" && (
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Create an account</h2>
                  <p className="text-gray-400 text-sm">
                    Join to start building your integrations
                  </p>
                </div>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      required
                      value={dateofbirth}
                      onChange={(e) => setDateofbirth(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500"
                      style={{ colorScheme: "dark" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Create Account
                </button>
              </form>
            )}

            {activeModal === "registerApp" && (
              <form onSubmit={handleRegisterApp} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Register New App</h2>
                  <p className="text-gray-400 text-sm">
                    Create credentials for your application
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      App Name
                    </label>
                    <input
                      type="text"
                      required
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500"
                      placeholder="My Awesome App"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Website URL
                    </label>
                    <input
                      type="url"
                      required
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Redirect URIs (comma-separated)
                    </label>
                    <textarea
                      required
                      value={redirectUris}
                      onChange={(e) => setRedirectUris(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500 resize-none h-24"
                      placeholder="https://example.com/callback, http://localhost:3000/callback"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  Generate Credentials
                </button>
              </form>
            )}

            {activeModal === "credentials" && credentials && (
              <div className="space-y-6">
                <div>
                  <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold mb-1 text-center">
                    App Created!
                  </h2>
                  <p className="text-gray-400 text-sm text-center">
                    Please save these credentials safely. The client secret will
                    not be shown again.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Client ID
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={credentials.clientId}
                        className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-gray-300 font-mono text-sm"
                      />
                      <button
                        onClick={() =>
                          copyToClipboard(credentials.clientId, "Client ID")
                        }
                        className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-gray-300"
                        title="Copy Client ID"
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Client Secret
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={credentials.clientSecret}
                        className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-gray-300 font-mono text-sm"
                      />
                      <button
                        onClick={() =>
                          copyToClipboard(
                            credentials.clientSecret,
                            "Client Secret",
                          )
                        }
                        className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-gray-300"
                        title="Copy Client Secret"
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
