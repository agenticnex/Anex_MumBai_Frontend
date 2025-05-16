
export interface ScraperConfig {
  url: string;
  requiresAuth: boolean;
  username?: string;
  password?: string;
  scrapingMode: ScrapingMode;
  targetSelectors?: string;
  prompts?: string[];
}

export enum ScrapingMode {
  FULL_PAGE = "full_page",
  TARGETED = "targeted",
  PROMPT_BASED = "prompt_based"
}

export interface ScrapedData {
  id: string;
  url: string;
  timestamp: string;
  mode: ScrapingMode;
  content: string | Record<string, any>;
}

export interface ScrapeResult {
  success: boolean;
  message: string;
  data?: ScrapedData;
}

export interface OCRConfig {
  extractionType: ExtractionType;
  searchFields?: string[];
  customPrompt?: string;
}

export enum ExtractionType {
  ALL = "all",
  CONTACT_INFO = "contact",
  CUSTOM = "custom"
}

export interface OCRData {
  id: string;
  fileName: string;
  fileType: string;
  timestamp: string;
  content: Record<string, any>;
}

export interface OCRResult {
  success: boolean;
  message: string;
  data?: OCRData;
}
