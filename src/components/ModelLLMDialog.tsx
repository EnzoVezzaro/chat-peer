import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Export types for reuse
export type BotProvider = 'openai' | 'claude' | 'grok' | 'groq';
export type ProviderSettings = {
  apiKey: string;
  model?: string; // Add optional model property
};
export type BotSettings = {
  keys: Partial<Record<BotProvider, ProviderSettings>>;
  selectedProvider: BotProvider | null;
};

export const BOT_SENDER_ID_PREFIX = 'bot-';

// Define models for each provider
const OPENAI_MODELS = ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
const CLAUDE_MODELS = ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'];
const GROK_MODELS = ['grok-1']; // Placeholder - verify actual available models if API exists
const GROQ_MODELS = ['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it'];

const MODELS_BY_PROVIDER: Record<BotProvider, string[]> = {
  openai: OPENAI_MODELS,
  claude: CLAUDE_MODELS,
  grok: GROK_MODELS,
  groq: GROQ_MODELS,
};

// Function to get the default model for a provider
const getDefaultModel = (provider: BotProvider): string | undefined => {
    const models = MODELS_BY_PROVIDER[provider];
    return models?.[0]; // Default to the first model in the list
};

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
  const [selectedModelUI, setSelectedModelUI] = useState<string | undefined>(undefined); // State for selected model in UI

  useEffect(() => {
    if (isOpen) {
      // Load settings from localStorage
      const storedSettingsString = localStorage.getItem('botSettings');
      let loadedSettings: BotSettings;

      try {
        loadedSettings = storedSettingsString
          ? JSON.parse(storedSettingsString)
          : { keys: {}, selectedProvider: BOT_PROVIDERS[0].value };
      } catch (error) {
        console.error("Failed to parse botSettings from localStorage:", error);
        loadedSettings = { keys: {}, selectedProvider: BOT_PROVIDERS[0].value }; // Reset to default if parsing fails
        localStorage.removeItem('botSettings'); // Clear corrupted data
      }


      // Ensure keys object exists
      if (!loadedSettings.keys) {
        loadedSettings.keys = {};
      }

      // Ensure selectedProvider is valid, default if not
      if (!loadedSettings.selectedProvider || !BOT_PROVIDERS.some(p => p.value === loadedSettings.selectedProvider)) {
        loadedSettings.selectedProvider = BOT_PROVIDERS[0].value;
      }

      setCurrentSettings(loadedSettings);

      const currentProvider = loadedSettings.selectedProvider;
      setSelectedProviderUI(currentProvider);

      // Set API key and Model based on loaded settings for the current provider
      const providerSettings = loadedSettings.keys?.[currentProvider];
      setApiKeyInput(providerSettings?.apiKey || '');
      setSelectedModelUI(providerSettings?.model || getDefaultModel(currentProvider)); // Use loaded model or default
    }
  }, [isOpen]);

  // Update API key and Model inputs when provider changes in UI
  useEffect(() => {
    const providerSettings = currentSettings.keys?.[selectedProviderUI];
    setApiKeyInput(providerSettings?.apiKey || '');
    // Set model: use stored model for this provider, or default for this provider, or undefined if no models
    setSelectedModelUI(providerSettings?.model || getDefaultModel(selectedProviderUI));
  }, [selectedProviderUI, currentSettings.keys]);


  const handleSave = () => {
    const trimmedApiKey = apiKeyInput.trim();
    const currentProviderLabel = BOT_PROVIDERS.find(p => p.value === selectedProviderUI)?.label || selectedProviderUI;

    // Prepare the updated settings for the current provider
    const providerUpdate: ProviderSettings = {
      apiKey: trimmedApiKey,
      model: selectedModelUI, // Include the selected model
    };

    let updatedKeys = { ...currentSettings.keys };

    if (!trimmedApiKey) {
      // If API key is removed, remove the entire entry for the provider
      delete updatedKeys[selectedProviderUI];
      toast.info(`Settings (including API key and model) for ${currentProviderLabel} removed.`);
    } else {
      // Otherwise, update or add the provider's settings
      updatedKeys = {
        ...updatedKeys,
        [selectedProviderUI]: providerUpdate,
      };
      toast.success(`Settings saved for ${currentProviderLabel}.`);
    }

    const finalSettings: BotSettings = {
      keys: updatedKeys,
      selectedProvider: selectedProviderUI, // Keep the currently selected provider as the active one
    };

    localStorage.setItem('botSettings', JSON.stringify(finalSettings));
    setCurrentSettings(finalSettings); // Update internal state
    onClose();
  };

  const handleProviderChange = (value: string) => {
    const newProvider = value as BotProvider;
    setSelectedProviderUI(newProvider);
    // Reset model selection to default when provider changes
    // The useEffect dependency on selectedProviderUI will handle setting the input fields
  };

  const handleModelChange = (value: string) => {
    setSelectedModelUI(value);
  };

  const availableModels = MODELS_BY_PROVIDER[selectedProviderUI] || [];

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
          {/* Provider Selection */}
          <div className="grid gap-2">
            <Label htmlFor="bot-provider">Model Provider</Label>
            <Select value={selectedProviderUI} onValueChange={handleProviderChange}>
              <SelectTrigger id="bot-provider" className="w-full">
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
              className="w-full"
              type="password"
              placeholder="Enter API Key"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              API key is stored locally in your browser's localStorage.
            </p>
          </div>

          {/* Model Selection - Conditionally render if models exist */}
          {availableModels.length > 0 && (
            <div className="grid gap-2">
              <Label htmlFor="model-select">Model for {BOT_PROVIDERS.find(p => p.value === selectedProviderUI)?.label}</Label>
              <Select value={selectedModelUI} onValueChange={handleModelChange}>
                <SelectTrigger id="model-select" className="w-full">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
               <p className="text-xs text-muted-foreground">
                Select the specific model to use for this provider.
              </p>
            </div>
          )}
           {availableModels.length === 0 && selectedProviderUI && (
             <p className="text-xs text-muted-foreground">
                No specific models listed for {BOT_PROVIDERS.find(p => p.value === selectedProviderUI)?.label}. The default model will be used if applicable.
              </p>
           )}
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
