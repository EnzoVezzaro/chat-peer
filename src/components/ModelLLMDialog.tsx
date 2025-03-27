import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Export types for reuse
export type BotProvider = 'openai' | 'claude' | 'grok' | 'groq';
export type BotSettings = {
  keys: Partial<Record<BotProvider, { apiKey: string }>>;
  selectedProvider: BotProvider | null;
};

export const BOT_SENDER_ID_PREFIX = 'bot-';

export const BOT_PROVIDERS: { value: BotProvider; label: string }[] = [
  { value: 'openai', label: 'OpenAI (ChatGPT)' },
  { value: 'claude', label: 'Anthropic (Claude)' },
  { value: 'grok', label: 'xAI (Grok)' },
  { value: 'groq', label: 'Groq' },
];

interface ModelLLMDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModelLLMDialog: React.FC<ModelLLMDialogProps> = ({ isOpen, onClose }) => {
  const [currentSettings, setCurrentSettings] = useState<BotSettings>({ keys: {}, selectedProvider: null });
  const [selectedProviderUI, setSelectedProviderUI] = useState<BotProvider>(BOT_PROVIDERS[0].value);
  const [apiKeyInput, setApiKeyInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      const storedSettingsString = localStorage.getItem('botSettings');
      const loadedSettings: BotSettings = storedSettingsString
        ? JSON.parse(storedSettingsString)
        : { keys: {}, selectedProvider: BOT_PROVIDERS[0].value };

      setCurrentSettings(loadedSettings);
      const currentProvider = loadedSettings.selectedProvider || BOT_PROVIDERS[0].value;
      setSelectedProviderUI(currentProvider);
      setApiKeyInput(loadedSettings.keys?.[currentProvider]?.apiKey || '');
    }
  }, [isOpen]);

  useEffect(() => {
    setApiKeyInput(currentSettings.keys?.[selectedProviderUI]?.apiKey || '');
  }, [selectedProviderUI, currentSettings.keys]);

  const handleSave = () => {
    const updatedKeys = {
      ...currentSettings.keys,
      [selectedProviderUI]: { apiKey: apiKeyInput.trim() },
    };

    if (!apiKeyInput.trim()) {
      delete updatedKeys[selectedProviderUI];
      toast.info(`API key for ${BOT_PROVIDERS.find(p => p.value === selectedProviderUI)?.label} removed.`);
    } else {
      toast.success(`Settings saved for ${BOT_PROVIDERS.find(p => p.value === selectedProviderUI)?.label}.`);
    }

    const finalSettings: BotSettings = {
      keys: updatedKeys,
      selectedProvider: selectedProviderUI,
    };

    localStorage.setItem('botSettings', JSON.stringify(finalSettings));
    setCurrentSettings(finalSettings);
    onClose();
  };

  const handleProviderChange = (value: string) => {
    setSelectedProviderUI(value as BotProvider);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>LLM Model Settings</DialogTitle>
          <DialogDescription>
            Configure API keys for different AI model providers.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="bot-provider">Model Provider</Label>
            <Select value={selectedProviderUI} onValueChange={handleProviderChange}>
              <SelectTrigger id="bot-provider">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {BOT_PROVIDERS.map((provider) => (
                  <SelectItem key={provider.value} value={provider.value}>
                    {provider.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="api-key">API Key for {BOT_PROVIDERS.find(p => p.value === selectedProviderUI)?.label}</Label>
            <Input
              id="api-key"
              type="password"
              placeholder={`Enter API Key`}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Your API key is stored locally in your browser's localStorage.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModelLLMDialog;
