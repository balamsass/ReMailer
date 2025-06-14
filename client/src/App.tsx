import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./lib/auth.tsx";
import { useAuth } from "./hooks/use-auth";
import MainLayout from "./components/layout/main-layout";
import Dashboard from "./pages/dashboard";
import Campaigns from "./pages/campaigns";
import EnhancedContacts from "./pages/enhanced-contacts";
import Lists from "./pages/lists";
import ListDetail from "./pages/list-detail";
import Analytics from "./pages/analytics";
import ApiTokens from "./pages/api-tokens";
import Admin from "./pages/admin";
import Images from "./pages/images";
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/campaigns" component={Campaigns} />
        <Route path="/contacts" component={EnhancedContacts} />
        <Route path="/lists" component={Lists} />
        <Route path="/lists/:id" component={ListDetail} />
        <Route path="/images" component={Images} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/api-tokens" component={ApiTokens} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function LoginForm() {
  const { login } = useAuth();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-xl border border-slate-200 w-full max-w-md">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-envelope text-white text-sm"></i>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">ReMailer</h1>
            <p className="text-xs text-slate-500">v1.0.0</p>
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold text-slate-900 mb-6">Sign In</h2>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          login(formData.get('email') as string, formData.get('password') as string);
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input 
                name="email" 
                type="email" 
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input 
                name="password" 
                type="password" 
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <button 
            type="submit"
            className="w-full bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors mt-6"
          >
            Sign In
          </button>
        </form>
        
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center mb-3">Demo Access</p>
          <button 
            onClick={() => login('admin@demo.com', 'demo123')}
            className="w-full bg-slate-100 text-slate-700 py-2 px-4 rounded-lg font-medium hover:bg-slate-200 transition-colors text-sm"
          >
            Quick Demo Sign In
          </button>
          <p className="text-xs text-slate-400 text-center mt-2">
            Email: admin@demo.com | Password: demo123
          </p>
        </div>
      </div>
    </div>
  );
}

function Router() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-envelope text-white text-sm"></i>
          </div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <LoginForm />;
  }
  
  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
