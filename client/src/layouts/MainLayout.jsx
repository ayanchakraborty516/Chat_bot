import { useState, cloneElement } from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import SettingsModal from '../components/common/SettingsModal';
import { useResponsive } from '../hooks/useResponsive';

export function MainLayout({ children }) {
  const { isMobile } = useResponsive();
  const [prevIsMobile, setPrevIsMobile] = useState(isMobile);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Sync sidebar open state when switching between mobile and desktop viewports
  if (isMobile !== prevIsMobile) {
    setPrevIsMobile(isMobile);
    setSidebarOpen(!isMobile);
  }

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 dark:bg-[#0c0e14] text-gray-900 dark:text-gray-100 font-sans antialiased">
      {/* Sidebar (Desktop dock or Mobile drawer) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={isMobile ? closeSidebar : toggleSidebar}
        isMobile={isMobile}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {cloneElement(children, { onToggleSidebar: toggleSidebar })}
      </div>

      {/* Global Settings Modal */}
      <SettingsModal />
    </div>
  );
}

export default MainLayout;
