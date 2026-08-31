import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider } from 'jotai';
import { initialize } from '@microsoft/power-apps/app';

import Layout from '@/pages/_layout';
import { queryClient } from '@/lib/query-client';
import { Toaster } from '@/components/ui/sonner';
import ErrorBoundary from '@/components/system/error-boundary';

import HomePage from '@/pages/index';
import ProjectsPage from '@/pages/projects';
import OpportunitiesPage from '@/pages/opportunities';
import WbsPage from '@/pages/wbs';
import HoursPage from '@/pages/hours';
import TeamPage from '@/pages/team';
import ReportsPage from '@/pages/reports';
import RisksPage from '@/pages/risks';
import LaborCategoriesPage from '@/pages/labor-categories';
import NotFoundPage from '@/pages/not-found';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string>();

  useEffect(() => {
    let isMounted = true;

    const initializeApp = async () => {
      try {
        await initialize();
        if (isMounted) {
          setIsInitialized(true);
        }
      } catch (error: unknown) {
        if (isMounted) {
          setInitializationError(error instanceof Error ? error.message : 'Unable to initialize the Power Apps data connection.');
        }
      }
    };

    void initializeApp();

    return () => {
      isMounted = false;
    };
  }, []);

  if (initializationError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <div className="w-full max-w-lg rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h1 className="text-xl font-semibold">Dataverse connection unavailable</h1>
          <p className="mt-2 text-sm">{initializationError}</p>
          <p className="mt-4 text-sm">Confirm this app is opened from its configured Power Apps environment and that the Dataverse connection is authorized.</p>
        </div>
      </main>
    );
  }

  if (!isInitialized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <div className="rounded-lg border bg-card px-6 py-4 text-card-foreground shadow-sm" role="status">
          Connecting to Dataverse…
        </div>
      </main>
    );
  }
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary resetQueryCache>
        <JotaiProvider>
          <Toaster richColors />
          <Router>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="opportunities" element={<OpportunitiesPage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="wbs" element={<WbsPage />} />
                <Route path="labor-categories" element={<LaborCategoriesPage />} />
                <Route path="hours" element={<HoursPage />} />
                <Route path="team" element={<TeamPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="risks" element={<RisksPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Router>
        </JotaiProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
