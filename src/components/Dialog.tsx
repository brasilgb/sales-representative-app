import { cloneElement, createContext, ReactElement, ReactNode, useContext, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DialogContextType { open: boolean; setOpen: (open: boolean) => void }
const DialogContext = createContext<DialogContextType | undefined>(undefined);

function Dialog({ children, open: controlledOpen, onOpenChange }: { children: ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  return <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>;
}

function DialogTrigger({ children }: { children: ReactElement<{ onPress?: () => void }> }) {
  const { setOpen } = useDialog();
  return cloneElement(children, { onPress: () => setOpen(true) });
}

function DialogContent({ children }: { className?: string; children: ReactNode }) {
  const { open, setOpen } = useDialog();
  const insets = useSafeAreaInsets();
  return (
    <Modal transparent animationType="slide" visible={open} onRequestClose={() => setOpen(false)} statusBarTranslucent>
      <View className="flex-1 justify-end bg-[#030810]/80">
        <Pressable accessibilityLabel="Fechar modal" className="absolute inset-0" onPress={() => setOpen(false)} />
        <View className="max-h-[92%] w-full max-w-[720px] self-center overflow-hidden rounded-t-2xl border border-b-0 border-white/10 bg-surface" style={{ paddingBottom: insets.bottom }}>
          <View className="my-[9px] h-1 w-10 self-center rounded-sm bg-white/20" />
          {children}
        </View>
      </View>
    </Modal>
  );
}

function useDialog() {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialog must be used within a Dialog');
  return context;
}

export { Dialog, DialogTrigger, DialogContent, useDialog };
