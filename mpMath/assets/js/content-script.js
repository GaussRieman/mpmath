// 当前编辑对象和是否在编辑模式
var editing = null;
var editingMode = false;
var cachedMainRange = null;

function getPopup() {
    return document.getElementById('popup');
}

function getEditorFrame() {
    var direct = document.getElementById('ueditor_0');
    if (direct && direct.tagName === 'IFRAME') return direct;

    var candidates = document.querySelectorAll(
        'iframe[id^="ueditor_"], iframe[id*="ueditor"], iframe.editor_iframe, .editor_iframe iframe'
    );
    for (var i = 0; i < candidates.length; i += 1) {
        var frame = candidates[i];
        if (!frame || frame.tagName !== 'IFRAME') continue;
        try {
            if (frame.contentDocument || frame.contentWindow) return frame;
        } catch (e) {
            // ignore cross-origin frame
        }
    }
    return null;
}

function getEditorView() {
    var editorFrame = getEditorFrame();
    if (editorFrame && editorFrame.contentDocument) {
        var frameDoc = editorFrame.contentDocument;
        var frameView = frameDoc.querySelector('.view, [contenteditable="true"], .editable, body');
        if (frameView) return frameView;
    }

    // fallback: some editor versions may not use iframe
    return document.querySelector(
        '#js_editor [contenteditable="true"], .ql-editor, .ProseMirror, .editor_content [contenteditable="true"], [contenteditable="true"]'
    );
}

function closestEditable(node) {
    var current = node;
    while (current && current !== document.body) {
        if (current.nodeType === 1 && current.getAttribute('contenteditable') === 'true') return current;
        current = current.parentNode;
    }
    return null;
}

function cacheMainSelection() {
    var sel = window.getSelection ? window.getSelection() : null;
    if (!sel || sel.rangeCount === 0) return;
    var range = sel.getRangeAt(0);
    if (closestEditable(range.startContainer)) {
        cachedMainRange = range.cloneRange();
    }
}

function formulaClick(event) {
    cacheMainSelection();

    var popup = getPopup();
    if (!popup) return;

    popup.style.display = 'block';
    popup.contentWindow.postMessage({ type: 'CHANGE_INPUT', text: '' }, '*');
    popup.focus();
    $('.tpl_dropdown_menu', '.formula').css('display', 'none');
    if (event) event.stopPropagation();
}

function fixClick(event) {
    revise();
    $('.tpl_dropdown_menu', '.formula').css('display', 'none');
    if (event) event.stopPropagation();
}

function guideClick(event) {
    alert('指南还在施工!');
    $('.tpl_dropdown_menu', '.formula').css('display', 'none');
    if (event) event.stopPropagation();
}

function ensurePopup() {
    if (getPopup()) return;

    var iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('./pages/popup.html');
    iframe.className = 'mpm-modal';
    iframe.frameBorder = 0;
    iframe.allowTransparency = true;
    iframe.id = 'popup';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
}

function getToolbar() {
    var candidates = [
        '#js_media_list',
        '.editor_toolbar ul',
        '.rich_media_tool_bar ul',
        '.weui-desktop-toolbar ul'
    ];

    for (var i = 0; i < candidates.length; i += 1) {
        var target = document.querySelector(candidates[i]);
        if (target) return target;
    }

    return null;
}

function insertFormulaAtCursor(html) {
    var editorFrame = getEditorFrame();
    var view = getEditorView();
    if (!view) return false;

    var editorWin = (editorFrame && editorFrame.contentWindow) ? editorFrame.contentWindow : window;
    var editorDoc = (editorFrame && editorFrame.contentDocument) ? editorFrame.contentDocument : document;
    var insertHTML = '\u00A0' + html + '\u00A0';

    if (editorWin && editorWin.focus) editorWin.focus();
    view.focus();

    if (!editorFrame && editorDoc.execCommand) {
        var mainSel = window.getSelection ? window.getSelection() : null;
        if (mainSel && cachedMainRange) {
            mainSel.removeAllRanges();
            mainSel.addRange(cachedMainRange.cloneRange());
        }
        var inserted = editorDoc.execCommand('insertHTML', false, insertHTML);
        if (inserted) {
            view.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
        }
    }

    var selection = editorWin.getSelection ? editorWin.getSelection() : null;
    if (!selection || selection.rangeCount === 0) {
        view.insertAdjacentHTML('beforeend', insertHTML);
        view.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
    }

    var range = selection.getRangeAt(0);
    if (!view.contains(range.startContainer)) {
        view.insertAdjacentHTML('beforeend', insertHTML);
        view.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
    }

    range.deleteContents();
    var container = editorDoc.createElement('span');
    container.innerHTML = insertHTML;
    var frag = editorDoc.createDocumentFragment();
    while (container.firstChild) {
        frag.appendChild(container.firstChild);
    }
    range.insertNode(frag);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    view.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
}

