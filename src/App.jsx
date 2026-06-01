import { useState } from 'react';
import HQ from './components/HQ.jsx';
import Athletes from './components/Athletes.jsx';
import Convoy from './components/Convoy.jsx';
import MessHall from './components/MessHall.jsx';
import KitBag from './components/KitBag.jsx';

const TABS = [
  { id: 'hq',       label: '🏔 HQ' },
  { id: 'athletes', label: '🎿 Athletes' },
  { id: 'convoy',   label: '🚗 Convoy' },
  { id: 'messhall', label: '🍽 Mess Hall' },
  { id: 'kitbag',   label: '🎒 Kit Bag' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('hq');

  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-title">
            WINTER OLYMPICS <span>2026</span>
          </div>
          <nav className="tab-nav">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="app-main" style={{ paddingTop: '88px' }}>
        {activeTab === 'hq'       && <HQ />}
        {activeTab === 'athletes' && <Athletes />}
        {activeTab === 'convoy'   && <Convoy />}
        {activeTab === 'messhall' && <MessHall />}
        {activeTab === 'kitbag'   && <KitBag />}
      </main>
    </>
  );
}
