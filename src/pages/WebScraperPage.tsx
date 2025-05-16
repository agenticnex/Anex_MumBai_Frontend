
import { useState, useEffect } from "react";
import { ScrapedData, ScrapeResult } from "@/types/scraper";
import { WebScraperForm } from "@/components/scraper/WebScraperForm";
import { ScrapedDataDisplay } from "@/components/scraper/ScrapedDataDisplay";
import { scraperService } from "@/services/scraperService";
import { useToast } from "@/hooks/use-toast";

const WebScraperPage = () => {
  const { toast } = useToast();
  const [latestResult, setLatestResult] = useState<ScrapedData | null>(null);
  const [allData, setAllData] = useState<ScrapedData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await scraperService.getAllScrapedData();
      setAllData(data);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load scraped data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScrapingComplete = (result: ScrapeResult) => {
    if (result.success && result.data) {
      setLatestResult(result.data);
      loadData();
    }
  };

  const handleQueryData = async (query: string) => {
    setIsLoading(true);
    try {
      let data;
      if (query.trim() === "") {
        data = await scraperService.getAllScrapedData();
      } else {
        data = await scraperService.queryScrapedData(query);
      }
      
      setAllData(data);
      
      toast({
        title: `${data.length} results found`,
        description: query ? `For query: "${query}"` : "Showing all data",
      });
    } catch (error) {
      console.error("Error querying data:", error);
      toast({
        title: "Error",
        description: "Failed to query scraped data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Web Scraper Agent</h1>
        <p className="text-muted-foreground">
          Extract data from websites with customizable settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <WebScraperForm onScrapingComplete={handleScrapingComplete} />
        </div>
        <div>
          {isLoading ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Loading data...</p>
            </div>
          ) : (
            <ScrapedDataDisplay
              data={latestResult}
              allData={allData}
              onQueryData={handleQueryData}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default WebScraperPage;
