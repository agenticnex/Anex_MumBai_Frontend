
import { ScraperConfig, ScrapedData, ScrapeResult, ScrapingMode } from "@/types/scraper";

// Mock database for storing scraped data
// This would be replaced with actual PostgreSQL calls
const mockDatabase: ScrapedData[] = [];

export const scraperService = {
  /**
   * Scrape a website based on the provided configuration
   */
  async scrapeWebsite(config: ScraperConfig): Promise<ScrapeResult> {
    try {
      console.log("Starting web scrape with config:", config);
      
      // In a real implementation, this would call a backend API
      // For now, we'll simulate the scraping process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockContent = getMockContent(config);
      
      const scrapedData: ScrapedData = {
        id: generateId(),
        url: config.url,
        timestamp: new Date().toISOString(),
        mode: config.scrapingMode,
        content: mockContent
      };
      
      // Save to our mock database
      mockDatabase.push(scrapedData);
      
      return {
        success: true,
        message: "Scraping completed successfully",
        data: scrapedData
      };
    } catch (error) {
      console.error("Error during scraping:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "An unknown error occurred"
      };
    }
  },
  
  /**
   * Get all scraped data
   */
  async getAllScrapedData(): Promise<ScrapedData[]> {
    return [...mockDatabase];
  },
  
  /**
   * Get scraped data by query
   */
  async queryScrapedData(query: string): Promise<ScrapedData[]> {
    const lowerQuery = query.toLowerCase();
    return mockDatabase.filter(item => {
      if (typeof item.content === 'string') {
        return item.content.toLowerCase().includes(lowerQuery);
      } else {
        return JSON.stringify(item.content).toLowerCase().includes(lowerQuery);
      }
    });
  }
};

// Helper functions
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function getMockContent(config: ScraperConfig): string | Record<string, any> {
  switch (config.scrapingMode) {
    case ScrapingMode.FULL_PAGE:
      return `<html><body><h1>Example Page for ${config.url}</h1><p>This is a simulated full page scrape result for the URL: ${config.url}</p><div class="content">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nisl nunc quis nisl.</div></body></html>`;
      
    case ScrapingMode.TARGETED:
      return {
        title: `Example Page for ${config.url}`,
        mainContent: "This is the main content that was targeted based on the selector.",
        metadata: {
          description: "Example page description",
          author: "John Doe",
          lastUpdated: new Date().toISOString()
        }
      };
      
    case ScrapingMode.PROMPT_BASED:
      const promptResults: Record<string, string> = {};
      (config.prompts || []).forEach((prompt, index) => {
        promptResults[`prompt_${index+1}`] = `Result for prompt: "${prompt}" from ${config.url}`;
      });
      return promptResults;
      
    default:
      return "No content scraped";
  }
}
