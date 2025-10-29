import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calculator, Atom, Code2, Lightbulb, Zap, Sparkles } from "lucide-react";

export const StudentGuide = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Intro Section */}
      <div className="text-center space-y-3 py-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          🚀 Benvenuto nella Calcolatrice Smart!
        </h2>
        <p className="text-lg text-muted-foreground">
          Hey! 👋 Sei pronto a fare calcoli come un pro?<br />
          Questa non è una calcolatrice qualsiasi - è il tuo <strong>assistente matematico personale</strong>!
        </p>
      </div>

      {/* Three Modes Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Le 3 Modalità Magiche
        </h3>
        
        <div className="grid gap-4 md:grid-cols-3">
          {/* Standard Mode */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500 rounded-xl">
                  <Calculator className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-blue-900 dark:text-blue-100">Standard</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <CardDescription className="text-blue-800 dark:text-blue-200">
                <strong>Operazioni base:</strong> +, -, ×, ÷
              </CardDescription>
              <div className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
                <p><strong>Ideale per:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Compiti quotidiani</li>
                  <li>Shopping math</li>
                  <li>Split del conto</li>
                </ul>
              </div>
              <div className="bg-blue-200 dark:bg-blue-800 p-3 rounded-lg">
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Tip: Usa il tasto <code className="bg-blue-300 dark:bg-blue-700 px-2 py-1 rounded">%</code> per percentuali!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Scientific Mode */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800 hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500 rounded-xl">
                  <Atom className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-purple-900 dark:text-purple-100">Scientifica</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <CardDescription className="text-purple-800 dark:text-purple-200">
                <strong>Funzioni avanzate:</strong> sin, cos, tan, log, potenze
              </CardDescription>
              <div className="text-sm space-y-1 text-purple-700 dark:text-purple-300">
                <p><strong>Ideale per:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Fisica & Chimica</li>
                  <li>Matematica avanzata</li>
                  <li>Geometria & Trigonometria</li>
                </ul>
              </div>
              <div className="bg-purple-200 dark:bg-purple-800 p-3 rounded-lg">
                <p className="text-xs font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Tip: Combina le funzioni per equazioni complesse!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Programmer Mode */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800 hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500 rounded-xl">
                  <Code2 className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-green-900 dark:text-green-100">Programmatore</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <CardDescription className="text-green-800 dark:text-green-200">
                <strong>Conversioni di base:</strong> binario, ottale, esadecimale
              </CardDescription>
              <div className="text-sm space-y-1 text-green-700 dark:text-green-300">
                <p><strong>Ideale per:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Informatica</li>
                  <li>Elettronica</li>
                  <li>Coding & Debugging</li>
                </ul>
              </div>
              <div className="bg-green-200 dark:bg-green-800 p-3 rounded-lg">
                <p className="text-xs font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Tip: Perfetto per conversioni rapide!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Tips Section */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950 border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
            <Zap className="h-6 w-6 text-orange-500" />
            💡 Tips & Tricks Utili
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
              <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">⌨️ Shortcuts Tastiera</h4>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• <code className="bg-muted px-2 py-1 rounded">Enter</code> - Calcola il risultato</li>
                <li>• <code className="bg-muted px-2 py-1 rounded">Esc</code> - Cancella tutto</li>
                <li>• <code className="bg-muted px-2 py-1 rounded">↑</code> - Richiama ultimo calcolo</li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
              <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">🎯 Pro Tips</h4>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Usa le parentesi per operazioni complesse</li>
                <li>• Cambia modalità con i tab in alto</li>
                <li>• I risultati sono sempre precisi al massimo</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          ❓ Domande Frequenti (FAQ)
        </h3>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-left hover:text-primary transition-colors">
              Come cambio modalità di calcolo?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Facilissimo! Guarda in alto nella calcolatrice: troverai tre tab (<strong>Standard</strong>, <strong>Scientifica</strong>, <strong>Programmatore</strong>). 
              Clicca sul tab che ti serve e la calcolatrice cambierà immediatamente modalità con tutte le funzioni specifiche.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="text-left hover:text-primary transition-colors">
              Posso copiare i risultati dei calcoli?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Certamente! Puoi selezionare il risultato nel display e copiarlo con <code className="bg-muted px-2 py-1 rounded">Ctrl+C</code> (o <code className="bg-muted px-2 py-1 rounded">Cmd+C</code> su Mac). 
              Puoi anche cliccare sul display per selezionare tutto il testo automaticamente.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="text-left hover:text-primary transition-colors">
              Ci sono limiti di calcolo o restrizioni?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              La calcolatrice può gestire numeri molto grandi e piccoli (fino a ±10<sup>308</sup>). 
              Alcune funzioni potrebbero essere disabilitate dal tuo insegnante per esercitazioni specifiche - 
              se non vedi una funzione che cerchi, è probabilmente disabilitata temporaneamente per scopi didattici.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="text-left hover:text-primary transition-colors">
              Come funzionano le conversioni in modalità Programmatore?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Inserisci un numero e vedrai automaticamente le conversioni in <strong>binario</strong> (base 2), 
              <strong>ottale</strong> (base 8) e <strong>esadecimale</strong> (base 16). 
              Puoi anche inserire numeri direttamente in queste basi usando i prefissi: 
              <code className="bg-muted px-2 py-1 rounded mx-1">0b</code> per binario, 
              <code className="bg-muted px-2 py-1 rounded mx-1">0o</code> per ottale, e 
              <code className="bg-muted px-2 py-1 rounded mx-1">0x</code> per esadecimale.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger className="text-left hover:text-primary transition-colors">
              Perché alcune funzioni sono disattivate o non disponibili?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Il tuo insegnante può personalizzare quali funzioni sono disponibili in base agli obiettivi della lezione. 
              Per esempio, durante un test potrebbe disabilitare le funzioni avanzate per verificare che tu sappia 
              fare i calcoli base. Non preoccuparti, è tutto parte del processo di apprendimento! 😊
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Final Motivation */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="pt-6 text-center space-y-2">
          <p className="text-lg font-semibold">🎉 Sei pronto a fare calcoli da campione!</p>
          <p className="text-sm text-muted-foreground">
            Ricorda: la matematica è uno strumento potente. Usa la calcolatrice per controllare i tuoi calcoli 
            e per imparare, non solo per avere la risposta veloce!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
