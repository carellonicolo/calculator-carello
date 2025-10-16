import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";

type Setting = {
  id: string;
  function_key: string;
  function_name: string;
  category: string;
  is_enabled: boolean;
};

type GroupedSettings = {
  [category: string]: Setting[];
};

export const AdminDashboard = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchSettings();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('calculator_settings')
      .select('*')
      .order('category', { ascending: true })
      .order('function_name', { ascending: true });
    
    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare le impostazioni",
        variant: "destructive",
      });
      console.error(error);
    } else {
      setSettings(data || []);
    }
    setLoading(false);
  };

  const toggleSetting = async (id: string, currentValue: boolean) => {
    const { error } = await supabase
      .from('calculator_settings')
      .update({ is_enabled: !currentValue })
      .eq('id', id);
    
    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare l'impostazione",
        variant: "destructive",
      });
      console.error(error);
    } else {
      setSettings(settings.map(s => 
        s.id === id ? { ...s, is_enabled: !currentValue } : s
      ));
      toast({
        title: "Aggiornato",
        description: "Impostazione modificata con successo",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const groupedSettings: GroupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as GroupedSettings);

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'conversions':
        return 'Conversioni di Base';
      case 'scientific':
        return 'Funzioni Scientifiche';
      default:
        return category;
    }
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'conversions':
        return 'Gestisci le conversioni tra diverse basi numeriche (binario, ottale, esadecimale)';
      case 'scientific':
        return 'Gestisci le funzioni scientifiche avanzate della calcolatrice';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[hsl(var(--admin-bg))]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--admin-bg))] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard Amministrativa</h1>
              <p className="text-muted-foreground">Gestione Funzionalità Calcolatrice</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" className="gap-2">
            <LogOut className="h-4 w-4" />
            Esci
          </Button>
        </div>

        <div className="grid gap-6">
          {Object.entries(groupedSettings).map(([category, categorySettings]) => (
            <Card key={category} className="bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))]">
              <CardHeader>
                <CardTitle className="text-xl">{getCategoryTitle(category)}</CardTitle>
                <CardDescription>{getCategoryDescription(category)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categorySettings.map((setting) => (
                    <div
                      key={setting.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                    >
                      <div className="flex-1">
                        <Label
                          htmlFor={setting.id}
                          className="text-base font-medium cursor-pointer"
                        >
                          {setting.function_name}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Chiave: {setting.function_key}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-sm font-semibold ${
                            setting.is_enabled ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {setting.is_enabled ? "Abilitato" : "Disabilitato"}
                        </span>
                        <Switch
                          id={setting.id}
                          checked={setting.is_enabled}
                          onCheckedChange={() => toggleSetting(setting.id, setting.is_enabled)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-6 bg-[hsl(var(--admin-card))] rounded-lg border border-[hsl(var(--admin-border))]">
          <h3 className="text-lg font-semibold mb-2">ℹ️ Informazioni</h3>
          <p className="text-sm text-muted-foreground">
            Le modifiche alle impostazioni vengono applicate immediatamente alla calcolatrice pubblica.
            Gli studenti vedranno o non vedranno le funzioni in base allo stato qui configurato.
          </p>
        </div>
      </div>
    </div>
  );
};
