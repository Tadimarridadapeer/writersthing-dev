const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'src/app/profile/page.tsx');
let content = fs.readFileSync(p, 'utf8');

// 1. Ensure Bell icon is imported
if (!content.includes('Bell,') && !content.includes(', Bell')) {
  content = content.replace('import {', 'import { Bell,');
}

// 2. Ensure useNotifications is imported
if (!content.includes('useNotifications')) {
  content = content.replace('import { useAuth } from "@/context/AuthContext";', 'import { useAuth } from "@/context/AuthContext";\nimport { useNotifications } from "@/hooks/useNotifications";');
  content = content.replace('const { user, loading: authLoading } = useAuth();', 'const { user, loading: authLoading } = useAuth();\n  const { notifications, unreadCount, hasMore, fetchMore, setFilter: setNotifFilter, markAsRead, markAllAsRead, deleteNotification } = useNotifications(20);\n  const [notifFilterState, setNotifFilterState] = useState("all");\n  const handleNotifFilter = (f) => { setNotifFilterState(f); setNotifFilter(f); };');
} else {
  // If useNotifications is already imported (e.g. from previous bookmark logic, but wait, useBookmarks is there, not useNotifications)
  if (!content.includes('useNotifications(')) {
    content = content.replace('import { useBookmarks } from "@/hooks/useBookmarks";', 'import { useBookmarks } from "@/hooks/useBookmarks";\nimport { useNotifications } from "@/hooks/useNotifications";');
    content = content.replace('const { bookmarks, lists, toggleBookmark, fetchListsAndBookmarks } = useBookmarks();', 'const { bookmarks, lists, toggleBookmark, fetchListsAndBookmarks } = useBookmarks();\n  const { notifications, unreadCount, hasMore, fetchMore, setFilter: setNotifFilter, markAsRead, markAllAsRead, deleteNotification } = useNotifications(20);\n  const [notifFilterState, setNotifFilterState] = useState("all");\n  const handleNotifFilter = (f) => { setNotifFilterState(f); setNotifFilter(f); };');
  }
}

// 3. Add Nav Button
if (!content.includes('label="Notifications"')) {
  const btn = `<ProfileNavBtn icon={<Bell size={18} />} label="Notifications" active={activeSection === "Notifications"} onClick={() => setActiveSection("Notifications")} />
                `;
  content = content.replace('<ProfileNavBtn icon={<Book size={18} />} label="My Library"', btn + '<ProfileNavBtn icon={<Book size={18} />} label="My Library"');
}

// 4. Add Section UI
const notificationUI = `
                  {activeSection === "Notifications" && (
                    <div className="space-y-8">
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                        <h2 className="text-2xl font-black font-heading uppercase tracking-tight">Notifications</h2>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      {/* Filter Pills */}
                      <div className="flex flex-wrap gap-2 mb-8 select-none">
                        {[
                          { value: "all", label: "All" },
                          { value: "unread", label: "Unread" },
                          { value: "new_comment", label: "Comments" },
                          { value: "new_follower", label: "Followers" }
                        ].map((f) => (
                          <button
                            key={f.value}
                            onClick={() => handleNotifFilter(f.value)}
                            className={\`px-4 py-2 text-[8px] font-black uppercase tracking-widest transition-all border rounded-full cursor-pointer \${
                              notifFilterState === f.value
                                ? "bg-black border-black text-white"
                                : "bg-white border-zinc-200 text-zinc-400 hover:text-black hover:border-black"
                            }\`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      <div className="divide-y divide-zinc-100">
                        {notifications.length === 0 ? (
                          <div className="py-20 text-center text-zinc-400">
                            <p className="text-xs">No notifications found.</p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className={\`py-4 flex items-start gap-4 transition-colors \${!n.is_read ? 'bg-zinc-50/50' : ''}\`}>
                              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                                <Bell size={16} className="text-zinc-500" />
                              </div>
                              <div className="flex-1 min-w-0 pt-1">
                                <p className="text-sm text-zinc-800">
                                  {n.actor?.name && <span className="font-bold">{n.actor.name} </span>}
                                  {n.type.replace('_', ' ')}
                                </p>
                                <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-1">
                                  {new Date(n.created_at).toLocaleString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {!n.is_read && (
                                  <button onClick={() => markAsRead(n.id)} className="text-[10px] uppercase font-bold text-blue-500 hover:text-blue-700">Mark Read</button>
                                )}
                                <button onClick={() => deleteNotification(n.id)} className="text-[10px] uppercase font-bold text-red-400 hover:text-red-600">Delete</button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      {hasMore && notifications.length > 0 && (
                        <div className="pt-4 flex justify-center">
                          <button onClick={fetchMore} className="px-6 py-2 border border-zinc-200 text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-colors rounded-sm">
                            Load More
                          </button>
                        </div>
                      )}
                    </div>
                  )}
`;

if (!content.includes('activeSection === "Notifications"')) {
  content = content.replace('{activeSection === "Bookmarks" && (', notificationUI + '\n                  {activeSection === "Bookmarks" && (');
}

fs.writeFileSync(p, content, 'utf8');
console.log('Profile updated for Notifications');
