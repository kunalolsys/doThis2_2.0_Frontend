# Socket.IO Real-Time Task Module Integration
✅ **Approved Plan**: Non-disruptive. Separate Socket client/API. Navbar notifications. Prioritize MyTask.jsx.

## Steps (8 total)

### 1. ✅ Install Dependencies
- socket.io-client v4.8.3 (up-to-date)
- 15 vulns noted (non-blocking)

### 2. ✅ Socket Infrastructure (Separate Client)
- `src/context/SocketContext.jsx` ✓
- `src/lib/socket.js` ✓  
- `src/App.jsx` wrapped ✓

### 3. ✅ Navbar Notifications
- Navbar.jsx: Badge + live status ✓
- NotificationModal.jsx ✓
- APIs integrated ✓

### 4. ✅ Redux Socket Slice
- `socketSlice.js` ✓
- myTaskSlice extraReducers ✓ (optimistic new-task/query)

### 5. MyTask.jsx Integration (Priority)
- Add Live Events Feed panel
- Quick actions modal (raiseQuery, reply, markSeen)
- Live stats (unread badge, event count)
- Auto-join: user_tasks_${userId}

### 6. ManagerView.jsx Integration
- Live feed for subordinates
- Query/reply actions

### 7. Shared Components
- `src/components/LiveEventsFeed.jsx`
- `src/components/QuickTaskActions.jsx`
- `src/components/NotificationBadge.jsx`

### 8. Test & Verify
- Backend Socket.IO running
- Cross-tab: Create task/query → live updates
- Navbar notifications work
- Fallback: REST polling intact

**Progress: 1/8**  
**Current: Step 2**

