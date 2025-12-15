import { useEffect, useState } from "react";
import { Calculator } from "@/components/Calculator";
import { Lock, Shield, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabaseClient } from "@/lib/supabaseClient";
import { useUserRole } from "@/hooks/useUserRole";
import { HelpModal } from "@/components/HelpModal";

const Index = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const { isAdmin, loading } = useUserRole();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      setIsAuthenticated(!!session);
    };
    
    checkAuth();

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAdminClick = () => {
    if (isAuthenticated && isAdmin) {
      navigate('/admin');
    } else if (isAuthenticated && !isAdmin) {
      navigate('/login');
    } else {
      navigate('/login');
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[hsl(35,45%,96%)] via-[hsl(40,50%,92%)] to-[hsl(30,50%,88%)] grain-texture safe-bottom">
      {/* Improved gradient orbs with reduced opacity and better blend */}
      <div
        className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle at center, hsl(var(--primary) / 0.3) 0%, transparent 70%)",
          filter: "blur(80px)",
          mixBlendMode: "screen",
          animation: "float 20s ease-in-out infinite"
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-[32rem] h-[32rem] rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle at center, hsl(var(--accent) / 0.25) 0%, transparent 70%)",
          filter: "blur(80px)",
          mixBlendMode: "screen",
          animation: "float 25s ease-in-out infinite reverse"
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle at center, hsl(var(--primary) / 0.2) 0%, transparent 70%)",
          filter: "blur(80px)",
          mixBlendMode: "screen",
          animation: "float 30s ease-in-out infinite"
        }}
      />

      {/* Decorative geometric shapes - subtle */}
      <div className="absolute top-20 right-20 w-32 h-32 border border-primary/10 rounded-full animate-spin-slow opacity-30" />
      <div className="absolute bottom-32 left-32 w-24 h-24 border border-accent/10 rounded-lg rotate-45 animate-pulse opacity-30" />
      
      {/* Floating Help Button */}
      <Button
        onClick={() => setHelpModalOpen(true)}
        className="fixed bottom-20 right-6 sm:top-6 sm:right-6 sm:bottom-auto z-50 px-3 py-3 sm:px-4 sm:py-2 bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 hover:shadow-glow transition-all duration-300 group min-w-[44px] min-h-[44px] border-primary/50 bg-primary/10"
        aria-label="Apri guida - Informazioni su come usare la calcolatrice"
      >
        <HelpCircle className="h-5 w-5 sm:mr-2 text-primary group-hover:text-accent transition-colors" />
        <span className="text-foreground font-medium hidden sm:inline">Guida</span>
      </Button>
      
      {/* Floating Admin Button */}
      <Button
        onClick={handleAdminClick}
        disabled={loading}
        className={`fixed bottom-6 right-6 sm:top-20 sm:bottom-auto z-50 px-3 py-3 sm:px-4 sm:py-2 login-button-float bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 hover:shadow-glow transition-all duration-300 group min-w-[44px] min-h-[44px] ${
          isAdmin ? 'border-primary/50 bg-primary/10' : ''
        }`}
      >
        {loading ? (
          <div className="h-5 w-5 sm:mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        ) : isAdmin ? (
          <Shield className="h-5 w-5 sm:mr-2 text-primary group-hover:text-accent transition-colors" />
        ) : (
          <Lock className="h-5 w-5 sm:mr-2 text-primary group-hover:text-accent transition-colors" />
        )}
        <span className="text-foreground font-medium hidden sm:inline">
          {isAdmin ? 'Dashboard' : 'Admin'}
        </span>
      </Button>
      
      {/* Calculator with glassmorphism effect */}
      <div className="relative z-10">
        <Calculator />
      </div>

      {/* Help Modal */}
      <HelpModal 
        open={helpModalOpen} 
        onOpenChange={setHelpModalOpen}
        defaultTab="students"
      />
    </main>
  );
};

export default Index;
