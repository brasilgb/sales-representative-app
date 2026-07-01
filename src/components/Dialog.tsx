import { cloneElement, createContext, ReactElement, ReactNode, useContext, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
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
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Fechar modal" style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom }]}>
          <View style={styles.handle} />
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

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(3, 8, 16, 0.78)' },
  sheet: { width: '100%', maxWidth: 720, maxHeight: '92%', alignSelf: 'center', overflow: 'hidden', borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: 1, borderBottomWidth: 0, borderColor: 'rgba(247,248,250,0.12)', backgroundColor: '#101a2d' },
  handle: { width: 40, height: 4, alignSelf: 'center', borderRadius: 2, backgroundColor: 'rgba(247,248,250,0.22)', marginVertical: 9 },
});

export { Dialog, DialogTrigger, DialogContent, useDialog };
