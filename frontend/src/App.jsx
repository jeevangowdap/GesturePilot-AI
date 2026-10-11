import { useState, useCallback } from 'react';
import './index.css';
import Header from './components/Header';
import Landing from './components/Landing';
import Workspace from './components/Workspace';
import AuthPage from './components/AuthPage';

export default function App() {
  const [session, setSession] = useState(null);
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'auth'

  const handleUploadSuccess = useCallback((data) => {
    setSession({
      ...data,
      demo: false,
    });
  }, []);

  const handleClose = useCallback(() => {
    if (session?.sessionId && !session.demo) {
      fetch(`http://localhost:8000/session/${session.sessionId}`, {
        method: 'DELETE',
      }).catch(() => { });
    }
    setSession(null);
  }, [session]);

  const handleLoginSuccess = useCallback((userData) => {
    // Redirect directly to the presentation workspace with demo deck
    setSession({
      sessionId: 'demo-' + Date.now(),
      pdfUrl: userData.pdfUrl || '/demo-presentation.pdf',
      filename: userData.filename || 'GesturePilot_Demo_Deck.pptx',
      demo: true,
      email: userData.email || 'demo.pilot@gesturepilot.ai',
      name: userData.name || 'Demo Pilot',
    });
  }, []);

  return (
    <div className="app">
      <Header
        hasSession={!!session}
        session={session}
        onClose={handleClose}
        currentView={currentView}
        onOpenAuth={() => setCurrentView('auth')}
        onBackToLanding={() => setCurrentView('landing')}
      />

      {session ? (
        <Workspace session={session} />
      ) : currentView === 'auth' ? (
        <AuthPage
          onLoginSuccess={handleLoginSuccess}
          onBackToLanding={() => setCurrentView('landing')}
        />
      ) : (
        <Landing
          onUploadSuccess={handleUploadSuccess}
          onOpenAuth={() => setCurrentView('auth')}
          onOpenDemo={() =>
            handleLoginSuccess({ email: 'demo.presenter@gesturepilot.ai' })
          }
        />
      )}
    </div>
  );
}