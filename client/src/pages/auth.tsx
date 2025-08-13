import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Music } from "lucide-react";
import GlassPanel from "@/components/glass-panel";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";

type AuthMode = 'login' | 'signup';

const loginSchema = z.object({
  email: z.string().optional(),
  username: z.string().optional(),
  password: z.string().min(1, "Password is required")
}).refine((data) => data.email || data.username, {
  message: "Either email or username is required",
  path: ["email"]
});

export default function Auth() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [loginData, setLoginData] = useState({
    emailOrUsername: '',
    password: '',
    rememberMe: false
  });

  const [signupData, setSignupData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: ''
  });

  const loginMutation = useMutation({
    mutationFn: (data: { email?: string; username?: string; password: string }) =>
      apiRequest("POST", "/api/auth/login", data),
    onSuccess: async (response) => {
      const result = await response.json();
      toast({
        title: "Welcome back!",
        description: `Logged in as ${result.user.username}`,
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Login failed",
        description: "Invalid credentials",
        variant: "destructive"
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: (data: z.infer<typeof insertUserSchema>) =>
      apiRequest("POST", "/api/auth/register", data),
    onSuccess: async (response) => {
      const result = await response.json();
      toast({
        title: "Account created!",
        description: `Welcome to Groovia, ${result.user.fullName}!`,
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Registration failed",
        description: "User might already exist",
        variant: "destructive"
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const isEmail = loginData.emailOrUsername.includes('@');
    loginMutation.mutate({
      [isEmail ? 'email' : 'username']: loginData.emailOrUsername,
      password: loginData.password
    });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validatedData = insertUserSchema.parse(signupData);
      signupMutation.mutate(validatedData);
    } catch (error) {
      toast({
        title: "Invalid form data",
        description: "Please check all fields",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-20">
      <div className="max-w-md w-full">
        <GlassPanel className="p-8">
          <div className="text-center mb-8">
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-2">
              <Music className="inline-block w-10 h-10 mr-2" />
              Groovia
            </div>
            <p className="text-gray-300">Join the music experience</p>
          </div>

          {/* Auth Toggle */}
          <div className="flex mb-6 glass-panel rounded-lg p-1">
            <Button
              variant={authMode === 'login' ? 'default' : 'ghost'}
              onClick={() => setAuthMode('login')}
              className="flex-1 py-2 rounded-md transition-all"
              data-testid="tab-login"
            >
              Login
            </Button>
            <Button
              variant={authMode === 'signup' ? 'default' : 'ghost'}
              onClick={() => setAuthMode('signup')}
              className="flex-1 py-2 rounded-md transition-all"
              data-testid="tab-signup"
            >
              Sign Up
            </Button>
          </div>

          {/* Login Form */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <Label htmlFor="emailOrUsername" className="text-gray-300">Email or Username</Label>
                <Input
                  id="emailOrUsername"
                  type="text"
                  required
                  value={loginData.emailOrUsername}
                  onChange={(e) => setLoginData({...loginData, emailOrUsername: e.target.value})}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400"
                  placeholder="Enter your email or username"
                  data-testid="input-email-username"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400"
                  placeholder="Enter your password"
                  data-testid="input-password"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={loginData.rememberMe}
                    onCheckedChange={(checked) => setLoginData({...loginData, rememberMe: checked as boolean})}
                    data-testid="checkbox-remember-me"
                  />
                  <Label htmlFor="rememberMe" className="text-sm text-gray-300">Remember me</Label>
                </div>
                <Button variant="link" className="text-sm text-purple-300 hover:text-purple-200 p-0" data-testid="link-forgot-password">
                  Forgot password?
                </Button>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 btn-glow"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          )}

          {/* Signup Form */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-6">
              <div>
                <Label htmlFor="fullName" className="text-gray-300">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  required
                  value={signupData.fullName}
                  onChange={(e) => setSignupData({...signupData, fullName: e.target.value})}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400"
                  placeholder="Enter your full name"
                  data-testid="input-full-name"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={signupData.email}
                  onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400"
                  placeholder="Enter your email"
                  data-testid="input-signup-email"
                />
              </div>
              <div>
                <Label htmlFor="username" className="text-gray-300">Username</Label>
                <Input
                  id="username"
                  type="text"
                  required
                  value={signupData.username}
                  onChange={(e) => setSignupData({...signupData, username: e.target.value})}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400"
                  placeholder="Choose a username"
                  data-testid="input-signup-username"
                />
              </div>
              <div>
                <Label htmlFor="signupPassword" className="text-gray-300">Password</Label>
                <Input
                  id="signupPassword"
                  type="password"
                  required
                  value={signupData.password}
                  onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400"
                  placeholder="Create a password"
                  data-testid="input-signup-password"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 btn-glow"
                disabled={signupMutation.isPending}
                data-testid="button-signup"
              >
                {signupMutation.isPending ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          )}

          {/* Social Login */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-gray-400">Or continue with</span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button 
                variant="ghost" 
                className="glass-panel hover:bg-white/20 text-white" 
                data-testid="button-google-auth"
              >
                <span className="text-red-400 mr-2">G</span>
                Google
              </Button>
              <Button 
                variant="ghost" 
                className="glass-panel hover:bg-white/20 text-white" 
                data-testid="button-spotify-auth"
              >
                <span className="text-green-400 mr-2">S</span>
                Spotify
              </Button>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
