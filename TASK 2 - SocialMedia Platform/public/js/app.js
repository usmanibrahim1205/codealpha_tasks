/* ==========================================================================
   ULINK FRONTEND CORE CLIENT CONTROLLER (SPA)
   ========================================================================== */

function initializeULink() {
  try {
  // --- STATE CONTROLLER ---
  const state = {
    currentUser: null,
    currentView: 'feed',
    activeThreadId: null,
    
    // Stories system
    storiesFeed: [], // user groups
    storiesUserIndex: 0,
    storySlideIndex: 0,
    storyProgressInterval: null,
    storyProgressPct: 0,

    // Audio recorder variables
    audioRecorder: null,
    audioChunks: [],
    audioContext: null,
    audioAnalyser: null,
    audioVisualizerTimer: null,
    voiceStartTime: 0,
    voiceTimerInterval: null,

    // Create post system
    createPostFiles: [],
    createPostFilter: 'normal',
    createPostSliderIndex: 0
  };

  // Cache DOM Selectors
  const DOM = {
    authContainer: document.getElementById('auth-container'),
    appContainer: document.getElementById('app-container'),
    
    // Auth Forms
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    loginError: document.getElementById('login-error'),
    registerError: document.getElementById('register-error'),
    goToRegister: document.getElementById('go-to-register'),
    goToLogin: document.getElementById('go-to-login'),
    
    // Nav elements
    navUserAvatar: document.getElementById('nav-user-avatar'),
    navLogout: document.getElementById('nav-btn-logout'),
    feedSidebarLogoutBtn: document.getElementById('feed-sidebar-logout-btn'),
    navCreate: document.getElementById('nav-btn-create'),
    navSettings: document.getElementById('nav-btn-settings'),
    mobileBtnCreate: document.getElementById('mobile-btn-create'),
    dmUnreadBadge: document.getElementById('dm-unread-badge'),
    mobileUnreadBadge: document.getElementById('mobile-unread-badge'),
    activityUnreadBadge: document.getElementById('activity-unread-badge'),
    mobileActivityUnreadBadge: document.getElementById('mobile-activity-unread-badge'),
    activityList: document.getElementById('activity-list'),
    btnClearActivity: document.getElementById('btn-clear-activity'),
    toastContainer: document.getElementById('notification-toast-container'),

    // Views
    views: {
      feed: document.getElementById('view-feed'),
      explore: document.getElementById('view-explore'),
      reels: document.getElementById('view-reels'),
      dms: document.getElementById('view-dms'),
      profile: document.getElementById('view-profile'),
      activity: document.getElementById('view-activity')
    },

    // Feed DOM
    storiesList: document.getElementById('stories-list'),
    postsContainer: document.getElementById('posts-container'),
    feedSidebarAvatar: document.getElementById('feed-sidebar-avatar'),
    feedSidebarUsername: document.getElementById('feed-sidebar-username'),
    feedSidebarFullname: document.getElementById('feed-sidebar-fullname'),
    suggestionsList: document.getElementById('suggestions-list'),
    btnAddStory: document.getElementById('btn-add-story'),
    storyMyAvatar: document.getElementById('story-my-avatar'),

    // Explore DOM
    exploreSearchInput: document.getElementById('explore-search-input'),
    searchClearBtn: document.getElementById('search-clear-btn'),
    searchResultsSection: document.getElementById('search-results-section'),
    searchUsersList: document.getElementById('search-users-list'),
    searchPostsGrid: document.getElementById('search-posts-grid'),
    exploreDefaultContent: document.getElementById('explore-default-content'),
    exploreGridContainer: document.getElementById('explore-grid-container'),

    // Reels DOM
    reelsScrollContainer: document.getElementById('reels-scroll-container'),

    // DMs DOM
    btnStartChat: document.getElementById('btn-start-chat'),
    btnFallbackNewMsg: document.getElementById('btn-fallback-new-msg'),
    threadsContainer: document.getElementById('threads-container'),
    chatFallback: document.getElementById('chat-window-fallback'),
    chatActive: document.getElementById('chat-window-active'),
    chatHeaderAvatar: document.getElementById('chat-header-avatar'),
    chatHeaderName: document.getElementById('chat-header-name'),
    chatHeaderTyping: document.getElementById('chat-header-typing'),
    chatMessagesList: document.getElementById('chat-messages-list'),
    chatMessageInput: document.getElementById('chat-message-input'),
    chatBtnSend: document.getElementById('chat-btn-send'),
    chatBtnAttach: document.getElementById('chat-btn-attach'),
    chatFileInput: document.getElementById('chat-file-input'),
    chatBtnVoice: document.getElementById('chat-btn-voice'),
    chatBtnSticker: document.getElementById('chat-btn-sticker'),
    stickerContainer: document.getElementById('sticker-container'),
    voiceRecorderPanel: document.getElementById('voice-recorder-panel'),
    voiceTimer: document.getElementById('voice-timer'),
    voiceVisualizer: document.getElementById('voice-visualizer'),
    voiceBtnCancel: document.getElementById('voice-btn-cancel'),
    voiceBtnSend: document.getElementById('voice-btn-send'),

    // Profile DOM
    profileDetailsAvatar: document.getElementById('profile-details-avatar'),
    profileDetailsUsername: document.getElementById('profile-details-username'),
    profileDetailsFullname: document.getElementById('profile-details-fullname'),
    profileDetailsBio: document.getElementById('profile-details-bio'),
    profileStatsPosts: document.getElementById('profile-stats-posts'),
    profileStatsFollowers: document.getElementById('profile-stats-followers'),
    profileStatsFollowing: document.getElementById('profile-stats-following'),
    profilePrivateBadge: document.getElementById('profile-private-badge'),
    profileBtnLogout: document.getElementById('profile-btn-logout'),
    profileBtnSettings: document.getElementById('profile-btn-settings'),
    profileBtnFollow: document.getElementById('profile-btn-follow'),
    profileBtnUnfollow: document.getElementById('profile-btn-unfollow'),
    profileBtnPrivacyActions: document.getElementById('profile-btn-privacy-actions'),
    profileHighlightsList: document.getElementById('profile-highlights-list'),
    profilePostsGrid: document.getElementById('profile-posts-grid'),
    profileBtnAddHighlight: document.getElementById('profile-btn-add-highlight'),
    profileAvatarTrigger: document.getElementById('profile-avatar-trigger'),
    profileAvatarFile: document.getElementById('profile-avatar-file'),
    profileTriggerFollowers: document.getElementById('profile-trigger-followers'),
    profileTriggerFollowing: document.getElementById('profile-trigger-following'),

    // Modals
    modalCreatePost: document.getElementById('modal-create-post'),
    createPostClose: document.getElementById('create-post-close'),
    createPostFilesInput: document.getElementById('create-post-files'),
    createPostDropzone: document.getElementById('create-media-dropzone'),
    createPostPreviewer: document.getElementById('create-media-previewer'),
    previewCarouselSlider: document.getElementById('preview-carousel-slider'),
    previewPrevBtn: document.getElementById('preview-prev-btn'),
    previewNextBtn: document.getElementById('preview-next-btn'),
    previewIndicators: document.getElementById('preview-indicators'),
    filtersThumbList: document.getElementById('filters-thumb-list'),
    createPostCaption: document.getElementById('create-post-caption'),
    createPostLocation: document.getElementById('create-post-location'),
    createPostSubmit: document.getElementById('create-post-submit'),
    createPostError: document.getElementById('create-post-error'),
    
    modalStoriesViewer: document.getElementById('modal-stories-viewer'),
    btnStoryViewerClose: document.getElementById('btn-story-viewer-close'),
    storiesProgressContainer: document.getElementById('stories-progress-container'),
    storyViewerAvatar: document.getElementById('story-viewer-avatar'),
    storyViewerUsername: document.getElementById('story-viewer-username'),
    storyViewerTime: document.getElementById('story-viewer-time'),
    storyViewerCfBadge: document.getElementById('story-viewer-cf-badge'),
    storyViewerContent: document.getElementById('story-viewer-content'),
    storyViewerPrev: document.getElementById('story-viewer-prev'),
    storyViewerNext: document.getElementById('story-viewer-next'),
    storyViewerBtnHighlight: document.getElementById('story-viewer-btn-highlight'),
    storyViewerBtnDelete: document.getElementById('story-viewer-btn-delete'),

    modalCreateStory: document.getElementById('modal-create-story'),
    createStoryClose: document.getElementById('create-story-close'),
    createStoryFileInput: document.getElementById('create-story-file'),
    storyUploadBox: document.getElementById('story-upload-box'),
    storyMediaPreview: document.getElementById('story-media-preview'),
    storyPreviewViewport: document.getElementById('story-preview-viewport'),
    storyTextOverlay: document.getElementById('story-text-overlay'),
    createStorySubmit: document.getElementById('create-story-submit'),
    createStoryError: document.getElementById('create-story-error'),

    modalBuildHighlight: document.getElementById('modal-build-highlight'),
    buildHighlightClose: document.getElementById('build-highlight-close'),
    highlightTitleInput: document.getElementById('highlight-title-input'),
    highlightStoriesSelector: document.getElementById('highlight-stories-selector'),
    buildHighlightSubmit: document.getElementById('build-highlight-submit'),
    buildHighlightError: document.getElementById('build-highlight-error'),

    modalSettings: document.getElementById('modal-settings'),
    settingsClose: document.getElementById('settings-close'),
    setFullname: document.getElementById('set-fullname'),
    setBio: document.getElementById('set-bio'),
    setPrivacyToggle: document.getElementById('set-privacy-toggle'),
    settingsBlockedList: document.getElementById('settings-blocked-list'),
    setOldPassword: document.getElementById('set-old-password'),
    setNewPassword: document.getElementById('set-new-password'),
    setProfileSuccess: document.getElementById('set-profile-success'),
    setPasswordError: document.getElementById('set-password-error'),
    setPasswordSuccess: document.getElementById('set-password-success'),
    btnSettingsSaveProfile: document.getElementById('btn-settings-save-profile'),
    btnSettingsSavePassword: document.getElementById('btn-settings-save-password'),
    btnSettingsDeleteAccount: document.getElementById('btn-settings-delete-account'),

    modalStartChat: document.getElementById('modal-start-chat'),
    startChatClose: document.getElementById('start-chat-close'),
    chatSearchUsers: document.getElementById('chat-search-users'),
    chatSearchResults: document.getElementById('chat-search-results'),
    chatSelectedUsersBadgeRow: document.getElementById('chat-selected-users-badge-row'),
    chatIsGroupToggle: document.getElementById('chat-is-group-toggle'),
    groupNameInputRow: document.getElementById('group-name-input-row'),
    chatGroupName: document.getElementById('chat-group-name'),
    btnStartChatSubmit: document.getElementById('btn-start-chat-submit'),
    startChatError: document.getElementById('start-chat-error'),

    modalProfilePrivacy: document.getElementById('modal-profile-privacy'),
    profilePrivacyClose: document.getElementById('profile-privacy-close'),
    btnPrivCloseFriends: document.getElementById('btn-priv-close-friends'),
    btnPrivMute: document.getElementById('btn-priv-mute'),
    btnPrivRestrict: document.getElementById('btn-priv-restrict'),
    btnPrivBlock: document.getElementById('btn-priv-block'),
    privModalTitle: document.getElementById('priv-modal-title'),

    modalFollowList: document.getElementById('modal-follow-list'),
    followListClose: document.getElementById('follow-list-close'),
    followListModalTitle: document.getElementById('follow-list-modal-title'),
    followListContent: document.getElementById('follow-list-content'),

    modalDeleteConfirm: document.getElementById('modal-delete-confirm'),
    deleteConfirmClose: document.getElementById('delete-confirm-close'),
    btnDeleteCancel: document.getElementById('btn-delete-cancel'),
    btnDeleteConfirmAction: document.getElementById('btn-delete-confirm-action')
  };

  // --- STARTUP LOGIC ---
  const initApp = async () => {
    try {
      const data = await ULinkAPI.me();
      if (data.user) {
        setLoggedInUser(data.user);
        handleRoute();
      }
    } catch (e) {
      showAuthScreen();
    }
  };

  // Switch display elements
  function setLoggedInUser(user) {
    state.currentUser = user;
    DOM.authContainer.style.display = 'none';
    DOM.appContainer.style.display = 'grid';
    DOM.navUserAvatar.src = user.profile_pic || '/uploads/avatars/default.svg';
    DOM.storyMyAvatar.src = user.profile_pic || '/uploads/avatars/default.svg';
    
    // Boot socket
    ULinkWS.connect();
    setupWebSocketHandlers();
    updateGlobalUnreadBadges();
    
    // Suggest default sidebar items
    DOM.feedSidebarAvatar.src = user.profile_pic || '/uploads/avatars/default.svg';
    DOM.feedSidebarUsername.textContent = user.username;
    DOM.feedSidebarFullname.textContent = user.full_name || 'ULinker';
    loadSidebarSuggestions();
  }

  function showAuthScreen() {
    state.currentUser = null;
    state.activeThreadId = null;
    
    // Reset Direct Messages states and DOM to avoid cross-user state leaks
    if (DOM.threadsContainer) DOM.threadsContainer.innerHTML = '';
    if (DOM.chatMessagesList) DOM.chatMessagesList.innerHTML = '';
    if (DOM.chatActive) DOM.chatActive.style.display = 'none';
    if (DOM.chatFallback) DOM.chatFallback.style.display = 'flex';
    
    if (DOM.chatHeaderAvatar) DOM.chatHeaderAvatar.src = '/uploads/avatars/default.svg';
    if (DOM.chatHeaderName) DOM.chatHeaderName.textContent = 'Conversation User';
    if (DOM.chatHeaderTyping) DOM.chatHeaderTyping.style.display = 'none';

    // Clear Activity View state leaks
    if (DOM.activityList) DOM.activityList.innerHTML = '';
    if (DOM.activityUnreadBadge) DOM.activityUnreadBadge.style.display = 'none';
    if (DOM.mobileActivityUnreadBadge) DOM.mobileActivityUnreadBadge.style.display = 'none';

    ULinkWS.disconnect();
    DOM.appContainer.style.display = 'none';
    DOM.authContainer.style.display = 'flex';
  }

  // --- ROUTER ENGINE ---
  function handleRoute() {
    const hash = window.location.hash || '#feed';
    const viewName = hash.split('/')[0].substring(1);
    
    // Close any overlay modal on nav
    closeAllModals();

    // Deactivate active sidebar indicators
    document.querySelectorAll('.nav-links .nav-link').forEach(link => {
      link.classList.remove('active');
    });

    const activeLink = document.getElementById(`nav-btn-${viewName}`);
    if (activeLink) activeLink.classList.add('active');

    // Switch View Visibility
    Object.keys(DOM.views).forEach(key => {
      DOM.views[key].classList.remove('active');
    });

    if (DOM.views[viewName]) {
      DOM.views[viewName].classList.add('active');
      state.currentView = viewName;
    }

    // Dynamic views renderers
    if (viewName === 'feed') {
      renderFeedView();
    } else if (viewName === 'explore') {
      renderExploreView();
    } else if (viewName === 'reels') {
      renderReelsView();
    } else if (viewName === 'dms') {
      renderDMsView();
    } else if (viewName === 'profile') {
      const parts = hash.split('/');
      const targetUser = parts[1] || (state.currentUser ? state.currentUser.username : '');
      renderProfileView(targetUser);
    } else if (viewName === 'activity') {
      renderActivityView();
    }
  }

  window.addEventListener('hashchange', handleRoute);

  // Close modals
  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.classList.remove('active');
    });
    // Stop story timer
    if (state.storyProgressInterval) {
      clearInterval(state.storyProgressInterval);
      state.storyProgressInterval = null;
    }
    // Pause active modal stories video
    const video = DOM.storyViewerContent.querySelector('video');
    if (video) video.pause();
  }

  function closeDMConversation() {
    state.activeThreadId = null;
    const dmsLayout = document.querySelector('.dms-layout');
    if (dmsLayout) dmsLayout.classList.remove('thread-active');
    document.querySelectorAll('.thread-row').forEach(row => {
      row.classList.remove('active');
    });
    DOM.chatActive.style.display = 'none';
    DOM.chatFallback.style.display = 'flex';
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (state.currentView === 'dms' && state.activeThreadId) {
        closeDMConversation();
      }
      closeAllModals();
    }
  });

  // --- AUTH FORMS HANDLERS ---
  DOM.goToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    DOM.loginForm.classList.remove('active');
    DOM.registerForm.classList.add('active');
  });

  DOM.goToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    DOM.registerForm.classList.remove('active');
    DOM.loginForm.classList.add('active');
  });

  DOM.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    DOM.loginError.textContent = '';
    const name = document.getElementById('login-username').value;
    const pass = document.getElementById('login-password').value;
    try {
      const res = await ULinkAPI.login(name, pass);
      setLoggedInUser(res.user);
      if (window.location.hash === '#feed') {
        handleRoute();
      } else {
        window.location.hash = '#feed';
      }
    } catch (err) {
      DOM.loginError.textContent = err.message;
    }
  });

  DOM.registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    DOM.registerError.textContent = '';
    const user = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const name = document.getElementById('register-name').value;
    const pass = document.getElementById('register-password').value;
    try {
      const res = await ULinkAPI.register(user, email, name, pass);
      setLoggedInUser(res.user);
      if (window.location.hash === '#feed') {
        handleRoute();
      } else {
        window.location.hash = '#feed';
      }
    } catch (err) {
      DOM.registerError.textContent = err.message;
    }
  });

  if (DOM.navLogout) {
    DOM.navLogout.addEventListener('click', async (e) => {
      e.preventDefault();
      await ULinkAPI.logout();
      showAuthScreen();
    });
  }

  DOM.feedSidebarLogoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (confirm('Are you sure you want to log out of ULink?')) {
      await ULinkAPI.logout();
      showAuthScreen();
    }
  });

  DOM.btnClearActivity.addEventListener('click', async () => {
    try {
      await ULinkAPI.markNotificationsAsRead();
      document.querySelectorAll('.activity-item.unread').forEach(item => {
        item.classList.remove('unread');
      });
      updateGlobalUnreadBadges();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  });


  // --- FEED RENDER LOGIC ---
  async function renderFeedView() {
    try {
      // Refresh sidebar suggestions dynamically
      loadSidebarSuggestions();

      // 1. Stories circles load
      const storiesData = await ULinkAPI.getStoriesFeed();
      state.storiesFeed = storiesData.feed || [];
      drawStoriesCircles();

      // 2. Main Feed posts load
      const feedData = await ULinkAPI.getFeed();
      DOM.postsContainer.innerHTML = '';
      if (!feedData.feed || feedData.feed.length === 0) {
        DOM.postsContainer.innerHTML = `
          <div class="glass-panel text-center" style="padding: 40px;">
            <i class="fa-solid fa-people-arrows" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 15px;"></i>
            <h3>Your Feed is Empty</h3>
            <p class="text-muted" style="margin-top: 5px;">Follow creators on ULink or visit the Explore page to discover posts!</p>
          </div>
        `;
        return;
      }
      feedData.feed.forEach(post => {
        const postCard = createPostCard(post);
        DOM.postsContainer.appendChild(postCard);
      });
    } catch (e) {
      console.error('Feed failed to load:', e);
    }
  }

  function drawStoriesCircles() {
    DOM.storiesList.innerHTML = '';
    state.storiesFeed.forEach((group, index) => {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'story-circle';
      groupDiv.addEventListener('click', () => openStoriesViewer(index));

      // Check if unviewed (mock state for premium effect: close friends flag has distinct green ring)
      const ringClass = group.isCloseFriend ? 'avatar-ring story-unviewed badge-close-friends' : 'avatar-ring story-unviewed';

      groupDiv.innerHTML = `
        <div class="${ringClass}">
          <img src="${group.profile_pic || '/uploads/avatars/default.svg'}" alt="${group.username}" class="story-avatar" onerror="this.onerror=null; this.src='/uploads/avatars/default.svg';">
        </div>
        <span class="story-username">${group.username}</span>
      `;
      DOM.storiesList.appendChild(groupDiv);
    });
  }

  // Post Card Builder
  function createPostCard(post) {
    const card = document.createElement('div');
    card.className = 'post-card glass-panel';
    card.id = `post-card-${post.id}`;

    const mediaList = post.media || [];
    let mediaHtml = '';
    let indicatorsHtml = '';

    mediaList.forEach((m, idx) => {
      indicatorsHtml += `<span class="indicator-dot ${idx === 0 ? 'active' : ''}"></span>`;
      const filterClass = `filter-${m.media_filter || 'normal'}`;

      if (m.media_type === 'video') {
        mediaHtml += `
          <div class="media-slide" data-index="${idx}">
            <video src="${m.media_url}" class="${filterClass}" controls loop muted playsinline></video>
          </div>
        `;
      } else {
        mediaHtml += `
          <div class="media-slide" data-index="${idx}">
            <img src="${m.media_url}" class="${filterClass}" alt="Post Media" loading="lazy">
          </div>
        `;
      }
    });

    // Toggle arrows/indicators for carousels
    const arrowsAndDots = mediaList.length > 1 ? `
      <button class="carousel-arrow prev" style="display:none;"><i class="fa-solid fa-chevron-left"></i></button>
      <button class="carousel-arrow next"><i class="fa-solid fa-chevron-right"></i></button>
      <div class="carousel-indicators">${indicatorsHtml}</div>
    ` : '';

    // Verify properties
    const likeIconClass = post.has_liked ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
    const likedClass = post.has_liked ? 'liked' : '';
    const savedClass = post.has_saved ? 'saved' : '';
    const bookmarkIconClass = post.has_saved ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark';

    // Location markup
    const locationMarkup = post.location ? `<span class="post-location">${post.location}</span>` : '';

    card.innerHTML = `
      <div class="post-header">
        <div class="post-user-info">
          <img src="${post.profile_pic || '/uploads/avatars/default.svg'}" alt="Avatar" class="avatar-sm" onerror="this.onerror=null; this.src='/uploads/avatars/default.svg';">
          <div class="post-meta-details">
            <a href="#profile/${post.username}" class="poster-name">${post.username}</a>
            ${locationMarkup}
          </div>
        </div>
        <button class="post-actions-btn" data-user-id="${post.user_id}" data-username="${post.username}"><i class="fa-solid fa-ellipsis-vertical"></i></button>
      </div>

      <div class="post-media-container">
        <div class="post-media-slider">${mediaHtml}</div>
        ${arrowsAndDots}
      </div>

      <div class="post-buttons-bar">
        <div class="post-buttons-left">
          <button class="post-btn heart-btn ${likedClass}" data-post-id="${post.id}"><i class="${likeIconClass}"></i></button>
          <button class="post-btn comment-btn" data-post-id="${post.id}"><i class="fa-regular fa-comment"></i></button>
        </div>
        <button class="post-btn save-btn ${savedClass}" data-post-id="${post.id}"><i class="${bookmarkIconClass}"></i></button>
      </div>

      <div class="post-likes-info"><span class="likes-count-num">${post.likes_count || 0}</span> likes</div>
      
      <div class="post-caption-container">
        <span class="caption-author">${post.username}</span>
        <span class="caption-text-content">${parseHashtags(post.caption)}</span>
      </div>

      <button class="comments-trigger-btn" data-post-id="${post.id}">View comments...</button>
      <div class="post-time-stamp">${formatRelativeTime(post.created_at)}</div>
      
      <!-- Embedded quick comment input -->
      <div class="divider" style="margin:0;"></div>
      <div class="chat-input-bar" style="padding:10px 16px; border:none;">
        <input type="text" class="quick-comment-input" placeholder="Add a comment..." data-post-id="${post.id}">
        <button class="btn-text quick-comment-send" data-post-id="${post.id}">Post</button>
      </div>
    `;

    // Carousel events bindings
    if (mediaList.length > 1) {
      setupCarouselInteractions(card);
    }

    // Double tap triggers
    const mediaContainer = card.querySelector('.post-media-container');
    let lastTap = 0;
    mediaContainer.addEventListener('touchstart', (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      if (tapLength < 300 && tapLength > 0) {
        handleDoubleTapLike(post.id, mediaContainer, card.querySelector('.heart-btn'));
      }
      lastTap = currentTime;
    });
    mediaContainer.addEventListener('dblclick', () => {
      handleDoubleTapLike(post.id, mediaContainer, card.querySelector('.heart-btn'));
    });

    // Single likes toggles
    card.querySelector('.heart-btn').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const id = btn.getAttribute('data-post-id');
      const countEl = card.querySelector('.likes-count-num');
      let currentVal = parseInt(countEl.textContent);
      
      if (btn.classList.contains('liked')) {
        btn.classList.remove('liked');
        btn.querySelector('i').className = 'fa-regular fa-heart';
        countEl.textContent = Math.max(0, currentVal - 1);
        await ULinkAPI.unlikePost(id);
      } else {
        btn.classList.add('liked');
        btn.querySelector('i').className = 'fa-solid fa-heart';
        countEl.textContent = currentVal + 1;
        await ULinkAPI.likePost(id);
      }
    });

    // Save Toggles
    card.querySelector('.save-btn').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const id = btn.getAttribute('data-post-id');
      if (btn.classList.contains('saved')) {
        btn.classList.remove('saved');
        btn.querySelector('i').className = 'fa-regular fa-bookmark';
      } else {
        btn.classList.add('saved');
        btn.querySelector('i').className = 'fa-solid fa-bookmark';
      }
      await ULinkAPI.savePost(id);
    });

    // Slide comments bottom modal trigger
    const openComments = () => triggerCommentsDrawer(post.id);
    card.querySelector('.comments-trigger-btn').addEventListener('click', openComments);
    card.querySelector('.comment-btn').addEventListener('click', openComments);

    // Quick Comment inputs
    const input = card.querySelector('.quick-comment-input');
    const sendBtn = card.querySelector('.quick-comment-send');
    const submitComment = async () => {
      const val = input.value.trim();
      if (!val) return;
      input.value = '';
      try {
        await ULinkAPI.createComment(post.id, val);
        // Refresh trigger
        triggerCommentsDrawer(post.id);
      } catch (err) {
        console.error(err);
      }
    };
    sendBtn.addEventListener('click', submitComment);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') submitComment();
    });

    // Relationship ellipse popup triggers
    card.querySelector('.post-actions-btn').addEventListener('click', (e) => {
      const uid = parseInt(e.currentTarget.getAttribute('data-user-id'));
      const name = e.currentTarget.getAttribute('data-username');
      
      if (state.currentUser && uid === state.currentUser.id) {
        showDeleteConfirmModal(async () => {
          await ULinkAPI.deletePost(post.id);
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          card.style.transition = 'all 0.3s ease';
          setTimeout(() => {
            card.remove();
          }, 300);
        });
      } else {
        openPrivacyControlModal(uid, name);
      }
    });

    return card;
  }

  // Double tap animations
  async function handleDoubleTapLike(postId, container, heartBtn) {
    if (!heartBtn.classList.contains('liked')) {
      heartBtn.click();
    }
    const heart = document.createElement('i');
    heart.className = 'fa-solid fa-heart floating-heart';
    container.appendChild(heart);
    setTimeout(() => heart.remove(), 800);
  }

  // Setup carousel scroll actions
  function setupCarouselInteractions(card) {
    const slider = card.querySelector('.post-media-slider');
    const prev = card.querySelector('.carousel-arrow.prev');
    const next = card.querySelector('.carousel-arrow.next');
    const dots = card.querySelectorAll('.indicator-dot');
    
    let index = 0;
    const slidesCount = dots.length;

    const updateArrows = () => {
      prev.style.display = index === 0 ? 'none' : 'flex';
      next.style.display = index === slidesCount - 1 ? 'none' : 'flex';
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === index);
      });
    };

    next.addEventListener('click', () => {
      if (index < slidesCount - 1) {
        index++;
        slider.scrollTo({
          left: slider.offsetWidth * index,
          behavior: 'smooth'
        });
        updateArrows();
      }
    });

    prev.addEventListener('click', () => {
      if (index > 0) {
        index--;
        slider.scrollTo({
          left: slider.offsetWidth * index,
          behavior: 'smooth'
        });
        updateArrows();
      }
    });

    // Detect swiping
    slider.addEventListener('scroll', () => {
      const idx = Math.round(slider.scrollLeft / slider.offsetWidth);
      if (idx !== index && idx >= 0 && idx < slidesCount) {
        index = idx;
        updateArrows();
      }
    });
  }

  // Sidebar dynamic load
  async function loadSidebarSuggestions() {
    try {
      const searchRes = await ULinkAPI.search('a'); // grab general creators matching 'a'
      const followingRes = await ULinkAPI.getFollowing(state.currentUser.id);
      const followingList = followingRes.following || [];
      const followingMap = {};
      followingList.forEach(f => {
        followingMap[f.id] = f.status;
      });

      DOM.suggestionsList.innerHTML = '';
      const list = (searchRes.users || []).filter(u => u.id !== state.currentUser.id).slice(0, 5);
      if (list.length === 0) {
        DOM.suggestionsList.innerHTML = '<p class="text-muted text-sm">No suggestions right now</p>';
        return;
      }
      list.forEach(user => {
        const row = document.createElement('div');
        row.className = 'suggested-user-row';
        
        let followStatus = followingMap[user.id];
        let btnText = 'Follow';
        let btnDisabled = '';
        let btnClass = 'btn-text follow-suggest-btn';
        if (followStatus === 'accepted') {
          btnText = 'Following';
          btnDisabled = 'disabled';
          btnClass += ' following';
        } else if (followStatus === 'pending') {
          btnText = 'Requested';
          btnDisabled = 'disabled';
          btnClass += ' following';
        }

        row.innerHTML = `
          <img src="${user.profile_pic || '/uploads/avatars/default.svg'}" class="avatar-sm" alt="Avatar" onerror="this.onerror=null; this.src='/uploads/avatars/default.svg';">
          <div class="suggested-meta">
            <a href="#profile/${user.username}" class="suggested-username">${user.username}</a>
            <span class="suggested-subtitle">New on ULink</span>
          </div>
          <button class="${btnClass}" data-user-id="${user.id}" ${btnDisabled}>${btnText}</button>
        `;
        
        row.querySelector('.follow-suggest-btn').addEventListener('click', async (e) => {
          const btn = e.currentTarget;
          btn.textContent = 'Following';
          btn.disabled = true;
          btn.classList.add('following');
          const res = await ULinkAPI.followUser(btn.getAttribute('data-user-id'));
          if (res && res.status === 'pending') {
            btn.textContent = 'Requested';
          }
        });

        DOM.suggestionsList.appendChild(row);
      });
    } catch(err) {
      console.error(err);
    }
  }


  // --- STORIES VIEWER ENGINE ---
  function openStoriesViewer(userIndex) {
    state.storiesUserIndex = userIndex;
    state.storySlideIndex = 0;
    
    DOM.modalStoriesViewer.classList.add('active');
    renderActiveStorySlide();
  }

  function renderActiveStorySlide() {
    const userGroup = state.storiesFeed[state.storiesUserIndex];
    if (!userGroup || !userGroup.stories || userGroup.stories.length === 0) {
      closeAllModals();
      return;
    }

    const story = userGroup.stories[state.storySlideIndex];
    
    // Header setup
    DOM.storyViewerAvatar.src = userGroup.profile_pic || '/uploads/avatars/default.svg';
    DOM.storyViewerUsername.textContent = userGroup.username;
    DOM.storyViewerTime.textContent = formatRelativeTime(story.created_at);
    DOM.storyViewerCfBadge.style.display = userGroup.isCloseFriend ? 'inline-block' : 'none';

    // Fills timeline bar aggregation
    DOM.storiesProgressContainer.innerHTML = '';
    userGroup.stories.forEach((_, idx) => {
      const bar = document.createElement('div');
      bar.className = 'story-bar-bg';
      const fill = document.createElement('div');
      fill.className = 'story-bar-fill';
      
      if (idx < state.storySlideIndex) {
        fill.style.width = '100%';
      } else if (idx === state.storySlideIndex) {
        fill.id = 'story-active-fill-bar';
        fill.style.width = '0%';
      }
      bar.appendChild(fill);
      DOM.storiesProgressContainer.appendChild(bar);
    });

    // Content frame
    DOM.storyViewerContent.innerHTML = '';
    const textOverlay = story.text_content ? `<div class="story-text-overlay-display">${story.text_content}</div>` : '';
    
    if (story.media_type === 'video') {
      DOM.storyViewerContent.innerHTML = `
        <video src="${story.media_url}" autoplay playsinline id="story-video-node" style="width:100%;height:100%;object-fit:cover;"></video>
        ${textOverlay}
      `;
      // Autoplay voice hooks
      const video = document.getElementById('story-video-node');
      video.onloadedmetadata = () => {
        startStoriesProgressTimer(video.duration * 1000);
      };
      // Attempt unmuted play first; fallback to muted if browser blocks autoplay with audio
      video.play().catch(err => {
        console.warn("Story video unmuted autoplay blocked, playing muted:", err);
        video.muted = true;
        video.play().catch(playErr => console.error("Story video failed to play:", playErr));
      });
    } else {
      DOM.storyViewerContent.innerHTML = `
        <img src="${story.media_url}" alt="Story Media" style="width:100%;height:100%;object-fit:cover;">
        ${textOverlay}
      `;
      startStoriesProgressTimer(5000); // 5s photos default
    }

    // Toggle add to highlight option (only accessible for self posts)
    const isSelfStory = (userGroup.username === state.currentUser.username);
    DOM.storyViewerBtnHighlight.style.display = isSelfStory ? 'block' : 'none';
    if (DOM.storyViewerBtnDelete) {
      DOM.storyViewerBtnDelete.style.display = isSelfStory ? 'block' : 'none';
    }
  }

  function startStoriesProgressTimer(duration) {
    if (state.storyProgressInterval) clearInterval(state.storyProgressInterval);
    
    const fillBar = document.getElementById('story-active-fill-bar');
    let start = Date.now();
    
    state.storyProgressInterval = setInterval(() => {
      let pct = (Date.now() - start) / duration * 100;
      if (pct >= 100) {
        clearInterval(state.storyProgressInterval);
        shiftStoryNext();
      } else {
        if (fillBar) fillBar.style.width = `${pct}%`;
      }
    }, 30);
  }

  function shiftStoryNext() {
    const userGroup = state.storiesFeed[state.storiesUserIndex];
    if (state.storySlideIndex < userGroup.stories.length - 1) {
      state.storySlideIndex++;
      renderActiveStorySlide();
    } else if (state.storiesUserIndex < state.storiesFeed.length - 1) {
      state.storiesUserIndex++;
      state.storySlideIndex = 0;
      renderActiveStorySlide();
    } else {
      closeAllModals();
    }
  }

  function shiftStoryPrev() {
    if (state.storySlideIndex > 0) {
      state.storySlideIndex--;
      renderActiveStorySlide();
    } else if (state.storiesUserIndex > 0) {
      state.storiesUserIndex--;
      const userGroup = state.storiesFeed[state.storiesUserIndex];
      state.storySlideIndex = userGroup.stories.length - 1;
      renderActiveStorySlide();
    }
  }

  DOM.storyViewerNext.addEventListener('click', shiftStoryNext);
  DOM.storyViewerPrev.addEventListener('click', shiftStoryPrev);
  DOM.btnStoryViewerClose.addEventListener('click', closeAllModals);

  if (DOM.storyViewerBtnDelete) {
    DOM.storyViewerBtnDelete.addEventListener('click', () => {
      if (state.storyProgressInterval) {
        clearInterval(state.storyProgressInterval);
        state.storyProgressInterval = null;
      }
      const video = DOM.storyViewerContent.querySelector('video');
      if (video) video.pause();

      const userGroup = state.storiesFeed[state.storiesUserIndex];
      const story = userGroup.stories[state.storySlideIndex];

      showDeleteConfirmModal(async () => {
        await ULinkAPI.deleteStory(story.id);
        userGroup.stories.splice(state.storySlideIndex, 1);

        if (userGroup.stories.length === 0) {
          state.storiesFeed.splice(state.storiesUserIndex, 1);
          drawStoriesCircles();
          closeAllModals();
        } else {
          if (state.storySlideIndex >= userGroup.stories.length) {
            state.storySlideIndex = userGroup.stories.length - 1;
          }
          drawStoriesCircles();
          renderActiveStorySlide();
        }
      }, () => {
        renderActiveStorySlide();
      });
    });
  }


  // --- REELS SCROLL & PLAY ENGINE ---
  let reelsObserver = null;
  async function renderReelsView() {
    try {
      const data = await ULinkAPI.getReels();
      DOM.reelsScrollContainer.innerHTML = '';
      
      if (!data.reels || data.reels.length === 0) {
        DOM.reelsScrollContainer.innerHTML = `
          <div class="glass-panel text-center" style="padding: 40px; margin-top: 40px;">
            <i class="fa-solid fa-clapperboard" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 15px;"></i>
            <h3>No Reels Available</h3>
          </div>
        `;
        return;
      }

      data.reels.forEach(reel => {
        const reelCard = createReelCard(reel);
        DOM.reelsScrollContainer.appendChild(reelCard);
      });

      // Setup Autoplay Intersection Observer
      if (reelsObserver) reelsObserver.disconnect();
      
      reelsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const video = entry.target.querySelector('video');
          if (!video) return;
          if (entry.isIntersecting) {
            // Attempt to play unmuted first
            video.muted = false;
            video.play().catch(e => {
              console.log('Reel autoplay unmuted blocked, falling back to muted');
              video.muted = true;
              video.play().catch(e2 => console.error('Muted autoplay failed', e2));
            });
          } else {
            video.pause();
          }
        });
      }, { threshold: 0.7 });

      document.querySelectorAll('.reel-viewport').forEach(el => {
        reelsObserver.observe(el);
      });

    } catch (err) {
      console.error(err);
    }
  }

  function createReelCard(reel) {
    const card = document.createElement('div');
    card.className = 'reel-viewport';
    card.id = `reel-card-${reel.id}`;

    const media = reel.media[0] || {};
    const likedClass = reel.has_liked ? 'liked' : '';
    const heartIcon = reel.has_liked ? 'fa-solid fa-heart' : 'fa-regular fa-heart';

    card.innerHTML = `
      <video src="${media.media_url}" class="reel-video" loop playsinline></video>
      
      <div class="reel-actions-overlay">
        <div>
          <button class="reel-action-btn reel-heart-btn ${likedClass}" data-post-id="${reel.id}"><i class="${heartIcon}"></i></button>
          <div class="reel-action-counter reel-likes-cnt">${reel.likes_count || 0}</div>
        </div>
        <div>
          <button class="reel-action-btn reel-comment-btn" data-post-id="${reel.id}"><i class="fa-regular fa-comment"></i></button>
          <div class="reel-action-counter">${reel.comments_count || 0}</div>
        </div>
        <div>
          <button class="reel-action-btn reel-share-btn" data-user-id="${reel.user_id}" data-username="${reel.username}"><i class="fa-solid fa-ellipsis"></i></button>
        </div>
      </div>

      <div class="reel-details-overlay">
        <div class="reel-user">
          <img src="${reel.profile_pic || '/uploads/avatars/default.svg'}" class="avatar-sm" alt="Avatar" onerror="this.onerror=null; this.src='/uploads/avatars/default.svg';">
          <a href="#profile/${reel.username}" class="reel-username" style="color:#fff;text-decoration:none;">${reel.username}</a>
        </div>
        <p class="reel-caption">${parseHashtags(reel.caption)}</p>
      </div>
    `;

    // Click plays/pauses and ensures unmuted
    const video = card.querySelector('video');
    video.addEventListener('click', () => {
      video.muted = false;
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    });

    // Double tap triggers
    let lastTap = 0;
    video.addEventListener('touchstart', (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      if (tapLength < 300 && tapLength > 0) {
        handleDoubleTapLike(reel.id, card, card.querySelector('.reel-heart-btn'));
      }
      lastTap = currentTime;
    });

    // Direct Likes triggers
    card.querySelector('.reel-heart-btn').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const countEl = card.querySelector('.reel-likes-cnt');
      let currentVal = parseInt(countEl.textContent);
      if (btn.classList.contains('liked')) {
        btn.classList.remove('liked');
        btn.querySelector('i').className = 'fa-regular fa-heart';
        countEl.textContent = Math.max(0, currentVal - 1);
        await ULinkAPI.unlikePost(reel.id);
      } else {
        btn.classList.add('liked');
        btn.querySelector('i').className = 'fa-solid fa-heart';
        countEl.textContent = currentVal + 1;
        await ULinkAPI.likePost(reel.id);
      }
    });

    // Comments bottom drawer
    card.querySelector('.reel-comment-btn').addEventListener('click', () => triggerCommentsDrawer(reel.id));

    // Privacy settings triggers
    card.querySelector('.reel-share-btn').addEventListener('click', (e) => {
      const uid = parseInt(e.currentTarget.getAttribute('data-user-id'));
      const name = e.currentTarget.getAttribute('data-username');
      
      if (state.currentUser && uid === state.currentUser.id) {
        showDeleteConfirmModal(async () => {
          await ULinkAPI.deletePost(reel.id);
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          card.style.transition = 'all 0.3s ease';
          setTimeout(() => {
            card.remove();
          }, 300);
        });
      } else {
        openPrivacyControlModal(uid, name);
      }
    });

    return card;
  }


  // --- EXPLORE VIEW LOGIC ---
  async function renderExploreView() {
    DOM.exploreSearchInput.value = '';
    DOM.searchClearBtn.style.display = 'none';
    DOM.searchResultsSection.style.display = 'none';
    DOM.exploreDefaultContent.style.display = 'block';

    try {
      // Pull posts & reels for default grid
      const data = await ULinkAPI.getFeed(); // default to feed pull to extract random trending grids
      DOM.exploreGridContainer.innerHTML = '';
      
      const gridItems = (data.feed || []).slice(0, 15);
      if (gridItems.length === 0) {
        DOM.exploreGridContainer.innerHTML = '<p class="text-muted">No explore posts available.</p>';
        return;
      }

      gridItems.forEach((post, idx) => {
        const item = document.createElement('div');
        
        // Premium Alternating layout dimensions
        const isDoubleHeight = idx % 5 === 2;
        item.className = isDoubleHeight ? 'explore-item double-height' : 'explore-item';
        
        const media = post.media[0] || {};
        
        if (media.media_type === 'video') {
          item.innerHTML = `
            <video src="${media.media_url}" muted loop playsinline></video>
            <div class="explore-overlay">
              <span class="explore-stats"><i class="fa-solid fa-heart"></i> ${post.likes_count || 0}</span>
            </div>
          `;
          // Autoplay thumbnail play on hover
          const video = item.querySelector('video');
          item.addEventListener('mouseenter', () => video.play().catch(() => {}));
          item.addEventListener('mouseleave', () => video.pause());
        } else {
          item.className += ' filter-' + (media.media_filter || 'normal');
          item.innerHTML = `
            <img src="${media.media_url}" alt="Explore Grid" loading="lazy">
            <div class="explore-overlay">
              <span class="explore-stats"><i class="fa-solid fa-heart"></i> ${post.likes_count || 0}</span>
            </div>
          `;
        }

        item.addEventListener('click', () => {
          // Open single post details modal
          triggerPostModal(post.id);
        });

        DOM.exploreGridContainer.appendChild(item);
      });

    } catch (err) {
      console.error(err);
    }
  }

  // Reactive Live Search Input throttling
  let searchTimer = null;
  DOM.exploreSearchInput.addEventListener('input', () => {
    const val = DOM.exploreSearchInput.value.trim();
    DOM.searchClearBtn.style.display = val ? 'block' : 'none';
    
    if (searchTimer) clearTimeout(searchTimer);
    
    if (!val) {
      DOM.searchResultsSection.style.display = 'none';
      DOM.exploreDefaultContent.style.display = 'block';
      return;
    }

    searchTimer = setTimeout(async () => {
      try {
        const res = await ULinkAPI.search(val);
        DOM.exploreDefaultContent.style.display = 'none';
        DOM.searchResultsSection.style.display = 'block';

        // Render matching creators
        DOM.searchUsersList.innerHTML = '';
        if (!res.users || res.users.length === 0) {
          DOM.searchUsersList.innerHTML = '<p class="text-muted text-sm">No creators found</p>';
        } else {
          res.users.forEach(user => {
            const uRow = document.createElement('div');
            uRow.className = 'suggested-user-row';
            uRow.style.padding = '8px 0';
            uRow.innerHTML = `
              <img src="${user.profile_pic || '/uploads/avatars/default.svg'}" class="avatar-sm" alt="Avatar" onerror="this.onerror=null; this.src='/uploads/avatars/default.svg';">
              <div class="suggested-meta">
                <a href="#profile/${user.username}" class="suggested-username">${user.username}</a>
                <span class="suggested-subtitle">${user.full_name || ''}</span>
              </div>
              <a href="#profile/${user.username}" class="btn btn-secondary" style="font-size:0.75rem; padding: 4px 10px;">View</a>
            `;
            DOM.searchUsersList.appendChild(uRow);
          });
        }

        // Render matching hashtag/location posts
        DOM.searchPostsGrid.innerHTML = '';
        if (!res.posts || res.posts.length === 0) {
          DOM.searchPostsGrid.innerHTML = '<p class="text-muted text-sm">No posts matched search query</p>';
        } else {
          res.posts.forEach(post => {
            const gridEl = document.createElement('div');
            gridEl.className = 'explore-item';
            
            if (post.cover_type === 'video') {
              gridEl.innerHTML = `<video src="${post.cover_url}" muted playsinline></video>`;
            } else {
              gridEl.innerHTML = `<img src="${post.cover_url}" alt="Post cover" loading="lazy">`;
            }
            gridEl.addEventListener('click', () => triggerPostModal(post.id));
            DOM.searchPostsGrid.appendChild(gridEl);
          });
        }

      } catch (err) {
        console.error(err);
      }
    }, 400);
  });

  DOM.searchClearBtn.addEventListener('click', () => {
    renderExploreView();
  });

  // Hashtags search mapping
  document.querySelectorAll('.trend-tag').forEach(tag => {
    tag.addEventListener('click', (e) => {
      const hashText = e.currentTarget.getAttribute('data-tag');
      DOM.exploreSearchInput.value = hashText;
      DOM.exploreSearchInput.dispatchEvent(new Event('input'));
    });
  });


  // --- DIRECT MESSAGING / CHATS CLIENT ---
  async function renderDMsView() {
    try {
      const data = await ULinkAPI.getThreads();
      DOM.threadsContainer.innerHTML = '';

      if (!data.threads || data.threads.length === 0) {
        DOM.threadsContainer.innerHTML = '<p class="text-muted text-center" style="padding:20px;">No message threads yet.</p>';
        updateGlobalUnreadBadges();
        return;
      }

      data.threads.forEach(thread => {
        const row = document.createElement('div');
        const isUnread = thread.unread_count > 0;
        const unreadDot = isUnread ? `<span class="unread-dot-indicator"></span>` : '';
        const unreadClass = isUnread ? 'unread-thread' : '';

        row.className = `thread-row ${state.activeThreadId === thread.id ? 'active' : ''} ${unreadClass}`;
        row.setAttribute('data-thread-id', thread.id);
        
        const avatar = thread.profile_pic || '/uploads/avatars/default.svg';
        const lastMsg = thread.last_message ? thread.last_message : 'No messages yet';

        row.innerHTML = `
          <img src="${avatar}" alt="Avatar" class="avatar-sm">
          <div class="thread-meta">
            <span class="thread-title" style="${isUnread ? 'font-weight: 700; color: var(--text-primary);' : ''}">${thread.name}</span>
            <span class="thread-lastmsg" style="${isUnread ? 'font-weight: 600; color: var(--accent-pink);' : ''}">${lastMsg}</span>
          </div>
          ${unreadDot}
        `;

        row.addEventListener('click', () => openDMConversation(thread));
        DOM.threadsContainer.appendChild(row);
      });

      updateGlobalUnreadBadges();

    } catch (err) {
      console.error(err);
    }
  }

  async function openDMConversation(thread) {
    state.activeThreadId = thread.id;
    
    // Toggle mobile views
    document.querySelector('.dms-layout').classList.add('thread-active');

    // Make row active
    document.querySelectorAll('.thread-row').forEach(row => {
      row.classList.remove('active');
    });
    const activeRow = document.querySelector(`.thread-row[data-thread-id="${thread.id}"]`);
    if (activeRow) activeRow.classList.add('active');

    DOM.chatFallback.style.display = 'none';
    DOM.chatActive.style.display = 'flex';

    // Populate header
    DOM.chatHeaderAvatar.src = thread.profile_pic || '/uploads/avatars/default.svg';
    DOM.chatHeaderName.textContent = thread.name;
    DOM.chatHeaderTyping.style.display = 'none';

    // 1. Pull message history first (to preserve is_read values during rendering)
    try {
      const res = await ULinkAPI.getThreadMessages(thread.id);
      DOM.chatMessagesList.innerHTML = '';
      res.messages.forEach(msg => {
        appendMessageBubble(msg);
      });
      scrollToBottom(DOM.chatMessagesList);
    } catch(err) {
      console.error(err);
    }

    // 2. Mark messages as read now (updates DB and clears sidebar/unread dot UI)
    try {
      await ULinkAPI.markThreadAsRead(thread.id);
      
      // Remove visual indicators immediately
      const activeRowEl = document.querySelector(`.thread-row[data-thread-id="${thread.id}"]`);
      if (activeRowEl) {
        activeRowEl.classList.remove('unread-thread');
        const dot = activeRowEl.querySelector('.unread-dot-indicator');
        if (dot) dot.remove();
        const title = activeRowEl.querySelector('.thread-title');
        if (title) title.style.fontWeight = '600';
        const lastMsg = activeRowEl.querySelector('.thread-lastmsg');
        if (lastMsg) lastMsg.style.fontWeight = '400';
      }
      
      updateGlobalUnreadBadges();
    } catch(e) {
      console.error('Failed to mark thread as read:', e);
    }
  }

  function appendMessageBubble(msg) {
    const isOutgoing = msg.sender_id === state.currentUser.id;
    const bubbleWrapper = document.createElement('div');
    bubbleWrapper.className = `msg-bubble-wrapper ${isOutgoing ? 'outgoing' : 'incoming'}`;
    bubbleWrapper.id = `msg-bubble-wrapper-${msg.id}`;

    let mediaContent = '';
    if (msg.message_type === 'image' && msg.media_url) {
      mediaContent = `<div class="msg-bubble-media"><img src="${msg.media_url}" alt="Attachment" class="chat-img-popup"></div>`;
    } else if (msg.message_type === 'video' && msg.media_url) {
      mediaContent = `<div class="msg-bubble-media"><video src="${msg.media_url}" controls></video></div>`;
    } else if (msg.message_type === 'voice' && msg.media_url) {
      mediaContent = `
        <div class="voice-bubble">
          <button class="voice-play-btn" data-src="${msg.media_url}"><i class="fa-solid fa-play"></i></button>
          <div class="voice-timeline"><div class="voice-progress"></div></div>
        </div>
      `;
    }

    const textContent = msg.content ? `<div class="msg-text">${parseHashtags(msg.content)}</div>` : '';
    const reactionBadge = msg.reaction ? `<span class="msg-reaction" data-msg-id="${msg.id}">${msg.reaction}</span>` : '';

    let statusHtml = '';
    if (isOutgoing) {
      if (msg.is_read === 1) {
        statusHtml = `<span class="msg-status seen" title="Seen"><i class="fa-solid fa-check-double"></i> Seen</span>`;
      } else {
        statusHtml = `<span class="msg-status sent" title="Sent"><i class="fa-solid fa-check"></i> Sent</span>`;
      }
    }

    bubbleWrapper.innerHTML = `
      <div class="msg-bubble glass-panel ${!isOutgoing && msg.is_read === 0 ? 'unread-incoming' : ''}">
        ${mediaContent}
        ${textContent}
        ${reactionBadge}
      </div>
      <div class="msg-meta-row">
        <span class="msg-time">${formatRelativeTime(msg.created_at)}</span>
        ${statusHtml}
      </div>
    `;

    // Hook emoji reactions double click/long press
    const bubbleNode = bubbleWrapper.querySelector('.msg-bubble');
    bubbleNode.addEventListener('dblclick', () => {
      // Toggle heart reaction default
      const alreadyHas = msg.reaction === '❤️';
      ULinkWS.sendReaction(msg.id, alreadyHas ? null : '❤️');
    });

    // Voice play bindings
    const playBtn = bubbleWrapper.querySelector('.voice-play-btn');
    if (playBtn) {
      setupVoiceMessagePlayer(playBtn, bubbleWrapper.querySelector('.voice-progress'));
    }

    DOM.chatMessagesList.appendChild(bubbleWrapper);
  }

  // Interactive Voice play seeker
  function setupVoiceMessagePlayer(btn, progressEl) {
    let audio = null;
    btn.addEventListener('click', () => {
      const src = btn.getAttribute('data-src');
      if (!audio) {
        audio = new Audio(src);
        audio.ontimeupdate = () => {
          const pct = (audio.currentTime / audio.duration) * 100;
          progressEl.style.width = `${pct}%`;
        };
        audio.onended = () => {
          btn.innerHTML = '<i class="fa-solid fa-play"></i>';
          progressEl.style.width = '0%';
          audio = null;
        };
      }

      if (audio.paused) {
        audio.play();
        btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
      } else {
        audio.pause();
        btn.innerHTML = '<i class="fa-solid fa-play"></i>';
      }
    });
  }

  // Keyboard Input triggers
  DOM.chatMessageInput.addEventListener('input', () => {
    const val = DOM.chatMessageInput.value;
    DOM.chatBtnSend.style.display = val.trim() ? 'block' : 'none';
    
    // Send typing status to socket
    ULinkWS.sendTyping(state.activeThreadId, val.length > 0);
  });

  // Blur indicator
  DOM.chatMessageInput.addEventListener('blur', () => {
    ULinkWS.sendTyping(state.activeThreadId, false);
  });

  const sendTextMessage = () => {
    const val = DOM.chatMessageInput.value.trim();
    if (!val) return;
    DOM.chatMessageInput.value = '';
    DOM.chatBtnSend.style.display = 'none';
    
    ULinkWS.sendMessage(state.activeThreadId, val, 'text');
    ULinkWS.sendTyping(state.activeThreadId, false);
  };
  DOM.chatBtnSend.addEventListener('click', sendTextMessage);
  DOM.chatMessageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendTextMessage();
  });

  // Handle direct file attachments in DMs
  DOM.chatBtnAttach.addEventListener('click', () => DOM.chatFileInput.click());
  DOM.chatFileInput.addEventListener('change', async () => {
    const file = DOM.chatFileInput.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('media', file);

    try {
      const res = await ULinkAPI.uploadMessageMedia(formData);
      ULinkWS.sendMessage(state.activeThreadId, '', res.messageType, res.mediaUrl);
    } catch(e) {
      console.error('File send failed:', e);
    }
  });

  // Direct Message WebSockets Gateways Hooks
  function setupWebSocketHandlers() {
    ULinkWS.clearAllListeners();
    ULinkWS.on('message', (payload) => {
      const msg = payload.message;
      
      // If message is on active conversation, append it
      if (state.activeThreadId === msg.thread_id) {
        if (msg.sender_id !== state.currentUser.id) {
          msg.is_read = 1; // Mark as read immediately on client side since user is actively viewing this thread
        }
        appendMessageBubble(msg);
        scrollToBottom(DOM.chatMessagesList);
        // Reset typing
        DOM.chatHeaderTyping.style.display = 'none';
        
        ULinkAPI.markThreadAsRead(msg.thread_id).then(() => {
          updateGlobalUnreadBadges();
        });
      } else {
        updateGlobalUnreadBadges();
      }
      
      // Re-trigger thread list updates to refresh last messages details
      if (state.currentView === 'dms') {
        renderDMsView();
      }
    });

    ULinkWS.on('typing', (payload) => {
      if (state.activeThreadId === payload.threadId) {
        DOM.chatHeaderTyping.style.display = payload.isTyping ? 'inline-block' : 'none';
      }
    });

    ULinkWS.on('reaction', (payload) => {
      const { messageId, reaction } = payload;
      const bubble = document.getElementById(`msg-bubble-wrapper-${messageId}`);
      if (bubble) {
        let badge = bubble.querySelector('.msg-reaction');
        if (reaction) {
          if (badge) {
            badge.textContent = reaction;
          } else {
            const newBadge = document.createElement('span');
            newBadge.className = 'msg-reaction';
            newBadge.setAttribute('data-msg-id', messageId);
            newBadge.textContent = reaction;
            bubble.querySelector('.msg-bubble').appendChild(newBadge);
          }
        } else if (badge) {
          badge.remove();
        }
      }
    });

    ULinkWS.on('read', (payload) => {
      const { threadId, readerId } = payload;
      // If we are currently viewing this thread and the other person read it, update our outgoing messages to "Seen"
      if (state.activeThreadId === threadId && readerId !== state.currentUser.id) {
        document.querySelectorAll('.msg-bubble-wrapper.outgoing').forEach(wrapper => {
          const statusEl = wrapper.querySelector('.msg-status');
          if (statusEl && statusEl.classList.contains('sent')) {
            statusEl.className = 'msg-status seen';
            statusEl.title = 'Seen';
            statusEl.innerHTML = '<i class="fa-solid fa-check-double"></i> Seen';
          }
        });
      }
    });

    ULinkWS.on('notification', (payload) => {
      const notif = payload.notification;
      showNotificationToast(notif);
      updateGlobalUnreadBadges();
      if (state.currentView === 'activity') {
        renderActivityView();
      }
    });
  }

  // Audio Voice Recorder capture logic
  DOM.chatBtnVoice.addEventListener('click', async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Voice recorder not supported on this browser.');
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.audioChunks = [];
      state.audioRecorder = new MediaRecorder(stream);
      
      state.audioRecorder.ondataavailable = (e) => {
        state.audioChunks.push(e.data);
      };

      state.audioRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
      };

      state.audioRecorder.start();
      
      // Toggle Voice Recorder panel
      DOM.voiceRecorderPanel.style.display = 'flex';
      state.voiceStartTime = Date.now();
      
      // Setup Visualizer & Timer
      startVoiceTimerAndVisualizer(stream);

    } catch (e) {
      console.error('Audio hook error:', e);
    }
  });

  function startVoiceTimerAndVisualizer(stream) {
    // 1. Timer
    state.voiceTimerInterval = setInterval(() => {
      const diff = Date.now() - state.voiceStartTime;
      const sec = Math.floor(diff / 1000) % 60;
      const min = Math.floor(diff / 60000);
      DOM.voiceTimer.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }, 1000);

    // 2. Audio visualizer wave canvas drawing
    state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    state.audioAnalyser = state.audioContext.createAnalyser();
    const source = state.audioContext.createMediaStreamSource(stream);
    source.connect(state.audioAnalyser);
    state.audioAnalyser.fftSize = 64;
    
    const bufferLength = state.audioAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvasCtx = DOM.voiceVisualizer.getContext('2d');
    
    const drawWave = () => {
      state.audioVisualizerTimer = requestAnimationFrame(drawWave);
      state.audioAnalyser.getByteFrequencyData(dataArray);
      
      canvasCtx.fillStyle = 'rgba(20, 20, 25, 0.8)';
      canvasCtx.fillRect(0, 0, DOM.voiceVisualizer.width, DOM.voiceVisualizer.height);
      
      const barWidth = (DOM.voiceVisualizer.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      
      for(let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        canvasCtx.fillStyle = `hsl(${260 + (i * 2)}, 80%, 60%)`;
        canvasCtx.fillRect(x, DOM.voiceVisualizer.height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }
    };
    drawWave();
  }

  function stopVoiceTimerAndVisualizer() {
    clearInterval(state.voiceTimerInterval);
    cancelAnimationFrame(state.audioVisualizerTimer);
    if (state.audioContext) state.audioContext.close();
    DOM.voiceRecorderPanel.style.display = 'none';
  }

  DOM.voiceBtnCancel.addEventListener('click', () => {
    if (state.audioRecorder && state.audioRecorder.state !== 'inactive') {
      state.audioRecorder.stop();
    }
    stopVoiceTimerAndVisualizer();
  });

  DOM.voiceBtnSend.addEventListener('click', () => {
    if (state.audioRecorder && state.audioRecorder.state !== 'inactive') {
      state.audioRecorder.onstop = async () => {
        const audioBlob = new Blob(state.audioChunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('media', audioBlob, 'voice-note.webm');
        formData.append('uploadType', 'voice');

        try {
          const res = await ULinkAPI.uploadMessageMedia(formData);
          ULinkWS.sendMessage(state.activeThreadId, '', 'voice', res.mediaUrl);
        } catch (e) {
          console.error(e);
        }
      };
      state.audioRecorder.stop();
    }
    stopVoiceTimerAndVisualizer();
  });

  // Sticker popup toggles
  DOM.chatBtnSticker.addEventListener('click', (e) => {
    e.stopPropagation();
    const showing = DOM.stickerContainer.style.display === 'block';
    DOM.stickerContainer.style.display = showing ? 'none' : 'block';
  });

  document.querySelectorAll('.sticker-item').forEach(item => {
    item.addEventListener('click', () => {
      const sticker = item.textContent;
      ULinkWS.sendMessage(state.activeThreadId, sticker, 'text');
      DOM.stickerContainer.style.display = 'none';
    });
  });

  // Close sticker popup on outer click
  document.addEventListener('click', () => {
    DOM.stickerContainer.style.display = 'none';
  });


  // --- USER PROFILE & RELATIONSHIP VIEW ---
  async function renderProfileView(username) {
    try {
      const data = await ULinkAPI.getProfile(username);
      const prof = data.profile;

      // Populate details
      DOM.profileDetailsAvatar.src = prof.profile_pic || '/uploads/avatars/default.svg';
      DOM.profileDetailsUsername.textContent = prof.username;
      DOM.profileDetailsFullname.textContent = prof.full_name || '';
      DOM.profileDetailsBio.textContent = prof.bio || 'No bio yet';
      
      DOM.profileStatsPosts.textContent = prof.postsCount;
      DOM.profileStatsFollowers.textContent = prof.followersCount;
      DOM.profileStatsFollowing.textContent = prof.followingCount;

      // Toggle edit profile vs following controls
      if (prof.isSelf) {
        DOM.profileBtnLogout.style.display = 'inline-block';
        DOM.profileBtnSettings.style.display = 'inline-block';
        DOM.profileBtnFollow.style.display = 'none';
        DOM.profileBtnUnfollow.style.display = 'none';
        DOM.profileBtnPrivacyActions.style.display = 'none';
        DOM.profileBtnAddHighlight.style.display = 'inline-block';
        
        DOM.profileBtnLogout.onclick = async (e) => {
          e.preventDefault();
          if (confirm('Are you sure you want to log out of ULink?')) {
            await ULinkAPI.logout();
            showAuthScreen();
          }
        };
        DOM.profileBtnSettings.onclick = (e) => {
          e.preventDefault();
          openSettingsModal();
        };
      } else {
        DOM.profileBtnSettings.style.display = 'none';
        DOM.profileBtnLogout.style.display = 'none';
        DOM.profileBtnAddHighlight.style.display = 'none';
        DOM.profileBtnPrivacyActions.style.display = 'inline-block';
        
        // Follow relationship bindings
        if (prof.followStatus === 'accepted') {
          DOM.profileBtnFollow.style.display = 'none';
          DOM.profileBtnUnfollow.style.display = 'inline-block';
          DOM.profileBtnUnfollow.textContent = 'Unfollow';
        } else if (prof.followStatus === 'pending') {
          DOM.profileBtnFollow.style.display = 'none';
          DOM.profileBtnUnfollow.style.display = 'inline-block';
          DOM.profileBtnUnfollow.textContent = 'Requested';
        } else {
          DOM.profileBtnFollow.style.display = 'inline-block';
          DOM.profileBtnUnfollow.style.display = 'none';
        }

        // Ellipsis setup
        DOM.profileBtnPrivacyActions.onclick = () => openPrivacyControlModal(prof.id, prof.username);
      }

      // Private Accounts checking
      DOM.profilePrivateBadge.style.display = prof.is_private ? 'inline-block' : 'none';

      // Load Profile Highlights carousel
      loadProfileHighlights(prof.username);

      // Bind Follow actions
      DOM.profileBtnFollow.onclick = async () => {
        const res = await ULinkAPI.followUser(prof.id);
        renderProfileView(prof.username);
      };
      
      DOM.profileBtnUnfollow.onclick = async () => {
        await ULinkAPI.unfollowUser(prof.id);
        renderProfileView(prof.username);
      };

      // Tab selects: default Posts Grid load
      loadProfileMediaGrid(prof.username, 'posts');

    } catch (err) {
      console.error(err);
      if (err.message.includes('blocked') || err.message.includes('not accessible')) {
        DOM.profilePostsGrid.innerHTML = `
          <div class="glass-panel text-center" style="padding: 40px; grid-column: span 3;">
            <i class="fa-solid fa-ban" style="font-size: 3rem; color: var(--text-muted); margin-bottom:15px;"></i>
            <h3>Account Unreachable</h3>
            <p class="text-muted">Connection restrictions prevent viewing this creator's profile.</p>
          </div>
        `;
      }
    }
  }

  // Load highlights list
  async function loadProfileHighlights(username) {
    try {
      const res = await ULinkAPI.getUserHighlights(username);
      DOM.profileHighlightsList.innerHTML = '';
      
      if (res.highlights) {
        res.highlights.forEach(h => {
          const item = document.createElement('div');
          item.className = 'highlight-item';
          item.innerHTML = `
            <div class="highlight-ring">
              <img src="${h.cover_pic || '/uploads/avatars/default.svg'}" alt="Cover">
            </div>
            <span>${h.title}</span>
          `;
          
          item.addEventListener('click', () => {
            // Highlights viewer (simulate story viewer queue)
            state.storiesFeed = [{
              username: username,
              profile_pic: h.cover_pic,
              stories: h.items
            }];
            openStoriesViewer(0);
          });

          // Self deletion long press listener
          if (username === state.currentUser.username) {
            item.addEventListener('contextmenu', async (e) => {
              e.preventDefault();
              if (confirm(`Delete highlight '${h.title}'?`)) {
                await ULinkAPI.deleteHighlight(h.id);
                loadProfileHighlights(username);
              }
            });
          }

          DOM.profileHighlightsList.appendChild(item);
        });
      }
    } catch(e) {
      console.error(e);
    }
  }

  // Tab selections posts grids
  document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
      const activeTab = e.currentTarget;
      activeTab.classList.add('active');
      
      const tabName = activeTab.getAttribute('data-tab');
      const targetUser = window.location.hash.split('/')[1] || state.currentUser.username;
      
      loadProfileMediaGrid(targetUser, tabName);
    });
  });

  async function loadProfileMediaGrid(username, tabType) {
    DOM.profilePostsGrid.innerHTML = '';
    try {
      let items = [];
      if (tabType === 'saved') {
        const data = await ULinkAPI.getSavedPosts();
        items = data.saved || [];
      } else {
        const data = await ULinkAPI.getUserPosts(username);
        items = data.posts || [];
        if (tabType === 'reels') {
          items = items.filter(p => p.type === 'reel');
        } else {
          items = items.filter(p => p.type === 'post');
        }
      }

      if (items.length === 0) {
        DOM.profilePostsGrid.innerHTML = `
          <div class="glass-panel text-center" style="padding: 40px; grid-column: span 3;">
            <i class="fa-regular fa-folder-open" style="font-size: 2.5rem; color: var(--text-muted); margin-bottom: 15px;"></i>
            <h3>No Media Uploaded</h3>
          </div>
        `;
        return;
      }

      items.forEach(post => {
        const gridCard = document.createElement('div');
        gridCard.className = 'explore-item';
        
        const cover = post.cover_url || (post.media && post.media[0] ? post.media[0].media_url : '/uploads/avatars/default.svg');
        const isVideo = post.cover_type === 'video' || (post.media && post.media[0] && post.media[0].media_type === 'video');

        if (isVideo) {
          gridCard.innerHTML = `<video src="${cover}" muted playsinline></video>`;
        } else {
          gridCard.innerHTML = `<img src="${cover}" alt="Post cover" loading="lazy">`;
        }

        gridCard.addEventListener('click', () => triggerPostModal(post.id));
        DOM.profilePostsGrid.appendChild(gridCard);
      });

    } catch (e) {
      console.error(e);
      if (e.message.includes('Private')) {
        DOM.profilePostsGrid.innerHTML = `
          <div class="glass-panel text-center" style="padding: 40px; grid-column: span 3;">
            <i class="fa-solid fa-lock" style="font-size: 3rem; color: var(--text-muted); margin-bottom:15px;"></i>
            <h3>Account is Private</h3>
            <p class="text-muted">Follow this user to view their photos and videos.</p>
          </div>
        `;
      }
    }
  }

  // Followers lists dialog triggers
  const showFollowsDialog = async (type) => {
    const targetUser = window.location.hash.split('/')[1] || state.currentUser.username;
    try {
      const pData = await ULinkAPI.getProfile(targetUser);
      let list = [];
      if (type === 'followers') {
        const res = await ULinkAPI.getFollowers(pData.profile.id);
        list = res.followers || [];
      } else {
        const res = await ULinkAPI.getFollowing(pData.profile.id);
        list = (res.following || []).filter(u => u.status !== 'pending');
      }

      DOM.followListModalTitle.textContent = type === 'followers' ? 'Followers' : 'Following';
      DOM.modalFollowList.classList.add('active');
      DOM.followListContent.innerHTML = '';
      
      if (list.length === 0) {
        DOM.followListContent.innerHTML = '<p class="text-muted text-center">Empty list</p>';
        return;
      }

      list.forEach(user => {
        const row = document.createElement('div');
        row.className = 'follow-user-row';
        row.innerHTML = `
          <div class="chat-search-user-info">
            <img src="${user.profile_pic || '/uploads/avatars/default.svg'}" class="avatar-sm" alt="Avatar" onerror="this.onerror=null; this.src='/uploads/avatars/default.svg';">
            <a href="#profile/${user.username}" class="suggested-username">${user.username}</a>
          </div>
          ${(pData.profile.isSelf && type === 'followers') ? `<button class="btn btn-secondary remove-follower-btn" data-uid="${user.id}" style="font-size:0.75rem; padding: 4px 10px;">Remove</button>` : ''}
        `;
        
        const removeBtn = row.querySelector('.remove-follower-btn');
        if (removeBtn) {
          removeBtn.onclick = async () => {
            await ULinkAPI.unfollowUser(user.id); // unfollowing resets follower relations
            row.remove();
          };
        }

        DOM.followListContent.appendChild(row);
      });
    } catch(err) {
      console.error(err);
    }
  };

  DOM.profileTriggerFollowers.addEventListener('click', () => showFollowsDialog('followers'));
  DOM.profileTriggerFollowing.addEventListener('click', () => showFollowsDialog('following'));
  DOM.followListClose.addEventListener('click', closeAllModals);


  // --- CREATE DYNAMIC POST DETAIL MODAL ---
  function triggerPostModal(postId) {
    const modalId = 'programmatic-post-modal';
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-card glass-panel max-sm animate-zoom" style="max-height:90vh; overflow-y:auto; padding:0;">
          <div class="modal-header" style="padding: 16px 24px; border-bottom: 1px solid var(--border-glass); position: sticky; top: 0; background: var(--bg-glass); backdrop-filter: blur(12px); z-index: 10;">
            <h3>Post</h3>
            <button class="modal-close" onclick="document.getElementById('${modalId}').classList.remove('active')"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="modal-body" id="modal-post-container" style="padding: 0;">
            <!-- Loaded post card -->
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    modal.classList.add('active');
    loadModalPost(postId);
  }

  async function loadModalPost(postId) {
    const container = document.getElementById('modal-post-container');
    container.innerHTML = '<p class="text-muted text-center" style="padding:40px;">Loading post...</p>';
    try {
      const res = await ULinkAPI.getPost(postId);
      container.innerHTML = '';
      if (!res.post) {
        container.innerHTML = '<p class="text-muted text-center" style="padding:40px;">Post not found.</p>';
        return;
      }
      const postCard = createPostCard(res.post);
      container.appendChild(postCard);
    } catch(err) {
      console.error(err);
      container.innerHTML = '<p class="text-muted text-center" style="padding:40px; color:var(--accent-pink);">Failed to load post.</p>';
    }
  }

  // --- CREATE DYNAMIC COMMENTS BOTTOM DRAWER ---
  function triggerCommentsDrawer(postId) {
    // We create a bottom-sheet styled full commentary panel using active modal wrappers programmatically
    const drawerId = 'programmatic-comments-drawer';
    let drawer = document.getElementById(drawerId);
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.id = drawerId;
      drawer.className = 'modal-overlay';
      drawer.innerHTML = `
        <div class="modal-card glass-panel max-sm animate-zoom" style="max-height:80vh;">
          <div class="modal-header">
            <h3>Comments</h3>
            <button class="modal-close" onclick="document.getElementById('${drawerId}').classList.remove('active')"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="modal-body chat-messages-container" id="drawer-comments-list" style="max-height: 50vh; overflow-y:auto; padding: 15px 24px;">
            <!-- Loaded list -->
          </div>
          <div class="chat-input-bar" style="padding: 16px 24px; border-top:1px solid var(--border-glass);">
            <input type="text" id="drawer-comment-input" placeholder="Add comment...">
            <button class="btn-text" id="drawer-comment-send">Post</button>
          </div>
        </div>
      `;
      document.body.appendChild(drawer);
    }

    drawer.classList.add('active');
    loadDrawerComments(postId);

    const send = async () => {
      const inp = document.getElementById('drawer-comment-input');
      const val = inp.value.trim();
      if (!val) return;
      inp.value = '';
      await ULinkAPI.createComment(postId, val);
      loadDrawerComments(postId);
    };

    document.getElementById('drawer-comment-send').onclick = send;
    document.getElementById('drawer-comment-input').onkeypress = (e) => {
      if (e.key === 'Enter') send();
    };
  }

  async function loadDrawerComments(postId) {
    const listNode = document.getElementById('drawer-comments-list');
    listNode.innerHTML = '<p class="text-muted">Loading comments...</p>';
    try {
      const res = await ULinkAPI.getComments(postId);
      listNode.innerHTML = '';
      if (!res.comments || res.comments.length === 0) {
        listNode.innerHTML = '<p class="text-muted text-center" style="padding:20px;">No comments yet. Start the conversation!</p>';
        return;
      }
      res.comments.forEach(c => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.gap = '12px';
        item.style.marginBottom = '12px';
        item.innerHTML = `
          <img src="${c.profile_pic || '/uploads/avatars/default.svg'}" class="avatar-sm" alt="Avatar" onerror="this.onerror=null; this.src='/uploads/avatars/default.svg';">
          <div style="flex:1;">
            <div style="font-size:0.85rem;"><strong style="margin-right:8px;">${c.username}</strong> <span style="color:var(--text-secondary);">${c.text}</span></div>
            <span style="font-size:0.7rem; color:var(--text-muted);">${formatRelativeTime(c.created_at)}</span>
          </div>
        `;
        listNode.appendChild(item);
      });
      scrollToBottom(listNode);
    } catch(err) {
      console.error(err);
    }
  }


  // --- CREATE CONTENT MODAL FLOWS (Posts, Reels) ---
  const toggleCreateModal = (open) => {
    DOM.modalCreatePost.classList.toggle('active', open);
    if (!open) {
      // reset fields
      DOM.createPostCaption.value = '';
      DOM.createPostLocation.value = '';
      DOM.createPostPreviewer.style.display = 'none';
      DOM.createPostDropzone.querySelector('.dropzone-placeholder').style.display = 'flex';
      state.createPostFiles = [];
    }
  };

  DOM.navCreate.addEventListener('click', (e) => {
    e.preventDefault();
    toggleCreateModal(true);
  });
  DOM.mobileBtnCreate.addEventListener('click', () => toggleCreateModal(true));
  DOM.createPostClose.addEventListener('click', () => toggleCreateModal(false));

  DOM.createPostDropzone.addEventListener('click', () => DOM.createPostFilesInput.click());
  DOM.createPostFilesInput.addEventListener('change', () => {
    const files = Array.from(DOM.createPostFilesInput.files);
    if (files.length > 0) {
      state.createPostFiles = files;
      DOM.createPostDropzone.querySelector('.dropzone-placeholder').style.display = 'none';
      DOM.createPostPreviewer.style.display = 'block';
      state.createPostSliderIndex = 0;
      
      drawCreatePostPreviews();
      drawCSSFilterThumbnails();
    }
  });

  function drawCreatePostPreviews() {
    DOM.previewCarouselSlider.innerHTML = '';
    state.createPostFiles.forEach((file, index) => {
      const url = URL.createObjectURL(file);
      const slide = document.createElement('div');
      slide.className = 'media-slide';
      
      const filterClass = `filter-${state.createPostFilter}`;

      if (file.type.startsWith('video')) {
        slide.innerHTML = `<video src="${url}" class="${filterClass}" autoplay loop muted></video>`;
      } else {
        slide.innerHTML = `<img src="${url}" class="${filterClass}" alt="Preview">`;
      }
      DOM.previewCarouselSlider.appendChild(slide);
    });

    // Carousel indicator dots builder
    DOM.previewIndicators.innerHTML = '';
    state.createPostFiles.forEach((_, idx) => {
      DOM.previewIndicators.innerHTML += `<span class="indicator-dot ${idx === state.createPostSliderIndex ? 'active' : ''}"></span>`;
    });
    
    // Toggle sliders arrows
    DOM.previewPrevBtn.style.display = state.createPostSliderIndex === 0 ? 'none' : 'flex';
    DOM.previewNextBtn.style.display = state.createPostSliderIndex === state.createPostFiles.length - 1 ? 'none' : 'flex';
  }

  DOM.previewNextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (state.createPostSliderIndex < state.createPostFiles.length - 1) {
      state.createPostSliderIndex++;
      DOM.previewCarouselSlider.scrollTo({
        left: DOM.previewCarouselSlider.offsetWidth * state.createPostSliderIndex,
        behavior: 'smooth'
      });
      drawCreatePostPreviews();
    }
  });

  DOM.previewPrevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (state.createPostSliderIndex > 0) {
      state.createPostSliderIndex--;
      DOM.previewCarouselSlider.scrollTo({
        left: DOM.previewCarouselSlider.offsetWidth * state.createPostSliderIndex,
        behavior: 'smooth'
      });
      drawCreatePostPreviews();
    }
  });

  // Filter thumbnails builder
  const filterOptions = ['normal', 'grayscale', 'sepia', 'warm', 'cool', 'vintage'];
  function drawCSSFilterThumbnails() {
    DOM.filtersThumbList.innerHTML = '';
    if (state.createPostFiles.length === 0) return;
    
    const file = state.createPostFiles[state.createPostSliderIndex];
    const url = URL.createObjectURL(file);

    filterOptions.forEach(filter => {
      const thumb = document.createElement('div');
      thumb.className = `filter-thumb-item ${state.createPostFilter === filter ? 'active' : ''}`;
      
      thumb.innerHTML = `
        <div class="filter-thumb-frame">
          <img src="${url}" class="filter-${filter}" alt="Thumb">
        </div>
        <span class="filter-thumb-name">${filter}</span>
      `;

      thumb.addEventListener('click', (e) => {
        e.stopPropagation();
        state.createPostFilter = filter;
        drawCreatePostPreviews();
        drawCSSFilterThumbnails();
      });

      DOM.filtersThumbList.appendChild(thumb);
    });
  }

  // Upload Submit
  DOM.createPostSubmit.addEventListener('click', async () => {
    if (state.createPostFiles.length === 0) return;
    
    DOM.createPostError.textContent = '';
    DOM.createPostSubmit.disabled = true;
    DOM.createPostSubmit.textContent = 'Sharing...';

    const formData = new FormData();
    state.createPostFiles.forEach(file => {
      formData.append('media', file);
    });

    const isReel = document.getElementById('type-reel').checked;
    formData.append('type', isReel ? 'reel' : 'post');
    formData.append('caption', DOM.createPostCaption.value);
    formData.append('location', DOM.createPostLocation.value);
    
    // Apply filters
    const filtersList = state.createPostFiles.map(() => state.createPostFilter);
    formData.append('filters', JSON.stringify(filtersList));

    try {
      await ULinkAPI.createPost(formData);
      toggleCreateModal(false);
      DOM.createPostSubmit.disabled = false;
      DOM.createPostSubmit.textContent = 'Share Post';
      
      // Refresh views
      window.location.hash = isReel ? '#reels' : '#feed';
      handleRoute();
    } catch (err) {
      DOM.createPostError.textContent = err.message;
      DOM.createPostSubmit.disabled = false;
      DOM.createPostSubmit.textContent = 'Share Post';
    }
  });


  // --- STORIES CREATION FLOW ---
  DOM.btnAddStory.addEventListener('click', () => {
    DOM.modalCreateStory.classList.add('active');
    DOM.createStoryError.textContent = '';
    DOM.storyMediaPreview.style.display = 'none';
    DOM.storyUploadBox.querySelector('.dropzone-placeholder').style.display = 'flex';
    DOM.createStorySubmit.style.display = 'none';
  });

  DOM.createStoryClose.addEventListener('click', closeAllModals);
  DOM.storyUploadBox.addEventListener('click', () => DOM.createStoryFileInput.click());
  DOM.createStoryFileInput.addEventListener('change', () => {
    const file = DOM.createStoryFileInput.files[0];
    if (file) {
      DOM.storyUploadBox.querySelector('.dropzone-placeholder').style.display = 'none';
      DOM.storyMediaPreview.style.display = 'block';
      DOM.createStorySubmit.style.display = 'block';
      DOM.storyTextOverlay.value = '';

      const url = URL.createObjectURL(file);
      if (file.type.startsWith('video')) {
        DOM.storyPreviewViewport.innerHTML = `<video src="${url}" autoplay loop muted></video>`;
      } else {
        DOM.storyPreviewViewport.innerHTML = `<img src="${url}" alt="Story">`;
      }
    }
  });

  DOM.createStorySubmit.addEventListener('click', async () => {
    const file = DOM.createStoryFileInput.files[0];
    if (!file) return;

    DOM.createStoryError.textContent = '';
    DOM.createStorySubmit.disabled = true;
    DOM.createStorySubmit.textContent = 'Posting Story...';

    const formData = new FormData();
    formData.append('media', file);
    formData.append('uploadType', 'story');
    formData.append('text_content', DOM.storyTextOverlay.value);

    try {
      await ULinkAPI.createStory(formData);
      closeAllModals();
      DOM.createStorySubmit.disabled = false;
      DOM.createStorySubmit.textContent = 'Add to Story';
      renderFeedView();
    } catch(err) {
      DOM.createStoryError.textContent = err.message;
      DOM.createStorySubmit.disabled = false;
      DOM.createStorySubmit.textContent = 'Add to Story';
    }
  });


  // --- STORY HIGHLIGHTS BUILDER FLOW ---
  DOM.profileBtnAddHighlight.addEventListener('click', async () => {
    DOM.modalBuildHighlight.classList.add('active');
    DOM.buildHighlightError.textContent = '';
    DOM.highlightStoriesSelector.innerHTML = '';
    DOM.highlightTitleInput.value = '';

    // Query active user's own stories to pick
    try {
      const feedRes = await ULinkAPI.getStoriesFeed();
      const myGroup = (feedRes.feed || []).find(g => g.username === state.currentUser.username);
      
      if (!myGroup || !myGroup.stories || myGroup.stories.length === 0) {
        DOM.highlightStoriesSelector.innerHTML = '<p class="text-muted text-sm">Post a Story first before creating a Highlight.</p>';
        return;
      }

      myGroup.stories.forEach(story => {
        const card = document.createElement('div');
        card.className = 'story-select-card';
        card.setAttribute('data-story-id', story.id);
        
        if (story.media_type === 'video') {
          card.innerHTML = `
            <video src="${story.media_url}" muted playsinline></video>
            <span class="story-select-checkbox"><i class="fa-solid fa-check"></i></span>
          `;
        } else {
          card.innerHTML = `
            <img src="${story.media_url}" alt="Story">
            <span class="story-select-checkbox"><i class="fa-solid fa-check"></i></span>
          `;
        }

        card.onclick = () => card.classList.toggle('selected');
        DOM.highlightStoriesSelector.appendChild(card);
      });

    } catch (e) {
      console.error(e);
    }
  });

  DOM.buildHighlightClose.addEventListener('click', closeAllModals);
  DOM.buildHighlightSubmit.addEventListener('click', async () => {
    const title = DOM.highlightTitleInput.value.trim();
    const selectedCards = DOM.highlightStoriesSelector.querySelectorAll('.story-select-card.selected');
    
    if (!title) {
      DOM.buildHighlightError.textContent = 'Please enter a highlight name.';
      return;
    }
    if (selectedCards.length === 0) {
      DOM.buildHighlightError.textContent = 'Please select at least one story.';
      return;
    }

    const storyIds = Array.from(selectedCards).map(c => parseInt(c.getAttribute('data-story-id')));
    
    try {
      await ULinkAPI.createHighlight(title, storyIds);
      closeAllModals();
      loadProfileHighlights(state.currentUser.username);
    } catch(err) {
      DOM.buildHighlightError.textContent = err.message;
    }
  });


  // --- SETTINGS MODAL & PANES ---
  function openSettingsModal() {
    DOM.modalSettings.classList.add('active');
    
    // Default pane
    document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
    const defaultTab = document.querySelector('.settings-tab[data-stab="profile"]');
    if (defaultTab) defaultTab.classList.add('active');
    document.querySelectorAll('.settings-pane').forEach(p => p.classList.remove('active'));
    const profilePane = document.getElementById('spane-profile');
    if (profilePane) profilePane.classList.add('active');

    // Fill current info
    DOM.setFullname.value = state.currentUser.full_name || '';
    DOM.setBio.value = state.currentUser.bio || '';
    DOM.setPrivacyToggle.checked = !!state.currentUser.is_private;

    DOM.setProfileSuccess.textContent = '';
    DOM.setPasswordSuccess.textContent = '';
    DOM.setPasswordError.textContent = '';
    
    loadSettingsBlockedUsers();
  }

  if (DOM.navSettings) {
    DOM.navSettings.addEventListener('click', (e) => {
      e.preventDefault();
      openSettingsModal();
    });
  }

  DOM.settingsClose.addEventListener('click', closeAllModals);

  DOM.setPrivacyToggle.addEventListener('change', async () => {
    const formData = new FormData();
    formData.append('is_private', DOM.setPrivacyToggle.checked ? 1 : 0);
    try {
      const res = await ULinkAPI.updateProfile(formData);
      state.currentUser = res.user;
      
      // Update ui on current profile view if it's the current user's profile
      const activeHash = window.location.hash;
      if (activeHash === '#profile' || activeHash === `#profile/${state.currentUser.username}`) {
        renderProfileView(state.currentUser.username);
      }
    } catch(err) {
      console.error(err);
      DOM.setPrivacyToggle.checked = !DOM.setPrivacyToggle.checked; // revert
      alert('Failed to update account privacy setting');
    }
  });

  // Tabs toggle
  document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.addEventListener('click', async (e) => {
      const activeTab = e.currentTarget;
      const stab = activeTab.getAttribute('data-stab');
      
      if (stab === 'logout') {
        if (confirm('Are you sure you want to log out of ULink?')) {
          closeAllModals();
          await ULinkAPI.logout();
          showAuthScreen();
        }
        return;
      }

      document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
      activeTab.classList.add('active');

      document.querySelectorAll('.settings-pane').forEach(p => p.classList.remove('active'));
      const paneId = `spane-${stab}`;
      const pane = document.getElementById(paneId);
      if (pane) pane.classList.add('active');
    });
  });

  // Save profile updates
  DOM.btnSettingsSaveProfile.addEventListener('click', async () => {
    DOM.setProfileSuccess.textContent = '';
    const formData = new FormData();
    formData.append('full_name', DOM.setFullname.value);
    formData.append('bio', DOM.setBio.value);
    formData.append('is_private', DOM.setPrivacyToggle.checked ? 1 : 0);

    try {
      const res = await ULinkAPI.updateProfile(formData);
      state.currentUser = res.user;
      DOM.setProfileSuccess.textContent = 'Profile details saved!';
    } catch (err) {
      console.error(err);
    }
  });

  // Avatar pick trigger
  DOM.profileAvatarTrigger.addEventListener('click', () => {
    if (window.location.hash.split('/')[1] && window.location.hash.split('/')[1] !== state.currentUser.username) return;
    DOM.profileAvatarFile.click();
  });
  DOM.profileAvatarFile.addEventListener('change', async () => {
    const file = DOM.profileAvatarFile.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await ULinkAPI.updateProfile(formData);
      state.currentUser = res.user;
      DOM.profileDetailsAvatar.src = res.user.profile_pic;
      DOM.navUserAvatar.src = res.user.profile_pic;
    } catch(err) {
      console.error(err);
    }
  });

  // Load blocked creators in Settings
  async function loadSettingsBlockedUsers() {
    DOM.settingsBlockedList.innerHTML = '<p class="text-muted text-sm">Loading blocked users...</p>';
    try {
      const res = await ULinkAPI.getPrivacySettings();
      const blocked = (res.settings || []).filter(s => s.is_blocked === 1);
      
      DOM.settingsBlockedList.innerHTML = '';
      if (blocked.length === 0) {
        DOM.settingsBlockedList.innerHTML = '<p class="text-muted text-sm">No creators blocked yet.</p>';
        return;
      }
      
      blocked.forEach(user => {
        const row = document.createElement('div');
        row.className = 'blocked-user-row';
        row.innerHTML = `
          <span>${user.username}</span>
          <button class="btn btn-secondary btn-unblock" data-uid="${user.target_user_id}" style="font-size:0.75rem; padding: 4px 10px;">Unblock</button>
        `;
        
        row.querySelector('.btn-unblock').onclick = async (e) => {
          await ULinkAPI.updatePrivacySetting(user.target_user_id, 'block', 0);
          row.remove();
        };

        DOM.settingsBlockedList.appendChild(row);
      });

    } catch (err) {
      console.error(err);
    }
  }

  // Update password
  DOM.btnSettingsSavePassword.addEventListener('click', async () => {
    DOM.setPasswordSuccess.textContent = '';
    DOM.setPasswordError.textContent = '';
    
    const oldP = DOM.setOldPassword.value;
    const newP = DOM.setNewPassword.value;

    if (!oldP || !newP) {
      DOM.setPasswordError.textContent = 'All password fields are required.';
      return;
    }

    try {
      await ULinkAPI.changePassword(oldP, newP);
      DOM.setPasswordSuccess.textContent = 'Password updated successfully!';
      DOM.setOldPassword.value = '';
      DOM.setNewPassword.value = '';
    } catch (err) {
      DOM.setPasswordError.textContent = err.message;
    }
  });

  // Delete account cascade verification
  DOM.btnSettingsDeleteAccount.addEventListener('click', async () => {
    if (confirm('CAUTION: Are you absolutely sure you want to permanently delete your ULink account? This deletes all your posts, reels, comments, and messages, and cannot be undone.')) {
      try {
        await ULinkAPI.deleteAccount();
        showAuthScreen();
      } catch (err) {
        alert(err.message);
      }
    }
  });


  // --- CONNECTION / PRIVACY CONTROLS MODAL ---
  async function openPrivacyControlModal(targetId, targetUsername) {
    DOM.modalProfilePrivacy.classList.add('active');
    DOM.privModalTitle.textContent = `@${targetUsername}`;

    // Query active state
    try {
      const res = await ULinkAPI.getPrivacySettings();
      const settings = (res.settings || []).find(s => s.target_user_id === parseInt(targetId)) || {};

      DOM.btnPrivCloseFriends.innerHTML = settings.is_close_friend ? '<i class="fa-solid fa-star text-warning"></i> Close Friend: YES' : '<i class="fa-regular fa-star"></i> Add Close Friend';
      DOM.btnPrivMute.innerHTML = settings.is_muted ? '<i class="fa-solid fa-volume-xmark"></i> Feed Muted: YES' : '<i class="fa-solid fa-volume-high"></i> Mute Feed';
      DOM.btnPrivRestrict.innerHTML = settings.is_restricted ? '<i class="fa-solid fa-triangle-exclamation text-warning"></i> Restricted: YES' : '<i class="fa-solid fa-circle-check"></i> Restrict Commenting';
      DOM.btnPrivBlock.innerHTML = settings.is_blocked ? '<i class="fa-solid fa-ban text-danger"></i> Blocked: YES' : '<i class="fa-solid fa-ban"></i> Block Account';

      // Attach clicks
      const toggleSetting = async (action, currentVal) => {
        await ULinkAPI.updatePrivacySetting(targetId, action, currentVal ? 0 : 1);
        closeAllModals();
        
        // Re-render feed or profile
        handleRoute();
      };

      DOM.btnPrivCloseFriends.onclick = () => toggleSetting('close_friend', settings.is_close_friend);
      DOM.btnPrivMute.onclick = () => toggleSetting('mute', settings.is_muted);
      DOM.btnPrivRestrict.onclick = () => toggleSetting('restrict', settings.is_restricted);
      DOM.btnPrivBlock.onclick = () => toggleSetting('block', settings.is_blocked);

    } catch (e) {
      console.error(e);
    }
  }

  DOM.profilePrivacyClose.addEventListener('click', closeAllModals);

  // --- CONTENT DELETION CONFIRMATION MODAL HELPER ---
  function showDeleteConfirmModal(onConfirm, onCancel = null) {
    if (!DOM.modalDeleteConfirm) return;
    DOM.modalDeleteConfirm.classList.add('active');

    DOM.btnDeleteConfirmAction.onclick = async () => {
      try {
        await onConfirm();
      } catch (err) {
        console.error('Deletion error:', err);
      } finally {
        closeAllModals();
      }
    };

    DOM.btnDeleteCancel.onclick = () => {
      if (onCancel) onCancel();
      closeAllModals();
    };

    DOM.deleteConfirmClose.onclick = () => {
      if (onCancel) onCancel();
      closeAllModals();
    };
  }

  if (DOM.deleteConfirmClose) DOM.deleteConfirmClose.addEventListener('click', closeAllModals);
  if (DOM.btnDeleteCancel) DOM.btnDeleteCancel.addEventListener('click', closeAllModals);


  // --- NEW MESSAGE / DMS CHAT MODAL ENGINE ---
  DOM.btnStartChat.addEventListener('click', () => openNewMessageModal());
  DOM.btnFallbackNewMsg.addEventListener('click', () => openNewMessageModal());

  let selectedMessageUsers = []; // ids list
  
  function openNewMessageModal() {
    DOM.modalStartChat.classList.add('active');
    DOM.chatSearchUsers.value = '';
    DOM.chatSearchResults.innerHTML = '';
    DOM.chatSelectedUsersBadgeRow.innerHTML = '';
    DOM.groupNameInputRow.style.display = 'none';
    DOM.chatIsGroupToggle.checked = false;
    DOM.chatGroupName.value = '';
    DOM.startChatError.textContent = '';
    selectedMessageUsers = [];
  }

  DOM.startChatClose.addEventListener('click', closeAllModals);
  DOM.chatIsGroupToggle.addEventListener('change', () => {
    DOM.groupNameInputRow.style.display = DOM.chatIsGroupToggle.checked ? 'block' : 'none';
  });

  // Search creators to start a thread
  let dmsSearchTimer = null;
  DOM.chatSearchUsers.addEventListener('input', () => {
    const val = DOM.chatSearchUsers.value.trim();
    if (dmsSearchTimer) clearTimeout(dmsSearchTimer);
    
    if (!val) {
      DOM.chatSearchResults.innerHTML = '';
      return;
    }

    dmsSearchTimer = setTimeout(async () => {
      try {
        const res = await ULinkAPI.search(val);
        DOM.chatSearchResults.innerHTML = '';
        const list = (res.users || []).filter(u => u.id !== state.currentUser.id);
        
        if (list.length === 0) {
          DOM.chatSearchResults.innerHTML = '<p class="text-muted text-sm">No creators matched</p>';
          return;
        }

        list.forEach(user => {
          const isSelected = selectedMessageUsers.includes(user.id);
          const row = document.createElement('div');
          row.className = `chat-search-row ${isSelected ? 'selected' : ''}`;
          row.innerHTML = `
            <div class="chat-search-user-info">
              <img src="${user.profile_pic || '/uploads/avatars/default.svg'}" class="avatar-sm" alt="Avatar" onerror="this.onerror=null; this.src='/uploads/avatars/default.svg';">
              <span class="suggested-username">${user.username}</span>
            </div>
            <span class="chat-search-check"><i class="fa-solid fa-circle-check"></i></span>
          `;

          row.onclick = () => {
            if (selectedMessageUsers.includes(user.id)) {
              selectedMessageUsers = selectedMessageUsers.filter(id => id !== user.id);
              row.classList.remove('selected');
            } else {
              // If not group thread, limit selection count to 1
              if (!DOM.chatIsGroupToggle.checked) {
                selectedMessageUsers = [user.id];
                document.querySelectorAll('.chat-search-row').forEach(r => r.classList.remove('selected'));
                row.classList.add('selected');
              } else {
                selectedMessageUsers.push(user.id);
                row.classList.add('selected');
              }
            }
            drawSelectedDMUserBadges(list);
          };

          DOM.chatSearchResults.appendChild(row);
        });

      } catch(err) {
        console.error(err);
      }
    }, 300);
  });

  function drawSelectedDMUserBadges(allSearchUsers) {
    DOM.chatSelectedUsersBadgeRow.innerHTML = '';
    selectedMessageUsers.forEach(uid => {
      const user = allSearchUsers.find(u => u.id === uid);
      if (!user) return;
      const badge = document.createElement('span');
      badge.className = 'selected-badge';
      badge.innerHTML = `
        ${user.username} <i class="fa-solid fa-xmark remove-badge-btn" data-uid="${user.id}"></i>
      `;
      badge.querySelector('.remove-badge-btn').onclick = () => {
        selectedMessageUsers = selectedMessageUsers.filter(id => id !== user.id);
        badge.remove();
        // remove row select
        document.querySelectorAll('.chat-search-row').forEach(row => {
          // Row click to toggle selection state
        });
      };
      DOM.chatSelectedUsersBadgeRow.appendChild(badge);
    });
  }

  DOM.btnStartChatSubmit.addEventListener('click', async () => {
    if (selectedMessageUsers.length === 0) {
      DOM.startChatError.textContent = 'Please select a recipient.';
      return;
    }

    const isGroup = DOM.chatIsGroupToggle.checked;
    const name = DOM.chatGroupName.value.trim();
    
    if (isGroup && !name) {
      DOM.startChatError.textContent = 'Please specify a group name.';
      return;
    }

    try {
      const res = await ULinkAPI.startThread(selectedMessageUsers, name, isGroup);
      closeAllModals();
      
      // Update local state
      state.activeThreadId = res.threadId;
      window.location.hash = '#dms';
      renderDMsView();
      
      // Get conversation info object to open directly
      const thRes = await ULinkAPI.getThreads();
      const activeTh = thRes.threads.find(t => t.id === res.threadId);
      if (activeTh) openDMConversation(activeTh);

    } catch (err) {
      DOM.startChatError.textContent = err.message;
    }
  });


  // --- CONCISE AUXILIARY UTILITIES ---
  async function updateGlobalUnreadBadges() {
    try {
      // 1. Direct Messages Unread Counts
      const data = await ULinkAPI.getThreads();
      const totalUnread = (data.threads || []).reduce((acc, t) => acc + (t.unread_count || 0), 0);
      
      if (totalUnread > 0) {
        DOM.dmUnreadBadge.textContent = totalUnread;
        DOM.dmUnreadBadge.style.display = 'inline-block';
        DOM.mobileUnreadBadge.textContent = totalUnread;
        DOM.mobileUnreadBadge.style.display = 'inline-block';
      } else {
        DOM.dmUnreadBadge.style.display = 'none';
        DOM.mobileUnreadBadge.style.display = 'none';
      }

      // 2. Activity (Notifications) Unread Counts
      const notifData = await ULinkAPI.getUnreadNotificationsCount();
      const notifUnread = notifData.unread_count || 0;

      if (notifUnread > 0) {
        DOM.activityUnreadBadge.textContent = notifUnread;
        DOM.activityUnreadBadge.style.display = 'inline-block';
        DOM.mobileActivityUnreadBadge.textContent = notifUnread;
        DOM.mobileActivityUnreadBadge.style.display = 'inline-block';
      } else {
        DOM.activityUnreadBadge.style.display = 'none';
        DOM.mobileActivityUnreadBadge.style.display = 'none';
      }
    } catch (e) {
      console.error('Failed to update global unread counts:', e);
    }
  }

  async function renderActivityView() {
    if (!state.currentUser) return;
    
    DOM.activityList.innerHTML = '<p class="text-muted text-center" style="padding:20px;">Loading activity...</p>';
    
    try {
      // 1. Fetch pending follow requests if any
      let followRequests = [];
      try {
        const reqRes = await ULinkAPI.getFollowRequests();
        followRequests = reqRes.requests || [];
      } catch(e) {
        console.error('Failed to load follow requests:', e);
      }

      const data = await ULinkAPI.getNotifications();
      DOM.activityList.innerHTML = '';
      
      // Render follow requests section if there are pending requests
      if (followRequests.length > 0) {
        const requestsBox = document.createElement('div');
        requestsBox.className = 'follow-requests-section glass-panel';
        requestsBox.style.padding = '16px';
        requestsBox.style.marginBottom = '20px';
        requestsBox.style.borderRadius = 'var(--radius-lg)';
        requestsBox.style.border = '1px solid var(--border-glass)';
        requestsBox.innerHTML = `
          <h3 style="font-size: 0.95rem; margin-bottom: 12px; font-family: 'Outfit', sans-serif; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-user-plus text-warning"></i>
            Follow Requests (${followRequests.length})
          </h3>
          <div class="requests-list-container" style="display: flex; flex-direction: column; gap: 10px;"></div>
        `;
        
        const listContainer = requestsBox.querySelector('.requests-list-container');
        followRequests.forEach(req => {
          const row = document.createElement('div');
          row.className = 'follow-request-row';
          row.style.display = 'flex';
          row.style.alignItems = 'center';
          row.style.justifyContent = 'space-between';
          row.style.padding = '8px 0';
          row.style.borderBottom = '1px solid rgba(255,255,255,0.03)';
          
          row.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
              <img src="${req.profile_pic || '/uploads/avatars/default.svg'}" class="avatar-sm" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;">
              <div style="display: flex; flex-direction: column;">
                <span style="font-size: 0.85rem; font-weight: 600;">${req.username}</span>
                <span style="font-size: 0.75rem; color: var(--text-muted);">${req.full_name || ''}</span>
              </div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-primary approve-btn" style="font-size: 0.75rem; padding: 4px 10px; margin:0;">Confirm</button>
              <button class="btn btn-secondary delete-btn" style="font-size: 0.75rem; padding: 4px 10px; margin:0;">Delete</button>
            </div>
          `;
          
          row.querySelector('.approve-btn').onclick = async () => {
            row.querySelector('.approve-btn').textContent = 'Confirming...';
            row.querySelector('.approve-btn').disabled = true;
            row.querySelector('.delete-btn').style.display = 'none';
            await ULinkAPI.approveFollowRequest(req.id);
            renderActivityView();
          };
          
          row.querySelector('.delete-btn').onclick = async () => {
            row.querySelector('.delete-btn').textContent = 'Deleting...';
            row.querySelector('.delete-btn').disabled = true;
            row.querySelector('.approve-btn').style.display = 'none';
            await ULinkAPI.rejectFollowRequest(req.id);
            renderActivityView();
          };
          
          listContainer.appendChild(row);
        });
        
        DOM.activityList.appendChild(requestsBox);
      }

      if ((!data.notifications || data.notifications.length === 0) && followRequests.length === 0) {
        DOM.activityList.innerHTML = '<p class="text-muted text-center" style="padding:40px;">No recent activity.</p>';
        return;
      }
      
      data.notifications.forEach(notif => {
        const item = document.createElement('div');
        item.className = `activity-item ${notif.is_read === 0 ? 'unread' : ''}`;
        item.setAttribute('data-id', notif.id);
        
        let text = '';
        if (notif.type === 'like') {
          text = `liked your ${notif.post_type || 'post'}.`;
        } else if (notif.type === 'comment') {
          text = `commented on your ${notif.post_type || 'post'}.`;
        } else if (notif.type === 'follow') {
          text = `started following you.`;
        }
        
        const avatar = notif.notifier_profile_pic || '/uploads/avatars/default.svg';
        
        let mediaPreview = '';
        if (notif.post_thumbnail) {
          mediaPreview = `
            <div class="activity-item-media">
              <img src="${notif.post_thumbnail}" alt="Post thumbnail">
            </div>
          `;
        }
        
        item.innerHTML = `
          <img src="${avatar}" class="avatar-md" alt="Avatar" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
          <div class="activity-item-content">
            <span class="activity-item-text"><strong>${notif.notifier_username}</strong> ${text}</span>
            <span class="activity-item-time">${formatRelativeTime(notif.created_at)}</span>
          </div>
          ${mediaPreview}
        `;
        
        item.addEventListener('click', () => {
          if (notif.type === 'follow') {
            window.location.hash = `#profile/${notif.notifier_username}`;
          } else if (notif.post_id) {
            window.location.hash = `#profile/${state.currentUser.username}`;
          }
        });
        
        DOM.activityList.appendChild(item);
      });
      
      // Clear counts in database when opened
      await ULinkAPI.markNotificationsAsRead();
      updateGlobalUnreadBadges();
    } catch (err) {
      console.error('Failed to render activity view:', err);
      DOM.activityList.innerHTML = '<p class="text-danger text-center" style="padding:20px;">Failed to load activity.</p>';
    }
  }

  function showNotificationToast(notif) {
    if (!DOM.toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    
    let actionText = '';
    if (notif.type === 'like') {
      actionText = `liked your ${notif.post_type || 'post'}.`;
    } else if (notif.type === 'comment') {
      actionText = `commented on your ${notif.post_type || 'post'}.`;
    } else if (notif.type === 'follow') {
      actionText = `started following you.`;
    }
    
    const avatar = notif.notifier_profile_pic || '/uploads/avatars/default.svg';
    
    let mediaEl = '';
    if (notif.post_thumbnail) {
      mediaEl = `
        <div class="activity-item-media" style="width: 32px; height: 32px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-glass); background: #000; flex-shrink: 0; margin-left: auto;">
          <img src="${notif.post_thumbnail}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
      `;
    }
    
    toast.innerHTML = `
      <img src="${avatar}" class="avatar-sm" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover; margin-right: 6px;">
      <div style="flex: 1;">
        <strong>${notif.notifier_username}</strong> ${actionText}
      </div>
      ${mediaEl}
    `;
    
    toast.addEventListener('click', () => {
      if (notif.type === 'follow') {
        window.location.hash = `#profile/${notif.notifier_username}`;
      } else {
        window.location.hash = `#activity`;
      }
      toast.remove();
    });
    
    DOM.toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 4000);
  }

  function scrollToBottom(node) {
    node.scrollTo({
      top: node.scrollHeight,
      behavior: 'smooth'
    });
  }

  function parseHashtags(text) {
    if (!text) return '';
    return text.replace(/(#[a-zA-Z0-9_]+)/g, '<span class="post-hashtags">$1</span>')
               .replace(/(@[a-zA-Z0-9_]+)/g, '<a href="#profile/$1" class="poster-name">$1</a>')
               .replace(/#(@[a-zA-Z0-9_]+)/g, '$1'); // clean edge cases
  }

  function formatRelativeTime(dateString) {
    if (!dateString) return '';
    let formatted = dateString;
    if (typeof dateString === 'string' && !dateString.includes('Z') && !dateString.includes('+') && dateString.match(/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/)) {
      // Treat SQLite default CURRENT_TIMESTAMP (which is in UTC) as UTC
      formatted = dateString.replace(' ', 'T') + 'Z';
    }
    const date = new Date(formatted);
    if (isNaN(date.getTime())) return dateString;

    // Use user's device locale and timezone dynamically
    return date.toLocaleString(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }


  // --- BOOTSTRAP INITIALIZE ---
  initApp();

  } catch (globalError) {
    console.error("ULink Global Error:", globalError);
    const errDiv = document.createElement('div');
    errDiv.style.styleSheet = ""; // force clean baseline
    errDiv.style.position = 'fixed';
    errDiv.style.top = '10px';
    errDiv.style.left = '10px';
    errDiv.style.right = '10px';
    errDiv.style.background = 'rgba(239, 68, 68, 0.95)';
    errDiv.style.color = 'white';
    errDiv.style.padding = '20px';
    errDiv.style.borderRadius = '8px';
    errDiv.style.zIndex = '9999';
    errDiv.style.fontFamily = 'monospace';
    errDiv.style.fontSize = '14px';
    errDiv.style.whiteSpace = 'pre-wrap';
    errDiv.innerHTML = `<h3>ULink Startup Crash Diagnostics:</h3><p>${globalError.stack || globalError.message || globalError}</p>`;
    document.body.appendChild(errDiv);
    
    const auth = document.getElementById('auth-container');
    if (auth) auth.style.display = 'flex';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeULink);
} else {
  initializeULink();
}
