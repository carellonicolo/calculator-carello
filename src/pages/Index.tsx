import { Calculator } from "@/components/Calculator";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[hsl(35,45%,96%)] via-[hsl(40,50%,92%)] to-[hsl(30,50%,88%)]">
      {/* Animated gradient orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full blur-3xl animate-pulse" 
           style={{ animation: "float 20s ease-in-out infinite" }} />
      <div className="absolute bottom-0 right-0 w-[32rem] h-[32rem] bg-gradient-to-tl from-accent/25 to-primary/25 rounded-full blur-3xl animate-pulse" 
           style={{ animation: "float 25s ease-in-out infinite reverse" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-3xl"
           style={{ animation: "float 30s ease-in-out infinite" }} />
      
      {/* Decorative geometric shapes */}
      <div className="absolute top-20 right-20 w-32 h-32 border-2 border-primary/20 rounded-full animate-spin-slow" />
      <div className="absolute bottom-32 left-32 w-24 h-24 border-2 border-accent/20 rounded-lg rotate-45 animate-pulse" />
      
      {/* Floating Login Button */}
      <Button
        onClick={() => navigate('/login')}
        className="fixed top-6 right-6 z-50 login-button-float bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 hover:shadow-glow transition-all duration-300 group"
        size="lg"
      >
        <Lock className="mr-2 h-5 w-5 text-primary group-hover:text-accent transition-colors" />
        <span className="text-foreground font-medium">Admin</span>
      </Button>
      
      {/* Calculator with glassmorphism effect */}
      <div className="relative z-10">
        <Calculator />
      </div>
    </div>
  );
};

export default Index;
