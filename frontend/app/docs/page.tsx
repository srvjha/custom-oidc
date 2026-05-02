import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Key, Shield, Globe, Lock, Code2, Terminal } from "lucide-react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function DocsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      {/* Note: In a real app, you'd handle auth state here or in a wrapper */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">

            <span className="font-semibold text-lg tracking-tight">srvAuth</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">Back to App</Link>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          <section className="space-y-4">
            <Badge variant="outline" className="text-primary border-primary bg-transparent">Documentation</Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Getting Started with srvAuth</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Everything you need to integrate OAuth 2.0 and OpenID Connect into your applications using our secure identity platform.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-10 h-10 rounded-none border border-primary flex items-center justify-center mb-4 text-primary">
                  <Key className="w-5 h-5" />
                </div>
                <CardTitle>OAuth 2.0 Flow</CardTitle>
                <CardDescription>Learn how to authorize users using the industry standard.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Authorization Code Grant</p>
                <p>• PKCE Support for SPA/Mobile</p>
                <p>• Token Revocation</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-10 h-10 rounded-none border border-primary flex items-center justify-center mb-4 text-primary">
                  <Shield className="w-5 h-5" />
                </div>
                <CardTitle>OpenID Connect</CardTitle>
                <CardDescription>Identity layer built on top of OAuth 2.0.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Standard ID Tokens</p>
                <p>• UserInfo Endpoint</p>
                <p>• Verified Email & Profiles</p>
              </CardContent>
            </Card>
          </div>

          <section className="space-y-8 py-12">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">Integration Guide</h2>
              <p className="text-muted-foreground">Follow these steps to secure your application in minutes.</p>
            </div>

            <div className="space-y-8">
              {[
                {
                  title: "1. Create an Application",
                  description: "Register your application in the developer console to get your Client ID and Client Secret.",
                  icon: <Globe className="w-6 h-6" />
                },
                {
                  title: "2. Configure Redirect URIs",
                  description: "Whitelist your application callback URLs. For example: https://myapp.com/api/auth/callback",
                  icon: <Terminal className="w-6 h-6" />
                },
                {
                  title: "3. Implement Login",
                  description: "Redirect users to our authorization endpoint with your Client ID and requested scopes.",
                  icon: <Lock className="w-6 h-6" />
                }
              ].map((step, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="w-12 h-12 rounded-none border border-primary flex-shrink-0 flex items-center justify-center text-primary font-bold">
                    {i + 1}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Card className="bg-transparent border border-primary p-8 rounded-none">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 space-y-4">
                <h3 className="text-2xl font-bold">Ready to secure your app?</h3>
                <p className="text-muted-foreground">Join thousands of developers building secure applications with srvAuth.</p>
                <Link href="/" className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all">
                  Get your credentials now <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="w-32 h-32 border border-primary rounded-none flex items-center justify-center text-primary rotate-3 shadow-2xl shadow-primary/10">
                <Shield className="w-16 h-16" />
              </div>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
