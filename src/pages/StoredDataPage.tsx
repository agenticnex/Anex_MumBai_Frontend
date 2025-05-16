
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrapedData } from "@/types/scraper";
import { scraperService } from "@/services/scraperService";
import { useToast } from "@/hooks/use-toast";
import { ScrapedDataDisplay } from "@/components/scraper/ScrapedDataDisplay";

const StoredDataPage = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [scrapedData, setScrapedData] = useState<ScrapedData[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const data = await scraperService.getAllScrapedData();
      setScrapedData(data);
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

  const handleQueryData = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      let data;
      if (searchQuery.trim() === "") {
        data = await scraperService.getAllScrapedData();
      } else {
        data = await scraperService.queryScrapedData(searchQuery);
      }
      
      setScrapedData(data);
      
      toast({
        title: `${data.length} results found`,
        description: searchQuery ? `For query: "${searchQuery}"` : "Showing all data",
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
        <h1 className="text-3xl font-bold">Stored Data</h1>
        <p className="text-muted-foreground">
          View and query all data scraped from websites
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Query Database</CardTitle>
          <CardDescription>
            Search for specific content in your scraped data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Enter search query..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={() => handleQueryData(query)}
              disabled={isLoading}
            >
              {isLoading ? "Searching..." : "Search"}
            </Button>
            <Button 
              variant="outline" 
              onClick={loadAllData}
              disabled={isLoading}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Loading data...</p>
        </div>
      ) : (
        <>
          {scrapedData.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No scraped data available</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.href = "/"}
                >
                  Go to Web Scraper
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ScrapedDataDisplay 
              data={null} 
              allData={scrapedData} 
              onQueryData={handleQueryData} 
            />
          )}
        </>
      )}
    </div>
  );
};

export default StoredDataPage;
