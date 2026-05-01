"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function AuthorizeContent() {
  const searchParams = useSearchParams();
  
  const [view, setView] = useState<"loading" | "login" | "register" | "consent">("loading");
  
  const [consentData, setConsentData] = useState<any>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [fullname, setFullname] = useState("");
  const [dateofbirth, setDateofbirth] = useState("");
  const [gender, setGender] = useState("other");

  useEffect(() => {
    checkAuthorization();
  }, [searchParams]);

  const checkAuthorization = async () => {
    setView("loading");
    const token = localStorage.getItem("accessToken");
    
    try {
      const urlParams = new URLSearchParams(searchParams as any).toString();
      const response = await axios.get(`${API_URL}/o/authorize?${urlParams}`, {
        headers: {
          "Accept": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        validateStatus: () => true,
      });
      
      const data = response.data;
      
      if (response.status === 401 && data.error === "login_required") {
        setView("login");
      } else if (response.status === 200 && data.action === "consent_required") {
        setConsentData(data);
        setView("consent");
      } else if (response.status === 200 && data.action === "redirect") {
        window.location.href = data.redirect_url;
      } else {
        toast.error("Unexpected response from authorization server");
      }
    } catch (error) {
      toast.error("Failed to communicate with authorization server");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading("Logging in...");
    try {
      const response = await axios.post(`${API_URL}/auth/sign-in`, { email, password }, {
        headers: { "Content-Type": "application/json" },
        validateStatus: () => true,
      });
      
      const data = response.data;
      if (response.status >= 200 && response.status < 300) {
        localStorage.setItem("accessToken", data.data.accessToken);
        toast.success("Logged in successfully!", { id: loadingToast });
        checkAuthorization();
      } else {
        toast.error(data.message || "Failed to log in", { id: loadingToast });
      }
    } catch (error) {
      toast.error("An error occurred during login", { id: loadingToast });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading("Creating account...");
    try {
      const response = await axios.post(`${API_URL}/auth/sign-up`, {
        email,
        password,
        fullname,
        username: email.split("@")[0],
        dateofbirth: dateofbirth + "T00:00:00Z",
        gender,
      }, {
        headers: { "Content-Type": "application/json" },
        validateStatus: () => true,
      });

      const data = response.data;
      if (response.status >= 200 && response.status < 300) {
        toast.success("Account created! Please sign in.", { id: loadingToast });
        setView("login");
      } else {
        toast.error(data.message || "Failed to register", { id: loadingToast });
      }
    } catch (error) {
      toast.error("An error occurred during registration", { id: loadingToast });
    }
  };

  const handleConsent = async (approved: boolean) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const response = await axios.post(`${API_URL}/o/consent`, {
        client_id: consentData.client_id,
        redirect_uri: consentData.redirect_uri,
        scope: searchParams.get("scope") || "",
        state: consentData.state || "",
        approved
      }, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        validateStatus: () => true,
      });

      const data = response.data;
      if (response.status >= 200 && response.status < 300 && data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        toast.error("Failed to process consent");
      }
    } catch (error) {
      toast.error("Error processing consent");
    }
  };

  if (view === "loading") {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-500 mb-4" />
        <p className="text-gray-400">Loading authorization request...</p>
      </div>
    );
  }

  if (view === "login") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-950 border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Sign In to Continue</h1>
            <p className="text-gray-400 text-sm">An application is requesting access to your account.</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 mt-4 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Sign In
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-400">
            Don't have an account?{" "}
            <button
              onClick={() => setView("register")}
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Create one
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "register") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-950 border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Create an Account</h1>
            <p className="text-gray-400 text-sm">Join to continue to the application.</p>
          </div>
          
          <form onSubmit={handleRegister} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Date of Birth</label>
              <input
                type="date"
                required
                value={dateofbirth}
                onChange={(e) => setDateofbirth(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500 text-white"
                style={{ colorScheme: "dark" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Gender</label>
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
            <button
              type="submit"
              className="w-full py-2 mt-4 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Sign Up
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <button
              onClick={() => setView("login")}
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "consent" && consentData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-950 border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/50">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Authorization Request</h1>
            <p className="text-gray-400 text-sm">
              <strong className="text-white">{consentData.client.appName}</strong> wants to access your srvAuth account.
            </p>
          </div>

          <div className="bg-zinc-900 border border-white/5 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Requested Permissions</h3>
            <ul className="space-y-3">
              {consentData.scopes.map((scope: string) => (
                <li key={scope} className="flex items-start gap-3">
                  <div className="mt-0.5 text-green-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-200 font-medium">{scope}</p>
                    <p className="text-xs text-gray-500">
                      {scope === "openid" && "Verify your identity."}
                      {scope === "profile" && "Access your basic profile information."}
                      {scope === "email" && "Access your email address."}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleConsent(false)}
              className="flex-1 py-2.5 px-4 bg-transparent border border-white/10 text-white font-medium rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleConsent(true)}
              className="flex-1 py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
            >
              Allow Access
            </button>
          </div>
          
          <div className="mt-6 text-center text-xs text-gray-600">
            By allowing access, you agree to {consentData.client.appName}'s terms of service and privacy policy.
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function AuthorizePage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center bg-black text-white">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
      </div>
    }>
      <AuthorizeContent />
    </Suspense>
  );
}
