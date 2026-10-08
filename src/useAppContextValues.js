import { useMemo } from "react";

// Samler appens context-værdier (flyttet ud af App.jsx, ren omflytning).
// Hver værdi memoiseres, så et Provider kun sender et nyt objekt, når noget af indholdet ændrer sig.
export function useAppContextValues(v) {
  const {
    user, setUser, userId, setUserId, accessToken,
    loginEmail, setLoginEmail, loginPassword, setLoginPassword, authError, setAuthError,
    authInfo, emailTakenError, setEmailTakenError, emailError, setEmailError, passwordError,
    setPasswordError, authLoading, authTab, setAuthTab, isOAuth, rememberMe,
    setRememberMe, handleLogin, handleSignup, handleOAuth, handleForgotPassword, clearAuth,
    verifyEmail, verifyStatus, verifyError, verifyNotice, verifyLoading, resendCooldown,
    checkEmailVerified, resendVerification, changeVerifyEmail, continueAfterVerify, resetError, resetLoading,
    resetDone, setResetError, submitNewPassword, continueAfterReset, allergens, setAllergens,
    customAllerg, setCustomAllerg, family, setFamily, activeProfiles, setActiveProfiles,
    scanFamily, household, setHousehold, householdLoading, loadHousehold, profileLoadStatus,
    retryProfileLoad, adminSection, setAdminSection, adminStats, adminUsers, adminUsersLoading,
    adminTickets, adminTicketFilter, setAdminTicketFilter, submissions, submissionsLoading, submissionFilter,
    setSubmissionFilter, openSubmission, setOpenSubmission, editingSubmission, setEditingSubmission, openAdminUser,
    setOpenAdminUser, openTicket, setOpenTicket, cleanedOcrText, cleaningOcr, loadAdminUsers,
    loadAdminStats, loadSubmissions, loadTickets, updateUserRole, deleteUser, updateSubmissionAndApprove,
    rejectSubmission, updateTicketStatus, cleanOcrWithAI, ticketsLoading, userSearch, setUserSearch,
    userSearchParam, setUserSearchParam, missingEans, missingEansLoading, loadMissingEans, deleteMissingEan,
    importLog, importLoading, runImport, reparseLog, reparseLoading, runReparse,
    screen, setScreen, openLegal, legalReturnScreen, history, setHistory,
    historyLoading, historyScope, historyError, favoritesError, favorites, favoritesScope,
    loadHistory, clearHistory, loadFavorites, toggleFavorite, setFavoriteCategory, isFavorite,
    lists, activeList, activeListId, setActiveListId, shoppingList, setShoppingList,
    shoppingListId, setShoppingListId, newItemName, setNewItemName, loadShoppingList, listsError,
    familyMembers, loadFamilyMembers, createList, renameList, setListType, deleteList,
    joinByCode, getListAccess, grantAccess, revokeAccess, rotateListCode, leaveList,
    addToList, toggleItem, removeItem, clearDone, newMemberName, setNewMemberName,
    newMemberBirthYear, setNewMemberBirthYear, newMemberGender, setNewMemberGender, newMemberAllerg, setNewMemberAllerg,
    newMemberCustomAllerg, setNewMemberCustomAllerg, newMemberDiets, setNewMemberDiets, newMemberLevels, setNewMemberLevels,
    newMemberENumbers, setNewMemberENumbers, newMemberSubtypes, setNewMemberSubtypes, newMemberCustomInput, setNewMemberCustomInput,
    editingMemberId, retryLoadFamily, familyError, addMember, updateMember, removeMember,
    startEditMember, cancelEditMember, eSearch, setESearch, eCategory, setECategory,
    allergenSubtypes, setAllergenSubtypes, selectedENumbers, setSelectedENumbers, activeSubtypeModal, setActiveSubtypeModal
  } = v;

  // Context-værdierne memoiseres, så et Provider ikke sender et nyt objekt
  // videre (og dermed tvinger ALLE dets consumers til at re-rendere) ved
  // hver App-render — kun når noget de faktisk indeholder ændrer sig.
  const authContextValue = useMemo(() => ({
    user, setUser, userId, setUserId, accessToken,
    loginEmail, setLoginEmail, loginPassword, setLoginPassword,
    authError, setAuthError, authInfo, emailTakenError, setEmailTakenError,
    emailError, setEmailError, passwordError, setPasswordError,
    authLoading, authTab, setAuthTab,
    isOAuth, rememberMe, setRememberMe,
    handleLogin, handleSignup, handleOAuth, handleForgotPassword, clearAuth,
    verifyEmail, verifyStatus, verifyError, verifyNotice, verifyLoading, resendCooldown,
    checkEmailVerified, resendVerification, changeVerifyEmail, continueAfterVerify,
    resetError, resetLoading, resetDone, setResetError, submitNewPassword, continueAfterReset,
  }), [user, userId, setUserId, accessToken, loginEmail, loginPassword, authError, authInfo, emailTakenError, emailError, passwordError, authLoading, authTab, isOAuth, rememberMe, handleLogin, handleSignup, handleOAuth, handleForgotPassword, clearAuth,
       verifyEmail, verifyStatus, verifyError, verifyNotice, verifyLoading, resendCooldown, checkEmailVerified, resendVerification, changeVerifyEmail, continueAfterVerify, resetError, resetLoading, resetDone, setResetError, submitNewPassword, continueAfterReset]);

  const profileContextValue = useMemo(() => ({
    allergens, setAllergens, customAllerg, setCustomAllerg,
    family, setFamily, activeProfiles, setActiveProfiles,
    scanFamily, household, setHousehold, householdLoading, loadHousehold,
    profileLoadStatus, retryProfileLoad,
  }), [allergens, customAllerg, family, activeProfiles, scanFamily, household, householdLoading, loadHousehold, profileLoadStatus, retryProfileLoad]);

  const adminContextValue = useMemo(() => ({
    adminSection, setAdminSection, adminStats,
    adminUsers, adminUsersLoading,
    adminTickets, adminTicketFilter, setAdminTicketFilter,
    submissions, submissionsLoading, submissionFilter, setSubmissionFilter,
    openSubmission, setOpenSubmission,
    editingSubmission, setEditingSubmission,
    openAdminUser, setOpenAdminUser,
    openTicket, setOpenTicket,
    cleanedOcrText, cleaningOcr,
    loadAdminUsers, loadAdminStats, loadSubmissions, loadTickets,
    updateUserRole, deleteUser,
    updateSubmissionAndApprove, rejectSubmission,
    updateTicketStatus, cleanOcrWithAI,
    ticketsLoading,
    userSearch, setUserSearch, userSearchParam, setUserSearchParam,
    missingEans, missingEansLoading, loadMissingEans, deleteMissingEan,
    importLog, importLoading, runImport,
    reparseLog, reparseLoading, runReparse,
  }), [
    adminSection, adminStats, adminUsers, adminUsersLoading,
    adminTickets, adminTicketFilter, submissions, submissionsLoading, submissionFilter,
    openSubmission, editingSubmission, openAdminUser, openTicket,
    cleanedOcrText, cleaningOcr,
    loadAdminUsers, loadAdminStats, loadSubmissions, loadTickets,
    updateUserRole, deleteUser, updateSubmissionAndApprove, rejectSubmission,
    updateTicketStatus, cleanOcrWithAI, ticketsLoading,
    userSearch, userSearchParam, missingEans, missingEansLoading, loadMissingEans, deleteMissingEan,
    importLog, importLoading, runImport, reparseLog, reparseLoading, runReparse,
  ]);

  const navigationContextValue = useMemo(() => ({ screen, setScreen, openLegal, legalReturnScreen }), [screen, openLegal, legalReturnScreen]);

  const historyContextValue = useMemo(() => ({
    history, setHistory, historyLoading, historyScope, historyError, favoritesError,
    favorites, favoritesScope, loadHistory, clearHistory, loadFavorites, toggleFavorite, setFavoriteCategory, isFavorite,
  }), [history, historyLoading, historyScope, historyError, favoritesError, favorites, favoritesScope, loadHistory, clearHistory, loadFavorites, toggleFavorite, setFavoriteCategory, isFavorite]);

  const shoppingContextValue = useMemo(() => ({
    lists, activeList, activeListId, setActiveListId,
    shoppingList, setShoppingList, shoppingListId, setShoppingListId,
    newItemName, setNewItemName, loadShoppingList, listsError,
    familyMembers, loadFamilyMembers,
    createList, renameList, setListType, deleteList, joinByCode,
    getListAccess, grantAccess, revokeAccess, rotateListCode, leaveList,
    addToList, toggleItem, removeItem, clearDone,
  }), [lists, activeList, activeListId, setActiveListId, shoppingList, shoppingListId, newItemName, loadShoppingList, listsError,
       familyMembers, loadFamilyMembers, createList, renameList, setListType, deleteList, joinByCode,
       getListAccess, grantAccess, revokeAccess, rotateListCode, leaveList, addToList, toggleItem, removeItem, clearDone]);

  const familyFormContextValue = useMemo(() => ({
    newMemberName, setNewMemberName,
    newMemberBirthYear, setNewMemberBirthYear,
    newMemberGender, setNewMemberGender,
    newMemberAllerg, setNewMemberAllerg,
    newMemberCustomAllerg, setNewMemberCustomAllerg,
    newMemberDiets, setNewMemberDiets,
    newMemberLevels, setNewMemberLevels,
    newMemberENumbers, setNewMemberENumbers,
    newMemberSubtypes, setNewMemberSubtypes,
    newMemberCustomInput, setNewMemberCustomInput,
    editingMemberId, retryLoadFamily, familyError,
    addMember, updateMember, removeMember, startEditMember, cancelEditMember,
  }), [
    newMemberName, newMemberBirthYear, newMemberGender, newMemberAllerg,
    newMemberCustomAllerg, newMemberDiets, newMemberLevels, newMemberENumbers, newMemberSubtypes,
    newMemberCustomInput, editingMemberId, addMember, updateMember, removeMember,
    startEditMember, cancelEditMember, retryLoadFamily, familyError,
  ]);

  const allergenPrefsContextValue = useMemo(() => ({
    eSearch, setESearch, eCategory, setECategory,
    allergenSubtypes, setAllergenSubtypes,
    selectedENumbers, setSelectedENumbers,
    activeSubtypeModal, setActiveSubtypeModal,
  }), [eSearch, eCategory, allergenSubtypes, selectedENumbers, activeSubtypeModal]);

  return { authContextValue, profileContextValue, adminContextValue, navigationContextValue, historyContextValue, shoppingContextValue, familyFormContextValue, allergenPrefsContextValue };
}
