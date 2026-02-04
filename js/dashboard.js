/**
 * CodePulse - Dashboard JavaScript
 * Handles dashboard functionality, API calls, and UI updates
 */

// State
const state = {
    user: null,
    allRepos: [],        // All repos from GitHub
    selectedRepos: [],   // IDs of selected repos to track
    repos: [],           // Filtered repos (selected only)
    commits: [],
    pullRequests: [],    // PRs across repos
    contributors: new Map(),
    goals: [],           // Team goals
    currentView: 'overview',
    theme: 'dark'        // Current theme
};

// DOM Elements
const elements = {
    loadingState: document.getElementById('loadingState'),
    overviewView: document.getElementById('overviewView'),
    reposView: document.getElementById('reposView'),
    leaderboardView: document.getElementById('leaderboardView'),
    teamView: document.getElementById('teamView'),
    commitsView: document.getElementById('commitsView'),
    settingsView: document.getElementById('settingsView'),
    emptyState: document.getElementById('emptyState'),

    // Stats
    totalRepos: document.getElementById('totalRepos'),
    totalCommits: document.getElementById('totalCommits'),
    totalContributors: document.getElementById('totalContributors'),
    healthScore: document.getElementById('healthScore'),

    // User info
    userAvatar: document.getElementById('userAvatar'),
    userName: document.getElementById('userName'),
    userLogin: document.getElementById('userLogin'),

    // Lists
    activityList: document.getElementById('activityList'),
    topRepos: document.getElementById('topRepos'),
    allRepos: document.getElementById('allRepos'),
    teamGrid: document.getElementById('teamGrid'),
    allCommits: document.getElementById('allCommits'),

    // Leaderboard
    podium: document.getElementById('podium'),
    rankingsList: document.getElementById('rankingsList'),

    // Settings
    repoSelectionList: document.getElementById('repoSelectionList'),
    selectAllRepos: document.getElementById('selectAllRepos'),
    deselectAllRepos: document.getElementById('deselectAllRepos'),

    // Modal
    commitModal: document.getElementById('commitModal'),
    commitModalContent: document.getElementById('commitModalContent'),
    closeCommitModal: document.getElementById('closeCommitModal'),

    // Pull Requests
    pullsView: document.getElementById('pullsView'),
    prStats: document.getElementById('prStats'),
    prList: document.getElementById('prList'),

    // Goals
    goalsView: document.getElementById('goalsView'),
    weeklySummary: document.getElementById('weeklySummary'),
    summaryGrid: document.getElementById('summaryGrid'),
    goalsList: document.getElementById('goalsList'),
    addGoalBtn: document.getElementById('addGoalBtn'),

    // Theme
    themeToggle: document.getElementById('themeToggle'),

    // Header
    pageTitle: document.getElementById('pageTitle'),
    pageSubtitle: document.getElementById('pageSubtitle'),
    refreshBtn: document.getElementById('refreshBtn')
};

// Local Storage Keys
const STORAGE_KEYS = {
    selectedRepos: 'codepulse_selected_repos',
    goals: 'codepulse_goals',
    theme: 'codepulse_theme'
};

// API Functions
const api = {
    async getUser() {
        const response = await fetch('/api/user');
        if (!response.ok) throw new Error('Failed to fetch user');
        return response.json();
    },

    async getRepos() {
        const response = await fetch('/api/repos');
        if (!response.ok) throw new Error('Failed to fetch repos');
        return response.json();
    },

    async getCommits(repo, owner) {
        const response = await fetch(`/api/commits?repo=${repo}&owner=${owner}`);
        if (!response.ok) throw new Error('Failed to fetch commits');
        return response.json();
    },

    async getCommitDetails(repo, owner, sha) {
        const response = await fetch(`/api/commit-details?repo=${repo}&owner=${owner}&sha=${sha}`);
        if (!response.ok) throw new Error('Failed to fetch commit details');
        return response.json();
    },

    async getContributors(repo, owner) {
        const response = await fetch(`/api/contributors?repo=${repo}&owner=${owner}`);
        if (!response.ok) return [];
        return response.json();
    },

    async getPulls(repo, owner) {
        const response = await fetch(`/api/pulls?repo=${repo}&owner=${owner}`);
        if (!response.ok) return [];
        return response.json();
    }
};

