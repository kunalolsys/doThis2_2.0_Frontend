# TaskChat Improvements

## Previous: Auto-Scroll Fix [✅ COMPLETED]

## New Task: Auto-Mark Thread Messages as Seen

**✅ APPROVED: Use `/thread/{conversationId}/seen` API + optimistic update**

## Implementation Steps

### 1. [✅ COMPLETED] Per-message seen with IntersectionObserver + `/thread/seen {messageId}`
   - Add markThreadSeen: POST `/thread/${task.conversationId}/seen`
   - Optimistic: set all messages seen=true
   - Debounce calls (use custom debounce ~1s)

### 2. [] Integrate with scroll
   - Call debouncedMarkSeen in handleScroll
   - Initial call after loadTaskChat

### 3. [] Test
   - Open TaskChat, scroll → network POST /thread/.../seen
   - All ✓✓ appear

### 4. [] [COMPLETED]

**Next: Step 1 edits**

## User Guide Manual [✅ COMPLETED]
- Created `docs/USER_GUIDE.md` with full sections for all features.


