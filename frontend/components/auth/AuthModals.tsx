"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";
import toast from "react-hot-toast";

interface AuthModalsProps {
  activeModal: "login" | "register" | "registerApp" | "credentials" | null;
  onClose: () => void;
  // Login/Register states & handlers
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  fullname: string;
  setFullname: (val: string) => void;
  username: string;
  setUsername: (val: string) => void;
  dateofbirth: string;
  setDateofbirth: (val: string) => void;
  gender: string;
  setGender: (val: string) => void;
  handleLogin: (e: React.FormEvent) => void;
  handleRegister: (e: React.FormEvent) => void;
  // App Registration states & handlers
  appName: string;
  setAppName: (val: string) => void;
  websiteUrl: string;
  setWebsiteUrl: (val: string) => void;
  redirectUris: string;
  setRedirectUris: (val: string) => void;
  handleRegisterApp: (e: React.FormEvent) => void;
  // Credentials
  credentials: { clientId: string; clientSecret: string } | null;
  onSwitchToRegister?: () => void;
  onSwitchToLogin?: () => void;
}

export default function AuthModals({
  activeModal,
  onClose,
  email,
  setEmail,
  password,
  setPassword,
  fullname,
  setFullname,
  username,
  setUsername,
  dateofbirth,
  setDateofbirth,
  gender,
  setGender,
  handleLogin,
  handleRegister,
  appName,
  setAppName,
  websiteUrl,
  setWebsiteUrl,
  redirectUris,
  setRedirectUris,
  handleRegisterApp,
  credentials,
  onSwitchToRegister,
  onSwitchToLogin,
}: AuthModalsProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <>
      {/* LOGIN MODAL */}
      <Dialog open={activeModal === "login"} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[400px] bg-transparent backdrop-blur-2xl border border-primary/20 p-8 rounded-none maroon-shadow">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold text-center">
              Welcome back
            </DialogTitle>
            <DialogDescription className="text-center">
              Enter your credentials to access your account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-transparent border border-primary/30 h-11 rounded-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-transparent border border-primary/30 h-11 rounded-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground h-12 text-lg rounded-none shadow-lg shadow-primary/20"
            >
              Sign In
            </Button>
          </form>
          {onSwitchToRegister && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <button
                onClick={onSwitchToRegister}
                className="text-primary hover:underline font-semibold"
              >
                Create one
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* REGISTER MODAL */}
      <Dialog open={activeModal === "register"} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[450px] bg-transparent backdrop-blur-2xl border border-primary/20 p-8 rounded-none overflow-y-auto max-h-[90vh] maroon-shadow">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold text-center">
              Create an account
            </DialogTitle>
            <DialogDescription className="text-center">
              Join srvAuth to start securing your applications.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegister} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="reg-fullname">Full Name</Label>
              <Input
                id="reg-fullname"
                placeholder="John Doe"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                required
                className="bg-background border-border h-11 rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background border-border h-11 rounded-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reg-username">Username (Optional)</Label>
                <Input
                  id="reg-username"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-background border-border h-11 rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-dob">Date of Birth</Label>
                <Input
                  id="reg-dob"
                  type="date"
                  value={dateofbirth}
                  onChange={(e) => setDateofbirth(e.target.value)}
                  required
                  className="bg-background border-border h-11 rounded-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-gender">Gender</Label>
              <select
                id="reg-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-background border border-border h-11 rounded-none px-3 outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Password</Label>
              <Input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background border-border h-11 rounded-none"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground h-12 text-lg rounded-none shadow-lg shadow-primary/20 mt-2"
            >
              Sign Up
            </Button>
          </form>
          {onSwitchToLogin && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                onClick={onSwitchToLogin}
                className="text-primary hover:underline font-semibold"
              >
                Sign in
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* REGISTER APP MODAL */}
      <Dialog open={activeModal === "registerApp"} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] bg-background/80 backdrop-blur-xl border border-primary p-8 rounded-none maroon-shadow">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold text-center">
              Register New Application
            </DialogTitle>
            <DialogDescription className="text-center">
              Create a new set of OAuth 2.0 credentials for your app.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegisterApp} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="app-name">Application Name</Label>
              <Input
                id="app-name"
                placeholder="My Awesome App"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                required
                className="bg-background border-border h-11 rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website-url">Website URL</Label>
              <Input
                id="website-url"
                placeholder="https://myapp.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                required
                className="bg-background border-border h-11 rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="redirect-uris">
                Redirect URIs (comma separated)
              </Label>
              <Input
                id="redirect-uris"
                placeholder="https://myapp.com/callback, http://localhost:3001/callback"
                value={redirectUris}
                onChange={(e) => setRedirectUris(e.target.value)}
                required
                className="bg-background border-border h-11 rounded-none"
              />
              <p className="text-[10px] text-muted-foreground">
                We will only redirect users back to these whitelisted URIs.
              </p>
            </div>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground h-12 text-lg rounded-none shadow-lg shadow-primary/20 mt-4"
            >
              Generate Credentials
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* CREDENTIALS MODAL */}
      <Dialog open={activeModal === "credentials"} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] bg-background/80 backdrop-blur-xl border border-primary p-8 rounded-none maroon-shadow">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold text-center text-primary">
              Credentials Generated!
            </DialogTitle>
            <DialogDescription className="text-center">
              Store these securely. You won&apos;t be able to see the secret
              again.
            </DialogDescription>
          </DialogHeader>
          {credentials && (
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Client ID</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={credentials.clientId}
                    className="bg-black/50 border-border font-mono text-sm h-11 rounded-none"
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(credentials.clientId, "Client ID")
                    }
                    className="h-11 w-11 p-0 rounded-none"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Client Secret</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    type="password"
                    value={credentials.clientSecret}
                    className="bg-black/50 border-border font-mono text-sm h-11 rounded-none"
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(credentials.clientSecret, "Client Secret")
                    }
                    className="h-11 w-11 p-0 rounded-none"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                onClick={onClose}
                className="w-full bg-foreground text-background h-12 rounded-none"
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