function forceAppendFormula(html) {
    var view = getEditorView() || closestEditable(document.activeElement);
    if (!view) return false;
    view.insertAdjacentHTML('beforeend', '\u00A0' + html + '\u00A0');
    view.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
}

function handleFormulaMessage(data) {
    if (!data || !data.type) return;
    var popup = getPopup();
    if (!popup) return;

    if (data.type === 'CLOSE_FORMULA') {
        popup.style.display = 'none';
        editingMode = false;
        var editorFrame = getEditorFrame();
        if (editorFrame) {
            setTimeout(function () {
                editorFrame.focus();
            }, 10);
        }
        return;
    }

    if (data.type === 'INSERT_FORMULA') {
        if (editingMode === true && editing) {
            var beg = data.text.indexOf('>') + 1;
            var end = data.text.lastIndexOf('<') - 1;
            editing.innerHTML = data.text.substring(beg, end);
            editingMode = false;
            return;
        }

        var ok = insertFormulaAtCursor(data.text);
        if (!ok) ok = forceAppendFormula(data.text);
        if (!ok) console.warn('[mpMath] INSERT_FORMULA failed: editor target not found');
    }
}

function handlePopupMessage(event) {
    if (!event || !event.data) return;
    handleFormulaMessage(event.data);
}

function bindFormulaEditClick() {
    var editorFrame = getEditorFrame();
    if (!editorFrame || editorFrame.dataset.mpmEditBound === '1') return;

    var bindView = function () {
        var view = getEditorView();
        if (!view || view.dataset.mpmEditBound === '1') return;

        $(view).on('click', '[data-formula], span:has([data-formula])', function () {
            var popup = getPopup();
            if (!popup) return;

            var formulaNode = this;
            if (!$(formulaNode).attr('data-formula')) {
                formulaNode = $(formulaNode).find('[data-formula]')[0];
            }
            if (!formulaNode) return;

            popup.style.display = 'block';
            popup.contentWindow.postMessage(
                {
                    type: 'CHANGE_INPUT',
                    text: $(formulaNode).attr('data-formula'),
                    isBlock: $(formulaNode).attr('display')
                },
                '*'
            );
            setTimeout(function () {
                popup.focus();
            }, 10);
            editing = formulaNode.parentElement;
            editingMode = true;
        });

        view.dataset.mpmEditBound = '1';
    };

    editorFrame.addEventListener('load', bindView);
    editorFrame.dataset.mpmEditBound = '1';
    bindView();
}

function bindHotkey() {
    var editorFrame = getEditorFrame();
    if (!editorFrame || editorFrame.dataset.mpmHotkeyBound === '1') return;

    var bindView = function () {
        var view = getEditorView();
        if (!view || view.dataset.mpmHotkeyBound === '1') return;

        view.addEventListener('keydown', function (event) {
            var keyCode = event.keyCode || event.which || event.charCode;
            var ctrlKey = event.ctrlKey || event.metaKey;
            if (ctrlKey && keyCode === 191) {
                formulaClick();
            }
        });
        view.dataset.mpmHotkeyBound = '1';
    };

    editorFrame.addEventListener('load', bindView);
    editorFrame.dataset.mpmHotkeyBound = '1';
    bindView();
}

