"use client";

import { useState, useCallback } from "react";

export function useNavigation() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  const setActiveTabState = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  return {
    activeTab,
    setActiveTabState,
  };
}
