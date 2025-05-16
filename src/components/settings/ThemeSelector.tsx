
import { Moon, Palette, Sun } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Theme = "light" | "dark" | "system";

interface ThemeSelectorProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function ThemeSelector({ currentTheme, onThemeChange }: ThemeSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Settings</CardTitle>
        <CardDescription>
          Customize the appearance of your Agent Hub
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label>Select Theme</Label>
          <ToggleGroup
            type="single"
            value={currentTheme}
            onValueChange={(value) => value && onThemeChange(value as Theme)}
            className="justify-start"
          >
            <ToggleGroupItem value="light" aria-label="Light Mode">
              <Sun className="h-4 w-4 mr-2" />
              Light
            </ToggleGroupItem>
            <ToggleGroupItem value="dark" aria-label="Dark Mode">
              <Moon className="h-4 w-4 mr-2" />
              Dark
            </ToggleGroupItem>
            <ToggleGroupItem value="system" aria-label="System Theme">
              <Palette className="h-4 w-4 mr-2" />
              System
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardContent>
    </Card>
  );
}
