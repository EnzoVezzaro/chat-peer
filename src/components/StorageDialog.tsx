import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Download, Upload, Trash } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface StorageDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const StorageDialog: React.FC<StorageDialogProps> = ({ isOpen, onClose }) => {
  const [useLocalStorage, setUseLocalStorage] = useState(localStorage.getItem('useLocalStorage') === 'true');
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClearStorage = () => {
    localStorage.removeItem('botSettings');
    localStorage.removeItem('chatData');
    toast.info('All storage data has been cleared');
    window.location.reload();
  };

  const handleDownloadStorage = () => {
    const storageData = {
      botSettings: localStorage.getItem('botSettings'),
      chatData: localStorage.getItem('chatData')
    };
    
    const blob = new Blob([JSON.stringify(storageData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chat_storage_backup.json';
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Storage data downloaded');
  };

  const handleImportStorage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.botSettings) {
          localStorage.setItem('botSettings', data.botSettings);
        }
        if (data.chatData) {
          localStorage.setItem('chatData', data.chatData);
        }
        
        toast.success('Storage data imported successfully');
        window.location.reload();
      } catch (error) {
        console.error('Error importing storage:', error);
        toast.error('Failed to import storage data');
      }
    };
    reader.readAsText(file);
  };

  const handleStorageToggle = (checked: boolean) => {
    setUseLocalStorage(checked);
    localStorage.setItem('useLocalStorage', checked.toString());
    toast.success(`Local storage ${checked ? 'enabled' : 'disabled'}`);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg p-6 rounded-xl shadow-lg bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Storage Settings</DialogTitle>
            <DialogDescription className="text-gray-600">Manage your chat storage and backup settings</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
              <Label htmlFor="storage-toggle" className="text-sm font-medium">Use Local Storage</Label>
              <Switch
                id="storage-toggle"
                checked={useLocalStorage}
                onCheckedChange={handleStorageToggle}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button variant="outline" className="w-full" onClick={handleDownloadStorage}>
                <Download className="w-5 h-5 mr-2" />
              </Button>
              <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-5 h-5 mr-2" />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={handleImportStorage}
              />
              <Button variant="destructive" className="w-full" onClick={() => setShowConfirmClear(true)}>
                <Trash className="w-5 h-5 mr-2" />
              </Button>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button onClick={onClose} className="w-full">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmClear} onOpenChange={setShowConfirmClear}>
        <AlertDialogContent className="p-6 rounded-xl shadow-lg bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              This will permanently delete all your chat data and settings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-between">
            <AlertDialogCancel className="w-full">Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" className="w-full" onClick={handleClearStorage}>
                <Trash className="w-5 h-5 mr-2" />
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default StorageDialog;
