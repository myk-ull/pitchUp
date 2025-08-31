import React, { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus, Search, Check, X, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import './FriendsPage.css';

interface Friend {
  id: string;
  username: string;
  avatar_url?: string;
  status: 'pending' | 'accepted';
  created_at: string;
  is_requester: boolean;
}

interface UserSearchResult {
  id: string;
  username: string;
  avatar_url?: string;
}

const FriendsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'add'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestedUsers, setRequestedUsers] = useState<Set<string>>(new Set());

  const formatDate = (dateString: string) => {
    // Ensure we're working with UTC time
    const date = new Date(dateString + (dateString.includes('Z') ? '' : 'Z'));
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const days = Math.floor(seconds / 86400);
    
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    if (user) {
      loadFriends();
      loadPendingRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadFriends = async () => {
    if (!user) return;
    
    const { data: friendshipsData, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted');

    if (friendshipsData && !error) {
      // Get all friend IDs
      const friendIds = friendshipsData.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      );
      
      // Fetch profiles for all friends
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', friendIds);
      
      if (profilesData) {
        const profileMap = new Map(profilesData.map(p => [p.id, p]));
        
        const formattedFriends = friendshipsData.map(friendship => {
          const friendId = friendship.user_id === user.id ? friendship.friend_id : friendship.user_id;
          const friendProfile = profileMap.get(friendId);
          
          return {
            id: friendship.id,
            username: friendProfile?.username || 'Unknown',
            avatar_url: friendProfile?.avatar_url,
            status: 'accepted' as const,
            created_at: friendship.created_at,
            is_requester: friendship.user_id === user.id
          };
        });
        
        setFriends(formattedFriends);
      }
    }
  };

  const loadPendingRequests = async () => {
    if (!user) return;
    
    const { data: requestsData, error } = await supabase
      .from('friendships')
      .select('*')
      .eq('friend_id', user.id)
      .eq('status', 'pending');

    if (requestsData && !error) {
      // Get all requester IDs
      const requesterIds = requestsData.map(r => r.user_id);
      
      // Fetch profiles for all requesters
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', requesterIds);
      
      if (profilesData) {
        const profileMap = new Map(profilesData.map(p => [p.id, p]));
        
        const formattedRequests = requestsData.map(friendship => {
          const requesterProfile = profileMap.get(friendship.user_id);
          
          return {
            id: friendship.id,
            username: requesterProfile?.username || 'Unknown',
            avatar_url: requesterProfile?.avatar_url,
            status: 'pending' as const,
            created_at: friendship.created_at,
            is_requester: false
          };
        });
        
        setPendingRequests(formattedRequests);
      }
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || !user) return;
    
    setLoading(true);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .ilike('username', `%${searchQuery}%`)
      .neq('id', user.id)
      .limit(10);

    if (data && !error) {
      const existingFriendIds = new Set([
        ...friends.map(f => f.id),
        ...pendingRequests.map(r => r.id)
      ]);
      
      const filteredResults = data.filter(u => !existingFriendIds.has(u.id));
      setSearchResults(filteredResults);
    }
    
    setLoading(false);
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('friendships')
      .insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending'
      });

    if (!error) {
      setRequestedUsers(prev => new Set(prev).add(friendId));
      setTimeout(() => {
        setSearchResults(prev => prev.filter(u => u.id !== friendId));
      }, 1000);
    }
  };

  const acceptRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (!error) {
      loadFriends();
      loadPendingRequests();
    }
  };

  const declineRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', requestId);

    if (!error) {
      loadPendingRequests();
    }
  };

  const removeFriend = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (!error) {
      loadFriends();
    }
  };

  return (
    <div className="friends-page">
      <div className="friends-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={24} />
        </button>
        <h1>Friends</h1>
        <div className="header-spacer"></div>
      </div>

      <div className="friends-tabs">
        <button 
          className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          Friends {friends.length > 0 && `(${friends.length})`}
        </button>
        <button 
          className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Requests {pendingRequests.length > 0 && <span className="badge">{pendingRequests.length}</span>}
        </button>
        <button 
          className={`tab ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          <UserPlus size={18} />
        </button>
      </div>

      <div className="friends-content">
        {activeTab === 'friends' && (
          <div className="friends-list">
            {friends.length === 0 ? (
              <div className="empty-state">
                <p>No friends yet</p>
                <button className="add-friends-btn" onClick={() => setActiveTab('add')}>
                  Add Friends
                </button>
              </div>
            ) : (
              friends.map(friend => (
                <div key={friend.id} className="friend-item">
                  <div className="friend-avatar">
                    {friend.username[0].toUpperCase()}
                  </div>
                  <div className="friend-info">
                    <div className="friend-username">{friend.username}</div>
                    <div className="friend-status">Friends {formatDate(friend.created_at)}</div>
                  </div>
                  <button 
                    className="remove-btn"
                    onClick={() => removeFriend(friend.id)}
                  >
                    <X size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="requests-list">
            {pendingRequests.length === 0 ? (
              <div className="empty-state">
                <p>No pending requests</p>
              </div>
            ) : (
              pendingRequests.map(request => (
                <div key={request.id} className="request-item">
                  <div className="friend-avatar">
                    {request.username[0].toUpperCase()}
                  </div>
                  <div className="friend-info">
                    <div className="friend-username">{request.username}</div>
                    <div className="friend-status">
                      <Clock size={12} /> Pending
                    </div>
                  </div>
                  <div className="request-actions">
                    <button 
                      className="accept-btn"
                      onClick={() => acceptRequest(request.id)}
                    >
                      <Check size={18} />
                    </button>
                    <button 
                      className="decline-btn"
                      onClick={() => declineRequest(request.id)}
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'add' && (
          <div className="add-friends">
            <div className="search-container">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search by username"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
              />
              <button 
                className="search-btn"
                onClick={searchUsers}
                disabled={loading}
              >
                Search
              </button>
            </div>

            <div className="search-results">
              {loading ? (
                <div className="loading">Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map(user => (
                  <div key={user.id} className="user-result">
                    <div className="friend-avatar">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div className="friend-info">
                      <div className="friend-username">{user.username}</div>
                    </div>
                    <button 
                      className={`add-btn ${requestedUsers.has(user.id) ? 'requested' : ''}`}
                      onClick={() => sendFriendRequest(user.id)}
                      disabled={requestedUsers.has(user.id)}
                    >
                      {requestedUsers.has(user.id) ? (
                        <>
                          <Check size={16} /> Requested
                        </>
                      ) : (
                        <>
                          <UserPlus size={16} /> Add
                        </>
                      )}
                    </button>
                  </div>
                ))
              ) : searchQuery && (
                <div className="empty-state">
                  <p>No users found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;