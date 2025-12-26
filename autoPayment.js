(function() {
    'use strict';

    const LOG_STORAGE_KEY = 'autoPaymentLogs';
    let countdownTimer = null;
    let uiContainer = null;
    let logContainer = null;
    let isProcessRunning = false;
    let currentPageType = ''; // 'dashboard' or 'details'

    // 初始化入口
    function init() {
        const href = window.location.href;
        if (href.includes('/payments/dashboard')) {
            currentPageType = 'dashboard';
            createUI();
            startCountdown();
        } else if (href.includes('/payments/disburse/details')) {
            currentPageType = 'details';
            createUI();
            startCountdown();
        }
    }

    // 创建UI界面
    function createUI() {
        // 创建主容器
        uiContainer = document.createElement('div');
        uiContainer.id = 'auto-payment-ui';
        uiContainer.style.position = 'fixed';
        uiContainer.style.top = '10px';
        uiContainer.style.right = '10px';
        uiContainer.style.width = '350px';
        uiContainer.style.backgroundColor = '#fff';
        uiContainer.style.border = '1px solid #ccc';
        uiContainer.style.zIndex = '999999';
        uiContainer.style.padding = '10px';
        uiContainer.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
        uiContainer.style.fontFamily = 'Arial, sans-serif';
        uiContainer.style.display = 'flex';
        uiContainer.style.flexDirection = 'column';
        uiContainer.style.gap = '10px';

        // 标题
        const title = document.createElement('div');
        title.textContent = '自动付款助手';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '5px';
        uiContainer.appendChild(title);

        // 日志显示框 (黑色背景)
        logContainer = document.createElement('div');
        logContainer.style.height = '200px';
        logContainer.style.backgroundColor = '#000';
        logContainer.style.color = '#00ff00';
        logContainer.style.overflowY = 'auto';
        logContainer.style.padding = '8px';
        logContainer.style.fontSize = '12px';
        logContainer.style.lineHeight = '1.4';
        logContainer.style.borderRadius = '4px';
        logContainer.style.whiteSpace = 'pre-wrap';
        uiContainer.appendChild(logContainer);

        // 加载历史日志
        loadLogs();

        // 按钮区域
        const btnContainer = document.createElement('div');
        btnContainer.style.display = 'flex';
        btnContainer.style.justifyContent = 'space-between';
        btnContainer.style.gap = '10px';

        // 停止按钮
        const stopBtn = document.createElement('button');
        stopBtn.textContent = '停止';
        stopBtn.style.flex = '1';
        stopBtn.style.padding = '5px 10px';
        stopBtn.style.cursor = 'pointer';
        stopBtn.onclick = stopProcess;

        // 清空日志按钮
        const clearBtn = document.createElement('button');
        clearBtn.textContent = '清空日志';
        clearBtn.style.flex = '1';
        clearBtn.style.padding = '5px 10px';
        clearBtn.style.cursor = 'pointer';
        clearBtn.onclick = clearLogs;

        btnContainer.appendChild(stopBtn);
        btnContainer.appendChild(clearBtn);
        uiContainer.appendChild(btnContainer);

        document.body.appendChild(uiContainer);
    }

    // 写入日志并缓存
    function appendLog(msg) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString();
        const logLine = `[${timeStr}] ${msg}`;
        
        // 显示在界面
        const p = document.createElement('div');
        p.textContent = logLine;
        logContainer.appendChild(p);
        logContainer.scrollTop = logContainer.scrollHeight;

        // 保存到localStorage
        const logs = getStoredLogs();
        logs.push(logLine);
        // 限制日志条数，避免无限增长，保留最近200条
        if (logs.length > 200) {
            logs.splice(0, logs.length - 200);
        }
        localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
    }

    // 获取本地存储日志
    function getStoredLogs() {
        try {
            const stored = localStorage.getItem(LOG_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('读取日志失败', e);
            return [];
        }
    }

    // 加载并显示日志
    function loadLogs() {
        const logs = getStoredLogs();
        logs.forEach(logLine => {
            const p = document.createElement('div');
            p.textContent = logLine;
            logContainer.appendChild(p);
        });
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    // 清空日志
    function clearLogs() {
        localStorage.removeItem(LOG_STORAGE_KEY);
        logContainer.innerHTML = '';
        appendLog('日志已清空');
    }

    // 停止流程
    function stopProcess() {
        if (countdownTimer) {
            clearInterval(countdownTimer);
            countdownTimer = null;
        }
        isProcessRunning = false;
        appendLog('用户点击停止，流程终止，对话框即将关闭...');
        
        // 稍微延迟关闭对话框，让用户看到提示
        setTimeout(() => {
            if (uiContainer) {
                uiContainer.remove();
            }
        }, 500);
    }

    // 开始倒计时
    function startCountdown() {
        isProcessRunning = true;
        let seconds = 10;
        
        const pageDesc = currentPageType === 'details' ? '二级付款页' : '一级付款页';
        appendLog(`当前为${pageDesc}，对话框已弹出，准备开始倒计时...`);
        appendLog(`${seconds}s后开始请求付款`);
        
        countdownTimer = setInterval(() => {
            if (!isProcessRunning) {
                clearInterval(countdownTimer);
                return;
            }
            
            seconds--;
            if (seconds > 0) {
                appendLog(`${seconds}s后开始请求付款`);
            } else {
                clearInterval(countdownTimer);
                countdownTimer = null;
                executePayment();
            }
        }, 1000);
    }

    // 提取二级页面信息
    function extractPageInfo() {
        // 提取店铺名称
        // class="dropdown-account-switcher-header-label-global"
        const shopEl = document.querySelector('.dropdown-account-switcher-header-label-global');
        if (shopEl) {
            appendLog(`检测到店铺名称: ${shopEl.textContent.trim()}`);
        } else {
            appendLog('未找到店铺名称元素');
        }

        // 提取付款金额
        // class="settlement-amount-balance"
        const amountEl = document.querySelector('.settlement-amount-balance');
        if (amountEl) {
            const rawAmount = amountEl.textContent.trim();
            // 尝试区分币种和金额，例如 "AU$20.60"
            // 正则匹配：非数字部分作为币种，数字+逗号+点作为金额
            const match = rawAmount.match(/^([^\d\s]+)\s*([\d,.]+)$/);
            if (match) {
                appendLog(`检测到付款金额: ${rawAmount} (币种: ${match[1]}, 数值: ${match[2]})`);
            } else {
                appendLog(`检测到付款金额(未识别格式): ${rawAmount}`);
            }
        } else {
            appendLog('未找到付款金额元素');
        }
    }

    // 执行付款操作
    function executePayment() {
        if (!isProcessRunning) return;

        // 如果是二级页面，先提取信息
        if (currentPageType === 'details') {
            appendLog('开始提取二级页面信息...');
            extractPageInfo();
        }
        
        appendLog('开始查找“请求付款”按钮...');
        
        // 查找所有 kat-button
        const katButtons = Array.from(document.querySelectorAll('kat-button'));
        let targetBtn = null;
        
        for (const btn of katButtons) {
            const label = btn.getAttribute('label');
            if (label === '请求付款') {
                targetBtn = btn;
                break;
            }
        }
        
        if (!targetBtn) {
            appendLog('未找到label为“请求付款”的kat-button');
            finishProcess();
            return;
        }
        
        // 检查 disabled 属性
        const disabledVal = targetBtn.getAttribute('disabled');
        // 注意：getAttribute返回的是字符串，有些实现可能是空字符串表示true，或者'true'/'disabled'
        // 这里严格按照要求判断值为 'true'
        if (disabledVal === 'true') {
            appendLog('按钮处于禁用状态(disabled="true")，流程结束');
            finishProcess();
            return;
        }
        
        // 查找 Shadow DOM 中的 button
        let realBtn = null;
        if (targetBtn.shadowRoot) {
            realBtn = targetBtn.shadowRoot.querySelector('button');
        }
        
        if (!realBtn) {
            appendLog('未在Shadow DOM中找到button标签');
            finishProcess();
            return;
        }
        
        appendLog('找到按钮，执行点击...');
        realBtn.click();
        appendLog('点击完成');
        
        finishProcess();
    }

    // 流程结束处理
    function finishProcess() {
        isProcessRunning = false;
        appendLog('流程结束，即将关闭页面...');
        
        // 延迟关闭页面，确保日志已保存且用户能看到最后状态
        setTimeout(() => {
            // window.close() 在 content script 中通常无效，改用发消息给 background 关闭
            // window.close();
            try {
                chrome.runtime.sendMessage({ action: "closeCurrentTab" }, (response) => {
                    if (chrome.runtime.lastError) {
                        appendLog('关闭页面失败: ' + chrome.runtime.lastError.message);
                    } else if (response && !response.ok) {
                        appendLog('关闭页面失败: ' + (response.desc || '未知错误'));
                    }
                });
            } catch (e) {
                appendLog('发送关闭请求异常: ' + e.message);
            }
        }, 2000);
    }

    // 启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
