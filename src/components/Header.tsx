import { Menu, Bell, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLangMenu, setShowLangMenu] = useState(false);

  useEffect(() => {
    const fetchUnreadAlerts = async () => {
      if (!user) return;

      if (user.role === 'FARMER') {
        const { data: farmer } = await supabase
          .from('farmers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (farmer) {
          const { count } = await supabase
            .from('alerts')
            .select('*', { count: 'exact', head: true })
            .eq('farmer_id', farmer.id)
            .eq('is_read', false);

          setUnreadCount(count || 0);
        }
      }
    };

    fetchUnreadAlerts();

    const subscription = supabase
      .channel('alerts_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => {
        fetchUnreadAlerts();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>

        <div className="flex-1 lg:block hidden" />

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Globe className="w-6 h-6 text-gray-700" />
              <span className="hidden sm:inline text-sm font-medium text-gray-700">
                {language === 'en' ? 'English' : 'Kiswahili'}
              </span>
            </button>

            {showLangMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowLangMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <button
                    onClick={() => {
                      setLanguage('en');
                      setShowLangMenu(false);
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                      language === 'en' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('sw');
                      setShowLangMenu(false);
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                      language === 'sw' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    Kiswahili
                  </button>
                </div>
              </>
            )}
          </div>

          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="w-6 h-6 text-gray-700" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
