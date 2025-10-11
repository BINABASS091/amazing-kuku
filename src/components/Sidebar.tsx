import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  Warehouse,
  Package,
  Radio,
  CreditCard,
  BookOpen,
  Settings,
  LogOut,
  Bell,
  Lightbulb,
  Bird,
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: t('sidebar.dashboard') },
    { to: '/admin/farmers', icon: UserCheck, label: t('sidebar.farmers') },
    { to: '/admin/subscriptions', icon: CreditCard, label: t('sidebar.subscriptions') },
    { to: '/admin/recommendations', icon: Lightbulb, label: t('sidebar.recommendations') },
    { to: '/admin/alerts', icon: Bell, label: t('sidebar.alerts') },
    { to: '/admin/devices', icon: Radio, label: t('sidebar.devices') },
    { to: '/admin/farms', icon: Warehouse, label: t('sidebar.allFarms') },
    { to: '/admin/batches', icon: Package, label: t('sidebar.allBatches') },
    { to: '/admin/breeds', icon: Bird, label: t('sidebar.breedConfigs') },
    { to: '/admin/settings', icon: Settings, label: t('common.settings') },
  ];

  const farmerLinks = [
    { to: '/farmer', icon: LayoutDashboard, label: t('common.dashboard') },
    { to: '/farmer/farms', icon: Warehouse, label: t('sidebar.myFarms') },
    { to: '/farmer/batches', icon: Package, label: t('sidebar.batches') },
    { to: '/farmer/activities', icon: BookOpen, label: t('sidebar.activities') },
    { to: '/disease-prediction', icon: Activity, label: 'Disease Prediction' },
    { to: '/farmer/knowledge', icon: Lightbulb, label: t('sidebar.knowledgeBase') },
    { to: '/farmer/alerts', icon: Bell, label: t('sidebar.alerts') },
    { to: '/farmer/profile', icon: Settings, label: t('common.profile') },
  ];

  const links = user?.role === 'ADMIN' ? adminLinks : farmerLinks;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-30 h-full bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-green-600">Fugaji Pro</h1>
            <p className="text-sm text-gray-600 mt-1">
              {user?.role === 'ADMIN' ? t('sidebar.adminPortal') : t('sidebar.farmerPortal')}
            </p>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to;

                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-green-50 text-green-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="mb-3 px-4">
              <p className="text-sm font-medium text-gray-900">{(user as any)?.user_metadata?.full_name || user?.email}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>{t('common.logout')}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
