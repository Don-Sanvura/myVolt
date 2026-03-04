// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    // ----- state -----
    let library = []; // each item: { id, title, desc, reviewed }

    // ----- DOM elements -----
    const titleInput = document.getElementById('titleInput');
    const descInput = document.getElementById('descInput');
    const addBtn = document.getElementById('addBtn');
    const libraryContainer = document.getElementById('libraryContainer');
    const statsDisplay = document.getElementById('statsDisplay');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const fileImport = document.getElementById('fileImport');
    const clearBtn = document.getElementById('clearBtn');

    // ----- helper: generate unique id -----
    function generateId() {
        return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    // ----- render library grid + stats -----
    function render() {
        if (!libraryContainer) return;

        if (library.length === 0) {
            libraryContainer.innerHTML = `<div class="empty-message">✨ your library is empty — add your first book or idea</div>`;
        } else {
            let html = '';
            library.forEach(item => {
                html += `
                    <div class="card" data-id="${item.id}">
                        <div class="card-title">${escapeHtml(item.title) || 'untitled'}</div>
                        <div class="card-desc">${escapeHtml(item.desc) || '—'}</div>
                        <div class="card-footer">
                            <button class="review-btn" data-id="${item.id}">${item.reviewed ? '★' : '☆'}</button>
                            <button class="delete-btn" data-id="${item.id}">✕ delete</button>
                        </div>
                    </div>
                `;
            });
            libraryContainer.innerHTML = html;
        }

        // update stats
        const total = library.length;
        const reviewed = library.filter(i => i.reviewed).length;
        statsDisplay.textContent = `📚 ${total} item${total !== 1 ? 's' : ''} · ${reviewed} reviewed`;
    }

    // simple escape to prevent XSS
    function escapeHtml(unsafe) {
        if (!unsafe) return unsafe;
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ----- add new item -----
    function addItem() {
        const title = titleInput.value.trim();
        const desc = descInput.value.trim();
        if (!title && !desc) {
            alert('please enter at least a title or a description');
            return;
        }
        const newItem = {
            id: generateId(),
            title: title || 'untitled',
            desc: desc || '',
            reviewed: false
        };
        library.push(newItem);
        render();
        // clear inputs
        titleInput.value = '';
        descInput.value = '';
        titleInput.focus();
    }

    // ----- delete item -----
    function deleteItem(id) {
        library = library.filter(item => item.id !== id);
        render();
    }

    // ----- toggle review status -----
    function toggleReview(id) {
        const item = library.find(i => i.id === id);
        if (item) {
            item.reviewed = !item.reviewed;
            render();
        }
    }

    // ----- event delegation for card buttons -----
    libraryContainer.addEventListener('click', (e) => {
        const reviewBtn = e.target.closest('.review-btn');
        const deleteBtn = e.target.closest('.delete-btn');

        if (reviewBtn) {
            const id = reviewBtn.getAttribute('data-id');
            toggleReview(id);
        } else if (deleteBtn) {
            const id = deleteBtn.getAttribute('data-id');
            if (confirm('remove this item from your library?')) {
                deleteItem(id);
            }
        }
    });

    // ----- add button -----
    addBtn.addEventListener('click', addItem);

    // allow enter key in inputs (but not required)
    titleInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addItem();
        }
    });
    descInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addItem();
        }
    });

    // ----- export / save library -----
    exportBtn.addEventListener('click', () => {
        const dataStr = JSON.stringify(library, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `myvolt_library_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // ----- import / load library -----
    importBtn.addEventListener('click', () => {
        fileImport.click();
    });

    fileImport.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const imported = JSON.parse(ev.target.result);
                if (Array.isArray(imported)) {
                    // validate basic structure (optional)
                    library = imported.map(item => ({
                        id: item.id || generateId(),
                        title: item.title || 'untitled',
                        desc: item.desc || '',
                        reviewed: !!item.reviewed
                    }));
                    render();
                } else {
                    alert('invalid file format: expected an array');
                }
            } catch (err) {
                alert('error reading file: invalid JSON');
            }
            fileImport.value = ''; // allow re-upload of same file
        };
        reader.readAsText(file);
    });

    // ----- clear all with confirmation -----
    clearBtn.addEventListener('click', () => {
        if (library.length === 0) return;
        if (confirm('permanently delete your entire library?')) {
            library = [];
            render();
        }
    });

    // ----- initial render (empty library) -----
    render();
});
