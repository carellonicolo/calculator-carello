import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Settings2, Shield, Zap, CheckCircle, XCircle, AlertCircle, Lightbulb, BookOpen } from "lucide-react";

export const TeacherGuide = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Intro Section */}
      <div className="text-center space-y-3 py-4">
        <h2 className="text-3xl font-bold text-foreground">
          🎛️ Pannello di Controllo Admin
        </h2>
        <p className="text-lg text-muted-foreground">
          Benvenuto nel centro di comando! Da qui gestisci ogni aspetto della calcolatrice<br />
          per adattarla perfettamente alle tue esigenze didattiche.
        </p>
      </div>

      {/* Dashboard Overview */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-6 w-6 text-primary" />
            Panoramica Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            La dashboard amministrativa ti permette di controllare in tempo reale quali funzionalità 
            della calcolatrice sono disponibili per i tuoi studenti. Le modifiche si applicano <strong>istantaneamente</strong> 
            a tutti gli utenti senza necessità di ricaricare la pagina.
          </p>
          
          <div className="grid gap-3 md:grid-cols-3">
            <div className="p-4 bg-background rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <h4 className="font-semibold">Controllo Globale</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Abilita/disabilita l'intera calcolatrice con un solo click
              </p>
            </div>
            
            <div className="p-4 bg-background rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <h4 className="font-semibold">Gestione Modalità</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Attiva/disattiva singole modalità di calcolo
              </p>
            </div>
            
            <div className="p-4 bg-background rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Settings2 className="h-5 w-5 text-blue-500" />
                <h4 className="font-semibold">Funzioni Granulari</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Controllo fine su ogni singola funzione
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mode Management Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          📊 Gestione delle Modalità
        </h3>
        
        <div className="grid gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">🔢 Modalità Standard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Contiene:</strong> Operazioni aritmetiche base (+, -, ×, ÷), percentuali, decimali</p>
              <p><strong>Consigliata per:</strong> Scuola primaria, verifiche di base, esercizi introduttivi</p>
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  <strong>Tip:</strong> Ideale come punto di partenza per tutti i livelli
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">⚛️ Modalità Scientifica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Contiene:</strong> Funzioni trigonometriche, logaritmi, potenze, radici, costanti matematiche</p>
              <p><strong>Consigliata per:</strong> Scuola media superiore, liceo, corsi scientifici</p>
              <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-xs text-purple-900 dark:text-purple-100 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  <strong>Tip:</strong> Puoi disabilitare singole funzioni per esercizi mirati
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">💻 Modalità Programmatore</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Contiene:</strong> Conversioni binario/ottale/esadecimale, operazioni bitwise (AND, OR, XOR, NOT)</p>
              <p><strong>Consigliata per:</strong> Informatica, elettronica, corsi di programmazione</p>
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-900 dark:text-green-100 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  <strong>Tip:</strong> Utile per corsi STEM e preparazione a certificazioni
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Feature Management Best Practices */}
      <Card className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
            <BookOpen className="h-6 w-6" />
            📈 Best Practice per la Configurazione
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
              <div>
                <h4 className="font-semibold text-orange-900 dark:text-orange-100">Inizia Restrittivo</h4>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Disabilita inizialmente le funzionalità avanzate e abilitale gradualmente in base al progresso della classe.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
              <div>
                <h4 className="font-semibold text-orange-900 dark:text-orange-100">Adatta per Livello</h4>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Configura le modalità in base al livello scolastico: Standard per primaria, Scientifica per superiori, Programmatore per informatica.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
              <div>
                <h4 className="font-semibold text-orange-900 dark:text-orange-100">Monitora l'Utilizzo</h4>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Osserva quali funzioni vengono usate di più e adatta la configurazione di conseguenza.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">4</div>
              <div>
                <h4 className="font-semibold text-orange-900 dark:text-orange-100">Comunica le Limitazioni</h4>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Informa sempre gli studenti quando disabiliti funzionalità, spiegando il motivo didattico.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Use Cases Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          💡 Scenari d'Uso Pratici
        </h3>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="scenario-1">
            <AccordionTrigger className="text-left hover:text-primary">
              📝 Scenario 1: Verifica in Classe (Solo Calcoli Base)
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-muted-foreground">
                Durante una verifica scritta vuoi che gli studenti usino solo operazioni aritmetiche base.
              </p>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="font-semibold text-sm">Configurazione Consigliata:</p>
                <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                  <li><CheckCircle className="inline h-4 w-4 text-green-500" /> Abilita: Modalità Standard</li>
                  <li><XCircle className="inline h-4 w-4 text-red-500" /> Disabilita: Modalità Scientifica</li>
                  <li><XCircle className="inline h-4 w-4 text-red-500" /> Disabilita: Modalità Programmatore</li>
                  <li><CheckCircle className="inline h-4 w-4 text-green-500" /> Mantieni: Solo +, -, ×, ÷, %</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="scenario-2">
            <AccordionTrigger className="text-left hover:text-primary">
              🔬 Scenario 2: Laboratorio di Fisica (Funzioni Scientifiche Complete)
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-muted-foreground">
                Durante un laboratorio di fisica gli studenti hanno bisogno di tutte le funzioni scientifiche per analizzare i dati.
              </p>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="font-semibold text-sm">Configurazione Consigliata:</p>
                <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                  <li><CheckCircle className="inline h-4 w-4 text-green-500" /> Abilita: Modalità Scientifica (tutte le funzioni)</li>
                  <li><CheckCircle className="inline h-4 w-4 text-green-500" /> Mantieni: Modalità Standard come fallback</li>
                  <li><XCircle className="inline h-4 w-4 text-red-500" /> Disabilita: Modalità Programmatore (non necessaria)</li>
                  <li><CheckCircle className="inline h-4 w-4 text-green-500" /> Includi: sin, cos, tan, log, exp, potenze</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="scenario-3">
            <AccordionTrigger className="text-left hover:text-primary">
              💻 Scenario 3: Corso di Informatica (Focus su Conversioni)
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-muted-foreground">
                In un corso di informatica gli studenti devono imparare le conversioni tra basi numeriche diverse.
              </p>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="font-semibold text-sm">Configurazione Consigliata:</p>
                <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                  <li><CheckCircle className="inline h-4 w-4 text-green-500" /> Abilita: Modalità Programmatore (priorità)</li>
                  <li><CheckCircle className="inline h-4 w-4 text-green-500" /> Focus su: Conversioni binario, ottale, esadecimale</li>
                  <li><CheckCircle className="inline h-4 w-4 text-green-500" /> Includi: Operazioni bitwise (AND, OR, XOR, NOT)</li>
                  <li><AlertCircle className="inline h-4 w-4 text-yellow-500" /> Opzionale: Modalità Standard per calcoli ausiliari</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="scenario-4">
            <AccordionTrigger className="text-left hover:text-primary">
              🎓 Scenario 4: Esame di Maturità (Configurazione Mista)
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-muted-foreground">
                Durante l'esame di maturità gli studenti hanno bisogno di funzioni scientifiche ma con alcune limitazioni.
              </p>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="font-semibold text-sm">Configurazione Consigliata:</p>
                <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                  <li><CheckCircle className="inline h-4 w-4 text-green-500" /> Abilita: Modalità Standard + Scientifica</li>
                  <li><AlertCircle className="inline h-4 w-4 text-yellow-500" /> Disabilita: Funzioni di memoria e storage</li>
                  <li><XCircle className="inline h-4 w-4 text-red-500" /> Disabilita: Modalità Programmatore</li>
                  <li><CheckCircle className="inline h-4 w-4 text-green-500" /> Mantieni: Solo funzioni essenziali per materie scientifiche</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Real-Time Updates */}
      <Card className="border-2 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-green-500" />
            ⚡ Sincronizzazione in Tempo Reale
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground">
            Tutte le modifiche che effettui nella dashboard si applicano <strong>immediatamente</strong> a tutti gli studenti 
            che stanno usando la calcolatrice. Non c'è bisogno che ricarichino la pagina.
          </p>
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-900 dark:text-green-100">
              <strong>Come funziona:</strong> Il sistema verifica automaticamente ogni 30 secondi se ci sono aggiornamenti 
              alle impostazioni. Quando cambi una configurazione, tutti i client riceveranno l'aggiornamento 
              entro 30 secondi e adatteranno l'interfaccia di conseguenza.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card className="border-2 border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-red-500" />
            🔒 Sicurezza e Autenticazione
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground">
            Solo gli utenti con ruolo <strong>admin</strong> possono accedere alla dashboard amministrativa. 
            Il sistema utilizza Supabase Auth per garantire la sicurezza.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Autenticazione sicura</strong> - Sistema basato su JWT tokens
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Ruoli separati</strong> - Admin e studenti hanno accessi diversi
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong>RLS Policies</strong> - Row Level Security per protezione dati
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Final Tips */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="pt-6 space-y-3">
          <h4 className="font-semibold text-lg flex items-center gap-2">
            💼 Suggerimenti Finali per Insegnanti
          </h4>
          <ul className="text-sm space-y-2 text-muted-foreground list-disc list-inside">
            <li>Sperimenta con diverse configurazioni prima di usarle in classe</li>
            <li>Salva mentalmente le configurazioni che funzionano meglio per ogni scenario</li>
            <li>Comunica sempre agli studenti le limitazioni attive e il motivo didattico</li>
            <li>Usa la funzione "Attiva Tutto" / "Disattiva Tutto" per reset rapidi</li>
            <li>Monitora l'uso della calcolatrice per identificare aree di difficoltà</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
