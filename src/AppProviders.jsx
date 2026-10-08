import React from "react";
import { AuthProvider } from "./AuthContext.jsx";
import { ProfileProvider } from "./ProfileContext.jsx";
import { AdminProvider } from "./AdminContext.jsx";
import { NavigationProvider } from "./NavigationContext.jsx";
import { HistoryProvider } from "./HistoryContext.jsx";
import { ShoppingProvider } from "./ShoppingContext.jsx";
import { FamilyFormProvider } from "./FamilyFormContext.jsx";
import { AllergenPrefsProvider } from "./AllergenPrefsContext.jsx";

// De otte context-udbydere samlet ét sted (flyttet ud af App.jsx, ren omflytning).
export default function AppProviders({ values, children }) {
  return (
    <AuthProvider value={values.authContextValue}>
    <ProfileProvider value={values.profileContextValue}>
    <AdminProvider value={values.adminContextValue}>
    <NavigationProvider value={values.navigationContextValue}>
    <HistoryProvider value={values.historyContextValue}>
    <ShoppingProvider value={values.shoppingContextValue}>
    <FamilyFormProvider value={values.familyFormContextValue}>
    <AllergenPrefsProvider value={values.allergenPrefsContextValue}>
      {children}
    </AllergenPrefsProvider>
    </FamilyFormProvider>
    </ShoppingProvider>
    </HistoryProvider>
    </NavigationProvider>
    </AdminProvider>
    </ProfileProvider>
    </AuthProvider>
  );
}
