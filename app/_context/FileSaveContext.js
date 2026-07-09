import { createContext } from 'react';

/**
 * Shared workspace state:
 *  - fileSave: timestamp trigger for a manual "Save" from the header
 *  - saveStatus: 'idle' | 'saving' | 'saved' — powers the autosave indicator
 */
export const FileSaveContext = createContext({
  fileSave: 0,
  setFileSave: () => {},
  saveStatus: 'idle',
  setSaveStatus: () => {},
});
