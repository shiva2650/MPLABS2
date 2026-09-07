import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  ExternalLink,
  CheckCheck,
  X
} from 'lucide-react';
import { SystemNotification } from '../types/index.ts';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../services/api.ts';

interface NotificationCenterProps {
  onSelectProject?: (projectId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onSelectProject }) => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await fetchNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) {
      console.warn('Unable to load remote notifications, keeping current state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.warn('Failed to mark notification read remotely:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.warn('Failed to mark all notifications read remotely:', err);
    }
  };

  const handleNotificationClick = (n: SystemNotification) => {
    if (!n.isRead) {
      markNotificationRead(n.id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
      );
    }
    if (n.projectId && onSelectProject) {
      onSelectProject(n.projectId);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 hover:text-blue-950 hover:bg-gray-100 rounded-md transition-colors"
        title="Notifications & System Alerts"
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-600 text-white font-extrabold text-[10px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-300 rounded-lg shadow-2xl z-50 overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="bg-blue-950 text-white p-3 flex items-center justify-between border-b-2 border-amber-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">System Alerts & Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-amber-500 text-slate-950 font-extrabold px-1.5 py-0.2 rounded text-[10px]">
                  {unreadCount} New
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-semibold text-blue-200 hover:text-white flex items-center gap-1 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>Mark All</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-300 hover:text-white p-0.5 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 bg-gray-50/50">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-xs">
                No notifications on record.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 transition-colors cursor-pointer flex items-start gap-2.5 ${
                    n.isRead ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/70 hover:bg-blue-50'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {n.priority === 'Critical' || n.priority === 'high' ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 block" />
                    ) : n.priority === 'High' || n.priority === 'medium' ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 block" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-gray-900 truncate text-xs">{n.title}</span>
                      <span className="text-[10px] text-gray-500 shrink-0 font-mono">
                        {new Date(n.createdAt || n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-700 leading-snug line-clamp-2">
                      {n.message}
                    </p>

                    <div className="mt-1.5 flex items-center justify-between text-[10px]">
                      {n.workId ? (
                        <span className="font-mono font-bold text-blue-900 bg-blue-100 px-1.5 py-0.2 rounded">
                          {n.workId}
                        </span>
                      ) : (
                        <span className="text-gray-400">System Notification</span>
                      )}

                      {!n.isRead && (
                        <button
                          onClick={(e) => handleMarkRead(n.id, e)}
                          className="text-blue-900 hover:text-blue-950 font-semibold"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 bg-gray-100 text-center text-[10px] text-gray-600 border-t border-gray-200">
            Compliant with MoSPI MPLADS automated audit telemetry
          </div>
        </div>
      )}
    </div>
  );
};
