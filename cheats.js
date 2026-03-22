/* ================================================
   SCRIPT KITTENS — Free Cheats Vault JS v49
   Ultra-Premium · Hybrid Code Form · No Tilt
   Fixed Tabs & File Inputs
================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // Visual Effects
    initPreloader();
    initLenisScroll();
    initCursor();
    initPageTransition();
    initParticles();
    initAmbientGlitter();
    initFantasyEffects();

    // UI
    initHeaderScroll();
    initKeyboardShortcuts();
    initFullscreen();

    // Core
    initVaultCore();
});

// ============ CORE VAULT FUNCTIONALITY ============
function initVaultCore() {
    const state = {
        codes: [],
        projects: [],
        filter: 'all', // all, code, tool, project
        searchQuery: ''
    };

    const elements = {
        grid: document.getElementById('cheatsGrid'),
        tabs: document.querySelectorAll('.ck-tab'),
        searchInput: document.querySelector('.ck-search input')
    };

    // --- 1. Fetch Data ---
    async function fetchData() {
        try {
            const codesRes = await fetch(apiUrl('/api/codes'), { credentials: 'include' });
            const projectsRes = await fetch(apiUrl('/api/projects'), { credentials: 'include' });
            const codesData = await codesRes.json();
            const projectsData = await projectsRes.json();

            if (codesData.status === 'success') state.codes = codesData.codes;
            if (projectsData.status === 'success') state.projects = projectsData.projects;

            renderGrid();
        } catch (error) {
            console.error('Failed to load data:', error);
            elements.grid.innerHTML = `<div class="error-state">Failed to load data. Is backend running?</div>`;
        }
    }

    // --- 2. Render Grid ---
    function renderGrid() {
        elements.grid.innerHTML = '';
        let items = [];

        // Exclude codes from 'all' section per user request
        if (state.filter === 'all') items = [...state.projects];
        else if (state.filter === 'code') items = state.codes;
        else if (state.filter === 'tool') items = state.projects.filter(p => p.category === 'tool');
        else if (state.filter === 'project') items = state.projects.filter(p => p.category !== 'tool');

        // Toggle Grid Layout
        if (state.filter === 'code') {
            elements.grid.classList.add('grid-one-column');
        } else {
            elements.grid.classList.remove('grid-one-column');
        }

        if (state.searchQuery) {
            const q = state.searchQuery.toLowerCase();
            items = items.filter(item =>
                item.title.toLowerCase().includes(q) ||
                (item.description && item.description.toLowerCase().includes(q)) ||
                (item.tags && item.tags.some(t => t.toLowerCase().includes(q)))
            );
        }

        items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        if (items.length === 0) {
            elements.grid.innerHTML = `<div class="empty-state">No items found.</div>`;
            return;
        }

        items.forEach((item, index) => {
            elements.grid.appendChild(createCard(item));
        });

        if (typeof gsap !== 'undefined') {
            gsap.fromTo('.ck-card.reveal-new',
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: 'power2.out', clearProps: 'all' }
            );
        }
    }

    // --- 3. Create Card ---
    function createCard(item) {
        const div = document.createElement('div');
        const isProject = item.category === 'project' || item.category === 'tool';
        const isCode = item.category === 'codes';
        const hasSnippets = item.snippets && item.snippets.length > 0;

        div.className = `script-card ck-card reveal-new ${isCode ? 'code-type' : ''} ${hasSnippets ? 'hex-premium' : ''}`;

        let headerHtml = '';
        if (isProject && item.screenshots && item.screenshots.length > 0) {
            headerHtml = `<div class="card-image-container"><img src="${apiUrl('/uploads/' + item.screenshots[0])}" class="card-image" alt="${item.title}" onerror="this.parentElement.style.display='none'"></div>`;
        } else if (hasSnippets) {
            headerHtml = `<div class="code-card-header hex-header"><div class="ck-card-lang"><i class="fas fa-terminal"></i> CODE</div><div class="code-lang-tag premium-tag">PREMIUM</div></div>`;
        } else if (isCode) {
            headerHtml = `<div class="code-card-header"><div class="ck-card-lang"><i class="fas fa-code"></i> ${item.language || 'SCRIPT'}</div></div>`;
        }

        let bodyHtml = '';
        if (hasSnippets) {
            const snippetsHtml = item.snippets.map((snip, idx) => `
                <div class="hex-snippets-block">
                    ${(snip.search || snip.replace) ? `
                    <div class="hex-dual-row">
                        <div class="hex-field-half">
                            <span class="hex-lbl">SEARCH</span>
                            <div class="hex-val-box">${snip.search || '-'}</div>
                        </div>
                        <div class="hex-field-half">
                            <span class="hex-lbl">REPLACE</span>
                            <div class="hex-val-box">${snip.replace || '-'}</div>
                        </div>
                        <button class="hex-copy-mini" onclick="copyRawText('${snip.search}\\n${snip.replace}')"><i class="fas fa-copy"></i></button>
                    </div>` : ''}
                    
                    ${snip.content ? `
                    <div class="hex-content-row">
                        <div class="hex-input-wrapper big-code-wrapper">
                            <textarea readonly class="hex-input big-code-area" id="code-${item.id}-${idx}">${snip.content}</textarea>
                            <button class="hex-copy-btn big-copy-btn" onclick="copyRawText(document.getElementById('code-${item.id}-${idx}').value)"><i class="fas fa-copy"></i></button>
                        </div>
                    </div>` : ''}
                </div>
            `).join('');
            bodyHtml = `<div class="hex-snippets-container">${snippetsHtml}</div>`;
        } else if (isCode) {
            bodyHtml = `<div class="code-preview">${item.description || '// No content'}</div>`;
        } else {
            bodyHtml = `<p>${item.description || 'No description provided.'}</p>`;
        }

        const tagsHtml = (item.tags && item.tags.length > 0) ?
            `<div class="ck-tags">${item.tags.slice(0, 3).map(t => `<span class="ck-tag"><i class="fas fa-tag"></i> ${t}</span>`).join('')}</div>` : '';

        div.innerHTML = `
            <button class="delete-btn" onclick="deleteItem('${item.id}', this.closest('.script-card'))"><i class="fas fa-trash"></i></button>
            ${headerHtml}
            <div style="padding: 16px;">
                ${!isCode || hasSnippets ? `<h3>${item.title}</h3>` : ''}
                ${isCode && !hasSnippets ? `<h3 style="margin-top:0">${item.title}</h3>` : ''}
                ${!isCode && !hasSnippets && !headerHtml ? '<div class="ck-project-preview"><i class="fas fa-layer-group"></i> <span>Project</span></div>' : ''}
                ${bodyHtml}
                ${tagsHtml}
                <div class="ck-card-meta">
                    <div class="ck-author"><div class="ck-avatar">${item.author.substring(0, 2).toUpperCase()}</div><div><div class="ck-author-name">${item.author}</div><div class="ck-author-role">Uploader</div></div></div>
                    ${!hasSnippets ? `<div class="ck-stats"><span class="ck-stat"><i class="fas fa-download"></i> ${item.download_count}</span></div>` : ''}
                </div>
                ${!hasSnippets ? `<div class="ck-card-actions"><button class="ck-dl-btn" onclick="triggerDownload('${item.id}', '${item.category}')"><i class="fas fa-download"></i> Download</button></div>` : ''}
            </div>
        `;
        return div;
    }

    // --- 4. Init Forms ---
    initUploadForms(fetchData);

    // --- 5. Filters ---
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.filter = tab.dataset.filter || 'all';
            renderGrid();
        });
    });

    let searchTimeout;
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                state.searchQuery = e.target.value.trim();
                renderGrid();
            }, 300);
        });
    }

    // Hybrid Mode Injection
    const codeContainer = document.getElementById('codeCardsContainer');
    const addCodeBtn = document.getElementById('addCodeCardBtn');
    if (codeContainer) {
        codeContainer.innerHTML = `
            <div class="publish-simple-fields premium-form-layout">
                <!-- Type 1: Search / Replace -->
                <div class="publish-section-label cool-heading"><i class="fas fa-microchip"></i> HEX TRANSFORMATION SYSTEM</div>
                <div class="publish-vertical-fields">
                    <div class="publish-hex-field cool-input-group">
                        <div class="input-header">
                            <span class="hex-label">SEARCH VALUE</span>
                            <span class="input-hint">HEX BYTES</span>
                        </div>
                        <textarea id="codeSearchInput" class="hex-input-line cool-textarea" placeholder="FF FF 00 00..." spellcheck="false"></textarea>
                    </div>
                    <div class="publish-hex-field cool-input-group" style="margin-top: 25px;">
                        <div class="input-header">
                            <span class="hex-label">REPLACE VALUE</span>
                            <span class="input-hint">HEX BYTES</span>
                        </div>
                        <textarea id="codeReplaceInput" class="hex-input-line cool-textarea accent-input" placeholder="00 00 FF FF..." spellcheck="false"></textarea>
                    </div>
                </div>

                <!-- Type 2: Offsets / Script -->
                <div class="publish-section-label cool-heading" style="margin-top: 40px;"><i class="fas fa-terminal"></i> SCRIPT ENGINE / OFFSET DATA</div>
                <div class="publish-hex-field cool-input-group">
                    <div class="input-header">
                        <span class="hex-label">SOURCE CONTENT</span>
                        <span class="input-hint">RAW DATA</span>
                    </div>
                    <textarea id="simpleCodeContent" class="code-textarea cool-textarea script-input" placeholder="Paste your script, offsets, or file content here..." spellcheck="false"></textarea>
                </div>
            </div>
        `;
        if (addCodeBtn) addCodeBtn.style.display = 'none';
        const cardsSection = codeContainer.closest('.publish-cards-section');
        if (cardsSection) cardsSection.style.border = 'none';
    }

    // Initial Load
    fetchData();
}

// ... (initUploadForms remains mostly same, just ensuring correct Input IDs are read) ...

// ============ CREATE CARD (UPDATED) ============
function createCard(item) {
    const div = document.createElement('div');
    const isProject = item.category === 'project' || item.category === 'tool';
    const isCode = item.category === 'codes';
    const hasSnippets = item.snippets && item.snippets.length > 0;

    div.className = `script-card ck-card reveal-new ${isCode ? 'code-type' : ''} ${hasSnippets ? 'hex-premium' : ''}`;

    let headerHtml = '';
    // Project Image
    if (isProject && item.screenshots && item.screenshots.length > 0) {
        headerHtml = `<div class="card-image-container"><img src="${apiUrl('/uploads/' + item.screenshots[0])}" class="card-image" alt="${item.title}" onerror="this.parentElement.style.display='none'"></div>`;
    }
    // Code Header (Premium Style)
    else if (isCode || hasSnippets) {
        headerHtml = `
                <div class="code-card-header hex-header">
                    <div class="ck-card-lang"><i class="fas fa-terminal"></i> VAULT CODE</div>
                    <div class="code-lang-tag premium-tag">PREMIUM</div>
                </div>
            `;
    }

    let bodyHtml = '';
    if (hasSnippets) {
        const snippetsHtml = item.snippets.map((snip, idx) => {
            const hasSearchReplace = (snip.search && snip.search.trim()) || (snip.replace && snip.replace.trim());
            const hasContent = snip.content && snip.content.trim();

            let innerHtml = '';

            if (hasSearchReplace) {
                searchHtml = `
                        <div class="code-output-section">
                            <span class="code-output-label">SEARCH</span>
                            <div class="code-output-box">${snip.search || '-'}</div>
                        </div>
                    `;
                replaceHtml = `
                        <div class="code-output-section">
                            <span class="code-output-label">REPLACE</span>
                            <div class="code-output-box accent-text">${snip.replace || '-'}</div>
                        </div>
                        <button class="code-copy-btn" title="Copy Search & Replace" onclick="copyRawText('${snip.search}\\n${snip.replace}')">
                            <i class="fas fa-copy"></i>
                        </button>
                    `;
            }

            if (hasContent) {
                contentHtml = `
                        <div class="code-output-section full">
                            <span class="code-output-label">SCRIPT / CONTENT</span>
                            <div class="code-output-box code-content-box">${snip.content}</div>
                            <button class="code-copy-btn" title="Copy Content" onclick="copyRawText(this.previousElementSibling.innerText)">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    `;
            }

            return `<div class="hex-snippet-wrapper">
                    <div class="professional-vertical-stack">
                        ${searchHtml}
                        ${replaceHtml}
                        ${contentHtml}
                    </div>
                </div>`;
        }).join('');
        bodyHtml = `<div class="hex-snippets-container">${snippetsHtml}</div>`;
    } else if (isCode) {
        bodyHtml = `<div class="code-preview">${item.description || '// No content'}</div>`;
    } else {
        bodyHtml = `<p>${item.description || 'No description provided.'}</p>`;
    }

    const tagsHtml = (item.tags && item.tags.length > 0) ?
        `<div class="ck-tags">${item.tags.slice(0, 3).map(t => `<span class="ck-tag"><i class="fas fa-tag"></i> ${t}</span>`).join('')}</div>` : '';

    // Author/Meta Footer
    const footerHtml = `
            <div class="ck-card-meta">
                <div class="ck-author">
                    <div class="ck-avatar">${item.author.substring(0, 2).toUpperCase()}</div>
                    <div>
                        <div class="ck-author-name">${item.author}</div>
                        <div class="ck-author-role">Verified Uploader</div>
                    </div>
                </div>
                ${!hasSnippets ? `<div class="ck-stats"><span class="ck-stat"><i class="fas fa-download"></i> ${item.download_count}</span></div>` : ''}
            </div>
            ${!hasSnippets ? `<div class="ck-card-actions"><button class="ck-dl-btn" onclick="triggerDownload('${item.id}', '${item.category}')"><i class="fas fa-download"></i> Download</button></div>` : ''}
        `;

    div.innerHTML = `
            <button class="delete-btn" onclick="deleteItem('${item.id}', this.closest('.script-card'))"><i class="fas fa-trash"></i></button>
            ${headerHtml}
            <div style="padding: 24px;">
                <h2 style="margin-bottom:6px; letter-spacing:-0.5px">${item.title}</h2>
                <div class="ck-date" style="font-size:11px; color:rgba(255,255,255,0.4); margin-bottom:20px; text-transform:uppercase; letter-spacing:1px">${new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                ${!isCode && !hasSnippets && !headerHtml ? '<div class="ck-project-preview"><i class="fas fa-layer-group"></i> <span>Project</span></div>' : ''}
                ${bodyHtml}
                ${tagsHtml}
                ${footerHtml}
            </div>
        `;
    return div;
}

function initUploadForms(onSuccessCallback) {
    // 1. Tabs - Using .publish-tab and .publish-panel
    const uploadTabs = document.querySelectorAll('.publish-tab');
    const uploadPanels = document.querySelectorAll('.publish-panel');
    uploadTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            uploadTabs.forEach(t => t.classList.remove('active'));
            uploadPanels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const panel = document.querySelector(`.publish-panel[data-panel="${target}"]`);
            if (panel) panel.classList.add('active');
        });
    });

    // 2. Image Previews & File Inputs
    const inputsToBind = [
        { id: 'projectImageInput', isImage: true },
        { id: 'toolImageInput', isImage: true },
        { id: 'projectFileInput', isImage: false },
        { id: 'toolFileInput', isImage: false }
    ];

    inputsToBind.forEach(item => {
        const input = document.getElementById(item.id);
        if (!input) return;

        const box = input.closest('.publish-file-box');
        const placeholder = box ? box.querySelector('.publish-file-placeholder') : null;

        input.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0] && placeholder) {
                const file = e.target.files[0];
                if (item.isImage) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        placeholder.classList.add('has-image');
                        placeholder.innerHTML = `<img src="${ev.target.result}">`;
                    };
                    reader.readAsDataURL(file);
                } else {
                    placeholder.classList.add('has-file');
                    placeholder.innerHTML = `<i class="fas fa-check"></i> <span>${file.name}</span>`;
                }
            }
        });
    });

    // 3. Submissions
    const projForm = document.getElementById('projectForm');
    if (projForm) {
        projForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitFileForm(projForm, 'project', onSuccessCallback);
        });
    }

    const toolForm = document.getElementById('toolForm');
    if (toolForm) {
        toolForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitFileForm(toolForm, 'tool', onSuccessCallback);
        });
    }

    const codeForm = document.getElementById('codeForm');
    if (codeForm) {
        codeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = codeForm.querySelector('.publish-btn');
            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> ...';

            const name = document.getElementById('codeNameInput').value.trim();
            const search = document.getElementById('codeSearchInput').value;
            const replace = document.getElementById('codeReplaceInput').value;
            const content = document.getElementById('simpleCodeContent').value;

            if (!name) { alert('Name required'); btn.innerHTML = originalHtml; return; }

            const codeData = [{
                label: 'Code',
                search: search,
                replace: replace,
                content: content
            }];

            try {
                const res = await fetch(apiUrl('/api/upload'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ title: name, category: 'codes', codes: codeData })
                });
                const data = await res.json();
                if (data.success || data.status === 'success') {
                    // Success Animation
                    btn.classList.add('success');
                    btn.innerHTML = '<i class="fas fa-check"></i> Published';

                    showToast('Code Successfully Published!', 'success');

                    setTimeout(() => {
                        codeForm.reset();
                        document.getElementById('simpleCodeContent').value = '';
                        document.getElementById('codeSearchInput').value = '';
                        document.getElementById('codeReplaceInput').value = '';
                        btn.classList.remove('success');
                        btn.innerHTML = originalHtml;
                        onSuccessCallback();
                    }, 2000);
                } else {
                    alert('Error: ' + data.message);
                    btn.innerHTML = originalHtml;
                }
            } catch (err) {
                alert('Net Error');
                btn.innerHTML = originalHtml;
            }
        });
    }
}

async function submitFileForm(form, type, onSuccess) {
    const btn = form.querySelector('.publish-btn');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> ...';

    const formData = new FormData();
    const title = form.querySelector('input[name="title"]').value;
    const author = form.querySelector('input[name="author"]').value;
    const desc = form.querySelector('textarea').value;

    formData.append('title', title);
    formData.append('author', author);
    formData.append('description', desc);

    const catSelect = form.querySelector('select[name="category"]');
    if (catSelect) {
        formData.append('category', catSelect.value);
    } else {
        formData.append('category', type);
    }

    const fileInput = form.querySelector('input[type="file"]:not([accept*="image"])');
    if (fileInput && fileInput.files[0]) formData.append('file', fileInput.files[0]);

    const imgInput = form.querySelector('input[type="file"][accept*="image"]');
    if (imgInput && imgInput.files[0]) formData.append('image', imgInput.files[0]);

    try {
        const res = await fetch(apiUrl('/api/upload'), { method: 'POST', credentials: 'include', body: formData });
        const data = await res.json();
        if (data.success || data.status === 'success') {
            showToast('Published!', 'success');
            form.reset();
            form.querySelectorAll('.has-image').forEach(el => {
                el.classList.remove('has-image');
                el.innerHTML = '<i class="fas fa-image"></i><span>Click to upload image</span>';
            });
            form.querySelectorAll('.has-file').forEach(el => {
                el.classList.remove('has-file');
                el.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span>Drop file here</span>';
            });
            btn.innerHTML = originalHtml;
            onSuccess();
        } else {
            alert('Error: ' + data.message);
            btn.innerHTML = originalHtml;
        }
    } catch (err) {
        alert('Net Error');
        btn.innerHTML = originalHtml;
    }
}

// ============ HELPERS ============
window.deleteItem = async (id, el) => {
    if (!confirm('Delete?')) return;
    try {
        await fetch(apiUrl(`/api/delete/${id}`), { method: 'DELETE', credentials: 'include' });
        el.remove();
        showToast('Deleted', 'success');
    } catch (e) { alert('Error'); }
};

window.triggerDownload = (id, type) => {
    window.location.href = apiUrl(`/api/download/${id}/${type}`);
};

window.copyRawText = (text) => {
    navigator.clipboard.writeText(text).then(() => showToast('Copied!', 'success'));
};

function showToast(msg, type = 'info') {
    let c = document.querySelector('.ck-toast-container');
    if (!c) {
        c = document.createElement('div');
        c.className = 'ck-toast-container';
        document.body.appendChild(c);
    }

    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };

    const t = document.createElement('div');
    t.className = `ck-toast ${type}`;
    t.innerHTML = `
        <i class="${icons[type] || icons.info}"></i>
        <span>${msg}</span>
    `;
    c.appendChild(t);

    // Auto-remove after animation
    setTimeout(() => {
        t.style.animation = 'toastSlideOut 0.5s cubic-bezier(0.19, 1, 0.22, 1) forwards';
        setTimeout(() => t.remove(), 500);
    }, 3000);
}


// ============ EFFECTS ============
function initPreloader() { const p = document.getElementById('preloader'); if (p) setTimeout(() => { p.style.opacity = 0; setTimeout(() => p.remove(), 500); }, 1000); }
function initLenisScroll() { if (typeof Lenis !== 'undefined') { const l = new Lenis({ smooth: true }); function raf(t) { l.raf(t); requestAnimationFrame(raf); } requestAnimationFrame(raf); } }
function initCursor() { }
function initPageTransition() { gsap.to('.reveal', { opacity: 1, y: 0, stagger: 0.1 }); }
function initParticles() { }
function initAmbientGlitter() { }
function initFantasyEffects() { }
function initHeaderScroll() { const h = document.querySelector('.ck-header'); window.addEventListener('scroll', () => { if (window.scrollY > 50) h.classList.add('scrolled'); else h.classList.remove('scrolled'); }); }
function initKeyboardShortcuts() { }
function initFullscreen() { }
