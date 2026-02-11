// 当前编辑对象和是否在编辑(插入)模式
let editing;
let editingMode;

function handleMessage(event) {
    if (!event.data || !event.data.type) return;

    if (event.data.type === 'CLOSE_FORMULA') {
        const popup = document.getElementById('popup');
        if (!popup) return;

        popup.style.display = 'none';
        setTimeout(function () {
            const editor = document.getElementById('ueditor_0');
            if (editor) editor.focus();
        }, 10);
        editingMode = false;
        return;
    }

    if (event.data.type === 'INSERT_FORMULA') {
        if (editingMode === true && editing) {
            const beg = event.data.text.indexOf('>') + 1;
            const end = event.data.text.lastIndexOf('<') - 1;
            editing.innerHTML = event.data.text.substring(beg, end);
            editingMode = false;
            return;
        }

        if (window.UE && window.UE.getEditor) {
            window.UE.getEditor('js_editor').execCommand('insertHTML', '\xA0' + event.data.text + '\xA0');
        }
    }
}

function bindFormulaEditClick() {
    const frame = document.getElementById('ueditor_0');
    if (!frame || frame.dataset.mpmEditBound === '1') return;

    const bindView = function () {
        const frameDoc = frame.contentDocument;
        if (!frameDoc) return;

        const view = frameDoc.querySelector('.view');
        if (!view || view.dataset.mpmEditBound === '1') return;

        $(view).on('click', '[data-formula]', function () {
            const popup = document.getElementById('popup');
            if (!popup) return;

            popup.style.display = 'block';
            popup.contentWindow.postMessage(
                {
                    type: 'CHANGE_INPUT',
                    text: $(this).attr('data-formula'),
                    isBlock: $(this).attr('display')
                },
                '*'
            );
            setTimeout(function () {
                popup.focus();
            }, 10);
            editing = this.parentElement;
            editingMode = true;
        });

        view.dataset.mpmEditBound = '1';
    };

    frame.addEventListener('load', bindView);
    frame.dataset.mpmEditBound = '1';
    bindView();
}

window.addEventListener('message', handleMessage);

bindFormulaEditClick();
var injectChecks = 0;
var maxInjectChecks = 60;
var injectTimer = null;
var injectObserver = new MutationObserver(function () {
    if (injectTimer) return;
    injectTimer = setTimeout(function () {
        injectTimer = null;
        bindFormulaEditClick();
        injectChecks += 1;

        var frame = document.getElementById('ueditor_0');
        if ((frame && frame.dataset.mpmEditBound === '1') || injectChecks >= maxInjectChecks) {
            injectObserver.disconnect();
        }
    }, 120);
});

injectObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
});
