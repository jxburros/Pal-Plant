/**
 * useModalState Hook
 *
 * Manages all modal states for the app to reduce complexity in App.tsx
 * Provides a clean API for opening/closing modals and managing editing state
 *
 * @module useModalState
 */

import { useState, useCallback } from 'react';
import { Friend } from '../types';

export interface ModalState {
  // Friend modal
  isFriendModalOpen: boolean;
  editingFriend: Friend | null;
  openAddFriend: () => void;
  openEditFriend: (friend: Friend) => void;
  updateEditingFriend: (friend: Friend) => void;
  closeFriendModal: () => void;

  // Settings modal
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;

  // Bulk import modal
  isBulkImportOpen: boolean;
  openBulkImport: () => void;
  closeBulkImport: () => void;

  // Onboarding
  showOnboarding: boolean;
  openOnboarding: () => void;
  closeOnboarding: () => void;

  // Rule guide
  isRuleGuideOpen: boolean;
  openRuleGuide: () => void;
  closeRuleGuide: () => void;

  // Data warning modal (new)
  showDataWarning: boolean;
  openDataWarning: () => void;
  closeDataWarning: () => void;
}

export const useModalState = (): ModalState => {
  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isRuleGuideOpen, setIsRuleGuideOpen] = useState(false);
  const [showDataWarning, setShowDataWarning] = useState(false);

  const openAddFriend = useCallback(() => {
    setEditingFriend(null);
    setIsFriendModalOpen(true);
  }, []);

  const openEditFriend = useCallback((friend: Friend) => {
    setEditingFriend(friend);
    setIsFriendModalOpen(true);
  }, []);

  const updateEditingFriend = useCallback((friend: Friend) => {
    setEditingFriend(friend);
  }, []);

  const closeFriendModal = useCallback(() => {
    setIsFriendModalOpen(false);
    setEditingFriend(null);
  }, []);

  const openSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  const openBulkImport = useCallback(() => {
    setIsBulkImportOpen(true);
  }, []);

  const closeBulkImport = useCallback(() => {
    setIsBulkImportOpen(false);
  }, []);

  const openOnboarding = useCallback(() => {
    setShowOnboarding(true);
  }, []);

  const closeOnboarding = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  const openRuleGuide = useCallback(() => {
    setIsRuleGuideOpen(true);
  }, []);

  const closeRuleGuide = useCallback(() => {
    setIsRuleGuideOpen(false);
  }, []);

  const openDataWarning = useCallback(() => {
    setShowDataWarning(true);
  }, []);

  const closeDataWarning = useCallback(() => {
    setShowDataWarning(false);
  }, []);

  return {
    isFriendModalOpen,
    editingFriend,
    openAddFriend,
    openEditFriend,
    updateEditingFriend,
    closeFriendModal,

    isSettingsOpen,
    openSettings,
    closeSettings,

    isBulkImportOpen,
    openBulkImport,
    closeBulkImport,

    showOnboarding,
    openOnboarding,
    closeOnboarding,

    isRuleGuideOpen,
    openRuleGuide,
    closeRuleGuide,

    showDataWarning,
    openDataWarning,
    closeDataWarning
  };
};
