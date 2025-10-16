import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, Power } from "lucide-react";
import { Calculator } from "./Calculator";

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
  const [calculatorEnabled, setCalculatorEnabled] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchSettings();
    fetchGlobalSettings();
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

  const fetchGlobalSettings = async () => {
    const { data, error } = await supabase
      .from('global_settings')
      .select('setting_value')
      .eq('setting_key', 'calculator_enabled')
      .single();
    
    if (error) {
      console.error('Error fetching global settings:', error);
    } else {
      setCalculatorEnabled(data?.setting_value ?? true);
    }
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

  const toggleGlobalCalculator = async () => {
    const newValue = !calculatorEnabled;
    const { error } = await supabase
      .from('global_settings')
      .update({ setting_value: newValue })
      .eq('setting_key', 'calculator_enabled');
    
    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare lo stato della calcolatrice",
        variant: "destructive",
      });
      console.error(error);
    } else {
      setCalculatorEnabled(newValue);
      toast({
        title: newValue ? "Calcolatrice Abilitata" : "Calcolatrice Disabilitata",
        description: newValue 
          ? "La calcolatrice è ora visibile e utilizzabile dagli utenti" 
          : "La calcolatrice è stata disabilitata per tutti gli utenti",
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
    <div className="min-h-screen bg-[hsl(var(--admin-bg))]">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Control Panel */}
        <div className="lg:w-1/2 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <Settings className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard Admin</h1>
                  <p className="text-sm text-muted-foreground">Gestione Calcolatrice</p>
                </div>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm" className="gap-2">
                <LogOut className="h-4 w-4" />
                Esci
              </Button>
            </div>

            {/* Global Toggle Card */}
            <Card className="mb-6 bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))] border-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${calculatorEnabled ? 'bg-primary/20' : 'bg-destructive/20'}`}>
                    <Power className={`h-6 w-6 ${calculatorEnabled ? 'text-primary' : 'text-destructive'}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl">Stato Calcolatrice</CardTitle>
                    <CardDescription>
                      {calculatorEnabled 
                        ? "La calcolatrice è attiva e disponibile per tutti gli utenti" 
                        : "La calcolatrice è disabilitata per tutti gli utenti"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg bg-background/50">
                  <div className="flex items-center gap-3">
                    <span className={`inline-block w-3 h-3 rounded-full ${calculatorEnabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <Label className="text-base font-semibold cursor-pointer" htmlFor="global-toggle">
                      {calculatorEnabled ? "🟢 Abilitata" : "🔴 Disabilitata"}
                    </Label>
                  </div>
                  <Switch
                    id="global-toggle"
                    checked={calculatorEnabled}
                    onCheckedChange={toggleGlobalCalculator}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Individual Function Settings */}
            <div className="grid gap-6">
              {Object.entries(groupedSettings).map(([category, categorySettings]) => (
                <Card key={category} className="bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))]">
                  <CardHeader>
                    <CardTitle className="text-lg">{getCategoryTitle(category)}</CardTitle>
                    <CardDescription className="text-sm">{getCategoryDescription(category)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categorySettings.map((setting) => (
                        <div
                          key={setting.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                        >
                          <div className="flex-1">
                            <Label
                              htmlFor={setting.id}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {setting.function_name}
                            </Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {setting.function_key}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-semibold ${
                                setting.is_enabled ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {setting.is_enabled ? "ON" : "OFF"}
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

            <div className="mt-6 p-4 bg-[hsl(var(--admin-card))] rounded-lg border border-[hsl(var(--admin-border))]">
              <h3 className="text-sm font-semibold mb-1.5 flex items-center gap-2">
                ℹ️ Informazioni
              </h3>
              <p className="text-xs text-muted-foreground">
                Le modifiche vengono applicate in tempo reale. Usa l'anteprima a destra per testare.
              </p>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="lg:w-1/2 bg-calculator-bg border-l border-[hsl(var(--admin-border))]">
          <div className="sticky top-0 p-4 bg-calculator-bg/95 backdrop-blur-sm border-b border-[hsl(var(--admin-border))] lg:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="w-full"
            >
              {showPreview ? "Nascondi" : "Mostra"} Anteprima
            </Button>
          </div>
          
          <div className={`${showPreview ? 'block' : 'hidden lg:block'} h-full flex items-center justify-center p-4`}>
            <div className="w-full max-w-md">
              <div className="mb-4 text-center">
                <h2 className="text-calculator-text font-semibold text-sm">Anteprima Live</h2>
                <p className="text-calculator-text/60 text-xs">Vedi le modifiche in tempo reale</p>
              </div>
              <Calculator />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
