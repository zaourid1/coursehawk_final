import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import {
  GraduationCap,
  Calendar,
  MessageCircle,
  CheckCircle,
  BookOpen,
  Target,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Track Requirements",
    description: "Monitor your degree progress by category with real-time credit tracking.",
  },
  {
    icon: Calendar,
    title: "Semester Planner",
    description: "Build and compare multiple term plans with CRN management for fast registration.",
  },
  {
    icon: MessageCircle,
    title: "AI Academic Advisor",
    description: "Get personalized course recommendations powered by your academic history.",
  },
  {
    icon: ShieldCheck,
    title: "Prerequisite Validation",
    description: "Automatically check course eligibility and avoid registration blocks.",
  },
];

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loginError, isLoggingIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@wlu.ca"
          required
          data-testid="input-email"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          minLength={6}
          data-testid="input-password"
        />
      </div>
      {loginError && (
        <p className="text-sm text-destructive" data-testid="text-auth-error">
          {loginError.message}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isLoggingIn} data-testid="button-auth-submit">
        {isLoggingIn ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}

function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const { register, registerError, isRegistering } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register({ email, password, firstName, lastName });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="reg-first">First Name</Label>
          <Input
            id="reg-first"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Jane"
            data-testid="input-first-name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-last">Last Name</Label>
          <Input
            id="reg-last"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Hawk"
            data-testid="input-last-name"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-email">Email</Label>
        <Input
          id="reg-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@wlu.ca"
          required
          data-testid="input-reg-email"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-password">Password</Label>
        <Input
          id="reg-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 6 characters"
          required
          minLength={6}
          data-testid="input-reg-password"
        />
      </div>
      {registerError && (
        <p className="text-sm text-destructive" data-testid="text-reg-error">
          {registerError.message}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isRegistering} data-testid="button-reg-submit">
        {isRegistering ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
}

function AuthCard() {
  return (
    <Card className="w-full max-w-sm shadow-xl border-border/60">
      <CardContent className="p-6">
        <div className="mb-5 text-center space-y-1">
          <h3 className="font-semibold text-lg">Get Started</h3>
          <p className="text-sm text-muted-foreground">Sign in or create your free account</p>
        </div>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-5" data-testid="tabs-auth">
            <TabsTrigger value="login" data-testid="tab-login">Sign In</TabsTrigger>
            <TabsTrigger value="register" data-testid="tab-register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <LoginForm />
          </TabsContent>
          <TabsContent value="register">
            <RegisterForm />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-bold text-lg leading-none block">Hawk's Path</span>
                <span className="text-[10px] text-muted-foreground leading-none">Wilfrid Laurier University</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Academic Planning Tool</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-16">
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/12" />
          <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="pointer-events-none absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/15 text-accent-foreground border border-accent/30 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-accent" />
                  AI-Powered Academic Planning
                </div>
                <div className="space-y-4">
                  <div className="text-sm font-semibold tracking-widest uppercase text-primary/70">
                    Wilfrid Laurier University
                  </div>
                  <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                    Plan Your
                    <span className="text-primary block">Academic Journey</span>
                    <span className="text-accent">With Confidence</span>
                  </h1>
                </div>
                <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                  Hawk's Path helps WLU students navigate course selection with smart prerequisite
                  checking, personalized semester planning, and an AI advisor that knows your degree.
                </p>
                <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-chart-2" />
                    Real WLU course catalog
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-chart-2" />
                    Prerequisite auto-check
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-chart-2" />
                    GPT-4o AI Advisor
                  </div>
                </div>
              </div>

              <div className="flex justify-center lg:justify-end relative z-10">
                <AuthCard />
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-muted/40 border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <GraduationCap className="h-4 w-4" />
                Built for WLU CS Students
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold">
                Everything You Need to Graduate On Time
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Powerful tools designed around the WLU Computer Science program to keep you on track every semester.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="hover-elevate border-border/60 hover:border-primary/30 transition-colors">
                  <CardContent className="p-6 space-y-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <div className="text-accent font-semibold text-sm tracking-widest uppercase">
              Wilfrid Laurier University — Computer Science
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold">
              Ready to Plan Your Path to Graduation?
            </h2>
            <p className="text-lg text-primary-foreground/70 max-w-xl mx-auto">
              Track every credit, validate every prerequisite, and get AI-powered guidance — all in one place.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-10 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <span className="font-semibold text-sm block">Hawk's Path</span>
                <span className="text-xs text-muted-foreground">Wilfrid Laurier University</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center sm:text-right">
              For academic planning purposes only. Not official WLU advising.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
