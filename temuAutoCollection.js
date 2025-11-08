

// Temu 产品采集工具 - UI与入口逻辑

(function() {
  let isCollecting = false;
  let progressCount = 0;
  let qualifiedCount = 0;
  let processedIds = new Set();
  let minDailySalesInput, minRatingInput, statusText, progressText, toggleBtn;

  const SETTINGS_KEY = 'temuCollectionSettings';

  const log = (...args) => {
    try {
      if (typeof FXLog === 'function') FXLog('[TemuAuto]', ...args);
      else console.log('[TemuAuto]', ...args);
    } catch (e) {
      console.log('[TemuAuto]', ...args);
    }
  };

  // 分类白名单与匹配
  function normalizeCategory(s) {
    return (s || '').replace(/\s+/g, '').replace(/[，、:：]/g, '').trim();
  }
  const ALLOWED_CATEGORIES = [
    // 顶级 + 子类（去重）
    '家居厨房用品', '个性化商品', '浴室用品', '节日饰品', '家居装饰', '节日聚会用品', '沙发装饰', '餐厅用品', '毯子', '厨房收纳', '窗饰及配件', '墙面装饰', '厨房用品', '毛巾浴巾', '烘焙用品', '杯具', '家庭收纳', '餐厨布艺', '咖啡用品', '酿酒用具', '旅行及外出用杯子',
    '运动与户外', '运动及户外配件', '骑行用品', '野营登山', '垂钓', '户外餐厨', '包袋与背包', '水上运动', '高尔夫用品', '船用设备', '攀岩与求生工具', '冬季运动',
    '珠宝和配饰', '女士珠宝', '女士发饰', '男士珠宝首饰', '饰品收纳', '女士纽扣与徽章', '装扮假发', '手扇', '裸钻、裸石', '女士假领', '男士配饰', '面罩', '挂包架', '男士耳罩', '女士耳罩',
    '汽车用品', '汽车零件', '汽车配饰', '外部配饰配件', '汽车保养清洁', '汽车贴纸', '车载手机支架', '房车家具', '汽车收纳', '钥匙扣钥匙包', '房车配件',
    '美容与健康', '美妆', '假发和接发', '美妆工具', '剃须和脱毛', '假睫毛', '化妆包和收纳袋', '发饰', '浴室及淋浴配件',
    '玩具与游戏', '新奇整蛊玩具', '玩偶及配件', '角色扮演道具', '户外游戏', '聚会用品', '玩具人偶和套装', '手工用品与贴纸', '水上玩具', '木偶手偶',
    '庭院、草坪和园艺', '户外节日装饰', '户外装饰', '浇灌工具', '泳池用品', '花园雕塑', '防虫用品', '庭院装饰地插', '野餐用品', '池塘及水景用品', '指示牌及户外墙饰', '庭院喂鸟用品',
    '手工艺与缝纫制品', '礼品包装用品', '工艺品', '珠饰、首饰制作用品', '派对装饰及用品', '模型制作', '编织钩针用品/织物/装饰用品', '毛线', '布料',
    '家居装修', '墙纸', '工具收纳', '墙贴与壁画', '园艺工具',
    '办公与学校用品', '存储收纳', '书写文具与修正用品', '纸张、标签及便利贴', '桌面配件', '包装与运输', '文具贴纸', '贺卡与明信片', '教室装饰',
    '宠物用品', '宠物投喂器', '宠物玩具', '宠物外出用品', '马用品', '宠物纪念和丧葬用品'
  ];
  const NORMALIZED_ALLOWED = new Set(ALLOWED_CATEGORIES.map(normalizeCategory));
  function isAllowedCategory(category) {
    const c = normalizeCategory(category);
    if (!c) return false;
    if (NORMALIZED_ALLOWED.has(c)) return true;
    // 兼容包含关系与斜杠分隔的复合类目
    for (const token of NORMALIZED_ALLOWED) {
      const parts = token.split('/');
      for (const p of parts) {
        if (p && c.includes(p)) return true;
      }
    }
    return false;
  }

  function loadTemuSettings() {
    try {
      chrome.storage.sync.get(SETTINGS_KEY, (result) => {
        const s = result[SETTINGS_KEY] || {};
        if (minDailySalesInput) minDailySalesInput.value = s.minDailySales !== undefined ? s.minDailySales : '';
        if (minRatingInput) minRatingInput.value = s.minRating !== undefined ? s.minRating : '';
        log('加载采集设置', s);
      });
    } catch (e) {
      log('加载设置异常', e?.message || e);
    }
  }

  function saveTemuSettings() {
    try {
      const s = {
        minDailySales: Number(minDailySalesInput?.value || 0),
        minRating: Number(minRatingInput?.value || 0),
      };
      chrome.storage.sync.set({ [SETTINGS_KEY]: s }, () => {
        log('保存采集设置', s);
      });
    } catch (e) {
      log('保存设置异常', e?.message || e);
    }
  }

  function temuAutoCollectionMain() {
    try {
      const url = new URL(location.href);
      // const isDevPreview = url.searchParams.get('devPreview') === '1';
      const isTemuDomain = location.hostname === 'www.temu.com';
      const isListPage = !!document.querySelector('.autoFitList') || !!document.querySelector('.autoFitGoodsList');
      log('入口检查', { isTemuDomain, isListPage });

      // 仅在Temu商品列表页运行；预览模式下跳过域名与列表页判断
      // if (!isDevPreview) {
        if (!isTemuDomain) return;
        if (!isListPage) return;
      // }

      // 防止重复初始化
      if (document.getElementById('temu-collection-floating-btn')) return;

      initUI();
    } catch (e) {
      console.error('temuAutoCollectionMain 初始化失败: ', e);
      log('入口异常', e?.message || e);
    }
  }

  function checkVersionIsAvalible(callback,retryTimes = 3){
      FXLog("[checkVersionIsAvalible] 没有token，未登录：");
      chrome.storage.sync.get('userInfo', function(result) {
          FXLog("[checkVersionIsAvalible] 获取用户信息：",result);
          const userInfo = result.userInfo;
          if (!userInfo || !userInfo.token) {
              FXLog("[checkVersionIsAvalible] 没有token，未登录：");
              callback({code: 401, desc: "请先登录！"});
              return;
          }
          
        
          let url = 'http://119.91.217.3:8087/index.php/admin/index/checkChromePlugVersion?version=' + window.feixunPlugVersion;
          chrome.runtime.sendMessage({
              action: "makeCorsRequest",
              url: url,
              token: userInfo.token,
              data: {}
          },(response)=> {
              FXLog("[checkVersionIsAvalible] 插件可用状态：",response);
              if (response && response.data && response.data.code == 200) {
                  callback(response);
              } else if (retryTimes > 0) {
                  checkVersionIsAvalible(callback, retryTimes - 1);
              } else {
                  callback(response);
              }
              
          });

      });
  }
    
  function initUI() {
    // 浮动按钮容器
    const floatBtn = document.createElement('div');
    floatBtn.id = 'temu-collection-floating-btn';
    floatBtn.style.position = 'fixed';
    floatBtn.style.top = '50%';
    floatBtn.style.right = '20px';
    floatBtn.style.transform = 'translateY(-50%)';
    floatBtn.style.zIndex = '999999';
    floatBtn.style.background = '#e3f2fd';
    floatBtn.style.color = '#0d47a1';
    floatBtn.style.border = '1px solid #90caf9';
    floatBtn.style.borderRadius = '10px';
    floatBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    floatBtn.style.padding = '10px 14px 10px 14px';
    floatBtn.style.cursor = 'pointer';
    floatBtn.style.fontSize = '14px';
    floatBtn.style.userSelect = 'none';
    floatBtn.textContent = '产品采集工具';

    // 右侧角落拖动手柄
    const dragHandle = document.createElement('div');
    dragHandle.style.position = 'absolute';
    dragHandle.style.width = '14px';
    dragHandle.style.height = '14px';
    dragHandle.style.right = '-7px';
    dragHandle.style.bottom = '-7px';
    dragHandle.style.background = '#90caf9';
    dragHandle.style.border = '1px solid #64b5f6';
    dragHandle.style.borderRadius = '50%';
    dragHandle.style.boxShadow = '0 1px 4px rgba(0,0,0,0.2)';
    dragHandle.style.cursor = 'grab';
    dragHandle.title = '按住拖动';
    floatBtn.appendChild(dragHandle);

    // 拖动逻辑（仅手柄可拖动）
    (function enableDrag() {
      let dragging = false;
      let startX = 0, startY = 0, startTop = 0, startRight = 0;

      dragHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        dragging = true;
        dragHandle.style.cursor = 'grabbing';
        startX = e.clientX;
        startY = e.clientY;
        // 记录起始位置（top/right）
        const rect = floatBtn.getBoundingClientRect();
        startTop = rect.top;
        // 通过窗口宽度与元素右侧距离推算right
        startRight = window.innerWidth - rect.right;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });

      function onMouseMove(e) {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        // 更新位置：top向下为正，right向右为负（因此使用减法）
        const newTop = Math.max(10, Math.min(window.innerHeight - 10, startTop + dy));
        const newRight = Math.max(0, Math.min(window.innerWidth - 0, startRight - dx));
        floatBtn.style.top = `${newTop}px`;
        floatBtn.style.right = `${newRight}px`;
        floatBtn.style.transform = '';
      }

      function onMouseUp() {
        dragging = false;
        dragHandle.style.cursor = 'grab';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      }
    })();

    // 设置面板（默认隐藏）
    const panel = document.createElement('div');
    panel.id = 'temu-collection-settings-panel';
    panel.style.position = 'fixed';
    panel.style.top = '50%';
    panel.style.left = '50%';
    panel.style.transform = 'translate(-50%, -50%)';
    panel.style.width = '300px';
    panel.style.maxWidth = '80vw';
    panel.style.background = '#fff';
    panel.style.border = '1px solid #ddd';
    panel.style.borderRadius = '8px';
    panel.style.boxShadow = '0 6px 18px rgba(0,0,0,0.15)';
    panel.style.padding = '14px';
    panel.style.zIndex = '999998';
    panel.style.display = 'none';

    // 标题栏
    const panelHeader = document.createElement('div');
    panelHeader.style.display = 'flex';
    panelHeader.style.alignItems = 'center';
    panelHeader.style.justifyContent = 'space-between';
    panelHeader.style.marginBottom = '10px';
    panelHeader.style.paddingBottom = '8px';
    panelHeader.style.borderBottom = '1px solid #eee';

    const panelTitle = document.createElement('div');
    panelTitle.textContent = '产品采集工具';
    panelTitle.style.fontWeight = 'bold';
    panelTitle.style.color = '#333';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.background = 'transparent';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '18px';
    closeBtn.style.lineHeight = '1';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.color = '#666';
    closeBtn.style.padding = '2px 6px';
    closeBtn.title = '关闭';

    closeBtn.addEventListener('click', () => {
      panel.style.display = 'none';
    });

    panelHeader.appendChild(panelTitle);
    panelHeader.appendChild(closeBtn);

    // 上半部分：采集条件设置
    const settingsTitle = document.createElement('div');
    settingsTitle.textContent = '产品采集条件设置';
    settingsTitle.style.fontWeight = 'bold';
    settingsTitle.style.color = '#333';
    settingsTitle.style.marginBottom = '10px';

    const conditionWrapper = document.createElement('div');
    conditionWrapper.style.display = 'grid';
    conditionWrapper.style.gridTemplateColumns = '1fr 1fr';
    conditionWrapper.style.gap = '8px';
    conditionWrapper.style.marginBottom = '12px';

    const minDailySalesLabel = document.createElement('label');
    minDailySalesLabel.textContent = '最小日销量';
    minDailySalesLabel.style.fontSize = '12px';
    minDailySalesLabel.style.color = '#555';

    minDailySalesInput = document.createElement('input');
    minDailySalesInput.type = 'number';
    minDailySalesInput.placeholder = '例如 50';
    minDailySalesInput.min = '0';
    minDailySalesInput.style.width = '100%';
    minDailySalesInput.style.boxSizing = 'border-box';
    minDailySalesInput.style.padding = '6px 8px';
    minDailySalesInput.style.border = '1px solid #ccc';
    minDailySalesInput.style.borderRadius = '6px';
    minDailySalesInput.addEventListener('change', saveTemuSettings);
    minDailySalesInput.addEventListener('blur', saveTemuSettings);

    const minRatingLabel = document.createElement('label');
    minRatingLabel.textContent = '最小评分';
    minRatingLabel.style.fontSize = '12px';
    minRatingLabel.style.color = '#555';

    minRatingInput = document.createElement('input');
    minRatingInput.type = 'number';
    minRatingInput.placeholder = '例如 4.5';
    minRatingInput.min = '0';
    minRatingInput.max = '5';
    minRatingInput.step = '0.1';
    minRatingInput.style.width = '100%';
    minRatingInput.style.boxSizing = 'border-box';
    minRatingInput.style.padding = '6px 8px';
    minRatingInput.style.border = '1px solid #ccc';
    minRatingInput.style.borderRadius = '6px';
    minRatingInput.addEventListener('change', saveTemuSettings);
    minRatingInput.addEventListener('blur', saveTemuSettings);

    // 加载缓存的采集设置
    loadTemuSettings();

    const leftCol = document.createElement('div');
    leftCol.appendChild(minDailySalesLabel);
    leftCol.appendChild(minDailySalesInput);

    const rightCol = document.createElement('div');
    rightCol.appendChild(minRatingLabel);
    rightCol.appendChild(minRatingInput);

    conditionWrapper.appendChild(leftCol);
    conditionWrapper.appendChild(rightCol);

    // 下半部分：采集操作
    const actionWrapper = document.createElement('div');
    actionWrapper.style.borderTop = '1px solid #eee';
    actionWrapper.style.paddingTop = '10px';

    toggleBtn = document.createElement('button');
    toggleBtn.id = 'temu-collection-toggle-btn';
    toggleBtn.textContent = '开始采集';
    toggleBtn.style.background = '#1976d2';
    toggleBtn.style.color = '#fff';
    toggleBtn.style.border = 'none';
    toggleBtn.style.borderRadius = '6px';
    toggleBtn.style.padding = '8px 12px';
    toggleBtn.style.cursor = 'pointer';
    toggleBtn.style.fontSize = '13px';
    toggleBtn.style.marginRight = '10px';

    statusText = document.createElement('span');
    statusText.id = 'temu-collection-status-text';
    statusText.textContent = '当前状态：未开始';
    statusText.style.color = '#555';
    statusText.style.marginRight = '8px';

    progressText = document.createElement('span');
    progressText.id = 'temu-collection-progress-text';
    progressText.textContent = '采集进度：0';
    progressText.style.color = '#555';

    actionWrapper.appendChild(toggleBtn);
    actionWrapper.appendChild(statusText);
    actionWrapper.appendChild(progressText);

    panel.appendChild(panelHeader);
    panel.appendChild(settingsTitle);
    panel.appendChild(conditionWrapper);
    panel.appendChild(actionWrapper);

    // 点击浮动按钮切换面板显示（每次显示都居中）
    floatBtn.addEventListener('click', () => {
      checkVersionIsAvalible((res)=>{
        if (res && res.data && res.data.code == 200) {
            chrome.storage.sync.set({'feixunplugchecktime': Date.now()},function (res) {
                console.log('校验时间保存成功',res);
            });

            const willShow = panel.style.display === 'none';
            if (willShow) {
              panel.style.top = '50%';
              panel.style.left = '50%';
              panel.style.transform = 'translate(-50%, -50%)';
              panel.style.display = 'block';
            }
        } else {
            chrome.storage.sync.set({'feixunplugchecktime': 0},function () {

            });
            let state = "权限校验失败";
            if (res && res.data && res.data.desc) {
                state = res.data.desc;
            } else if (res && res.desc) {
                state = res.desc;
            } else if (res && res.msg) {
                state = res.msg;
            }
            if (state == "Token expiration") {
              state = "请重新登录";
            }
            alert(state);
        }
      });
    });

    // 开始/停止采集按钮逻辑
    toggleBtn.addEventListener('click', () => {
      if (!isCollecting) {
        checkVersionIsAvalible((res)=>{
          if (res && res.data && res.data.code == 200) {
              chrome.storage.sync.set({'feixunplugchecktime': Date.now()},function (res) {
                  console.log('校验时间保存成功',res);
              });

              startCollection();
          } else {
              chrome.storage.sync.set({'feixunplugchecktime': 0},function () {

              });
              let state = "权限校验失败";
              if (res && res.data && res.data.desc) {
                  state = res.data.desc;
              } else if (res && res.desc) {
                  state = res.desc;
              } else if (res && res.msg) {
                  state = res.msg;
              }
              if (state == "Token expiration") {
                state = "请重新登录";
              }
              alert(state);
          }
        });
      } else {
        stopCollection();
      }
    });

    document.body.appendChild(floatBtn);
    document.body.appendChild(panel);
  }

  function startCollection() {
    isCollecting = true;
    toggleBtn.textContent = '停止采集';
    updateStatus('采集中');
    progressCount = 0;
    qualifiedCount = 0;
    processedIds = new Set();
    updateProgress(progressCount, qualifiedCount);
    // 保存一次当前设置，避免丢失
    saveTemuSettings();
    log('开始采集');
    collectLoop();
  }

  function stopCollection() {
    isCollecting = false;
    toggleBtn.textContent = '开始采集';
    updateStatus('已停止');
    log('停止采集');
  }

  function updateStatus(text) {
    if (statusText) statusText.textContent = `当前状态：${text}`;
  }

  function updateProgress(total, qualified) {
    if (progressText) progressText.textContent = `采集进度：已分析 ${total}，符合条件 ${qualified}`;
  }

  function ensureStatusCard(productId, anchorNode) {
    const existing = document.getElementById(`temu-status-${productId}`);
    if (existing) return existing;
    const card = document.createElement('div');
    card.id = `temu-status-${productId}`;
    card.style.margin = '6px 0';
    card.style.padding = '6px 10px';
    card.style.border = '1px dashed #d0d7de';
    card.style.borderRadius = '6px';
    card.style.fontSize = '12px';
    card.style.color = '#24292f';
    card.style.background = '#f6f8fa';
    card.textContent = '采集中…';
    try {
      anchorNode.appendChild(card);
    } catch (e) {
      // 兜底：插到父节点末尾
      anchorNode && anchorNode.appendChild(card);
    }
    return card;
  }

  function setStatusCard(card, type, msgExtra = '') {
    // type: success | fail | skip | running
    let bg = '#f6f8fa', border = '#d0d7de', color = '#24292f', text = '';
    if (type === 'success') {
      bg = '#e6ffed'; border = '#34d058'; color = '#000'; text = '已采集成功';
    } else if (type === 'fail') {
      bg = '#ffeef0'; border = '#e5534b'; color = '#86181d'; text = '采集失败';
    } else if (type === 'skip') {
      bg = '#fff5b1'; border = '#e1b600'; color = '#6c5f00'; text = '不符合采集条件';
    } else {
      text = '采集中…';
    }
    card.style.background = bg;
    card.style.borderColor = border;
    card.style.color = color;
    card.textContent = msgExtra ? `${text}（${msgExtra}）` : text;
  }

  // ===================== 采集核心逻辑 =====================
  async function collectLoop() {
    const minDailySales = Number(minDailySalesInput?.value || 0);
    const minRating = Number(minRatingInput?.value || 0);

    let noNewCount = 0;
    let lastProductCount = 0;

    while (isCollecting) {
      const listRoot = document.querySelector('.autoFitList') || document.querySelector('.autoFitGoodsList');
      if (!listRoot) {
        updateStatus('未找到产品列表');
        log('未找到产品列表 .autoFitList/.autoFitGoodsList');
        break;
      }

      const productNodes = Array.from(listRoot.querySelectorAll('[data-tooltip^="goodContainer-"]'));
      const currentCount = productNodes.length;
      log('当前页面产品数量', currentCount);

      // 遍历当前页面的产品卡片
      for (const node of productNodes) {
        if (!isCollecting) break;
        const idMatch = (node.getAttribute('data-tooltip') || '').match(/goodContainer-(\d+)/);
        if (!idMatch) continue;
        const productId = idMatch[1];
        if (processedIds.has(productId)) continue;

        const statusCard = ensureStatusCard(productId, node);
        setStatusCard(statusCard, 'running');

        // 滚动到产品位置，居中显示，避免过快滚动影响解析
        // try {
        //   node.scrollIntoView({ behavior: 'smooth', block: 'center' });
        //   // 轻微上移，避免被顶部导航遮挡
        //   window.scrollBy(0, -80);
        //   log('滚动到产品', productId);
        //   await sleep(300);
        // } catch (e) {
        //   log('滚动异常', e?.message || e);
        // }

        // 产品标题
        const title = (node.getAttribute('data-tooltip-title') || '').trim();
        log('处理产品', { productId, title });

        // 卡片根节点（尽量使用靠上的父级）
        const cardRoot = node.closest('[role="group"],[class]') || node;

        // 评分
        let rating = 0.0;
        const ratingSpan = findSpanByText(cardRoot, /星（满分5星）/);
        if (ratingSpan) {
          const m = ratingSpan.textContent.trim().match(/(\d+(?:\.\d+)?)\s*星/);
          rating = m ? parseFloat(m[1]) : 0.0;
        }
        log('评分解析', rating);

        // 价格
        const priceText = findPriceText(cardRoot);
        const price = parsePriceToFloat(priceText);
        log('价格解析', { priceText, price });

        // 主图
        const mainImgUrl = findImageUrl(cardRoot);
        log('主图地址', mainImgUrl);

        // 详情链接
        const detailHrefEl = document.querySelector(`[data-tooltip="goodName-${productId}"] a[href]`);
        const detail_page_url = detailHrefEl ? toAbsoluteUrl(detailHrefEl.getAttribute('href')) : '';
        log('详情链接', detail_page_url);

        // 站点
        const site = inferSite(priceText, detail_page_url);
        log('站点推断', site);

        // 等待插件生成的数据块（gdid）
        const pluginDiv = await waitForGdidDiv(productId, 10000);
        log('插件div存在', !!pluginDiv);
        let daily_sales = 0;
        let total_sales = 0;
        let listing_time = '';
        let category = '';
        if (pluginDiv) {
          const zxlDiv = pluginDiv.querySelector('.zxlitem');
          if (zxlDiv) {
            const valSpan = zxlDiv.querySelector('.value') || zxlDiv.querySelector('span');
            const txt = (valSpan?.textContent || '').trim();
            const dm = txt.match(/日\s*(\d+(?:\.\d+)?)\s*([Kk]?)/);
            daily_sales = dm ? Math.round(parseFloat(dm[1]) * (dm[2] ? 1000 : 1)) : 0;
            const tm = txt.match(/总\s*(\d+(?:\.\d+)?)\s*([Kk]?)/);
            total_sales = tm ? Math.round(parseFloat(tm[1]) * (tm[2] ? 1000 : 1)) : 0;
          }
          const sjsjDiv = pluginDiv.querySelector('.sjsjitem');
          if (sjsjDiv) {
            const span = sjsjDiv.querySelector('.value') || sjsjDiv.querySelector('span');
            const dateTxt = (span?.textContent || '').trim();
            const dt = dateTxt.match(/\d{4}-\d{2}-\d{2}/);
            listing_time = dt ? dt[0] : '';
          }
          const categoryItem = Array.from(pluginDiv.querySelectorAll('.item')).find(it => {
            const label = it.querySelector('.label');
            return label && /分类\s*:/.test(label.textContent);
          });
          if (categoryItem) {
            const val = categoryItem.querySelector('.value') || categoryItem;
            category = (val.textContent || '').replace(/^\s*分类\s*:/, '').trim();
          }
        }
        log('插件数据解析', { daily_sales, total_sales, listing_time, category });

        // 分类白名单判断
        const passCategory = isAllowedCategory(category);
        log('分类过滤', { category, passCategory });

        // 构造上报对象并过滤
        const willReport = daily_sales >= minDailySales && rating >= minRating && passCategory;
        const productData = {
          product_id: productId,
          price,
          main_image_url: mainImgUrl,
          detail_page_url,
          site,
          title,
          daily_sales,
          rating,
          listing_time,
          category,
          total_sales,
          status: 1
        };
        const failureReasons = [];
         if (daily_sales < minDailySales) failureReasons.push(`日销量未达标（当前 ${daily_sales}，需≥${minDailySales}）`);
         if (rating < minRating) failureReasons.push(`评分未达标（当前 ${rating}，需≥${minRating}）`);
         if (!passCategory) failureReasons.push(`分类不在白名单（${category || '未知'}）`);
         log('上报准备', { product_id: productId, daily_sales, rating, category, passCategory, willReport, failureReasons });

        if (!willReport) {
          setStatusCard(statusCard, 'skip', failureReasons.join('；') || '不符合采集条件');
        } else {
          // 上报（仅在符合条件时）
          await reportTemuGoods(productData).then(res => {
            const inner = (res && res.data) ? res.data : {};
            const code = inner.code;
            const desc = (inner.desc ?? res?.desc ?? '');
            log('上报响应', { product_id: productId, result: code ?? 'unknown', desc });
            if (code === 200) {
              setStatusCard(statusCard, 'success');
            } else {
              setStatusCard(statusCard, 'fail', desc || '未知错误');
            }
          }).catch(err => {
            log('上报失败', err?.message || err);
            setStatusCard(statusCard, 'fail', err?.message || '网络错误');
          });

          // 随机延迟 3-5 秒后再继续下一个产品，控制请求频率（仅上报后）
          const delayMs = 3000 + Math.floor(Math.random() * 2000);
          log('延迟等待毫秒', delayMs);
          await sleep(delayMs);
        }

        processedIds.add(productId);
        progressCount++;
        if (willReport) qualifiedCount++;
        updateProgress(progressCount, qualifiedCount);
        log('进度', { progressCount, qualifiedCount });
      }

      // 翻页：点击“查看更多”
      const moreBtn = findSpanByText(document, /^\s*查看更多\s*$/);
      if (moreBtn) {
        moreBtn.click();
        updateStatus('点击查看更多，加载新产品…');
        log('点击查看更多', { currentCount });
        await sleep(10000);
        // 滚动至页面底部，触发懒加载
        try {
          const root = document.scrollingElement || document.documentElement || document.body;
          window.scrollTo({ top: root.scrollHeight, behavior: 'smooth' });
          log('滚动至页面底部以加载更多');
        } catch (e) {
          log('滚动到底部异常', e?.message || e);
        }
        const listRootAfter = document.querySelector('.autoFitList') || document.querySelector('.autoFitGoodsList') || document;
        const newNodes = Array.from(listRootAfter.querySelectorAll('[data-tooltip^="goodContainer-"]'));
        const newCount = newNodes.length;
        if (newCount <= currentCount) {
          noNewCount += 1;
        } else {
          noNewCount = 0;
        }
        updateStatus('采集中');
        log('查看更多后的数量', { newCount, noNewCount });
        if (noNewCount >= 2) {
          updateStatus('没有更多新产品，已结束');
          log('采集结束：无新增');
          break;
        }
        lastProductCount = newCount;
        continue;
      } else {
        updateStatus('已完成当前页采集');
        log('采集完成：未找到查看更多');
        break;
      }
    }
  }

  // ===================== DOM/解析辅助 =====================
  function findSpanByText(root, regex) {
    const spans = Array.from(root.querySelectorAll('span'));
    return spans.find(s => regex.test((s.textContent || '').trim())) || null;
  }

  function findPriceText(root) {
    const priceNode = root.querySelector('[data-type="price"] ._2XgTiMJi')
      || root.querySelector('[data-type="price"]')
      || root.querySelector('[data-type="marketPrice"] ._2XgTiMJi');
    return (priceNode?.textContent || '').trim();
  }

  function parsePriceToFloat(text) {
    if (!text) return 0.0;
    const m = text.replace(/[,\s]/g, '').match(/(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : 0.0;
  }

  function findImageUrl(root) {
    const img = root.querySelector('img[data-js-main-img="true"], img.goods-img-external');
    if (img && img.src) return img.src;
    const bgSpan = root.querySelector('span[style*="background-image"]');
    if (bgSpan) {
      const style = bgSpan.getAttribute('style') || '';
      const m = style.match(/background-image:\s*url\(("|')(.*?)("|')\)/);
      if (m) return m[2];
    }
    // 增加对video标签的判断，提取poster属性作为产品图片
    const video = root.querySelector('video');
    if (video && video.poster) return video.poster;
    return '';
  }

  function toAbsoluteUrl(href) {
    if (!href) return '';
    if (/^https?:\/\//i.test(href)) return href;
    return location.origin + href;
  }

  function inferSite(priceText, detailUrl) {
    const cm = (priceText || '').match(/([A-Z]{2})\$/);
    if (cm) return cm[1];
    const pm = (detailUrl || '').match(/^\/(\w{2})-/);
    if (pm) return pm[1].toUpperCase();
    return 'US';
  }

  async function waitForGdidDiv(productId, timeoutMs = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const div = document.querySelector(`div[gdid="${productId}"]`);
      if (div) return div;
      await sleep(500);
    }
    return null;
  }

  function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  // ===================== 云端上报 =====================
  async function reportTemuGoods(data) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.sync.get('userInfo', function(result) {
          const userInfo = result.userInfo;
          if (!userInfo || !userInfo.token) {
            updateStatus('缺少用户信息或未登录');
            return reject(new Error('缺少用户信息'));
          }
          const payload = {
            ...data,
            created_by_user_id: userInfo.id || 0,
            created_by_username: userInfo.nickname || ''
          };
          chrome.runtime.sendMessage({
            action: 'makePOSTRequest',
            url: 'http://119.91.217.3:8087/index.php/admin/index/addTemuGoodsRecord',
            token: userInfo.token,
            data: payload
          }, (response) => {
            // 简单记录返回
            try {
              console.log('[TemuReport] response:', response);
            } catch (e) {}
            resolve(response);
          });
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  // 在DOM加载完成后执行入口方法
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', temuAutoCollectionMain);
  } else {
    temuAutoCollectionMain();
  }
})();