// Storage Functions
const storage = {
    getSelectedRepos() {
        const saved = localStorage.getItem(STORAGE_KEYS.selectedRepos);
        return saved ? JSON.parse(saved) : null;
    },

    saveSelectedRepos(repoIds) {
        localStorage.setItem(STORAGE_KEYS.selectedRepos, JSON.stringify(repoIds));
    },

    getGoals() {
        const saved = localStorage.getItem(STORAGE_KEYS.goals);
        return saved ? JSON.parse(saved) : [];
    },

    saveGoals(goals) {
        localStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(goals));
    },

    getTheme() {
        return localStorage.getItem(STORAGE_KEYS.theme) || 'dark';
    },

    saveTheme(theme) {
        localStorage.setItem(STORAGE_KEYS.theme, theme);
    }
};

// UI Functions
const ui = {
    showLoading() {
        elements.loadingState.classList.remove('hidden');
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    },

    hideLoading() {
        elements.loadingState.classList.add('hidden');
    },

    showView(viewName) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

        const view = document.getElementById(`${viewName}View`);
        const navItem = document.querySelector(`[data-view="${viewName}"]`);

        if (view) view.classList.add('active');
        if (navItem) navItem.classList.add('active');

        state.currentView = viewName;
        this.updateHeader(viewName);
    },

    updateHeader(viewName) {
        const headers = {
            overview: { title: 'Overview', subtitle: 'Welcome back! Here\'s what\'s happening.' },
            repos: { title: 'Repositories', subtitle: 'All your tracked repositories' },
            leaderboard: { title: 'Leaderboard', subtitle: 'Top contributors ranked by activity' },
            team: { title: 'Team', subtitle: 'Contributors across your repositories' },
            commits: { title: 'Commits', subtitle: 'Recent commit activity' },
            pulls: { title: 'Pull Requests', subtitle: 'Track PR status across repositories' },
            goals: { title: 'Goals', subtitle: 'Set and track team objectives' },
            settings: { title: 'Settings', subtitle: 'Configure your tracked repositories' }
        };

        const header = headers[viewName] || headers.overview;
        elements.pageTitle.textContent = header.title;
        elements.pageSubtitle.textContent = header.subtitle;
    },

    updateUserInfo(user) {
        elements.userAvatar.src = user.avatar_url;
        elements.userName.textContent = user.name || user.login;
        elements.userLogin.textContent = `@${user.login}`;
    },

    updateStats() {
        elements.totalRepos.textContent = state.repos.length;
        elements.totalCommits.textContent = state.commits.length;
        elements.totalContributors.textContent = state.contributors.size;
        elements.healthScore.textContent = this.calculateHealthScore();
    },

    calculateHealthScore() {
        if (state.repos.length === 0) return '--';

        let score = 0;
        let count = 0;

        state.repos.forEach(repo => {
            let repoScore = 70;
            if (repo.description) repoScore += 10;

            const lastPush = new Date(repo.pushed_at);
            const daysSincePush = (Date.now() - lastPush) / (1000 * 60 * 60 * 24);
            if (daysSincePush < 7) repoScore += 15;
            else if (daysSincePush < 30) repoScore += 10;
            else if (daysSincePush < 90) repoScore += 5;

            if (repo.stargazers_count > 0) repoScore += 5;

            score += Math.min(100, repoScore);
            count++;
        });

        const avgScore = Math.round(score / count);
        return avgScore >= 80 ? 'A' : avgScore >= 60 ? 'B' : avgScore >= 40 ? 'C' : 'D';
    },

    renderActivityList() {
        if (state.commits.length === 0) {
            elements.activityList.innerHTML = `
                <div class="activity-item">
                    <div class="activity-content">
                        <p class="activity-title">No recent activity</p>
                        <div class="activity-meta">Start committing to see your activity here</div>
                    </div>
                </div>
            `;
            return;
        }

        const recentCommits = state.commits.slice(0, 5);
        elements.activityList.innerHTML = recentCommits.map(commit => `
            <div class="activity-item clickable" data-sha="${commit.sha}" data-repo="${commit.repo}" data-owner="${commit.owner}">
                <img src="${commit.author?.avatar_url || 'https://github.com/ghost.png'}" 
                     alt="${commit.author?.login || 'Unknown'}" 
                     class="activity-avatar">
                <div class="activity-content">
                    <p class="activity-title">
                        <strong>${commit.author?.login || 'Unknown'}</strong> 
                        committed to <strong>${commit.repo}</strong>
                    </p>
                    <div class="activity-meta">
                        <span>${commit.commit.message.split('\n')[0].substring(0, 50)}${commit.commit.message.length > 50 ? '...' : ''}</span>
                        <span>${this.formatDate(commit.commit.author.date)}</span>
                    </div>
                </div>
                <span class="activity-badge ${this.getQualityClass(commit)}">${this.getQualityLabel(commit)}</span>
            </div>
        `).join('');

        // Add click handlers
        elements.activityList.querySelectorAll('.activity-item.clickable').forEach(item => {
            item.addEventListener('click', () => {
                this.showCommitDetails(item.dataset.sha, item.dataset.repo, item.dataset.owner);
            });
        });
    },

    renderRepos(container, repos) {
        if (repos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📂</div>
                    <h3>No repositories found</h3>
                    <p>Select repositories to track in Settings.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = repos.map(repo => `
            <div class="repo-card">
                <div class="repo-header">
                    <a href="${repo.html_url}" target="_blank" class="repo-name">${repo.name}</a>
                    <span class="repo-visibility">${repo.private ? 'Private' : 'Public'}</span>
                </div>
                <p class="repo-description">${repo.description || 'No description'}</p>
                <div class="repo-stats">
                    ${repo.language ? `
                        <span class="repo-stat repo-language">
                            <span class="language-dot" style="background: ${this.getLanguageColor(repo.language)}"></span>
                            ${repo.language}
                        </span>
                    ` : ''}
                    <span class="repo-stat">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        ${repo.stargazers_count}
                    </span>
                    <span class="repo-stat">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="6" y1="3" x2="6" y2="15"/>
                            <circle cx="18" cy="6" r="3"/>
                            <circle cx="6" cy="18" r="3"/>
                            <path d="M18 9a9 9 0 0 1-9 9"/>
                        </svg>
                        ${repo.forks_count}
                    </span>
                </div>
            </div>
        `).join('');
    },

    renderLeaderboard() {
        const contributors = Array.from(state.contributors.values())
            .sort((a, b) => b.contributions - a.contributions);

        if (contributors.length === 0) {
            elements.podium.innerHTML = '';
            elements.rankingsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🏆</div>
                    <h3>No contributors yet</h3>
                    <p>Contributors will appear here once you have commits.</p>
                </div>
            `;
            return;
        }

        // Render podium (top 3)
        const top3 = contributors.slice(0, 3);
        const medals = ['🥇', '🥈', '🥉'];
        const placeClasses = ['first', 'second', 'third'];

        elements.podium.innerHTML = top3.map((contributor, index) => `
            <div class="podium-place ${placeClasses[index]}">
                <img src="${contributor.avatar_url}" alt="${contributor.login}" class="podium-avatar">
                <span class="podium-rank">${medals[index]}</span>
                <span class="podium-name">${contributor.login}</span>
                <span class="podium-commits">${contributor.contributions} commits</span>
                <span class="podium-score">#${index + 1}</span>
            </div>
        `).join('');

        // Render full rankings (4th place onwards)
        const rest = contributors.slice(3);
        if (rest.length === 0) {
            elements.rankingsList.innerHTML = '';
            return;
        }

        elements.rankingsList.innerHTML = rest.map((contributor, index) => `
            <div class="ranking-item">
                <div class="ranking-position">${index + 4}</div>
                <img src="${contributor.avatar_url}" alt="${contributor.login}" class="ranking-avatar">
                <div class="ranking-info">
                    <div class="ranking-name">${contributor.login}</div>
                    <div class="ranking-details">@${contributor.login}</div>
                </div>
                <div class="ranking-stats">
                    <div class="ranking-stat">
                        <span class="ranking-stat-value">${contributor.contributions}</span>
                        <span class="ranking-stat-label">Commits</span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    renderTeam() {
        const contributors = Array.from(state.contributors.values());

        if (contributors.length === 0) {
            elements.teamGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <h3>No contributors found</h3>
                    <p>Contributors will appear here once you have commits.</p>
                </div>
            `;
            return;
        }

        elements.teamGrid.innerHTML = contributors.map(contributor => `
            <div class="team-card">
                <img src="${contributor.avatar_url}" alt="${contributor.login}" class="team-avatar">
                <h3 class="team-name">${contributor.login}</h3>
                <p class="team-login">@${contributor.login}</p>
                <div class="team-stats">
                    <div class="team-stat">
                        <span class="team-stat-value">${contributor.contributions || 0}</span>
                        <span class="team-stat-label">Commits</span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    renderCommits() {
        if (state.commits.length === 0) {
            elements.allCommits.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h3>No commits found</h3>
                    <p>Push some commits to see them here.</p>
                </div>
            `;
            return;
        }

        elements.allCommits.innerHTML = state.commits.map(commit => `
            <div class="commit-item clickable" data-sha="${commit.sha}" data-repo="${commit.repo}" data-owner="${commit.owner}">
                <img src="${commit.author?.avatar_url || 'https://github.com/ghost.png'}" 
                     alt="${commit.author?.login || 'Unknown'}" 
                     class="commit-avatar">
                <div class="commit-content">
                    <p class="commit-message">${commit.commit.message.split('\n')[0]}</p>
                    <div class="commit-meta">
                        <span class="commit-sha">${commit.sha.substring(0, 7)}</span>
                        <span>${commit.author?.login || 'Unknown'}</span>
                        <span>${commit.repo}</span>
                        <span>${this.formatDate(commit.commit.author.date)}</span>
                    </div>
                </div>
                <span class="commit-quality activity-badge ${this.getQualityClass(commit)}">
                    ${this.getQualityLabel(commit)}
                </span>
            </div>
        `).join('');

        // Add click handlers
        elements.allCommits.querySelectorAll('.commit-item.clickable').forEach(item => {
            item.addEventListener('click', () => {
                this.showCommitDetails(item.dataset.sha, item.dataset.repo, item.dataset.owner);
            });
        });
    },

    renderRepoSelection() {
        elements.repoSelectionList.innerHTML = state.allRepos.map(repo => {
            const isSelected = state.selectedRepos.includes(repo.id);
            return `
                <label class="repo-checkbox ${isSelected ? 'selected' : ''}" data-repo-id="${repo.id}">
                    <input type="checkbox" ${isSelected ? 'checked' : ''}>
                    <div class="repo-checkbox-info">
                        <div class="repo-checkbox-name">${repo.name}</div>
                        <div class="repo-checkbox-meta">
                            ${repo.language || 'No language'} • 
                            ${repo.private ? 'Private' : 'Public'} • 
                            Updated ${this.formatDate(repo.pushed_at)}
                        </div>
                    </div>
                </label>
            `;
        }).join('');

        // Add change handlers
        elements.repoSelectionList.querySelectorAll('.repo-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const repoId = parseInt(checkbox.dataset.repoId);
                const isChecked = checkbox.querySelector('input').checked;

                if (isChecked) {
                    if (!state.selectedRepos.includes(repoId)) {
                        state.selectedRepos.push(repoId);
                    }
                    checkbox.classList.add('selected');
                } else {
                    state.selectedRepos = state.selectedRepos.filter(id => id !== repoId);
                    checkbox.classList.remove('selected');
                }

                storage.saveSelectedRepos(state.selectedRepos);
                updateTrackedRepos();
            });
        });
    },

    async showCommitDetails(sha, repo, owner) {
        elements.commitModal.classList.add('active');
        elements.commitModalContent.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading commit details...</p>
            </div>
        `;

        try {
            const commit = await api.getCommitDetails(repo, owner, sha);

            const filesHtml = commit.files ? commit.files.map(file => {
                let status = 'modified';
                if (file.status === 'added') status = 'added';
                else if (file.status === 'removed') status = 'removed';

                return `
                    <div class="commit-file-item">
                        <span class="file-status ${status}">${status}</span>
                        <span class="file-name">${file.filename}</span>
                        <span class="file-changes">
                            <span class="additions">+${file.additions}</span> / 
                            <span class="deletions">-${file.deletions}</span>
                        </span>
                    </div>
                `;
            }).join('') : '<div class="commit-file-item">No files data available</div>';

            elements.commitModalContent.innerHTML = `
                <div class="commit-detail-header">
                    <img src="${commit.author?.avatar_url || 'https://github.com/ghost.png'}" 
                         alt="${commit.author?.login || 'Unknown'}" 
                         class="commit-detail-avatar">
                    <div class="commit-detail-info">
                        <h3>${commit.author?.login || 'Unknown'}</h3>
                        <div class="commit-detail-meta">
                            ${this.formatDate(commit.commit.author.date)} • ${commit.sha.substring(0, 7)}
                        </div>
                    </div>
                </div>
                
                <div class="commit-detail-message">${commit.commit.message}</div>
                
                <div class="commit-detail-stats">
                    <div class="commit-stat-card additions">
                        <span class="commit-stat-value">+${commit.stats?.additions || 0}</span>
                        <span class="commit-stat-label">Additions</span>
                    </div>
                    <div class="commit-stat-card deletions">
                        <span class="commit-stat-value">-${commit.stats?.deletions || 0}</span>
                        <span class="commit-stat-label">Deletions</span>
                    </div>
                    <div class="commit-stat-card files">
                        <span class="commit-stat-value">${commit.files?.length || 0}</span>
                        <span class="commit-stat-label">Files Changed</span>
                    </div>
                </div>
                
                <div class="commit-files-list">
                    <div class="commit-files-header">Files Changed</div>
                    ${filesHtml}
                </div>
            `;
        } catch (error) {
            console.error('Failed to load commit details:', error);
            elements.commitModalContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">❌</div>
                    <h3>Failed to load commit details</h3>
                    <p>Please try again later.</p>
                </div>
            `;
        }
    },

    hideCommitModal() {
        elements.commitModal.classList.remove('active');
    },

    getQualityClass(commit) {
        const message = commit.commit.message;
        const length = message.length;

        if (length < 10) return 'warning';
        if (message.toLowerCase().includes('fix') || message.toLowerCase().includes('bug')) return 'warning';
        if (message.toLowerCase().includes('wip') || message.toLowerCase().includes('todo')) return 'error';
        return 'good';
    },

    getQualityLabel(commit) {
        const qualityClass = this.getQualityClass(commit);
        return qualityClass === 'good' ? '✓ Good' : qualityClass === 'warning' ? '⚠ Review' : '✗ Needs Work';
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    },

    getLanguageColor(language) {
        const colors = {
            JavaScript: '#f1e05a',
            TypeScript: '#3178c6',
            Python: '#3572A5',
            Java: '#b07219',
            'C#': '#178600',
            'C++': '#f34b7d',
            C: '#555555',
            Ruby: '#701516',
            Go: '#00ADD8',
            Rust: '#dea584',
            PHP: '#4F5D95',
            Swift: '#F05138',
            Kotlin: '#A97BFF',
            HTML: '#e34c26',
            CSS: '#563d7c',
            Vue: '#41b883',
            Shell: '#89e051'
        };
        return colors[language] || '#858585';
    },

    // Pull Requests rendering
    renderPullRequests() {
        const prs = state.pullRequests;

        // Calculate stats
        const open = prs.filter(pr => pr.state === 'open').length;
        const merged = prs.filter(pr => pr.merged_at).length;
        const closed = prs.filter(pr => pr.state === 'closed' && !pr.merged_at).length;

        elements.prStats.innerHTML = `
            <div class="pr-stat-card open">
                <span class="pr-stat-value">${open}</span>
                <span class="pr-stat-label">Open PRs</span>
            </div>
            <div class="pr-stat-card merged">
                <span class="pr-stat-value">${merged}</span>
                <span class="pr-stat-label">Merged</span>
            </div>
            <div class="pr-stat-card closed">
                <span class="pr-stat-value">${closed}</span>
                <span class="pr-stat-label">Closed</span>
            </div>
            <div class="pr-stat-card">
                <span class="pr-stat-value">${prs.length}</span>
                <span class="pr-stat-label">Total</span>
            </div>
        `;

        if (prs.length === 0) {
            elements.prList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔗</div>
                    <h3>No Pull Requests</h3>
                    <p>Create a pull request to see it here.</p>
                </div>
            `;
            return;
        }

        elements.prList.innerHTML = prs.slice(0, 30).map(pr => {
            const status = pr.merged_at ? 'merged' : pr.state;
            const statusIcon = status === 'open'
                ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/></svg>'
                : status === 'merged'
                    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/></svg>'
                    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';

            const labels = pr.labels?.map(label =>
                `<span class="pr-label" style="background: #${label.color}20; color: #${label.color}">${label.name}</span>`
            ).join('') || '';

            return `
                <div class="pr-item">
                    <div class="pr-icon ${status}">${statusIcon}</div>
                    <div class="pr-content">
                        <div class="pr-title">
                            <a href="${pr.html_url}" target="_blank">${pr.title}</a>
                            <span class="pr-number">#${pr.number}</span>
                        </div>
                        <div class="pr-meta">
                            ${pr.user?.login || 'Unknown'} • ${pr.repo} • ${this.formatDate(pr.created_at)}
                        </div>
                        ${labels ? `<div class="pr-labels">${labels}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    // Weekly Summary
    renderWeeklySummary() {
        const now = new Date();
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);

        // This week's commits
        const thisWeekCommits = state.commits.filter(c =>
            new Date(c.commit.author.date) >= weekAgo
        ).length;

        // Last week's commits
        const lastWeekCommits = state.commits.filter(c => {
            const date = new Date(c.commit.author.date);
            return date >= twoWeeksAgo && date < weekAgo;
        }).length;

        // Calculate change percentage
        const commitChange = lastWeekCommits > 0
            ? Math.round(((thisWeekCommits - lastWeekCommits) / lastWeekCommits) * 100)
            : thisWeekCommits > 0 ? 100 : 0;

        // This week's PRs
        const thisWeekPRs = state.pullRequests.filter(pr =>
            new Date(pr.created_at) >= weekAgo
        ).length;

        // Active contributors this week
        const thisWeekContributors = new Set(
            state.commits
                .filter(c => new Date(c.commit.author.date) >= weekAgo)
                .map(c => c.author?.login)
                .filter(Boolean)
        ).size;

        // Active days
        const activeDays = new Set(
            state.commits
                .filter(c => new Date(c.commit.author.date) >= weekAgo)
                .map(c => new Date(c.commit.author.date).toDateString())
        ).size;

        elements.summaryGrid.innerHTML = `
            <div class="summary-card">
                <span class="summary-value">${thisWeekCommits}</span>
                <span class="summary-label">Commits</span>
                <div class="summary-change ${commitChange >= 0 ? 'positive' : 'negative'}">
                    ${commitChange >= 0 ? '↑' : '↓'} ${Math.abs(commitChange)}% vs last week
                </div>
            </div>
            <div class="summary-card">
                <span class="summary-value">${thisWeekPRs}</span>
                <span class="summary-label">Pull Requests</span>
            </div>
            <div class="summary-card">
                <span class="summary-value">${thisWeekContributors}</span>
                <span class="summary-label">Active Contributors</span>
            </div>
            <div class="summary-card">
                <span class="summary-value">${activeDays}/7</span>
                <span class="summary-label">Active Days</span>
            </div>
        `;
    },

    // Goals rendering
    renderGoals() {
        state.goals = storage.getGoals();

        if (state.goals.length === 0) {
            elements.goalsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎯</div>
                    <h3>No Goals Set</h3>
                    <p>Create a goal to track your team's progress.</p>
                </div>
            `;
            return;
        }

        // Update progress based on current data
        state.goals = state.goals.map(goal => {
            let current = 0;
            const now = new Date();
            const startDate = new Date(goal.startDate);

            if (goal.type === 'commits') {
                current = state.commits.filter(c =>
                    new Date(c.commit.author.date) >= startDate
                ).length;
            } else if (goal.type === 'prs') {
                current = state.pullRequests.filter(pr =>
                    new Date(pr.created_at) >= startDate
                ).length;
            }

            const endDate = new Date(goal.endDate);
            let status = 'active';
            if (current >= goal.target) status = 'completed';
            else if (now > endDate) status = 'expired';

            return { ...goal, current, status };
        });

        storage.saveGoals(state.goals);

        elements.goalsList.innerHTML = state.goals.map((goal, index) => {
            const progress = Math.min(100, Math.round((goal.current / goal.target) * 100));
            const endDate = new Date(goal.endDate);
            const daysLeft = Math.max(0, Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)));

            return `
                <div class="goal-card" data-goal-id="${goal.id}">
                    <div class="goal-header">
                        <span class="goal-title">
                            ${goal.type === 'commits' ? '📝' : '🔗'} ${goal.name}
                        </span>
                        <span class="goal-status ${goal.status}">${goal.status}</span>
                    </div>
                    <div class="goal-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-text">
                            <span>${goal.current} / ${goal.target} ${goal.type}</span>
                            <span>${progress}%</span>
                        </div>
                    </div>
                    <div class="goal-meta">
                        <span>${daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}</span>
                        <div class="goal-actions">
                            <button onclick="ui.deleteGoal(${index})" class="delete">Delete</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    addGoal(goal) {
        state.goals.push({
            id: Date.now(),
            name: goal.name,
            type: goal.type,
            target: parseInt(goal.target),
            startDate: goal.startDate || new Date().toISOString(),
            endDate: goal.endDate,
            current: 0,
            status: 'active'
        });
        storage.saveGoals(state.goals);
        this.renderGoals();
    },

    deleteGoal(index) {
        state.goals.splice(index, 1);
        storage.saveGoals(state.goals);
        this.renderGoals();
    },

    showAddGoalModal() {
        elements.commitModal.classList.add('active');
        elements.commitModalContent.innerHTML = `
            <div class="goal-form">
                <div class="form-group">
                    <label>Goal Name</label>
                    <input type="text" id="goalName" placeholder="e.g., Weekly Commit Target">
                </div>
                <div class="form-group">
                    <label>Goal Type</label>
                    <select id="goalType">
                        <option value="commits">Commits</option>
                        <option value="prs">Pull Requests</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Target Number</label>
                    <input type="number" id="goalTarget" placeholder="e.g., 50" min="1">
                </div>
                <div class="form-group">
                    <label>End Date</label>
                    <input type="date" id="goalEndDate">
                </div>
                <div class="form-actions">
                    <button class="btn btn-secondary" onclick="ui.hideCommitModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="ui.submitGoal()">Create Goal</button>
                </div>
            </div>
        `;

        // Set default end date to 7 days from now
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        document.getElementById('goalEndDate').value = nextWeek.toISOString().split('T')[0];
    },

    submitGoal() {
        const name = document.getElementById('goalName').value;
        const type = document.getElementById('goalType').value;
        const target = document.getElementById('goalTarget').value;
        const endDate = document.getElementById('goalEndDate').value;

        if (!name || !target || !endDate) {
            alert('Please fill in all fields');
            return;
        }

        this.addGoal({ name, type, target, endDate });
        this.hideCommitModal();
    },

    // Theme toggle
    initTheme() {
        state.theme = storage.getTheme();
        document.documentElement.setAttribute('data-theme', state.theme);
        this.updateThemeIcon();
    },

    toggleTheme() {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', state.theme);
        storage.saveTheme(state.theme);
        this.updateThemeIcon();
    },

    updateThemeIcon() {
        const darkIcon = document.querySelector('.theme-icon-dark');
        const lightIcon = document.querySelector('.theme-icon-light');

        if (state.theme === 'dark') {
            darkIcon.style.display = 'block';
            lightIcon.style.display = 'none';
        } else {
            darkIcon.style.display = 'none';
            lightIcon.style.display = 'block';
        }
    }
};

// Update tracked repos based on selection
function updateTrackedRepos() {
    if (state.selectedRepos.length === 0) {
        // If no selection, track top 5 by default
        state.repos = state.allRepos.slice(0, 5);
    } else {
        state.repos = state.allRepos.filter(repo => state.selectedRepos.includes(repo.id));
    }

    // Re-render views that depend on repos
    ui.updateStats();
    ui.renderRepos(elements.topRepos, state.repos.slice(0, 4));
    ui.renderRepos(elements.allRepos, state.repos);
}

// Data Loading
async function loadData() {
    ui.showLoading();

    try {
        // Load user
        state.user = await api.getUser();
        ui.updateUserInfo(state.user);

        // Load all repos
        state.allRepos = await api.getRepos();

        // Load saved selection or default to top 5
        const savedSelection = storage.getSelectedRepos();
        if (savedSelection && savedSelection.length > 0) {
            state.selectedRepos = savedSelection.filter(id =>
                state.allRepos.some(repo => repo.id === id)
            );
        } else {
            state.selectedRepos = state.allRepos.slice(0, 5).map(repo => repo.id);
            storage.saveSelectedRepos(state.selectedRepos);
        }

        // Filter repos based on selection
        updateTrackedRepos();

        // Render repo selection
        ui.renderRepoSelection();

        // Load commits and contributors for tracked repos
        for (const repo of state.repos) {
            try {
                const commits = await api.getCommits(repo.name, repo.owner.login);
                commits.forEach(commit => {
                    commit.repo = repo.name;
                    commit.owner = repo.owner.login;
                    state.commits.push(commit);

                    // Track contributors
                    if (commit.author) {
                        if (!state.contributors.has(commit.author.login)) {
                            state.contributors.set(commit.author.login, {
                                ...commit.author,
                                contributions: 1
                            });
                        } else {
                            state.contributors.get(commit.author.login).contributions++;
                        }
                    }
                });
            } catch (error) {
                console.warn(`Failed to load commits for ${repo.name}`);
            }

            // Load PRs
            try {
                const prs = await api.getPulls(repo.name, repo.owner.login);
                prs.forEach(pr => {
                    pr.repo = repo.name;
                    state.pullRequests.push(pr);
                });
            } catch (error) {
                console.warn(`Failed to load PRs for ${repo.name}`);
            }
        }

        // Sort commits by date
        state.commits.sort((a, b) =>
            new Date(b.commit.author.date) - new Date(a.commit.author.date)
        );

        // Sort PRs by date
        state.pullRequests.sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
        );

        // Update UI
        ui.updateStats();
        ui.renderActivityList();
        ui.renderRepos(elements.topRepos, state.repos.slice(0, 4));
        ui.renderRepos(elements.allRepos, state.repos);
        ui.renderLeaderboard();
        ui.renderTeam();
        ui.renderCommits();
        ui.renderPullRequests();
        ui.renderWeeklySummary();
        ui.renderGoals();

        ui.hideLoading();
        ui.showView('overview');

    } catch (error) {
        console.error('Failed to load data:', error);
        ui.hideLoading();

        // Redirect to login if not authenticated
        if (error.message.includes('401') || error.message.includes('Failed to fetch')) {
            window.location.href = '/';
        }
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme
    ui.initTheme();

    // Navigation
    document.querySelectorAll('.nav-item, .view-all').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            if (view) ui.showView(view);
        });
    });

    // Theme toggle
    if (elements.themeToggle) {
        elements.themeToggle.addEventListener('click', () => {
            ui.toggleTheme();
        });
    }

    // Refresh button
    if (elements.refreshBtn) {
        elements.refreshBtn.addEventListener('click', () => {
            state.commits = [];
            state.pullRequests = [];
            state.contributors.clear();
            loadData();
        });
    }

    // Add goal button
    if (elements.addGoalBtn) {
        elements.addGoalBtn.addEventListener('click', () => {
            ui.showAddGoalModal();
        });
    }

    // Modal close
    if (elements.closeCommitModal) {
        elements.closeCommitModal.addEventListener('click', () => {
            ui.hideCommitModal();
        });
    }

    // Close modal on overlay click
    if (elements.commitModal) {
        elements.commitModal.addEventListener('click', (e) => {
            if (e.target === elements.commitModal) {
                ui.hideCommitModal();
            }
        });
    }

    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.commitModal.classList.contains('active')) {
            ui.hideCommitModal();
        }
    });

    // Select all repos
    if (elements.selectAllRepos) {
        elements.selectAllRepos.addEventListener('click', () => {
            state.selectedRepos = state.allRepos.map(repo => repo.id);
            storage.saveSelectedRepos(state.selectedRepos);
            ui.renderRepoSelection();
            updateTrackedRepos();
        });
    }

    // Deselect all repos
    if (elements.deselectAllRepos) {
        elements.deselectAllRepos.addEventListener('click', () => {
            state.selectedRepos = [];
            storage.saveSelectedRepos(state.selectedRepos);
            ui.renderRepoSelection();
            updateTrackedRepos();
        });
    }

    // Load data
    loadData();
});
