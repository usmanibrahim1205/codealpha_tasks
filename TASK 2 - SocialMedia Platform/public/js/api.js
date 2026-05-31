/* ==========================================================================
   ULINK FRONTEND REST API WRAPPER
   ========================================================================== */

const ULinkAPI = (() => {
  
  // Custom API fetch request handler
  async function request(url, options = {}) {
    options.headers = options.headers || {};
    options.credentials = 'same-origin';
    
    // If not sending FormData, default to application/json
    if (!(options.body instanceof FormData)) {
      options.headers['Content-Type'] = 'application/json';
      if (options.body && typeof options.body === 'object') {
        options.body = JSON.stringify(options.body);
      }
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }
      return data;
    } catch (err) {
      console.error(`API Error on [${url}]:`, err);
      throw err;
    }
  }

  return {
    // --- AUTHENTICATION ---
    async login(usernameOrEmail, password) {
      return request('/api/auth/login', {
        method: 'POST',
        body: { usernameOrEmail, password }
      });
    },

    async register(username, email, full_name, password) {
      return request('/api/auth/register', {
        method: 'POST',
        body: { username, email, full_name, password }
      });
    },

    async logout() {
      return request('/api/auth/logout', { method: 'POST' });
    },

    async me() {
      return request('/api/auth/me');
    },

    async changePassword(oldPassword, newPassword) {
      return request('/api/auth/change-password', {
        method: 'POST',
        body: { oldPassword, newPassword }
      });
    },

    async deleteAccount() {
      return request('/api/auth/delete-account', { method: 'POST' });
    },

    // --- USER PROFILES ---
    async getProfile(username) {
      return request(`/api/users/profile/${encodeURIComponent(username)}`);
    },

    async updateProfile(formData) {
      return request('/api/users/update-profile', {
        method: 'POST',
        body: formData
      });
    },

    async search(query) {
      return request(`/api/users/search?query=${encodeURIComponent(query)}`);
    },

    // --- POSTS & REELS ---
    async createPost(formData) {
      return request('/api/posts/create', {
        method: 'POST',
        body: formData
      });
    },

    async getFeed() {
      return request('/api/posts/feed');
    },

    async getReels() {
      return request('/api/posts/reels');
    },

    async getUserPosts(username) {
      return request(`/api/posts/user/${encodeURIComponent(username)}`);
    },

    async getPost(postId) {
      return request(`/api/posts/${postId}`);
    },

    async likePost(postId) {
      return request(`/api/posts/${postId}/like`, { method: 'POST' });
    },

    async unlikePost(postId) {
      return request(`/api/posts/${postId}/unlike`, { method: 'POST' });
    },

    async savePost(postId) {
      return request(`/api/posts/${postId}/save`, { method: 'POST' });
    },

    async getSavedPosts() {
      return request('/api/posts/saved');
    },

    // --- COMMENTS ---
    async getComments(postId) {
      return request(`/api/posts/${postId}/comments`);
    },

    async createComment(postId, text, parentId = null) {
      return request(`/api/posts/${postId}/comments/create`, {
        method: 'POST',
        body: { text, parent_id: parentId }
      });
    },

    // --- FOLLOWS ---
    async followUser(userId) {
      return request(`/api/users/${userId}/follow`, { method: 'POST' });
    },

    async unfollowUser(userId) {
      return request(`/api/users/${userId}/unfollow`, { method: 'POST' });
    },

    async getFollowers(userId) {
      return request(`/api/users/${userId}/followers`);
    },

    async getFollowing(userId) {
      return request(`/api/users/${userId}/following`);
    },

    async getFollowRequests() {
      return request('/api/users/follow-requests');
    },

    async approveFollowRequest(userId) {
      return request(`/api/users/follow-requests/${userId}/approve`, { method: 'POST' });
    },

    async rejectFollowRequest(userId) {
      return request(`/api/users/follow-requests/${userId}/reject`, { method: 'POST' });
    },

    // --- STORIES & HIGHLIGHTS ---
    async createStory(formData) {
      return request('/api/stories/create', {
        method: 'POST',
        body: formData
      });
    },

    async getStoriesFeed() {
      return request('/api/stories/feed');
    },

    async createHighlight(title, storyIds) {
      return request('/api/stories/highlights/create', {
        method: 'POST',
        body: { title, storyIds }
      });
    },

    async getUserHighlights(username) {
      return request(`/api/stories/highlights/user/${encodeURIComponent(username)}`);
    },

    async deleteHighlight(highlightId) {
      return request(`/api/stories/highlights/${highlightId}`, { method: 'DELETE' });
    },

    async deletePost(postId) {
      return request(`/api/posts/${postId}`, { method: 'DELETE' });
    },

    async deleteStory(storyId) {
      return request(`/api/stories/${storyId}`, { method: 'DELETE' });
    },

    // --- PRIVACY CONTROLS ---
    async updatePrivacySetting(targetUserId, action, value) {
      return request('/api/privacy/settings', {
        method: 'POST',
        body: { target_user_id: targetUserId, action, value }
      });
    },

    async getPrivacySettings() {
      return request('/api/privacy/settings');
    },

    // --- DIRECT MESSAGING ---
    async getThreads() {
      return request('/api/dms/threads');
    },

    async getThreadMessages(threadId) {
      return request(`/api/dms/threads/${threadId}/messages`);
    },

    async markThreadAsRead(threadId) {
      return request(`/api/dms/threads/${threadId}/read`, { method: 'POST' });
    },

    async startThread(targetUserIds, name = '', isGroup = false) {
      return request('/api/dms/threads/start', {
        method: 'POST',
        body: { targetUserIds, name, isGroup }
      });
    },

    async uploadMessageMedia(formData) {
      return request('/api/dms/upload', {
        method: 'POST',
        body: formData
      });
    },

    // --- NOTIFICATIONS (ACTIVITY) ---
    async getNotifications() {
      return request('/api/notifications');
    },

    async markNotificationsAsRead() {
      return request('/api/notifications/read', { method: 'POST' });
    },

    async getUnreadNotificationsCount() {
      return request('/api/notifications/unread-count');
    }
  };
})();
