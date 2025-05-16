
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScraperConfig, ScrapingMode, ScrapeResult } from "@/types/scraper";
import { scraperService } from "@/services/scraperService";
import { useToast } from "@/hooks/use-toast";

export function WebScraperForm({ onScrapingComplete }: { onScrapingComplete: (result: ScrapeResult) => void }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<ScraperConfig>({
    url: "",
    requiresAuth: false,
    scrapingMode: ScrapingMode.FULL_PAGE,
    targetSelectors: "",
    prompts: [""]
  });

  const updateConfig = (updates: Partial<ScraperConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const addPrompt = () => {
    if (config.prompts) {
      updateConfig({ prompts: [...config.prompts, ""] });
    }
  };

  const updatePrompt = (index: number, value: string) => {
    if (config.prompts) {
      const newPrompts = [...config.prompts];
      newPrompts[index] = value;
      updateConfig({ prompts: newPrompts });
    }
  };

  const removePrompt = (index: number) => {
    if (config.prompts && config.prompts.length > 1) {
      const newPrompts = config.prompts.filter((_, i) => i !== index);
      updateConfig({ prompts: newPrompts });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!config.url) {
      toast({
        title: "Missing URL",
        description: "Please enter a URL to scrape",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await scraperService.scrapeWebsite(config);
      
      if (result.success) {
        toast({
          title: "Scraping Complete",
          description: "Website data has been successfully scraped",
        });
      } else {
        toast({
          title: "Scraping Failed",
          description: result.message,
          variant: "destructive"
        });
      }
      
      onScrapingComplete(result);
    } catch (error) {
      console.error("Error during scraping:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Web Scraper Configuration</CardTitle>
        <CardDescription>Configure the scraper settings and credentials</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="url">Target URL</Label>
              <Input
                id="url"
                placeholder="https://example.com"
                value={config.url}
                onChange={(e) => updateConfig({ url: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="requires-auth"
                checked={config.requiresAuth}
                onCheckedChange={(checked) => updateConfig({ requiresAuth: checked })}
              />
              <Label htmlFor="requires-auth">Requires Authentication</Label>
            </div>

            {config.requiresAuth && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Username"
                    value={config.username || ""}
                    onChange={(e) => updateConfig({ username: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={config.password || ""}
                    onChange={(e) => updateConfig({ password: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            <div className="pt-4">
              <Label>Scraping Mode</Label>
              <Tabs 
                defaultValue={config.scrapingMode} 
                onValueChange={(value) => updateConfig({ scrapingMode: value as ScrapingMode })}
                className="mt-2"
              >
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value={ScrapingMode.FULL_PAGE}>Full Page</TabsTrigger>
                  <TabsTrigger value={ScrapingMode.TARGETED}>Targeted</TabsTrigger>
                  <TabsTrigger value={ScrapingMode.PROMPT_BASED}>Prompt Based</TabsTrigger>
                </TabsList>
                
                <TabsContent value={ScrapingMode.FULL_PAGE} className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    Scrapes the entire content of the webpage.
                  </p>
                </TabsContent>
                
                <TabsContent value={ScrapingMode.TARGETED} className="pt-4">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Extracts specific elements from the webpage based on CSS selectors.
                    </p>
                    <div>
                      <Label htmlFor="target-selectors">CSS Selectors (comma separated)</Label>
                      <Textarea
                        id="target-selectors"
                        placeholder=".main-content, h1, .article p"
                        value={config.targetSelectors || ""}
                        onChange={(e) => updateConfig({ targetSelectors: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value={ScrapingMode.PROMPT_BASED} className="pt-4">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Uses AI to extract specific information based on prompts.
                    </p>
                    
                    {config.prompts?.map((prompt, index) => (
                      <div key={index} className="flex space-x-2">
                        <Textarea
                          placeholder={`Prompt ${index + 1}: e.g., "Extract all product prices"`}
                          value={prompt}
                          onChange={(e) => updatePrompt(index, e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removePrompt(index)}
                          disabled={config.prompts?.length === 1}
                        >
                          <span className="sr-only">Remove prompt</span>
                          ✕
                        </Button>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addPrompt}
                      className="w-full"
                    >
                      Add Prompt
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading || !config.url}
          className="w-full"
        >
          {isLoading ? "Scraping..." : "Start Scraping"}
        </Button>
      </CardFooter>
    </Card>
  );
}
