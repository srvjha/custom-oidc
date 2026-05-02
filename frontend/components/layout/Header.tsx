"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Zap } from "lucide-react";

interface User {
  id: string;
  email: string;
  fullname: string;
}

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenCreateApp: () => void;
}

export default function Header({
  user,
  onLogout,
  onOpenLogin,
  onOpenRegister,
  onOpenCreateApp,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-all group">
            <div className="w-8 h-8 bg-primary/10 flex items-center justify-center font-bold text-primary transition-colors">
              S
            </div>
            <span className="font-bold text-xl tracking-tighter text-foreground">
              srvAuth
            </span>
          </Link>
        </div>



        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-6">
              <Link href="/docs" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">
                Docs
              </Link>
              <Button
                onClick={onOpenCreateApp}
                size="sm"
                className="hidden sm:flex bg-primary text-primary-foreground font-semibold px-4 h-9 rounded-none hover:brightness-110 shadow-[0_0_15px_rgba(var(--primary),0.2)]"
              >
                <Zap className="w-3.5 h-3.5 mr-2" />
                Create App
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "relative h-9 w-9 outline-none p-0 overflow-hidden"
                  )}
                >
                  <Avatar className="h-full w-full">
                    <AvatarFallback className="bg-primary text-white text-xs">
                      {user.fullname.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 bg-card border-border"
                  align="end"
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.fullname}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                      onClick={onLogout}
                    >
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <Link href="/docs" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest mr-2">
                Docs
              </Link>
              <Button
                variant="ghost"
                onClick={onOpenLogin}
                className="text-muted-foreground hover:text-foreground"
              >
                Log in
              </Button>
              <Button
                onClick={onOpenRegister}
                className="bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20"
              >
                Sign up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
