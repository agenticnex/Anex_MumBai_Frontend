
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { ThemeSelector } from "@/components/settings/ThemeSelector";

type Theme = "light" | "dark" | "system";

const SettingsPage = () => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [dbConnectionString, setDbConnectionString] = useState("");
  const [enableCache, setEnableCache] = useState(true);
  const [maxConcurrentScrapes, setMaxConcurrentScrapes] = useState("3");
  const [isLoading, setIsLoading] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    return (localStorage.getItem("theme") as Theme) || "system";
  });

  // Apply theme effect
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (currentTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(currentTheme);
    }
    
    localStorage.setItem("theme", currentTheme);
  }, [currentTheme]);

  // Handler for theme changes
  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    toast({
      title: "Theme Updated",
      description: `Theme has been set to ${theme} mode`,
    });
  };

  const handleSaveSettings = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Settings Saved",
        description: "Your settings have been updated successfully",
      });
    }, 1000);
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure your Agent Hub and applications
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ThemeSelector currentTheme={currentTheme} onThemeChange={handleThemeChange} />

        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>
              Configure third-party API keys and authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">Scraping API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Enter API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Used for accessing advanced scraping capabilities
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Connection</CardTitle>
            <CardDescription>
              Configure PostgreSQL database connection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="db-connection">Connection String</Label>
              <Input
                id="db-connection"
                type="password"
                placeholder="postgresql://user:password@localhost:5432/db"
                value={dbConnectionString}
                onChange={(e) => setDbConnectionString(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                PostgreSQL connection string for storing scraped data
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Scraping Settings</CardTitle>
            <CardDescription>
              Configure web scraping agent behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="cache">Enable Caching</Label>
                <p className="text-xs text-muted-foreground">
                  Cache scraped content to improve performance
                </p>
              </div>
              <Switch
                id="cache"
                checked={enableCache}
                onCheckedChange={setEnableCache}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="concurrent-scrapes">Maximum Concurrent Scrapes</Label>
              <Input
                id="concurrent-scrapes"
                type="number"
                min="1"
                max="10"
                value={maxConcurrentScrapes}
                onChange={(e) => setMaxConcurrentScrapes(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Limit the number of concurrent scraping operations
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSaveSettings} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
