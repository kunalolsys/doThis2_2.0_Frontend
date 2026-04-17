import React, { useState } from 'react';
import { Button } from './ui';
import { Badge } from './ui';
import { 
  MessageSquarePlus, 
  Reply, 
  Eye, 
  BellOff,
  Loader2 
} from 'lucide-react';
import { 
  raiseQuery, 
  sendMessage, 
  replyToQuery, 
  markMessageSeen, 
  markAllNotificationsRead 
} from '../lib/socket';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';

const QuickTaskActions = ({ taskIds = [], convId }) => {
  const [loading, setLoading] = useState({});
  const currentUser = useSelector(state => state.users.currentUser);

  const withLoading = (action, key) => async (...args) => {
    try {
      setLoading(prev => ({ ...prev, [key]: true }));
      await action(...args);
      toast.success(`${key} success`);
    } catch (error) {
      toast.error(`${key} failed`);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleRaiseQuery = withLoading(async () => {
    const taskId = taskIds[0];
    if (!taskId || !currentUser?._id) return toast.error('No task/user');
    
    await raiseQuery(taskId, `Quick query test: ${new Date().toLocaleTimeString()}`, 'TARGET_MANAGER_ID');
  }, 'raiseQuery');

  const handleSendMessage = withLoading(async () => {
    if (!convId) return toast.error('No conversation');
    await sendMessage(convId, `Quick message: ${new Date().toLocaleTimeString()}`);
  }, 'sendMessage');

  const handleReplyQuery = withLoading(async () => {
    if (!convId) return toast.error('No conversation');
    await replyToQuery('LATEST_QUERY_ID', convId, `Quick reply: ${new Date().toLocaleTimeString()}`);
  }, 'replyQuery');

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
        🎮 Quick Actions
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Button 
          onClick={handleRaiseQuery}
          disabled={loading.raiseQuery || !taskIds.length}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          {loading.raiseQuery ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquarePlus className="w-4 h-4" />}
          <span className="truncate">Raise Query</span>
        </Button>

        <Button 
          onClick={handleSendMessage}
          disabled={loading.sendMessage || !convId}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          {loading.sendMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Reply className="w-4 h-4" />}
          <span className="truncate">Send Message</span>
        </Button>

        <Button 
          onClick={handleReplyQuery}
          disabled={loading.replyQuery || !convId}
          className="w-full justify-start gap-2 col-span-1 md:col-span-2"
          variant="outline"
        >
          {loading.replyQuery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Reply className="w-4 h-4" />}
          <span className="truncate">Reply Query</span>
        </Button>
      </div>

      <div className="flex gap-2 pt-2 border-t">
        <Button 
          size="sm"
          onClick={withLoading(markMessageSeen, 'markSeen')}
          disabled={loading.markSeen}
          variant="ghost"
          className="flex-1 gap-1 justify-center"
        >
          👁️ Mark Seen
        </Button>
        <Button 
          size="sm" 
          onClick={withLoading(markAllNotificationsRead, 'clearNotifs')}
          disabled={loading.clearNotifs}
          variant="destructive"
          className="flex-1 gap-1 justify-center"
        >
          🗑️ Clear All
        </Button>
      </div>

      {/* Task/Conv info */}
      {(taskIds.length || convId) && (
        <div className="text-xs text-gray-500 space-y-1 p-2 bg-gray-50 rounded">
          <div>Task IDs: {taskIds.slice(0,2).join(', ') || 'None'}</div>
          <div>Conv ID: {convId?.slice(0,8) || 'None'}...</div>
        </div>
      )}
    </div>
  );
};

export default QuickTaskActions;