function ensureFormulaMenu() {
    var toolbar = getToolbar();
    if (!toolbar || document.getElementById('js_editor_insert_formula')) return;

    ensurePopup();

    var formulaMenu = document.createElement('li');
    formulaMenu.className = 'tpl_item tpl_item_dropdown jsInsertIcon formula';
    formulaMenu.id = 'js_editor_insert_formula';
    formulaMenu.innerHTML = '<span>公式</span>';

    var dropdownMenu = document.createElement('ul');
    dropdownMenu.className = 'tpl_dropdown_menu';
    dropdownMenu.style.display = 'none';

    var formulaInsertItem = document.createElement('li');
    formulaInsertItem.className = 'tpl_dropdown_menu_item';
    formulaInsertItem.innerText = '插入公式 ⌘/';
    formulaInsertItem.onclick = formulaClick;
    dropdownMenu.appendChild(formulaInsertItem);

    var formulaFixItem = document.createElement('li');
    formulaFixItem.className = 'tpl_dropdown_menu_item';
    formulaFixItem.innerText = '修复SVG';
    formulaFixItem.onclick = fixClick;
    dropdownMenu.appendChild(formulaFixItem);

    var formulaGuide = document.createElement('li');
    formulaGuide.className = 'tpl_dropdown_menu_item';
    formulaGuide.innerText = '指南';
    formulaGuide.onclick = guideClick;
    dropdownMenu.appendChild(formulaGuide);

    formulaMenu.appendChild(dropdownMenu);

    $(document).off('click.mpmMenu').on('click.mpmMenu', function (event) {
        if ($(event.target).closest(formulaMenu).length) {
            $(dropdownMenu).css('display', 'block');
        } else {
            $(dropdownMenu).css('display', 'none');
        }
    });

    toolbar.appendChild(formulaMenu);
}

function bootstrap() {
    ensureFormulaMenu();
    bindFormulaEditClick();
    bindHotkey();
}

window.addEventListener('message', handlePopupMessage);
bootstrap();

var maxBootstrapChecks = 80;
var bootstrapChecks = 0;
var bootstrapTimer = null;
var observer = new MutationObserver(function () {
    if (bootstrapTimer) return;
    bootstrapTimer = setTimeout(function () {
        bootstrapTimer = null;
        bootstrap();
        bootstrapChecks += 1;

        var editorFrame = getEditorFrame();
        var ready = Boolean(
            getPopup() &&
            document.getElementById('js_editor_insert_formula') &&
            editorFrame &&
            editorFrame.dataset.mpmHotkeyBound === '1' &&
            editorFrame.dataset.mpmEditBound === '1'
        );
        if (ready || bootstrapChecks >= maxBootstrapChecks) {
            observer.disconnect();
        }
    }, 120);
});

observer.observe(document.documentElement, {
    childList: true,
    subtree: true
});

/*
以下代码源于 https://github.com/kongxiangyan/bookmarklet
修复修正微信公众号图文编辑器粘贴 SVG 时部分转换为 Embed 导致不支持 Dark Mode 的问题
*/
function loadSVG(src) {
    return new Promise(function (resolve) {
        var ajax = new XMLHttpRequest();
        ajax.open('GET', src, true);
        ajax.send();
        ajax.onload = function () {
            var div = document.createElement('div');
            div.innerHTML = ajax.responseText;
            var svg = div.childNodes[1];
            resolve(svg);
        };
    });
}

function revise() {
    console.log('【MP_SVG_REVISE】 Start');
    var ueditor = getEditorFrame();
    if (!ueditor || !ueditor.contentDocument) {
        alert('未找到编辑器，稍后重试。');
        return;
    }

    var view = ueditor.contentDocument.getElementsByClassName('view')[0];
    if (!view) {
        alert('未找到编辑区，稍后重试。');
        return;
    }

    var embeds = view.querySelectorAll('embed');
    console.log('【MP_SVG_REVISE】 检测到 ' + embeds.length + ' 个目标……');
    var promises = [];
    embeds.forEach(function (embed, index) {
        console.log('【MP_SVG_REVISE】 第 ' + index + ' 个……');
        var parentNode = embed.parentNode;
        promises.push(new Promise(function (resolve) {
            loadSVG(embed.src).then(function (svg) {
                parentNode.insertBefore(svg, embed);
                parentNode.removeChild(embed);
                resolve();
            });
        }));
    });

    Promise.all(promises).then(function () {
        console.log('Revise complete!');
        alert('修复了 ' + embeds.length + ' 个目标!');
    });
}
