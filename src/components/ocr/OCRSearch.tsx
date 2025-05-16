
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { OCRResult, ocrService } from "@/services/ocrService";

interface OCRSearchProps {
  onSearchResults: (results: OCRResult[]) => void;
}

export const OCRSearch = ({ onSearchResults }: OCRSearchProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const searchInData = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Empty search query",
        description: "Please enter a search term",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      const results = await ocrService.queryProcessedData(searchQuery);
      onSearchResults(results);
      
      toast({
        title: "Search results",
        description: `Found ${results.length} matching documents`,
      });
    } catch (error) {
      console.error("Error searching data:", error);
      toast({
        title: "Search failed",
        description: "An error occurred while searching",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Card className="border-indigo-500/20 shadow-lg shadow-indigo-500/10">
      <CardHeader className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Search className="h-6 w-6 text-indigo-400" />
          Search & Results
        </CardTitle>
        <CardDescription>
          Search for specific information in processed files
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input 
                placeholder="Search by name, ID, or document content..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={searchInData}
                disabled={isSearching}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Search className="h-4 w-4 mr-2" />
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
