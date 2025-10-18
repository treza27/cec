import React from 'react';
import { User, Bell, LogOut, Menu } from 'lucide-react';
import { useEmployeeProfile } from '../../hooks/useEmployeeProfile';

interface AgentHeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onLogout: () => void;
}

export default function AgentHeader({ isSidebarOpen, onToggleSidebar, onLogout }: AgentHeaderProps) {
  const { profileData } = useEmployeeProfile();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <img
              src="/Logo.jpg"
              alt="Continental Express Cargo"
              className="h-8 sm:h-12 w-auto object-contain"
            />
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-bold text-blue-600">Espace Agent</h1>
              <p className="text-xs sm:text-sm text-gray-500">Continental Express Cargo</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button className="hidden sm:block p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
              <Bell className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {profileData?.full_name || 'Agent CEC'}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:block text-sm">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}