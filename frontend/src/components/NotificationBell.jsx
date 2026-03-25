import { useState, useEffect, useContext, useRef } from "react";
import API from "../api/axiosConfig";
import { AuthContext } from "../context/AuthContext";

const NotificationBell = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const { data } = await API.get("/users/notifications");
        setNotifications(data);
      } catch {
        // silently fail — bell is non-critical
      }
    };
    fetch();
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unread = notifications.filter(n => !n.read).length;

  const markRead = async (id) => {
    try {
      await API.put(`/users/notifications/${id}`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
    } catch {}
  };

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-300 hover:text-white transition"
      >
        <span className="text-xl">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-[#1e1e38] border border-gray-700 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-700">
            <h4 className="font-bold text-white">Notifications</h4>
          </div>
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-sm p-4 text-center">No notifications yet</p>
          ) : (
            notifications.map(n => (
              <div
                key={n._id}
                onClick={() => markRead(n._id)}
                className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-[#16162a] transition ${!n.read ? "bg-[#6c3483]/10" : ""}`}
              >
                <p className="text-sm text-white">{n.message}</p>
                {!n.read && (
                  <span className="text-xs text-[#6c3483] font-bold mt-1 block">Tap to mark read</span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;