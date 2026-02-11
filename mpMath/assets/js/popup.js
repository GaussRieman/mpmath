// 修改MathJax全局配置，使微信编辑器能保存下来
MathJax = {
    svg: { fontCache: 'none' },
    tex: { tags: 'ams' }
};

let input = document.getElementById('input');
let block = document.getElementById('block');
let insert = document.getElementById('insert');

// 判断输入是否为空
function checkNull(str) {
    if (str.length == 0) {
        insert.disabled = true;
        $(insert).addClass('weui-desktop-btn_disabled');
    } else {
        insert.disabled = false;
        $(insert).removeClass('weui-desktop-btn_disabled');
    }
}

// Tex代码转SVG图像
function convert() {
    let inputTex = document.getElementById("input").value.trim();
    checkNull(inputTex);

    output = document.getElementById('output');
    output.innerHTML = '';

    MathJax.texReset();
    let options = MathJax.getMetricsFor(output);
    options.display = block.checked;
    MathJax.tex2svgPromise(inputTex, options).then(function(node) {
        output.appendChild(node);
        MathJax.startup.document.clear();
        MathJax.startup.document.updateDocument();
    }).catch(function(err) {
        output.appendChild(document.createElement('pre')).appendChild(document.createTextNode(err.message));
    }).then(function() {
        inputTex.disabled = false;
    });
}

// 请求关闭公式编辑页面
function emitToHost(payload) {
    parent.window.postMessage(payload, '*');
}

function closeFrame() {
    emitToHost({ type: 'CLOSE_FORMULA' });
}

function insertFormula() {
    if (insert.disabled == true) return;

    // 直接提取 SVG，避免新版编辑器过滤 mjx-container 导致空白
    let output = document.getElementById('output');
    let svg = output.querySelector('svg');
    if (!svg) {
        alert('公式还未渲染完成，请稍后重试。');
        return;
    }

    let sp = document.createElement('span');
    sp.setAttribute('style', 'cursor:pointer;');

    let svgClone = svg.cloneNode(true);
    svgClone.setAttribute('data-formula', input.value.trim());

    if ($(block).prop('checked')) {
        svgClone.style.overflowX = 'auto';
        svgClone.style.outline = '0';
        svgClone.style.display = 'block';
        svgClone.style.textAlign = 'center';
        svgClone.style.margin = '15px 0px';
        svgClone.setAttribute('display', true);
        if (svgClone.firstElementChild) {
            svgClone.firstElementChild.style.height = 'auto';
            svgClone.firstElementChild.style.maxWidth = '300%';
        }
    }

    sp.appendChild(svgClone);
    emitToHost({ type: 'INSERT_FORMULA', text: sp.outerHTML });
    input.value = '';
    closeFrame();
}

$(function() {
    input.oninput = convert;
    block.onchange = convert;
    insert.onclick = insertFormula;
    document.getElementById('close').onclick = closeFrame;
    document.getElementById('cancel').onclick = closeFrame;

    window.addEventListener('message', function(event) {
        // 接收来自主页面的消息，改变输入框内容
        if (event.data.type) {
            if (event.data.type == 'CHANGE_INPUT') {
                //input.value = event.data.text.replace(/\\\\/g, '\\');
                input.value = event.data.text;
                input.focus();

                // 行间公式自动勾选
                if (event.data.isBlock == "true") $(block).prop('checked', true);
                else $(block).prop('checked', false);
                convert();
            }
        }
    });

    // 防止窗口失去焦点
    $(window).focusout(function() {
        setTimeout(function() {
            $('#input').focus();
        }, 10);
    });

    $('#input').keydown(function(event) {
        // 处理shift+enter
        if (event.keyCode == 13 && event.shiftKey) {
            insertFormula();
        }
    });

    $(document).keydown(function(event) {
        // 处理esc
        if (event.keyCode == 27) {
            closeFrame();
        }
    });
});
