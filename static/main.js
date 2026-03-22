/**
 * TSun SPAM API - Main Application Script
 * Handles form submission, API interactions, and tab navigation
 */

// DOM Elements
const elements = {
    form: null,
    uidInput: null,
    serverInput: null,
    serverButtons: null,
    submitBtn: null,
    responsePanel: null,
    statusBadge: null,
    responseData: null,
    responseCards: null,
    responseBody: null,
    jsonToggle: null,
    navTabs: null,
    tabContents: null
};

// Initialize application
function init() {
    cacheElements();
    bindEvents();
}

// Cache DOM elements
function cacheElements() {
    elements.form = document.getElementById('apiForm');
    elements.uidInput = document.getElementById('uid');
    elements.serverInput = document.getElementById('server');
    elements.serverButtons = document.querySelectorAll('.server-btn');
    elements.submitBtn = document.getElementById('submitBtn');
    elements.responsePanel = document.getElementById('responsePanel');
    elements.statusBadge = document.getElementById('statusBadge');
    elements.responseData = document.getElementById('responseData');
    elements.responseCards = document.getElementById('responseCards');
    elements.responseBody = document.getElementById('responseBody');
    elements.jsonToggle = document.getElementById('jsonToggle');
    elements.navTabs = document.querySelectorAll('.nav-tab');
    elements.tabContents = document.querySelectorAll('.tab-content');
}

// Bind event listeners
function bindEvents() {
    if (elements.form) {
        elements.form.addEventListener('submit', handleSubmit);
    }

    elements.navTabs.forEach(tab => {
        tab.addEventListener('click', handleTabClick);
    });

    elements.serverButtons.forEach(btn => {
        btn.addEventListener('click', handleServerSelect);
    });

    if (elements.jsonToggle) {
        elements.jsonToggle.addEventListener('click', toggleJsonView);
    }
}

// Handle server selection
function handleServerSelect(e) {
    const selectedServer = e.currentTarget.getAttribute('data-server');
    
    // Remove active class from all buttons
    elements.serverButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    e.currentTarget.classList.add('active');
    
    // Update hidden input value
    elements.serverInput.value = selectedServer;
}

// Handle tab navigation
function handleTabClick(e) {
    const targetTab = e.currentTarget.getAttribute('data-tab');

    // Update active tab button
    elements.navTabs.forEach(tab => {
        tab.classList.remove('active');
    });
    e.currentTarget.classList.add('active');

    // Show corresponding content
    elements.tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === targetTab) {
            content.classList.add('active');
        }
    });
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();

    const uid = elements.uidInput.value.trim();
    const server = elements.serverInput.value;
    
    if (!uid || !server) return;

    setLoadingState(true);
    hideResponse();

    try {
        const response = await sendRequest(uid, server);
        displayResponse(response);
    } catch (error) {
        displayError(error);
    } finally {
        setLoadingState(false);
    }
}

// Send API request
async function sendRequest(uid, server) {
    const response = await fetch(`/send_request-dev?uid=${encodeURIComponent(uid)}&server=${encodeURIComponent(server)}`);
    const data = await response.json();

    return {
        ok: response.ok,
        status: response.status,
        data: data
    };
}

// Display response data
function displayResponse(response) {
    const formattedJson = JSON.stringify(response.data, null, 2);
    elements.responseData.textContent = formattedJson;

    if (response.ok) {
        elements.statusBadge.textContent = `${response.status} OK`;
        elements.statusBadge.className = 'status-badge success';
        renderResponseCards(response.data);
    } else {
        elements.statusBadge.textContent = `${response.status} ERROR`;
        elements.statusBadge.className = 'status-badge error';
        renderErrorCards(response.data);
    }

    showResponse();
}

// Render response cards
function renderResponseCards(data) {
    const total = (data.Success || 0) + (data.Failed || 0);
    const successRate = total > 0 ? ((data.Success || 0) / total * 100).toFixed(1) : 0;
    
    const cardsHTML = `
        <div class="response-card player-card">
            <span class="response-card-icon">👤</span>
            <div class="response-card-label">Player Info</div>
            <div class="response-card-value">${data.PlayerName || 'Unknown'}</div>
            <div class="response-card-subtitle">UID: ${data.UID || 'N/A'} • Server: ${data.Server || 'N/A'}</div>
        </div>
        
        <div class="response-card success-card">
            <span class="response-card-icon">✅</span>
            <div class="response-card-label">Successful</div>
            <div class="response-card-value">${data.Success || 0}</div>
            <div class="response-card-subtitle">${successRate}% success rate</div>
        </div>
        
        <div class="response-card failed-card">
            <span class="response-card-icon">❌</span>
            <div class="response-card-label">Failed</div>
            <div class="response-card-value">${data.Failed || 0}</div>
            <div class="response-card-subtitle">${total} total requests</div>
        </div>
    `;
    
    elements.responseCards.innerHTML = cardsHTML;
}

// Render error cards
function renderErrorCards(data) {
    const errorHTML = `
        <div class="response-card failed-card">
            <span class="response-card-icon">⚠️</span>
            <div class="response-card-label">Error</div>
            <div class="response-card-value">Failed</div>
            <div class="response-card-subtitle">${data.error || 'Unknown error occurred'}</div>
        </div>
    `;
    
    elements.responseCards.innerHTML = errorHTML;
}

// Toggle JSON view
function toggleJsonView() {
    elements.responseBody.classList.toggle('visible');
    elements.jsonToggle.classList.toggle('expanded');
}

// Display error message
function displayError(error) {
    elements.responseData.textContent = `Error: ${error.message}`;
    elements.statusBadge.textContent = 'FAILED';
    elements.statusBadge.className = 'status-badge error';
    showResponse();
}

// Set loading state
function setLoadingState(isLoading) {
    elements.submitBtn.disabled = isLoading;

    if (isLoading) {
        elements.submitBtn.classList.add('loading');
    } else {
        elements.submitBtn.classList.remove('loading');
    }
}

// Show response panel
function showResponse() {
    elements.responsePanel.classList.add('visible');
}

// Hide response panel
function hideResponse() {
    elements.responsePanel.classList.remove('visible');
    elements.responseBody.classList.remove('visible');
    elements.jsonToggle.classList.remove('expanded');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
