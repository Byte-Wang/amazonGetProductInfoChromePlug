(function() {
    'use strict';

    // 初始化入口
    function init() {
        const href = window.location.href;
        // 检测是否为亚马逊登录页
        if (href.includes('amazon') && (href.includes('/ap/signin') || href.includes('/ap/mfa'))) {
            handleLoginPage();
        }
        // 检测是否为亚马逊账户页面，尝试获取用户名
        else if (href.includes('amazon') && href.includes('/ap/cnep')) {
            getAndSaveUsername();
        }
        // 检测是否为亚马逊卖家中心页面，尝试获取店铺名称
        else if (href.includes('sellercentral.amazon')) {
            getAndSaveStoreName();
        }
        // 检测是否为亚马逊账户修复页面，尝试跳过手机验证
        else if (href.includes('amazon') && href.includes('/ap/accountfixup')) {
            handleAccountFixupPage();
        }
    }

    // 获取并保存店铺名称
    function getAndSaveStoreName() {
        FXLog('检测到亚马逊卖家中心页面，尝试获取店铺名称');
        
        let retryCount = 0;
        const maxRetries = 5;
        const retryInterval = 3000; // 3秒
        
        function tryGetStoreName() {
            retryCount++;
            FXLog(`尝试获取店铺名称 (${retryCount}/${maxRetries})`);
            
            const storeName = findStoreName();
            if (storeName) {
                FXLog('找到店铺名称:', storeName);
                
                // 保存到 chrome.storage.sync
                chrome.storage.sync.set({ 'feixunCacheAmazonStoreName': storeName }, function() {
                    FXLog('店铺名称已保存到缓存');
                });
            } else if (retryCount < maxRetries) {
                FXLog('未找到店铺名称，将在3秒后重试');
                setTimeout(tryGetStoreName, retryInterval);
            } else {
                FXLog('达到最大重试次数，未找到店铺名称');
            }
        }
        
        tryGetStoreName();
    }

    function findStoreName(){
        const navbar=document.getElementById('navbar');
        if(!navbar){
        return findStoreName2();
        }
        const span=navbar.querySelector('span.dropdown-account-switcher-header-label-global');
        if(!span){
        return findStoreName2();
        }
        const txt=(span.textContent||'').trim();
        if(!txt){
        return findStoreName2();
        }
        return txt;
    }

    function findStoreName2(){
        const span=document.getElementById('ngstrim-account-store-text');
        if(!span){
        return '';
        }
        const txt=(span.textContent||'').trim();
        return txt;
    }

    // 获取并保存用户名
    function getAndSaveUsername() {
        FXLog('检测到亚马逊账户页面，尝试获取用户名');
        
        // 找到所有 class 为 a-fixed-right-grid-col 的 div
        const gridCols = document.querySelectorAll('.a-fixed-right-grid-col');
        
        for (const col of gridCols) {
            // 获取该 div 下所有 class 为 a-row 的 div
            const rows = col.querySelectorAll('.a-row');
            
            // 确保至少有两个 a-row
            if (rows.length >= 2) {
                // 检查第一个 a-row 的内容是否包含"邮箱地址"
                if (rows[0].textContent.includes('邮箱地址')) {
                    // 获取第二个 a-row 的内容作为用户名
                    const username = rows[1].textContent.trim();
                    FXLog('找到用户名:', username);
                    
                    // 保存到 chrome.storage.sync
                    chrome.storage.sync.set({ 'feixunCacheAmazonUsername': username }, function() {
                        FXLog('用户名已保存到缓存');
                        
                        // 从缓存里获取店铺名
                        chrome.storage.sync.get(['feixunCacheAmazonStoreName', 'userInfo'], function(result) {
                            FXLog('从缓存获取店铺名:', result);
                            const storeName = result.feixunCacheAmazonStoreName;
                            const userInfo = result.userInfo;
                            
                            if (storeName && userInfo && userInfo.token) {
                                FXLog('找到店铺名:', storeName);
                                // 从云端获取店铺编号
                                fetchStoreInfo(username, storeName, userInfo.token);
                            } else {
                                FXLog('缺少店铺名或用户信息');
                            }
                        });
                    });
                    
                    break;
                }
            }
        }
    }

    // 从云端获取店铺信息
    function fetchStoreInfo(username, storeName, token) {
        FXLog('从云端获取店铺信息，用户:', username);
        
        try {
            // 调用后台接口获取店铺信息
            chrome.runtime.sendMessage({
                action: 'makeCorsRequest',
                url: 'http://119.91.217.3:8087/index.php/admin/index/getOtps?acount=' + username,
                token: token,
                data: {}
            }, function(response) {
                FXLog('获取店铺信息响应:', response);
                
                if (response && response.code === 1 && response.data && response.data.list) {
                    const storeList = response.data.list;
                    if (storeList.length > 0) {
                        const storeInfo = storeList[0];
                        
                        // 检查返回的 store_name 与缓存的 storeName 是否相同
                        if (storeInfo.store_name === storeName) {
                            // 已经关联过，显示店铺信息卡片
                            showStoreInfoCard(storeName, username, storeInfo.desc);
                        } else {
                            // 未关联，提示用户是否关联
                            if (confirm(`是否将店铺编号 ${storeInfo.desc}(${storeInfo.acount}) 与店铺 ${storeName}(${username}) 关联？`)) {
                                // 调用关联接口
                                associateStore(storeInfo, storeName, token);
                            }
                        }
                    }
                } else {
                    FXLog('获取店铺信息失败');
                }
            });
        } catch (error) {
            console.error('获取店铺信息时出错:', error);
        }
    }

    // 关联店铺
    function associateStore(storeInfo, storeName, token) {
        FXLog('关联店铺:', storeName, '编号:', storeInfo.desc);
        
        try {
            // 调用关联接口
            chrome.runtime.sendMessage({
                action: 'makePOSTRequest',
                url: 'http://119.91.217.3:8087/index.php/admin/index/editOtp',
                token: token,
                data: {
                    id: storeInfo.id,
                    store_name: storeName,
                    desc: storeInfo.desc,
                    acount: storeInfo.acount
                }
            }, function(response) {
                FXLog('关联店铺响应:', response);
                
                if (response && response.code === 1) {
                    alert('店铺关联成功！');
                    // 显示店铺信息卡片
                    showStoreInfoCard(storeName, storeInfo.acount, storeInfo.desc);
                } else {
                    alert('店铺关联失败，请重试');
                }
            });
        } catch (error) {
            console.error('关联店铺时出错:', error);
        }
    }

    // 显示店铺信息卡片
    function showStoreInfoCard(storeName, username, storeId) {
        FXLog('显示店铺信息卡片');
        
        // 检查是否已存在卡片
        let card = document.getElementById('store-info-card');
        if (card) {
            card.remove();
        }
        
        // 创建卡片
        card = document.createElement('div');
        card.id = 'store-info-card';
        card.style.position = 'fixed';
        card.style.top = '10px';
        card.style.right = '10px';
        card.style.width = '300px';
        card.style.backgroundColor = '#fff';
        card.style.border = '1px solid #ccc';
        card.style.borderRadius = '8px';
        card.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
        card.style.padding = '15px';
        card.style.zIndex = '999999';
        card.style.fontFamily = 'Arial, sans-serif';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '8px';
        
        // 标题
        const title = document.createElement('div');
        title.textContent = '店铺信息';
        title.style.fontWeight = 'bold';
        title.style.fontSize = '16px';
        title.style.color = '#333';
        card.appendChild(title);
        
        // 店铺名称
        const storeNameEl = document.createElement('div');
        storeNameEl.textContent = `店铺名称: ${storeName}`;
        storeNameEl.style.fontSize = '14px';
        card.appendChild(storeNameEl);
        
        // 店铺账号
        const usernameEl = document.createElement('div');
        usernameEl.textContent = `店铺账号: ${username}`;
        usernameEl.style.fontSize = '14px';
        card.appendChild(usernameEl);
        
        // 店铺编号
        const storeIdEl = document.createElement('div');
        storeIdEl.textContent = `店铺编号: ${storeId}`;
        storeIdEl.style.fontSize = '14px';
        card.appendChild(storeIdEl);
        
        // 关闭按钮
        const closeBtn = document.createElement('div');
        closeBtn.textContent = '×';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '5px';
        closeBtn.style.right = '10px';
        closeBtn.style.fontSize = '20px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontWeight = 'bold';
        closeBtn.onclick = function() {
            card.remove();
        };
        card.appendChild(closeBtn);
        
        // 添加到页面
        document.body.appendChild(card);
    }

    // 生成 TOTP 校验码
    function base32Decode(base32String) {
      if (!base32String) return new Uint8Array();
      
      // 移除空格和等号填充
      base32String = base32String.trim().replace(/=+$/, '').toUpperCase();
      
      const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      let bits = 0;
      let value = 0;
      let index = 0;
      const output = new Uint8Array(Math.floor(base32String.length * 5 / 8));
      
      for (let i = 0; i < base32String.length; i++) {
        const char = base32String.charAt(i);
        const charIndex = base32Chars.indexOf(char);
        
        if (charIndex === -1) {
          throw new Error('Invalid character in base32 string: ' + char);
        }
        
        value = (value << 5) | charIndex;
        bits += 5;
        
        if (bits >= 8) {
          output[index++] = (value >>> (bits - 8)) & 0xff;
          bits -= 8;
        }
      }
      
      return output;
    }

    // HMAC-SHA1实现
    function hmacSha1(key, message) {
      const blockSize = 64; // SHA-1块大小为64字节
      
      // 如果密钥长度超过块大小，则进行哈希处理
      if (key.length > blockSize) {
        key = sha1(key);
        key = new Uint8Array(key.match(/.{2}/g).map(byte => parseInt(byte, 16)));
      }
      
      // 填充密钥到块大小
      const oKeyPad = new Uint8Array(blockSize);
      const iKeyPad = new Uint8Array(blockSize);
      
      for (let i = 0; i < blockSize; i++) {
        const keyByte = i < key.length ? key[i] : 0;
        oKeyPad[i] = 0x5C ^ keyByte;
        iKeyPad[i] = 0x36 ^ keyByte;
      }
      
      // 计算inner hash
      const inner = new Uint8Array(iKeyPad.length + message.length);
      inner.set(iKeyPad);
      inner.set(message, iKeyPad.length);
      const innerHash = sha1(inner);
      
      // 计算outer hash
      const innerHashBytes = new Uint8Array(innerHash.match(/.{2}/g).map(byte => parseInt(byte, 16)));
      const outer = new Uint8Array(oKeyPad.length + innerHashBytes.length);
      outer.set(oKeyPad);
      outer.set(innerHashBytes, oKeyPad.length);
      
      return sha1(outer);
    }
        // 生成TOTP验证码
    function generateTOTP(secret, digits = 6, period = 30) {
      try {
        // 解码Base32密钥
        const key = base32Decode(secret);
        
        // 计算当前时间步
        const currentTime = Math.floor(Date.now() / 1000);
        let timeStep = Math.floor(currentTime / period); // 改为let声明
        
        // 将时间步转换为8字节数组（大端序）
        const timeBuffer = new ArrayBuffer(8);
        const timeArray = new Uint8Array(timeBuffer);
        for (let i = 7; i >= 0; i--) {
          timeArray[i] = timeStep & 0xff;
          timeStep = timeStep >>> 8;
        }
        
        // 计算HMAC-SHA1
        const hmacResult = hmacSha1(key, timeArray);
        
        // 将哈希结果转换为字节数组
        const hmacBytes = new Uint8Array(hmacResult.match(/.{2}/g).map(byte => parseInt(byte, 16)));
        
        // 动态截断
        const offset = hmacBytes[19] & 0x0F;
        const binary = 
          ((hmacBytes[offset] & 0x7F) << 24) |
          ((hmacBytes[offset + 1] & 0xFF) << 16) |
          ((hmacBytes[offset + 2] & 0xFF) << 8) |
          (hmacBytes[offset + 3] & 0xFF);
        
        // 生成验证码
        const code = binary % Math.pow(10, digits);
        return code.toString().padStart(digits, '0');
      } catch (error) {
        console.error('生成TOTP时出错:', error);
        return null;
      }
    }


    // 处理账户修复页面
    function handleAccountFixupPage() {
        FXLog('检测到亚马逊账户修复页面，尝试跳过手机验证');
        
        // 找到跳过链接
        const skipLink = document.getElementById('ap-account-fixup-phone-skip-link');
        if (skipLink) {
            FXLog('找到跳过链接，点击跳过');
            skipLink.click();
        } else {
            FXLog('未找到跳过链接');
        }
    }

    // 处理登录页面
    function handleLoginPage() {
        // 检查是否为一级登录页（输入邮箱/手机号）
        if (document.getElementById('continue')) {
            setTimeout(() => {
                handleFirstLoginPage();
            }, 5000);
        }
        // 检查是否为二级登录页（输入密码）
        else if (document.getElementById('signInSubmit')) {
            setTimeout(() => {
                handleSecondLoginPage();
            }, 5000);
        }
        // 检查是否为三级登录页（输入验证码）
        else if (document.getElementById('auth-mfa-otpcode')) {
            setTimeout(() => {
                handleThirdLoginPage();
            }, 5000);
        }
    }

    // 处理一级登录页
    function handleFirstLoginPage() {
        FXLog('检测到一级登录页，开始自动填充用户名');
        
        // 从存储中获取缓存的用户名
        chrome.storage.sync.get('feixunCacheAmazonUsername', function(result) {
            const username = result.feixunCacheAmazonUsername;
            if (username) {
                FXLog('找到缓存的用户名:', username);
                // 填充用户名
                const emailInput = document.getElementById('ap_email');
                if (emailInput) {
                    emailInput.value = username;
                    FXLog('已填充用户名');
                    
                    // 点击继续按钮（指定查找input类型）
                    const continueButton = document.querySelector('input#continue');
                    if (continueButton) {
                        FXLog('点击继续按钮');
                        continueButton.click();
                    }
                }
            } else {
                FXLog('未找到缓存的用户名');
            }
        });
    }

    // 处理二级登录页
    function handleSecondLoginPage() {
        FXLog('检测到二级登录页，开始自动点击登录按钮');
        
        const signInButton = document.getElementById('signInSubmit');
        if (signInButton) {
            FXLog('点击登录按钮');
            signInButton.click();
        }
    }

    // 处理三级登录页
    function handleThirdLoginPage() {
        FXLog('检测到三级登录页，开始获取并填充验证码');
        
        // 从存储中获取用户名
        chrome.storage.sync.get(['feixunCacheAmazonUsername', 'userInfo'], async function(result) {
            FXLog('从缓存获取用户名:', result);

            const username = result.feixunCacheAmazonUsername;
            const userInfo = result.userInfo;
            
            if (username && userInfo && userInfo.token) {
                FXLog('获取验证码，用户:', username);
                
                try {
                    // 调用后台接口获取 OTP 信息
                    const response = await new Promise(function(resolve) {
                        chrome.runtime.sendMessage({
                            action: 'makeCorsRequest',
                            url: 'http://119.91.217.3:8087/index.php/admin/index/getOtps?acount=' + username,
                            token: userInfo.token,
                            data: {}
                        }, function(resp) {
                            resolve(resp);
                        });
                    });
                    
                    FXLog('获取 OTP 信息响应:', response);
                    
                    if (response && response.code === 1 && response.data && response.data.list && response.data.list.length > 0) {
                        const otpInfo = response.data.list[0];
                        if (otpInfo.secret) {
                            FXLog('获取到 secret:', otpInfo.secret);
                            // 根据 secret 计算 OTP 校验码
                            const otpCode = generateTOTP(otpInfo.secret);
                            FXLog('计算出验证码:', otpCode);
                        
                            // 填充验证码
                            const otpInput = document.getElementById('auth-mfa-otpcode');
                            if (otpInput) {
                                otpInput.value = otpCode;
                                FXLog('已填充验证码');
                                
                                // 点击登录按钮
                                const signInButton = document.getElementById('auth-signin-button');
                                if (signInButton) {
                                    FXLog('点击登录按钮');
                                    signInButton.click();
                                }
                            }
                        }
                    } else {
                        FXLog('获取验证码失败');
                    }
                } catch (error) {
                    console.error('获取验证码时出错:', error);
                }
            } else {
                FXLog('缺少用户名或用户信息');
            }
        });
    }

    // 启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();