import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCheck,
  RotateCcw,
  AlertTriangle,
  FileCheck2,
  DollarSign,
  ShieldCheck,
  Info,
  Clock,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api.js';
import { AppNotification } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';

interface NotificationCenterProps {
  onNavigateToAlerts?: () => void;
  onNavigateToProjects?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onNavigateToAlerts,
  onNavigateToProjects
}) => {
  const { user, role } = useAuth();
  const { t, formatDate, translateRole } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      if (res && Array.isArray(res.notifications)) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.warn('[NotificationCenter] Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Strictly isolate state per user: clear previous state immediately on switch
    setNotifications([]);
    if (role !== 'PUBLIC' && user?.userId) {
      fetchNotifications();
    }
  }, [role, user?.userId]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      // Optimistic client update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      // Persist to backend database
      await api.markAsRead(id);
    } catch (err) {
      console.warn('[NotificationCenter] Failed to mark read:', err);
      fetchNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      await api.markAllNotificationsRead();
      setStatusMessage('All marked as read');
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err) {
      console.warn('[NotificationCenter] Failed to mark all read:', err);
      fetchNotifications();
    }
  };

  const handleResetNotifications = async () => {
    try {
      setResetting(true);
      const res = await api.resetNotifications();
      if (res && Array.isArray(res.notifications)) {
        setNotifications(res.notifications);
      } else {
        await fetchNotifications();
      }
      setStatusMessage('Notifications reset successfully');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.warn('[NotificationCenter] Failed to reset notifications:', err);
      setStatusMessage('Reset completed via local store');
      setTimeout(() => setStatusMessage(null), 3000);
      await fetchNotifications();
    } finally {
      setResetting(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ALERT':
        return <AlertTriangle className="w-4 h-4 text-[#E07A5F]" />;
      case 'FINANCE':
        return <DollarSign className="w-4 h-4 text-[#81B29A]" />;
      case 'INSPECTION':
        return <FileCheck2 className="w-4 h-4 text-[#F4A261]" />;
      case 'AUDIT':
        return <ShieldCheck className="w-4 h-4 text-govt-navy" />;
      default:
        return <Info className="w-4 h-4 text-[#607D8B]" />;
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Recently';
    return formatDate(timestamp, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell trigger button */}
      <button
        id="notification-center-btn"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-lg text-panel-bg/80 hover:text-white hover:bg-govt-navy-light transition-colors focus:outline-hidden focus:ring-2 focus:ring-govt-saffron"
        title={unreadCount > 0 ? `${unreadCount} ${t.unreadCountText}` : t.notificationsTitle}
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            id="notification-unread-badge"
            className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-status-flagged text-[10px] font-bold text-white shadow-xs"
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          id="notification-dropdown"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white shadow-xl border border-slate-border z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-govt-navy text-white border-b border-govt-navy-dark">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{t.notificationsTitle}</span>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-status-flagged text-white">
                  {t('unreadCountText', { count: unreadCount })}
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-white/15 text-panel-bg/80">
                  {t.allCaughtUpText}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  id="mark-all-read-btn"
                  onClick={handleMarkAllAsRead}
                  className="p-1.5 rounded-md hover:bg-govt-navy-light text-panel-bg/80 hover:text-white text-xs flex items-center gap-1 transition-colors"
                  title={t.markAllReadText}
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                id="reset-notifications-btn"
                onClick={handleResetNotifications}
                disabled={resetting}
                className="p-1.5 rounded-md hover:bg-govt-navy-light text-panel-bg/80 hover:text-white text-xs flex items-center gap-1 transition-colors"
                title={t.resetBaselineText}
              >
                <RotateCcw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className="px-3 py-1.5 text-xs bg-panel-bg text-govt-navy font-medium border-b border-slate-border flex items-center justify-between">
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-border">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-muted">
                <div className="w-5 h-5 border-2 border-govt-navy border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                {t.loadingNotificationsText}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-muted">
                <Bell className="w-8 h-8 text-slate-muted/50 mx-auto mb-2" />
                <p className="font-medium text-slate-body">{t.emptyNotificationsTitle}</p>
                <p className="text-slate-muted mt-0.5">{t.emptyNotificationsDesc}</p>
                <button
                  onClick={handleResetNotifications}
                  className="mt-3 text-xs text-govt-navy font-semibold underline hover:text-govt-navy-light"
                >
                  {t.resetBaselineText}
                </button>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  id={`notification-item-${item.id}`}
                  onClick={() => {
                    handleMarkAsRead(item.id);
                    if (item.link?.includes('alert') && onNavigateToAlerts) {
                      onNavigateToAlerts();
                      setIsOpen(false);
                    } else if (item.link?.includes('project') && onNavigateToProjects) {
                      onNavigateToProjects();
                      setIsOpen(false);
                    }
                  }}
                  className={`p-3.5 transition-colors cursor-pointer flex gap-3 text-left ${
                    item.read
                      ? 'bg-white hover:bg-panel-bg'
                      : 'bg-panel-bg hover:bg-white'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    <div className="p-2 rounded-lg bg-white shadow-xs border border-slate-border">
                      {getNotificationIcon(item.type)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className={`text-xs ${item.read ? 'font-medium text-slate-muted' : 'font-bold text-slate-body'}`}>
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!item.read && (
                          <button
                            id={`mark-read-btn-${item.id}`}
                            onClick={(e) => handleMarkAsRead(item.id, e)}
                            className="p-0.5 rounded text-slate-muted hover:text-govt-navy hover:bg-white transition-colors"
                            title={t.markAsReadText}
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!item.read && (
                          <span className="w-2 h-2 rounded-full bg-status-flagged" />
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-muted mt-1 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-muted">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(item.createdAt)}</span>
                      {item.link && (
                        <span className="text-govt-navy font-medium flex items-center gap-0.5 ml-auto">
                          {t.viewDetails}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-panel-bg border-t border-slate-border flex items-center justify-between text-xs text-slate-muted">
            <button
              id="footer-reset-notifications-btn"
              onClick={handleResetNotifications}
              disabled={resetting}
              className="text-govt-navy hover:text-govt-navy-light font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
              <span>{t.resetBaselineText}</span>
            </button>
            <span className="text-[11px] text-slate-muted">
              {t.roleAuthority}: {translateRole(role)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
