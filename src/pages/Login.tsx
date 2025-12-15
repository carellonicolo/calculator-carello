import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabaseClient } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Lock, ArrowLeft, Loader2 } from "lucide-react";
import { z } from "zod";
import { withRetry } from "@/lib/supabaseRetry";

// Input validation schema for login form
const loginSchema = z.object({
  email: z.string()
    .trim()
    .min(1, { message: "Email richiesta" })
    .email({ message: "Formato email non valido" })
    .max(255, { message: "Email troppo lunga" }),
  password: z.string()
    .min(6, { message: "Password deve essere di almeno 6 caratteri" })
    .max(72, { message: "Password troppo lunga" })
});

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs before making API call
      const validationResult = loginSchema.safeParse({
        email: email.trim(),
        password
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: "Errore di validazione",
          description: firstError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      console.log('🔐 Tentativo di login...');

      // Login con retry automatico
      const loginResult = await withRetry(
        async () => supabaseClient.auth.signInWithPassword({
          email: validationResult.data.email,
          password: validationResult.data.password,
        }),
        { maxRetries: 3, initialDelay: 1000 }
      );

      if (loginResult.error) {
        console.error('❌ Errore login:', loginResult.error);
        toast({
          title: "Errore di accesso",
          description: loginResult.error.message === "Failed to fetch" 
            ? "Impossibile connettersi al server. Riprova tra qualche istante."
            : loginResult.error.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      console.log('✓ Login effettuato, verifica permessi admin...');

      // Controlla se l'utente è admin con retry
      const adminCheckResult = await withRetry(
        async () => supabaseClient.rpc('is_admin'),
        { maxRetries: 3, initialDelay: 1000 }
      );

      if (adminCheckResult.error) {
        console.error('❌ Errore verifica admin:', adminCheckResult.error);
        toast({
          title: "Errore di verifica",
          description: "Impossibile verificare i permessi. Riprova.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      if (adminCheckResult.data === true) {
        console.log('✓ Utente admin verificato');
        toast({
          title: "Accesso effettuato",
          description: "Benvenuto nell'area amministrativa",
        });
        navigate("/admin");
      } else {
        console.warn('⚠ Utente non admin');
        toast({
          title: "Accesso negato",
          description: "Non hai i permessi di amministratore",
          variant: "destructive",
        });
        // Logout automatico se non admin
        await supabaseClient.auth.signOut();
        navigate("/");
      }
    } catch (error: any) {
      console.error('❌ Errore imprevisto durante login:', error);
      toast({
        title: "Errore di connessione",
        description: error?.message || "Si è verificato un errore. Riprova tra qualche istante.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Area Amministrativa</CardTitle>
          <CardDescription>
            Accedi per gestire le funzionalità della calcolatrice
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@esempio.it"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accesso in corso...
                </>
              ) : (
                "Accedi"
              )}
            </Button>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">oppure</span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full gap-2" 
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4" />
            Torna alla Calcolatrice
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
