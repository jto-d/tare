import { useCallback, useEffect, useState } from 'react';
import { getMe, getWeights, type Me, type WeightEntry } from './api';
import { SignInScreen } from './screens/SignInScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { GraphScreen } from './screens/GraphScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { NavBar, type Tab } from './components/NavBar';

type Status = 'loading' | 'signed-out' | 'onboarding' | 'ready';

export function App() {
  const [status, setStatus] = useState<Status>('loading');
  const [me, setMe] = useState<Me | null>(null);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [tab, setTab] = useState<Tab>('home');
  const [authError, setAuthError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    try {
      const current = await getMe();
      if (!current) {
        setMe(null);
        setStatus('signed-out');
        return;
      }
      setMe(current);
      if (!current.onboarded) {
        setStatus('onboarding');
        return;
      }
      const w = await getWeights(60);
      setWeights(w.weights);
      setStatus('ready');
    } catch {
      setMe(null);
      setStatus('signed-out');
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'failed') {
      setAuthError('Sign-in failed. Please try again.');
      window.history.replaceState({}, '', window.location.pathname);
    }
    void loadSession();
  }, [loadSession]);

  const refreshWeights = useCallback(async () => {
    const w = await getWeights(60);
    setWeights(w.weights);
  }, []);

  const handleOnboardDone = useCallback(async () => {
    const current = await getMe();
    if (current) setMe(current);
    await refreshWeights();
    setStatus('ready');
    setTab('home');
  }, [refreshWeights]);

  const handleLogged = useCallback(
    (entry: WeightEntry) => {
      setWeights((prev) => {
        const withoutSameDay = prev.filter((w) => w.date !== entry.date);
        const merged = [...withoutSameDay, entry];
        merged.sort((a, b) => a.date.localeCompare(b.date));
        return merged;
      });
    },
    []
  );

  const handleSignOut = useCallback(() => {
    setMe(null);
    setWeights([]);
    setStatus('signed-out');
    setTab('home');
  }, []);

  const handleUserChange = useCallback(
    async (next: Me) => {
      setMe(next);
      await refreshWeights();
    },
    [refreshWeights]
  );

  if (status === 'loading') {
    return (
      <div className="app-shell">
        <div className="fullscreen-load">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (status === 'signed-out' || !me) {
    return (
      <div className="app-shell">
        <SignInScreen authError={authError} />
      </div>
    );
  }

  if (status === 'onboarding') {
    return (
      <div className="app-shell">
        <OnboardingScreen initialUnit={me.unit} onDone={handleOnboardDone} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="screen">
        {tab === 'home' && (
          <HomeScreen
            unit={me.unit}
            weights={weights}
            onLogged={handleLogged}
            onViewProgress={() => setTab('graph')}
          />
        )}
        {tab === 'graph' && <GraphScreen unit={me.unit} weights={weights} />}
        {tab === 'settings' && (
          <SettingsScreen me={me} onUserChange={handleUserChange} onSignOut={handleSignOut} />
        )}
      </div>
      <NavBar tab={tab} onChange={setTab} />
    </div>
  );
}
