/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './app/providers/AppProvider';
import { AppShell } from './app/app-shell/AppShell';
import { HomeScreen } from './features/home/HomeScreen';
import { TrainingScreen } from './features/training/TrainingScreen';
import { ProgressScreen } from './features/progress/ProgressScreen';
import { LibraryScreen } from './features/library/LibraryScreen';
import { MediaSearchScreen } from './features/media/MediaSearchScreen';

const MainRouter: React.FC = () => {
  const { currentDestination } = useApp();

  return (
    <AppShell>
      {currentDestination === 'home' && <HomeScreen />}
      {currentDestination === 'train' && <TrainingScreen />}
      {currentDestination === 'progress' && <ProgressScreen />}
      {currentDestination === 'library' && <LibraryScreen />}
      {currentDestination === 'media' && <MediaSearchScreen />}
    </AppShell>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainRouter />
    </AppProvider>
  );
}
