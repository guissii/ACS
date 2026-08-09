import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import VRRP from "./pages/VRRP";
import SDWAN from "./pages/SDWAN";
import BGP from "./pages/BGP";
import IPsec from "./pages/IPsec";
import FGCP from "./pages/FGCP";
import Architecture from "./pages/Architecture";
import Automation from "./pages/Automation";
import ConnectivityTest from "./pages/ConnectivityTest";

function Router() {
  return (
    <Switch>
      <Route
        path="/"
        component={() => (
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        )}
      />
      <Route
        path="/vrrp"
        component={() => (
          <DashboardLayout>
            <VRRP />
          </DashboardLayout>
        )}
      />
      <Route
        path="/sdwan"
        component={() => (
          <DashboardLayout>
            <SDWAN />
          </DashboardLayout>
        )}
      />
      <Route
        path="/bgp"
        component={() => (
          <DashboardLayout>
            <BGP />
          </DashboardLayout>
        )}
      />
      <Route
        path="/ipsec"
        component={() => (
          <DashboardLayout>
            <IPsec />
          </DashboardLayout>
        )}
      />
      <Route
        path="/fgcp"
        component={() => (
          <DashboardLayout>
            <FGCP />
          </DashboardLayout>
        )}
      />
      <Route
        path="/architecture"
        component={() => (
          <DashboardLayout>
            <Architecture />
          </DashboardLayout>
        )}
      />
      <Route
        path="/automation"
        component={() => (
          <DashboardLayout>
            <Automation />
          </DashboardLayout>
        )}
      />
      <Route
        path="/connectivity-test"
        component={() => (
          <DashboardLayout>
            <ConnectivityTest />
          </DashboardLayout>
        )}
      />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
