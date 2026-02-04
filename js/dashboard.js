/**
 * CodePulse - Dashboard JavaScript
 * Handles dashboard functionality, API calls, and UI updates
 */

// State
const state = {
    user: null,
    repos: [],
    commits: [],
    contributors: new Map(),
    currentView: 'overview'
};

// DOM Elements
const elements = {
    loadingState: document.getElementById('loadingState'),
    overviewView: document.getElementById('overviewView'),
    reposView: document.getElementById('reposView'),
    teamView: document.getElementById('teamView'),
    commitsView: document.getElementById('commitsView'),
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

    // Header
    pageTitle: document.getElementById('pageTitle'),
    pageSubtitle: document.getElementById('pageSubtitle'),
    refreshBtn: document.getElementById('refreshBtn')
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

    async getContributors(repo, owner) {
        const response = await fetch(`/api/contributors?repo=${repo}&owner=${owner}`);
        if (!response.ok) return [];
        return response.json();
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
            repos: { title: 'Repositories', subtitle: 'All your GitHub repositories' },
            team: { title: 'Team', subtitle: 'Contributors across your repositories' },
            commits: { title: 'Commits', subtitle: 'Recent commit activity' }
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
            let repoScore = 70; // Base score

            // Bonus for description
            if (repo.description) repoScore += 10;

            // Bonus for recent activity
            const lastPush = new Date(repo.pushed_at);
            const daysSincePush = (Date.now() - lastPush) / (1000 * 60 * 60 * 24);
            if (daysSincePush < 7) repoScore += 15;
            else if (daysSincePush < 30) repoScore += 10;
            else if (daysSincePush < 90) repoScore += 5;

            // Bonus for stars
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
            <div class="activity-item">
                <img src="${commit.author?.avatar_url || 'https://github.com/ghost.png'}" 
                     alt="${commit.author?.login || 'Unknown'}" 
                     class="activity-avatar">
                <div class="activity-content">
                    <p class="activity-title">
                        <strong>${commit.author?.login || 'Unknown'}</strong> 
                        committed to <strong>${commit.repo}</strong>
                    </p>
                    <div class="activity-meta">
                        <span>${commit.commit.message.split('\n')[0].substring(0, 50)}...</span>
                        <span>${this.formatDate(commit.commit.author.date)}</span>
                    </div>
                </div>
                <span class="activity-badge ${this.getQualityClass(commit)}">${this.getQualityLabel(commit)}</span>
            </div>
        `).join('');
    },

    renderRepos(container, repos) {
        if (repos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📂</div>
                    <h3>No repositories found</h3>
                    <p>Create a repository on GitHub to get started.</p>
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
            <div class="commit-item">
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
    },

    getQualityClass(commit) {
        const message = commit.commit.message;
        const length = message.length;

        // Simple quality heuristics
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
    }
};

// Data Loading
async function loadData() {
    ui.showLoading();

    try {
        // Load user
        state.user = await api.getUser();
        ui.updateUserInfo(state.user);

        // Load repos
        state.repos = await api.getRepos();

        // Load commits and contributors for each repo
        const topRepos = state.repos.slice(0, 5);

        for (const repo of topRepos) {
            try {
                const commits = await api.getCommits(repo.name, repo.owner.login);
                commits.forEach(commit => {
                    commit.repo = repo.name;
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
        }

        // Sort commits by date
        state.commits.sort((a, b) =>
            new Date(b.commit.author.date) - new Date(a.commit.author.date)
        );

        // Update UI
        ui.updateStats();
        ui.renderActivityList();
        ui.renderRepos(elements.topRepos, state.repos.slice(0, 4));
        ui.renderRepos(elements.allRepos, state.repos);
        ui.renderTeam();
        ui.renderCommits();

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
    // Navigation
    document.querySelectorAll('.nav-item, .view-all').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            if (view) ui.showView(view);
        });
    });

    // Refresh button
    if (elements.refreshBtn) {
        elements.refreshBtn.addEventListener('click', () => {
            state.commits = [];
            state.contributors.clear();
            loadData();
        });
    }

    // Load data
    loadData();
});
