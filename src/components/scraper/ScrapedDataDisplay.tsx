
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrapedData, ScrapingMode } from "@/types/scraper";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ScrapedDataDisplayProps {
  data: ScrapedData | null;
  allData: ScrapedData[];
  onQueryData: (query: string) => void;
}

export function ScrapedDataDisplay({ data, allData, onQueryData }: ScrapedDataDisplayProps) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    onQueryData(query);
  };

  const copyContent = (content: string | Record<string, any>) => {
    const contentToCopy = typeof content === "string" ? content : JSON.stringify(content, null, 2);
    navigator.clipboard.writeText(contentToCopy);
    toast({
      title: "Copied to clipboard",
      description: "Content has been copied to clipboard"
    });
  };

  const renderDataContent = (item: ScrapedData) => {
    const { content, mode } = item;
    
    if (typeof content === "string") {
      if (mode === ScrapingMode.FULL_PAGE) {
        // For HTML content, show first 300 characters to avoid overwhelming display
        const previewContent = content.length > 300 
          ? content.substring(0, 300) + "..." 
          : content;
          
        return (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">HTML Content Preview:</p>
            <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-[150px]">
              {previewContent}
            </pre>
          </div>
        );
      }
      return <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-[200px]">{content}</pre>;
    } else {
      return (
        <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-[200px]">
          {JSON.stringify(content, null, 2)}
        </pre>
      );
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Query Scraped Data</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Search in scraped data..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Latest Scrape Result</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyContent(data.content)}
              >
                Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">URL:</span>
                  <p className="font-medium truncate">{data.url}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Timestamp:</span>
                  <p className="font-medium">{new Date(data.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Mode:</span>
                  <p className="font-medium capitalize">{data.mode.replace("_", " ")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">ID:</span>
                  <p className="font-medium">{data.id}</p>
                </div>
              </div>
              
              <div>
                <span className="text-muted-foreground text-sm">Content:</span>
                {renderDataContent(data)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {allData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>All Scraped Data ({allData.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {allData.map((item) => (
                  <Card key={item.id} className="bg-secondary">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-medium truncate">{item.url}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.timestamp).toLocaleString()} - 
                            <span className="ml-1 capitalize">{item.mode.replace("_", " ")}</span>
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyContent(item.content)}
                        >
                          Copy
                        </Button>
                      </div>
                      <div className="mt-2">
                        {renderDataContent(item)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
