import React from 'react';
import { User, Bell, LogOut, Menu } from 'lucide-react';
import { useEmployeeProfileContext } from '../../contexts/EmployeeProfileContext';

interface AgentHeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onLogout: () => void;
}

export default function AgentHeader({ isSidebarOpen, onToggleSidebar, onLogout }: AgentHeaderProps) {
  const { profileData } = useEmployeeProfileContext();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="w-full px-3 md:px-5 lg:px-8">
        <div className="flex justify-between items-center py-3 md:py-4">
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Mobile menu button - hidden on md+ since sidebar is always visible */}
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>

            <img
              src="/Logo.jpg"
              alt="Continental Express Cargo"
              className="h-8 md:h-10 lg:h-12 w-auto object-contain"
            />
            <div className="hidden sm:block">
              <h1 className="text-base md:text-lg lg:text-xl font-bold text-blue-600">Espace Agent</h1>
              <p className="text-xs md:text-sm text-gray-500">Continental Express Cargo</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-3">
            <button className="hidden md:block p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
              <Bell className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center flex-shrink-0">
                {profileData?.profile_picture_url ? (
                  <img
                    src={profileData.profile_picture_url}
                    alt="Photo de profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="hidden lg:block text-sm font-medium text-gray-700">
                {profileData?.full_name || 'Agent CEC'}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-1 md:space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden md:block text-sm">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}