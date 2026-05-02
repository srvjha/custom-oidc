"use client";

import { motion, Variants } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Zap, Shield, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

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

interface DashboardContentProps {
  user: User;
  apps: AppInfo[];
  onOpenCreateApp: () => void;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export default function DashboardContent({ user, apps, onOpenCreateApp }: DashboardContentProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const maskClientId = (clientId: string) => {
    if (!clientId || clientId.length < 8) return clientId;
    return `${clientId.substring(0, 4)}••••••••${clientId.substring(clientId.length - 4)}`;
  };

  return (
    <main className="container mx-auto px-6 py-12">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-10 max-w-6xl mx-auto"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div variants={fadeUp}>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Welcome, {user.fullname.split(" ")[0]}
            </h1>
            <p className="text-muted-foreground">
              Manage your applications and OAuth settings.
            </p>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Button
              onClick={onOpenCreateApp}
              className="bg-primary hover:opacity-90 shadow-lg shadow-primary/20 h-11 px-6"
            >
              <Zap className="w-4 h-4 mr-2" /> Create New App
            </Button>
          </motion.div>
        </div>

        <motion.div
          variants={fadeUp}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card className="gradient-border bg-transparent relative overflow-hidden group maroon-shadow transition-all hover:scale-[1.01] duration-300 rounded-none">
            <div className="absolute right-0 top-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity rotate-12">
              <Shield className="w-24 h-24 text-foreground" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
                Total Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-bold text-foreground tabular-nums tracking-tight">{apps.length}</p>
            </CardContent>
          </Card>

          <Card className="gradient-border bg-transparent relative overflow-hidden group maroon-shadow transition-all hover:scale-[1.01] duration-300 rounded-none">
            <div className="absolute right-0 top-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity rotate-12">
              <CheckCircle2 className="w-24 h-24 text-foreground" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-none animate-pulse" />
                <p className="text-3xl font-bold text-foreground tracking-tight">Active</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="gradient-border bg-transparent overflow-hidden rounded-none maroon-shadow">
            <CardHeader className="border-b border-white/5 pb-6 bg-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                    Your Applications
                  </CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">
                    Managed OAuth 2.0 endpoints and credentials.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground h-12">
                      App Name
                    </TableHead>
                    <TableHead className="text-muted-foreground h-12">
                      Client ID
                    </TableHead>
                    <TableHead className="text-muted-foreground h-12">
                      Redirect URIs
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apps.length > 0 ? (
                    apps.map((app) => (
                      <TableRow
                        key={app.id}
                        className="border-border hover:bg-muted/20 transition-colors"
                      >
                        <TableCell className="font-medium text-foreground py-4">
                          {app.appName}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <code className="bg-background border border-border px-2 py-1 rounded text-xs font-mono text-muted-foreground">
                              {maskClientId(app.clientId)}
                            </code>
                            <button
                              onClick={() =>
                                copyToClipboard(app.clientId, "Client ID")
                              }
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate py-4">
                          {app.redirectUris[0]}{" "}
                          {app.redirectUris.length > 1 && (
                            <Badge
                              variant="secondary"
                              className="ml-1 text-[10px] bg-muted"
                            >
                              +{app.redirectUris.length - 1}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="h-32 text-center text-muted-foreground"
                      >
                        No applications found. Click{" "}
                        <span className="text-primary font-semibold">
                          Create New App
                        </span>{" "}
                        to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </main>
  );
}
