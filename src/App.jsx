import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import SnapshotOverview from './pages/SnapshotOverview';
import DuplicateGroupsPage from './pages/DuplicateGroupsPage';
import ComparePage from './pages/ComparePage';
import ActivityPage from './pages/ActivityPage';
import './styles/index.css';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/snapshots/:snapshotId" element={<SnapshotOverview />} />
          <Route path="/snapshots/:snapshotId/:module/groups" element={<DuplicateGroupsPage />} />
          <Route path="/snapshots/:snapshotId/:module/compare/:groupId" element={<ComparePage />} />
          <Route path="/snapshots/:snapshotId/:module/activity" element={<ActivityPage />} />
        </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#fff',
              border: '1px solid #334155',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;
