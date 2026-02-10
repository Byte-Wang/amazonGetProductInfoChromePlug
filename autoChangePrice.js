(()=>{
  const targetPath='/myinventory/inventory';
  const doc=document;
  const storageKey='agp_settings';
  const logStorageKey='agp_logs';
  const runtimeState={running:false,timer:null};

  function isTargetPage(){
    return location.href.includes(targetPath);
  }

  function loadSettings(){
    try{
      const raw=localStorage.getItem(storageKey)||'{}';
      return JSON.parse(raw);
    }catch(err){
      return {};
    }
  }

  function saveSettings(settings){
    localStorage.setItem(storageKey,JSON.stringify(settings));
  }

  // 日志缓存，减少localStorage读取次数
  let logCache=null;
  let lastCacheTime=0;
  const CACHE_TTL=5000; // 缓存5秒
  const MAX_LOG_ENTRIES=1000; // 最大保留1000条日志
  
  function appendLog(text){
    const logBox=doc.getElementById('agp_log');
    if(!logBox){
      return;
    }
    const now=new Date().toLocaleString();
    const line=doc.createElement('div');
    line.textContent=now+' '+text;
    logBox.appendChild(line);
    logBox.scrollTop=logBox.scrollHeight;

    try{
      const nowTs=Date.now();
      
      // 使用缓存减少localStorage读取
      if(!logCache||Date.now()-lastCacheTime>CACHE_TTL){
        const raw=localStorage.getItem(logStorageKey)||'[]';
        try{logCache=JSON.parse(raw)||[];}catch(e){logCache=[];}
        lastCacheTime=Date.now();
      }
      
      // 添加新日志
      logCache.push({ts:nowTs,text});
      
      // 滚动窗口：只保留最近的MAX_LOG_ENTRIES条
      if(logCache.length>MAX_LOG_ENTRIES){
        logCache=logCache.slice(-MAX_LOG_ENTRIES);
      }

      // 达到2000条时导出并清空
      if(logCache.length>=2000){
        const content=logCache.map(function(x){var d=new Date(x.ts||Date.now());return d.toLocaleString()+' '+(x.text||'');}).join('\r\n');
        const blob=new Blob([content],{type:'text/plain'});
        const url=URL.createObjectURL(blob);
        const a=doc.createElement('a');
        a.href=url;
        a.download='agp_logs_auto_'+new Date(Date.now()+28800000).toISOString().slice(0,19).replace('T','_').replace(/:/g,'-')+'.txt';
        doc.body.appendChild(a);
        a.click();
        setTimeout(function(){doc.body.removeChild(a);URL.revokeObjectURL(url);},0);

        // 清空缓存和日志
        logCache=[];
        logBox.innerHTML='';
        const clearedLine=doc.createElement('div');
        clearedLine.textContent=new Date().toLocaleString()+' [系统] 日志已达2000行，已自动导出并清空。';
        logBox.appendChild(clearedLine);
      }

      // 保存到localStorage
      localStorage.setItem(logStorageKey,JSON.stringify(logCache));
      
      // 及时释放大对象引用
      if(logCache.length>=2000){
        logCache=null;
      }
    }catch(e){
      console.error('日志保存失败:',e);
    }
  }

  function createFloatButton(){
    const floatButton=doc.createElement('div');
    floatButton.id='agp_float_btn';
    floatButton.style.position='fixed';
    floatButton.style.top='120px';
    floatButton.style.right='0';
    floatButton.style.background='#e6f2ff';
    floatButton.style.color='#000';
    floatButton.style.borderRadius='12px 0 0 12px';
    floatButton.style.boxShadow='rgba(0,0,0,0.2) 0 2px 8px';
    floatButton.style.zIndex='999999';
    floatButton.style.display='flex';
    floatButton.style.alignItems='center';
    floatButton.style.cursor='default';

    const dragHandle=doc.createElement('div');
    dragHandle.style.width='8px';
    dragHandle.style.height='36px';
    dragHandle.style.cursor='grab';
    dragHandle.style.background='rgba(0,0,0,0.1)';
    dragHandle.style.borderRadius='8px 0 0 8px';

    const toolButton=doc.createElement('div');
    toolButton.textContent='自动改价工具';
    toolButton.style.padding='8px 12px';
    toolButton.style.cursor='pointer';
    toolButton.style.userSelect='none';

    floatButton.appendChild(dragHandle);
    floatButton.appendChild(toolButton);
    doc.body.appendChild(floatButton);

    setupFloatButtonDrag(floatButton,dragHandle);
    setupToolButton(toolButton);

    return {floatButton,dragHandle,toolButton};
  }

  function setupFloatButtonDrag(floatButton,dragHandle){
    let dragStartY=0;
    let dragStartTop=0;
    let isDragging=false;

    function onMouseDown(event){
      isDragging=true;
      dragHandle.style.cursor='grabbing';
      dragStartY=event.clientY;
      dragStartTop=floatButton.getBoundingClientRect().top;
      event.preventDefault();
    }

    function onMouseMove(event){
      if(!isDragging){
        return;
      }
      const deltaY=event.clientY-dragStartY;
      const proposedTop=dragStartTop+deltaY;
      const clampedTop=Math.max(0,Math.min(window.innerHeight-36,proposedTop));
      floatButton.style.top=clampedTop+'px';
    }

    function onMouseUp(){
      isDragging=false;
      dragHandle.style.cursor='grab';
    }

    dragHandle.addEventListener('mousedown',onMouseDown);
    doc.addEventListener('mousemove',onMouseMove);
    doc.addEventListener('mouseup',onMouseUp);
  }

  function createModal(){
    const modalOverlay=doc.createElement('div');
    modalOverlay.id='agp_modal';
    modalOverlay.style.position='fixed';
    modalOverlay.style.inset='0';
    modalOverlay.style.display='none';
    modalOverlay.style.alignItems='center';
    modalOverlay.style.justifyContent='center';
    modalOverlay.style.zIndex='999999';
    modalOverlay.style.background='rgba(0,0,0,0.25)';

    const modalPanel=doc.createElement('div');
    modalPanel.style.width='640px';
    modalPanel.style.maxWidth='90vw';
    modalPanel.style.background='#fff';
    modalPanel.style.borderRadius='10px';
    modalPanel.style.boxShadow='rgba(0,0,0,0.3) 0 8px 24px';
    modalPanel.style.fontFamily='system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif';

    const modalHeader=doc.createElement('div');
    modalHeader.style.display='flex';
    modalHeader.style.alignItems='center';
    modalHeader.style.justifyContent='space-between';
    modalHeader.style.padding='12px 16px';
    modalHeader.style.borderBottom='1px solid #eee';

    const modalTitle=doc.createElement('div');
    modalTitle.textContent='自动改价工具';
    modalTitle.style.fontWeight='600';

    const closeButton=doc.createElement('button');
    closeButton.textContent='×';
    closeButton.style.background='transparent';
    closeButton.style.border='none';
    closeButton.style.fontSize='20px';
    closeButton.style.cursor='pointer';
    closeButton.addEventListener('click',function(){
      modalOverlay.style.display='none';
    });

    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);

    const modalContent=doc.createElement('div');
    modalContent.style.padding='12px 16px';

    const settingsGrid=createSettingsGrid();
    const logBox=createLogBox();
    const actionBar=createActionBar();

    modalContent.appendChild(settingsGrid.container);
    modalContent.appendChild(logBox);
    modalContent.appendChild(actionBar.container);

    modalPanel.appendChild(modalHeader);
    modalPanel.appendChild(modalContent);
    modalOverlay.appendChild(modalPanel);
    doc.body.appendChild(modalOverlay);

    applySettingsToInputs(settingsGrid);
    setupSettingsAutoSave(settingsGrid);

    return {modalOverlay,settingsGrid,logBox,actionBar};
  }

  function createSettingsGrid(){
    const container=doc.createElement('div');
    container.style.display='grid';
    container.style.gridTemplateColumns='1fr 1fr 1fr';
    container.style.gap='12px';

    function createInputField(label,type,step,placeholder,id){
      const wrap=doc.createElement('div');
      const title=doc.createElement('div');
      title.textContent=label;
      title.style.marginBottom='6px';
      title.style.fontSize='12px';
      title.style.color='#555';
      const input=doc.createElement('input');
      input.type=type;
      input.step=step;
      input.placeholder=placeholder;
      input.id=id;
      input.style.width='100%';
      input.style.boxSizing='border-box';
      input.style.padding='8px';
      input.style.border='1px solid #ddd';
      input.style.borderRadius='6px';
      wrap.appendChild(title);
      wrap.appendChild(input);
      return {wrap,input};
    }

    function createTextarea(label,placeholder,id){
      const wrap=doc.createElement('div');
      wrap.style.gridColumn='1 / -1';
      const title=doc.createElement('div');
      title.textContent=label;
      title.style.marginBottom='6px';
      title.style.fontSize='12px';
      title.style.color='#555';
      const textarea=doc.createElement('textarea');
      textarea.placeholder=placeholder;
      textarea.id=id;
      textarea.style.width='100%';
      textarea.style.height='60px';
      textarea.style.boxSizing='border-box';
      textarea.style.padding='8px';
      textarea.style.border='1px solid #ddd';
      textarea.style.borderRadius='6px';
      textarea.style.resize='vertical';
      textarea.style.fontFamily='inherit';
      wrap.appendChild(title);
      wrap.appendChild(textarea);
      return {wrap,textarea};
    }

    const intervalInputField=createInputField('检测间隔(分钟)','number','1','30','agp_interval');
    const priceDeltaInputField=createInputField('改价幅度','number','0.01','-0.01','agp_delta');
    const floorRatioInputField=createInputField('价格底线比例','number','0.01','2','agp_floor_ratio');
    floorRatioInputField.input.min = '1.3';
    const autoDaysInputField=createInputField('x天库存无变化自动改价','number','1','3','agp_auto_days');
    const skuWhitelistField=createTextarea('SKU白名单(逗号分隔)','sku1,sku2...','agp_sku_whitelist');
    
    // 创建动态改价勾选框
    const dynamicPricingField={
      wrap: doc.createElement('div'),
      input: doc.createElement('input')
    };
    const dynamicPricingTitle=doc.createElement('div');
    dynamicPricingTitle.textContent='勾选采用动态改价；不勾选根据推荐报价改价';
    dynamicPricingTitle.style.fontSize='12px';
    dynamicPricingTitle.style.color='#555';
    dynamicPricingTitle.style.marginLeft='8px';
    dynamicPricingTitle.style.lineHeight='20px';
    dynamicPricingField.input.type='checkbox';
    dynamicPricingField.input.id='agp_dynamic_pricing';
    dynamicPricingField.input.style.margin='0';
    dynamicPricingField.input.style.verticalAlign='middle';
    // 设置容器为flex布局，实现左右排列
    dynamicPricingField.wrap.style.display='flex';
    dynamicPricingField.wrap.style.alignItems='center';
    dynamicPricingField.wrap.style.marginBottom='6px';
    // 加载保存的状态，默认为不勾选
    const savedSettings=localStorage.getItem(storageKey)||'{}';
    let settings={};
    try{
      settings=JSON.parse(savedSettings)||{};
    }catch(e){
      settings={};
    }
    dynamicPricingField.input.checked=settings.dynamicPricing||false;
    dynamicPricingField.wrap.appendChild(dynamicPricingField.input);
    dynamicPricingField.wrap.appendChild(dynamicPricingTitle);

    container.appendChild(intervalInputField.wrap);
    container.appendChild(priceDeltaInputField.wrap);
    container.appendChild(floorRatioInputField.wrap);
    container.appendChild(autoDaysInputField.wrap);
    container.appendChild(skuWhitelistField.wrap);
    container.appendChild(dynamicPricingField.wrap);

    return {container,intervalInputField,priceDeltaInputField,floorRatioInputField,autoDaysInputField,skuWhitelistField,dynamicPricingField};
  }

  function createLogBox(){
    const logBox=doc.createElement('div');
    logBox.id='agp_log';
    logBox.style.marginTop='12px';
    logBox.style.height='300px';
    logBox.style.background='#000';
    logBox.style.color='#fff';
    logBox.style.fontSize='12px';
    logBox.style.padding='8px';
    logBox.style.overflow='auto';
    return logBox;
  }

  function createActionBar(){
    const container=doc.createElement('div');
    container.style.display='flex';
    container.style.gap='12px';
    container.style.marginTop='12px';

    const startButton=doc.createElement('button');
    startButton.id='agp_start';
    startButton.textContent='开始改价';
    startButton.style.background='#1677ff';
    startButton.style.color='#fff';
    startButton.style.border='none';
    startButton.style.padding='8px 12px';
    startButton.style.borderRadius='6px';
    startButton.style.cursor='pointer';

    const exportButton=doc.createElement('button');
    exportButton.id='agp_export_logs';
    exportButton.textContent='导出日志';
    exportButton.style.background='#52c41a';
    exportButton.style.color='#fff';
    exportButton.style.border='none';
    exportButton.style.padding='8px 12px';
    exportButton.style.borderRadius='6px';
    exportButton.style.cursor='pointer';
    exportButton.addEventListener('click',function(){
      try{
        const raw=localStorage.getItem(logStorageKey)||'[]';
        let entries=[];
        try{entries=JSON.parse(raw)||[];}catch(e){entries=[];}
        const content=entries.map(function(x){var d=new Date(x.ts||Date.now());return d.toLocaleString()+' '+(x.text||'');}).join('\r\n');
        const blob=new Blob([content],{type:'text/plain'});
        const url=URL.createObjectURL(blob);
        const a=doc.createElement('a');
        a.href=url;
        a.download='agp_logs_'+new Date(Date.now()+28800000).toISOString().slice(0,19).replace('T','_').replace(/:/g,'-')+'.txt';
        doc.body.appendChild(a);
        a.click();
        setTimeout(function(){doc.body.removeChild(a);URL.revokeObjectURL(url);},0);

        localStorage.setItem(logStorageKey,'[]');
        const logBox=doc.getElementById('agp_log');
        if(logBox){
          logBox.innerHTML='';
          const clearedLine=doc.createElement('div');
          clearedLine.textContent=new Date().toLocaleString()+' [系统] 手动导出日志完成，已清空。';
          logBox.appendChild(clearedLine);
        }
      }catch(e){}
    });

    const exportRecordsButton=doc.createElement('button');
    exportRecordsButton.id='agp_export_records';
    exportRecordsButton.textContent='导出本地缓存库存记录';
    exportRecordsButton.style.background='#fa8c16';
    exportRecordsButton.style.color='#fff';
    exportRecordsButton.style.border='none';
    exportRecordsButton.style.padding='8px 12px';
    exportRecordsButton.style.borderRadius='6px';
    exportRecordsButton.style.cursor='pointer';
    exportRecordsButton.addEventListener('click',function(){
      try{
        const recordKey='agp_product_records';
        const raw=localStorage.getItem(recordKey)||'{}';
        let recStore={};
        try{recStore=JSON.parse(raw)||{};}catch(e){recStore={};}
        const nowTs=Date.now();
        const header=['sku','状态','库存','价格','记录时间','未变化天数'];
        const rows=[header.join(',')];
        for(const sku in recStore){
          if(!Object.prototype.hasOwnProperty.call(recStore,sku)) continue;
          const r=recStore[sku]||{};
          const ts=typeof r.ts==='number'?r.ts:nowTs;
          const days=Math.floor((nowTs-ts)/(24*60*60*1000));
          const dt=new Date(ts).toLocaleString();
          const status=(r.status!=null?r.status:'');
          const stock=(r.stock!=null?String(r.stock):'');
          const price=(r.price!=null?String(r.price):'');
          const row=[sku,status,stock,price,dt,String(days)].map(function(v){
            var s=String(v);
            if(s.includes(',')||s.includes('"')){s='"'+s.replace(/"/g,'""')+'"';}
            return s;
          }).join(',');
          rows.push(row);
        }
        const csv=rows.join('\n');
        const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
        const url=URL.createObjectURL(blob);
        const a=doc.createElement('a');
        a.href=url;
        a.download='agp_inventory_records_'+new Date().toISOString().slice(0,10)+'.csv';
        doc.body.appendChild(a);
        a.click();
        setTimeout(function(){doc.body.removeChild(a);URL.revokeObjectURL(url);},0);
      }catch(e){}
    });

    container.appendChild(startButton);
    container.appendChild(exportButton);
    container.appendChild(exportRecordsButton);
    return {container,startButton,exportButton,exportRecordsButton};
  }

  function applySettingsToInputs(settingsGrid){
    const cfg=loadSettings();
    const interval=typeof cfg.interval==='number'?String(cfg.interval):'30';
    const delta=typeof cfg.delta==='number'?String(cfg.delta):'-0.1';
    const floorRatio=typeof cfg.floorRatio==='number'?String(cfg.floorRatio):'1.3';
    const autoDays=typeof cfg.autoDays==='number'?String(cfg.autoDays):'3';
    const skuWhitelist=typeof cfg.skuWhitelist==='string'?cfg.skuWhitelist:'';
    settingsGrid.intervalInputField.input.value=interval;
    settingsGrid.priceDeltaInputField.input.value=delta;
    settingsGrid.floorRatioInputField.input.value=floorRatio;
    settingsGrid.autoDaysInputField.input.value=autoDays;
    settingsGrid.skuWhitelistField.textarea.value=skuWhitelist;
  }

  function collectSettingsFromInputs(settingsGrid){
    const intervalValue=settingsGrid.intervalInputField.input.value||'30';
    const deltaValue=settingsGrid.priceDeltaInputField.input.value||'-0.1';
    const floorRatioValue=settingsGrid.floorRatioInputField.input.value||'1.3';
    const autoDaysValue=settingsGrid.autoDaysInputField.input.value||'3';
    const skuWhitelistValue=settingsGrid.skuWhitelistField.textarea.value||'';
    const dynamicPricingValue=settingsGrid.dynamicPricingField.input.checked||false;
    const intervalNumber=Math.max(1,Number(intervalValue));
    const deltaNumber=Number(deltaValue);
    const floorRatioNumber=Math.max(1.3, Number(floorRatioValue));
    const autoDaysNumber=Math.max(0,Number(autoDaysValue));
    const cfg={
      interval:intervalNumber,
      delta:deltaNumber,
      floorRatio:floorRatioNumber,
      autoDays:autoDaysNumber,
      skuWhitelist:skuWhitelistValue,
      dynamicPricing:dynamicPricingValue
    };
    return cfg;
  }

  function setupSettingsAutoSave(settingsGrid){    function onChange(){      const cfg=collectSettingsFromInputs(settingsGrid);      saveSettings(cfg);    }
    settingsGrid.intervalInputField.input.addEventListener('change',onChange);
    settingsGrid.priceDeltaInputField.input.addEventListener('change',onChange);
    settingsGrid.floorRatioInputField.input.addEventListener('change',onChange);
    settingsGrid.autoDaysInputField.input.addEventListener('change',onChange);
    settingsGrid.skuWhitelistField.textarea.addEventListener('change',onChange);
    settingsGrid.dynamicPricingField.input.addEventListener('change',onChange);
  }

  function setupToolButton(toolButton){
    toolButton.addEventListener('click',function(){

       chrome.storage.sync.get('userInfo', function(result) {
          FXLog("[checkVersionIsAvalible] 获取用户信息：",result);
          const userInfo = result.userInfo;
          if (!userInfo || !userInfo.token) {
              FXLog("[checkVersionIsAvalible] 没有token，未登录：");
              alert("请先登录！");
              return;
          }
          
          const modalOverlay=doc.getElementById('agp_modal');
          if(modalOverlay){
            modalOverlay.style.display='flex';
            applySettingsToInputs(globalUi.settingsGrid);
            try{
              const raw=localStorage.getItem(logStorageKey)||'[]';
              let entries=[];
              try{entries=JSON.parse(raw)||[];}catch(e){entries=[];}
              const logBox=globalUi.logBox;
              if(logBox){
                logBox.innerHTML='';
                for(const x of entries){
                  const line=doc.createElement('div');
                  const d=new Date((x&&typeof x.ts==='number')?x.ts:Date.now());
                  line.textContent=d.toLocaleString()+' '+(x&&x.text?x.text:'');
                  logBox.appendChild(line);
                }
                logBox.scrollTop=logBox.scrollHeight;
              }
            }catch(e){}
          }
        });

      
    });
  }

  function wait(ms){
    return new Promise(function(resolve){
      setTimeout(resolve,ms);
    });
  }

  function scrollPageToBottom(){
    const bodyHeight=doc.body?doc.body.scrollHeight:0;
    const docHeight=doc.documentElement?doc.documentElement.scrollHeight:0;
    const target=Math.max(bodyHeight,docHeight);
    window.scrollTo({top:target,behavior:'auto'});
  }

  function scrollPageToTop(){
    window.scrollTo({top:0,behavior:'auto'});
  }

  function clickSearchButton(){
    const searchButton=doc.querySelector('div[class^="SearchBox-module__searchButton"]');
    if(!searchButton){
      appendLog('未找到搜索按钮');
      return false;
    }
    searchButton.click();
    appendLog('已点击搜索按钮');
    return true;
  }

  function parseASIN(productElement){
    const rows=productElement.querySelectorAll('div[class^="JanusSplitBox-module__row--"]');
    for(const row of rows){
      const panels=Array.from(row.querySelectorAll('div[class^="JanusSplitBox-module__panel"]'));
      if(panels.length===2){
        const firstText=(panels[0].textContent||'').trim();
        if(firstText.toUpperCase()==='ASIN'){
          return (panels[1].textContent||'').trim();
        }
      }
    }
    return '';
  }

  function parseRecommendedTotal(featuredOfferContainer){
    const spans=featuredOfferContainer.querySelectorAll('span');
    let targetSpan=null;
    for(const span of spans){
      const text=span.textContent||'';
      if(text.includes('+')){
        targetSpan=span;
        break;
      }
    }
    if(!targetSpan){
      appendLog('匹配不到span');
      return null;
    }
    const rawText=targetSpan.textContent||'';
    const normalized=rawText.replace(/\s+/g,'');
    const match=normalized.match(/([A-Za-z]{0,5}\$|£|€|¥|₹)?([\d.,]+)\+([A-Za-z]{0,5}\$|£|€|¥|₹)?([\d.,]+)/);
    if(!match){
      appendLog('正则解析失败'+rawText);
      return null;
    }
    const price=parseFloat(match[2].replace(/,/g,''));
    const shipping=parseFloat(match[4].replace(/,/g,''));
    if(isNaN(price)||isNaN(shipping)){
      return null;
    }
    const total=price+shipping;
    const totalFixed=Number(total.toFixed(2));
    return totalFixed;
  }

  function findProductName(productElement){
    const textContainer=productElement.querySelector('div[class^="ProductDetails-module__textFieldsContainer--"]');
    if(textContainer){
      const anchor=textContainer.querySelector('a');
      if(anchor){
        const txt=(anchor.textContent||'').trim();
        if(txt){
          return txt;
        }
      }
    }
    return '';
  }



  function findStoreName(){
    const navbar=doc.getElementById('navbar');
    if(!navbar){
      return '';
    }
    const span=navbar.querySelector('span.dropdown-account-switcher-header-label-global');
    if(!span){
      return '';
    }
    const txt=(span.textContent||'').trim();
    return txt;
  }

  function findRegionName(){
    const navbar=doc.getElementById('navbar');
    if(!navbar){
      return '';
    }
    const span=navbar.querySelector('span.dropdown-account-switcher-header-label-regional');
    if(!span){
      return '';
    }
    const txt=(span.textContent||'').trim();
    return txt;
  }
  function parseInventoryCount(productElement){
    const cells=productElement.querySelectorAll('div[class^="TableCell-module__cellLayout"]');
    for(const cell of cells){
      const rows=cell.querySelectorAll('div[class^="JanusSplitBox-module__row"]');
      for(const row of rows){
        const panels=Array.from(row.querySelectorAll('div[class^="JanusSplitBox-module__panel"]'));
        if(panels.length===2){
          const firstLabel=panels[0].querySelector('kat-label');
          const emp=(firstLabel&&firstLabel.getAttribute('emphasis'))?firstLabel.getAttribute('emphasis').trim():'';
          if(emp.includes('有货')){
            const text=(panels[1].textContent||'').trim();
            const m=text.match(/\d+/);
            if(m){
              return parseInt(m[0],10);
            }
          }
        }
      }
    }
    return null;
  }

  function parseLast24hSales(productElement, skuText){
    // 获取当前库存
    const currentStock = parseInventoryCount(productElement);
    if (currentStock === null) {
      return 0;
    }
    
    // 从本地存储中读取历史库存记录
    const stockRecordKey = 'agp_stock_records';
    const rawStockRec = localStorage.getItem(stockRecordKey) || '{}';
    let stockStore = {};
    try {
      stockStore = JSON.parse(rawStockRec) || {};
    } catch (e) {
      stockStore = {};
    }
    
    // 获取当前时间
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    
    // 获取该SKU的历史库存记录
    const skuStockRecords = stockStore[skuText] || [];
    
    // 过滤出24小时内的库存记录
    const recentStockRecords = skuStockRecords.filter(record => record.timestamp >= twentyFourHoursAgo);
    
    // 计算24小时销量
    let sales = 0;
    if (recentStockRecords.length > 0) {
      // 按时间排序，最早的在前
      recentStockRecords.sort((a, b) => a.timestamp - b.timestamp);
      // 最早的库存减去当前库存就是销量
      const earliestStock = recentStockRecords[0].stock;
      sales = Math.max(0, earliestStock - currentStock);
    }
    
    // 更新本地存储，添加当前库存记录
    const newStockRecord = {
      timestamp: now,
      stock: currentStock
    };
    
    // 保留最近7天的记录，最多50条
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const updatedStockRecords = [
      ...skuStockRecords.filter(record => record.timestamp >= sevenDaysAgo),
      newStockRecord
    ].slice(-50); // 最多保留50条记录
    
    stockStore[skuText] = updatedStockRecords;
    localStorage.setItem(stockRecordKey, JSON.stringify(stockStore));
    
    return sales;
  }

  function findProductStatus(productElement){
    const statusContainer=productElement.querySelector('div[class^="Status-module__container--"]');
    if(!statusContainer){
      return '';
    }
    const label=statusContainer.querySelector('kat-label');
    if(!label){
      return '';
    }
    const emp=(label.getAttribute('emphasis')||'').trim();
    return emp;
  }
  function setInputValue(inputElement,value){
    if(!inputElement){
      return;
    }
    const numericValue=Number(value);
    inputElement.value=Number.isFinite(numericValue)?numericValue.toFixed(2):'';
    inputElement.dispatchEvent(new Event('input',{bubbles:true}));
    inputElement.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function findPriceInputs(productElement){
    const container=productElement.querySelector('div[class^="VolusPriceInputComposite-module__container"]');
    if(!container){
      return [];
    }
    const katInputElements=Array.from(container.querySelectorAll('kat-input'));
    const inputs=[];
    for(const kat of katInputElements){
      let inputEl=null;
      if(kat.shadowRoot){
        inputEl=kat.shadowRoot.querySelector('input');
      }
      if(!inputEl){
        inputEl=kat.querySelector('input');
      }
      if(inputEl){
        inputs.push(inputEl);
      }
    }
    return inputs;
  }

  function findEditBar(){
    return doc.querySelector('div[class^="VolusEditBar-module__container"]');
  }

  async function clickSaveAll(){
    appendLog('尝试查找保存按钮，最多等待 6 秒');
    const timeoutMs=6000;
    const start=Date.now();
    while(Date.now()-start<timeoutMs){
      const editBar=findEditBar();
      if(editBar){
        const katButtons=Array.from(editBar.querySelectorAll('kat-button'));
        let targetKatButton=null;
        for(const kat of katButtons){
          const label=kat.getAttribute('label')||'';
          if(label==='保存所有'){
            targetKatButton=kat;
            break;
          }
        }
        if(targetKatButton){
          const innerButton=(targetKatButton.shadowRoot&&targetKatButton.shadowRoot.querySelector('button'))||targetKatButton.querySelector('button');
          if(innerButton){
            innerButton.click();
            appendLog('已点击保存所有按钮');
            return true;
          }
        }
      }
      await wait(250);
    }
    appendLog('等待保存按钮超过 6 秒仍未找到');
    return false;
  }

  function isOverpriced(featuredOfferContainer){
    const fullText=featuredOfferContainer.textContent||'';
    return fullText.includes('您的标准商品价格加上运费高于相应价格');
  }

  async function parseTotalFee(productElement){
    const maxRetries=5;
    const delayMs=2000;
    for(let attempt=1; attempt<=maxRetries; attempt++){
      const feesCell=productElement.querySelector('div.estimated-fees-cell');
      if(!feesCell){
        if(attempt<maxRetries){
          appendLog('未找到总费用div，重试 '+String(attempt)+'/'+String(maxRetries));
          await wait(delayMs);
          continue;
        }
        appendLog('未找到总费用div，放弃');
        return null;
      }
      const rows=feesCell.querySelectorAll('div[class^="JanusSplitBox-module__row--"]');
      let finded=null;
      for(const row of rows){
        const labels=row.querySelectorAll('kat-label[emphasis]');
        if(labels.length>=2){
          const first=(labels[0].getAttribute('emphasis')||'').trim();
          const second=(labels[1].getAttribute('emphasis')||'').trim();
          if(first==='总费用'){
            const m=second.match(/[\d.,]+/);
            if(m){
              return parseFloat(m[0].replace(/,/g,''));
            }
            finded=second;
          }
        }
      }
      if(finded){
        if(attempt<maxRetries){
          appendLog('找到总费用，但正则匹配失败：'+finded+'，重试 '+String(attempt)+'/'+String(maxRetries));
          await wait(delayMs);
          continue;
        }
        appendLog('找到总费用，但正则匹配失败：'+finded+'，放弃');
        return null;
      } else {
        if(attempt<maxRetries){
          appendLog('未找到总费用label，重试 '+String(attempt)+'/'+String(maxRetries));
          await wait(delayMs);
          continue;
        }
        appendLog('未找到总费用label，放弃');
        return null;
      }
    }
    return null;
  }

  async function saveProductInfoToCloud(product){
    const productStatus=findProductStatus(product);
    const storeName=findStoreName();
    const regionName=findRegionName();
    const asin = parseASIN(product);
    const nameText=findProductName(product);
    const stock=parseInventoryCount(product);
    const skuText=product.getAttribute('data-sku')||'';
    const totalFee=await parseTotalFee(product);

    const inputs=findPriceInputs(product);
    let originalPriceText = 0;
    if(inputs.length > 0){
      const priceInput=inputs[0];
      originalPriceText = priceInput.value;
    }
    
    const recordKey='agp_product_records';
    const rawRec=localStorage.getItem(recordKey)||'{}';
    let recStore={};
    try{recStore=JSON.parse(rawRec)||{};}catch(e){recStore={};}
    const prev=recStore[skuText]||null;
    const currStatus=productStatus||'';
    const currStock=(typeof stock==='number')?stock:null;
    const currPriceNum=Number(originalPriceText);
    const nowTs=Date.now();
    const currTotalFee=totalFee!=null?Number(totalFee):0;
    let changed=true;
    if(prev&&typeof prev==='object'){
      const sameStatus=(prev.status||'')===currStatus;
      const sameStock=(prev.stock==null?currStock==null:prev.stock===currStock);
      const samePrice=Number(prev.price||NaN)===currPriceNum;
      const sameTotalFee=Number(prev.total_fee||NaN)===currTotalFee;
      changed=!(sameStatus&&sameStock&&samePrice&&sameTotalFee);

      if (changed) {
        if (!sameStatus) {
          appendLog('SKU：'+skuText+' 状态改变，从 '+prev.status+' 到 '+currStatus);
        }
        if (!sameStock) {
          appendLog('SKU：'+skuText+' 库存改变，从 '+prev.stock+' 到 '+currStock);
        }
        if (!samePrice) {
          appendLog('SKU：'+skuText+' 价格改变，从 '+prev.price+' 到 '+originalPriceText);
        }
        if (!sameTotalFee) {
          appendLog('SKU：'+skuText+' 总费用改变，从 '+prev.total_fee+' 到 '+totalFee);
        }
      }
    }
    if(changed){
      recStore[skuText]={
        status:currStatus,
        stock:(currStock==null?null:Number(currStock)),
        price:currPriceNum,
        total_fee:currTotalFee,
        ts:nowTs};
      localStorage.setItem(recordKey,JSON.stringify(recStore));
      await addChangePriceRecord({
        sku:skuText,
        product_title:nameText||'',
        original_price:Number(originalPriceText),
        new_price:Number(originalPriceText),
        total_cost:Number(totalFee||0),
        type:2,
        sales_status:productStatus||'',
        stock:(typeof stock==='number'?stock:0),
        store_name:storeName||'',
        operator_user_id:0,
        operator_username:'',
        asin:asin||'',
        region_name:regionName||'',
      });
    }
  }
 async function scanCurrentPageOld(cfg){
    const products=Array.from(doc.querySelectorAll('div[data-sku]'));
    appendLog('本页发现产品数 '+String(products.length));
    
    const whitelistRaw=cfg.skuWhitelist||'';
    const whitelist=new Set(whitelistRaw.split(/[,，\n]/).map(function(s){return s.trim();}).filter(function(s){return s;}));

    let editedCount=0;
    for(const product of products){
      if(runtimeState.running == false){
        appendLog('已停止');
        continue;
      }
      const productStatus=findProductStatus(product);
      const storeName=findStoreName();
      const regionName=findRegionName();
      const asin = parseASIN(product);
      const nameText=findProductName(product);
      const stock=parseInventoryCount(product);
      const skuText=product.getAttribute('data-sku')||'';
      const totalFee=await parseTotalFee(product);

      // appendLog('SKU:'+skuText+',ASIN:'+asin+',店铺:'+storeName+',区域:'+regionName+',状态:'+productStatus+',库存:'+stock);

      const inputs=findPriceInputs(product);
      
      let originalPriceText = 0;
      let originalMinText = 0;
      let priceInput;
      let minPriceInput;
      if(inputs.length > 0){
        priceInput=inputs[0];
        originalPriceText = priceInput.value;
      }
      if(inputs.length > 1){
        minPriceInput=inputs[1];
        originalMinText = minPriceInput.value;
      }

      //
      try{
        const recordKey='agp_product_records';
        const rawRec=localStorage.getItem(recordKey)||'{}';
        let recStore={};
        try{recStore=JSON.parse(rawRec)||{};}catch(e){recStore={};}
        const prev=recStore[skuText]||null;
        const currStatus=productStatus||'';
        const currStock=(typeof stock==='number')?stock:null;
        const currPriceNum=Number(originalPriceText);
        const nowTs=Date.now();
        const currTotalFee=totalFee!=null?Number(totalFee):0;
        let changed=true;
        if(prev&&typeof prev==='object'){
          const sameStatus=(prev.status||'')===currStatus;
          const sameStock=(prev.stock==null?currStock==null:prev.stock===currStock);
          const samePrice=Number(prev.price||NaN)===currPriceNum;
          const sameTotalFee=Number(prev.total_fee||NaN)===currTotalFee;
          changed=!(sameStatus&&sameStock&&samePrice&&sameTotalFee);
        }
        await saveProductInfoToCloud(product);

        if(whitelist.has(skuText)){
          appendLog('SKU '+skuText+' 在白名单中，跳过改价');
          continue;
        }
        if(productStatus && productStatus!=='在售'){
          appendLog('状态 '+productStatus+' 非在售，跳过 SKU '+skuText);
          continue;
        }

        if(inputs.length<2){
          appendLog('未找到价格输入框，跳过 SKU '+skuText);
          continue;
        }

        const autoDaysMs=Math.max(0,Number(cfg.autoDays||0))*24*60*60*1000;
        if(autoDaysMs>0 && prev && typeof prev.ts==='number'){
          const elapsed=nowTs-prev.ts;
          const sameStatus=(prev.status||'')===currStatus;
          const sameStock=(prev.stock==null?currStock==null:prev.stock===currStock);
          const samePrice=Number(prev.price||NaN)===currPriceNum;
          if(elapsed>=autoDaysMs && sameStatus && sameStock && samePrice && !changed){
            const autoNewPrice=currPriceNum+Number(cfg.delta||0);
            
            if(totalFee!=null){
              const thresholdAuto=totalFee*cfg.floorRatio;
              if(autoNewPrice<=thresholdAuto){
                appendLog('超过'+String(cfg.autoDays)+'天无变化，但新价不满足总费用*'+String(cfg.floorRatio)+' 下限，跳过 SKU '+skuText);
              }else{
                appendLog('超过'+String(cfg.autoDays)+'天无变化，按当前价改价 '+String(currPriceNum.toFixed(2))+' -> '+String(autoNewPrice.toFixed(2))+' SKU '+skuText);
                appendLog('SKU:['+skuText + ']符合条件，准备改价， 原价：'+String(currPriceNum.toFixed(2))+' -> 新价格 '+String(autoNewPrice.toFixed(2)));
                setInputValue(priceInput,autoNewPrice);
                if (originalMinText && Number(originalMinText) > 0){
                  setInputValue(minPriceInput,autoNewPrice - 0.1);
                }
                editedCount++;
                await addChangePriceRecord({
                  sku:skuText,
                  product_title:nameText||'',
                  original_price:Number(currPriceNum),
                  new_price:Number(autoNewPrice),
                  total_cost:Number(totalFee||0),
                  type:1,
                  sales_status:productStatus||'',
                  stock:(typeof currStock==='number'?currStock:0),
                  store_name:storeName||'',
                  operator_user_id:0,
                  operator_username:'',
                  asin:asin||'',
                  region_name:regionName||'',
                });
                await wait(1000);
                continue;
              }
            }else{
              appendLog('超过'+String(cfg.autoDays)+'天无变化，但总费用解析失败，跳过 SKU '+skuText);
              continue;
            }
          }
        }
      }catch(e){
        appendLog('改价过程中发生错误，跳过 SKU '+skuText+' 错误信息：'+e.message);
        continue;
      }

      // appendLog('开始检查 产品 SKU '+skuText+(nameText?(' 名称 '+nameText):''));
      const featuredOffer=product.querySelector('div[data-test-id="FeaturedOfferPrice"]');
      if(!featuredOffer){
        appendLog('未找到推荐报价区域，跳过 SKU '+skuText);
        continue;
      }
      const needAdjust=isOverpriced(featuredOffer);
      if(!needAdjust){
        appendLog('没有新的推荐报价，不改价 '+'跳过 SKU '+skuText);
        continue;
      }
      const recommendedTotal=parseRecommendedTotal(featuredOffer);
      if(recommendedTotal==null){
        appendLog('推荐总价解析失败，跳过 SKU '+skuText);
        continue;
      }
      // appendLog('计算出推荐报价： '+skuText+' '+String(recommendedTotal));
      const newPrice=recommendedTotal+cfg.delta;
    

      let threshold=0;
      if(totalFee!=null){
        threshold=totalFee*cfg.floorRatio;
        if(newPrice <= threshold){
          appendLog('新价格 '+Number(newPrice).toFixed(2)+' 低于总费用*'+cfg.floorRatio+' 的下限('+Number(threshold).toFixed(2)+')，跳过 SKU '+skuText);
          continue;
        }
      } else {
        appendLog('总费用解析失败，跳过 SKU '+skuText);
        continue;
      }
      // appendLog('允许改价，最低阈值 '+Number(totalFee).toFixed(2)+' * '+cfg.floorRatio+'='+Number(threshold).toFixed(2));
      
    

      if (Number(originalPriceText).toFixed(2) === Number(newPrice).toFixed(2)) {
        appendLog('价格未改变，跳过 SKU '+skuText);
        continue;
      }

      appendLog('SKU:['+skuText + ']符合条件，准备改价， 原价：'+originalPriceText+' -> 新价格 '+Number(newPrice).toFixed(2));
      
      setInputValue(priceInput,newPrice);
      if (originalMinText && Number(originalMinText) > 0){
        setInputValue(minPriceInput,newPrice - 0.1);
      }
      editedCount++;
      await addChangePriceRecord({
        sku:skuText,
        product_title:nameText||'',
        original_price:Number(originalPriceText),
        new_price:Number(newPrice),
        total_cost:Number(totalFee||0),
        type:1,
        sales_status:productStatus||'',
        stock:(typeof stock==='number'?stock:0),
        store_name:storeName||'',
        operator_user_id:0,
        operator_username:'',
        asin:asin||'',
        region_name:regionName||'',
      });
      await wait(1000);
    }
    if(editedCount>0){
      appendLog('准备保存 '+editedCount+' 个SKU');
      await wait(2000);
      const saved=await clickSaveAll();
      appendLog(saved?'已点击保存所有':'未找到保存按钮');
    }
    return products.length;
  }

  async function scanCurrentPageNew(cfg){
    appendLog('========== 开始扫描当前页面改价任务 ==========');
    // appendLog('配置信息：');
    // appendLog('  白名单SKU数量：'+cfg.skuWhitelist?(cfg.skuWhitelist.split(/[,，\n]/).filter(s=>s.trim()).length):0);
    // appendLog('  扫描间隔：'+cfg.interval+'毫秒');
    
    const products=Array.from(doc.querySelectorAll('div[data-sku]'));
    appendLog('本页发现产品数 '+String(products.length));
    
    const whitelistRaw=cfg.skuWhitelist||'';
    const whitelist=new Set(whitelistRaw.split(/[,，\n]/).map(function(s){return s.trim();}).filter(function(s){return s;}));
    
    let editedCount=0;
    let highRiskSKUs=[];
    
    for(const product of products){
      if(runtimeState.running == false){
        appendLog('已停止');
        continue;
      }

      

      const productStatus=findProductStatus(product);
      const storeName=findStoreName();
      const regionName=findRegionName();
      const asin = parseASIN(product);
      const nameText=findProductName(product);
      const stock=parseInventoryCount(product);
      const skuText=product.getAttribute('data-sku')||'';
      const totalFee=await parseTotalFee(product);

      appendLog('---------- 开始处理产品(sku:'+skuText+') ['+(editedCount+1)+'/'+products.length+'] ----------');
      
      await saveProductInfoToCloud(product);
      
      // appendLog('SKU '+skuText+' 基本信息：');
      // appendLog('  产品名称：'+nameText);
      // appendLog('  ASIN：'+asin);
      // appendLog('  库存：'+stock);
      // appendLog('  状态：'+productStatus);
      // appendLog('  店铺：'+storeName);
      // appendLog('  地区：'+regionName);

      if(whitelist.has(skuText)){
        appendLog('SKU '+skuText+' 在白名单中，跳过改价');
        continue;
      }
      if(productStatus && productStatus!=='在售'){
        appendLog('SKU '+skuText+' 状态为 '+productStatus+'，非在售状态，跳过改价');
        continue;
      }

      const inputs=findPriceInputs(product);
      if(inputs.length<2){
        appendLog('SKU '+skuText+' 未找到价格输入框，跳过改价');
        continue;
      }
      const priceInput=inputs[0];
      const minPriceInput=inputs[1];
      const originalPriceText = priceInput.value;
      const originalMinText = minPriceInput.value;
      const currPriceNum=Number(originalPriceText);
      
      try{
        // ───────────────────────────────────────
        // 步骤1：获取实时数据
        // ───────────────────────────────────────
        const last24hSales=parseLast24hSales(product, skuText);
        appendLog('SKU '+skuText+' 24h 销售数 '+String(last24hSales));
        appendLog('SKU '+skuText+' 当前库存：'+parseInventoryCount(product));
        const featuredOffer=product.querySelector('div[data-test-id="FeaturedOfferPrice"]');
        let recommendedTotal=null;
        if(featuredOffer){
          recommendedTotal=parseRecommendedTotal(featuredOffer);
        }
        
        appendLog('SKU '+skuText+' 实时数据：当前售价='+currPriceNum.toFixed(2)+'，24h销量='+last24hSales+'，推荐报价='+(recommendedTotal?recommendedTotal.toFixed(2):'无')+'，总费用='+(totalFee?totalFee.toFixed(2):'无'));
        
        // 【新增】异常保护：费用 ≥ 售价 → 极可能已亏损
        if(totalFee!=null && totalFee >= currPriceNum){
          appendLog('【警告】SKU '+skuText+'：总费用('+totalFee.toFixed(2)+') ≥ 售价('+currPriceNum.toFixed(2)+')，暂停调价！');
          highRiskSKUs.push(skuText);
          continue;
        }
        
        const dynamicMinPrice=totalFee!=null?totalFee*1.30:currPriceNum*0.8; // 默认1.3倍费用或当前价格的80%
        appendLog('SKU '+skuText+' 动态最低限价='+dynamicMinPrice.toFixed(2));
        
        // ───────────────────────────────────────
        // 步骤2：读取本地状态（从持久化存储）
        // ───────────────────────────────────────
        const recordKey='agp_product_records_auto';
        const rawRec=localStorage.getItem(recordKey)||'{}';
        let recStore={};
        try{recStore=JSON.parse(rawRec)||{};}catch(e){recStore={};}
        appendLog('SKU '+skuText+' 本地状态读取：成功加载存储记录，共包含 '+Object.keys(recStore).length+' 个SKU的状态');
        const prev=recStore[skuText]||{};
        appendLog('SKU '+skuText+' 历史状态：'+(prev?'已存在':'首次处理'));
        
        // 读取本地状态
        let consecutiveNoSalesHours=Number(prev.consecutiveNoSalesHours)||0;
        const lastPriceChangeTime=Number(prev.lastPriceChangeTime)||Date.now();
        const priceChangeQueue=Array.isArray(prev.priceChangeQueue)?prev.priceChangeQueue:[];
        
        // ───────────────────────────────────────
        // 步骤3：更新滞销计时器
        // ───────────────────────────────────────
        if(last24hSales===0){
          // 计算从上次更新到现在经过的小时数
          const now=Date.now();
          const lastUpdateTime=Number(prev.ts)||now;
          const hoursElapsed=(now-lastUpdateTime)/(3600*1000);
          consecutiveNoSalesHours += hoursElapsed;
          appendLog('SKU '+skuText+' 滞销计时更新：本次经过'+hoursElapsed.toFixed(1)+'小时，累计滞销'+consecutiveNoSalesHours.toFixed(1)+'小时');
        }else{
          consecutiveNoSalesHours=0;
          appendLog('SKU '+skuText+' 有销量('+last24hSales+')，重置滞销计时');
        }
        
        const hoursSinceLastChange=(Date.now()-lastPriceChangeTime)/(3600*1000);
        
        appendLog('SKU '+skuText+' 本地状态：连续滞销小时='+consecutiveNoSalesHours.toFixed(1)+'，距上次改价='+hoursSinceLastChange.toFixed(1)+'小时，调价队列='+JSON.stringify(priceChangeQueue));
        
        // ───────────────────────────────────────
        // 步骤4：销售状态
        // ───────────────────────────────────────
        let salesStatus='滞销';
        if(last24hSales>=3){
          salesStatus='热销';
        }else if(last24hSales>0){
          salesStatus='一般';
        }
        appendLog('SKU '+skuText+' 销售状态：'+salesStatus+' (24h销量='+last24hSales+')');
        
        // ───────────────────────────────────────
        // 步骤5：计算建议新价格
        // ───────────────────────────────────────
        let suggestedNewPrice=currPriceNum; // 默认不变
        let priceChangeReason='价格保持不变';
        
        if(salesStatus!=='滞销'){
          if(recommendedTotal && currPriceNum < recommendedTotal*1.10){
            suggestedNewPrice=currPriceNum*1.03;
            priceChangeReason='热销/一般状态，当前价低于推荐价110%，建议提价3%';
          }else{
            suggestedNewPrice=currPriceNum*1.01;
            priceChangeReason='热销/一般状态，建议小幅提价1%';
          }
        }else if(salesStatus==='滞销' && consecutiveNoSalesHours < 24){
          suggestedNewPrice=currPriceNum;
          priceChangeReason='滞销初期(<24小时)，保持价格观望';
        }else if(consecutiveNoSalesHours >= 24 && hoursSinceLastChange >= 6){
          // 检查价格稳定期：若最近3次均为降价，则强制跳过本次调价
          const priceStabilizationActive=(priceChangeQueue.length===3 && priceChangeQueue.every(direction=>direction==='down'));
          appendLog('SKU '+skuText+' 价格稳定期检查：调价队列='+JSON.stringify(priceChangeQueue)+'，是否触发保护='+(priceStabilizationActive?'是':'否'));
          
          if(!priceStabilizationActive){
            if(consecutiveNoSalesHours < 48){
              suggestedNewPrice=currPriceNum*0.95;
              priceChangeReason='滞销24-48小时，建议降价5%';
            }else if(consecutiveNoSalesHours < 72){
              suggestedNewPrice=currPriceNum*0.93;
              priceChangeReason='滞销48-72小时，建议降价7%';
            }else{
              suggestedNewPrice=dynamicMinPrice;
              priceChangeReason='滞销超过72小时，建议降至最低限价';
            }
          }else{
            priceChangeReason='价格稳定期保护：最近3次均为降价，跳过本次调价';
          }
        }else if(consecutiveNoSalesHours >= 24 && hoursSinceLastChange < 6){
          priceChangeReason='距上次改价不足6小时，跳过本次调价';
        }
        
        appendLog('SKU '+skuText+' 价格计算：'+priceChangeReason+'，建议新价='+suggestedNewPrice.toFixed(2));
        
        // ───────────────────────────────────────
        // 步骤6：强制应用价格底线
        // ───────────────────────────────────────
        const suggestedPriceBeforeFloor=suggestedNewPrice;
        suggestedNewPrice=Math.max(suggestedNewPrice,dynamicMinPrice);
        if(suggestedPriceBeforeFloor !== suggestedNewPrice){
          appendLog('SKU '+skuText+' 价格底线保护：建议价('+suggestedPriceBeforeFloor.toFixed(2)+')低于最低限价('+dynamicMinPrice.toFixed(2)+')，已调整至最低限价');
        }else{
          appendLog('SKU '+skuText+' 价格底线检查：建议价('+suggestedPriceBeforeFloor.toFixed(2)+')符合最低限价要求，无需调整');
        }
        
        // ───────────────────────────────────────
        // 步骤7：决策是否执行调价
        // ───────────────────────────────────────
        let executePriceChange=false;
        let priceChangeDirection='';
        let skipReason='';
        
        if(suggestedNewPrice!==currPriceNum){
          const priceChangeRatio=Math.abs(suggestedNewPrice-currPriceNum)/currPriceNum;
          if(priceChangeRatio>=0.01){ // 价格变动比例≥1%
            executePriceChange=true;
            priceChangeDirection=suggestedNewPrice>currPriceNum?'up':'down';
            appendLog('SKU '+skuText+' 调价决策：符合条件，执行调价 (变动比例='+(priceChangeRatio*100).toFixed(1)+'%)');
          }else{
            skipReason='价格变动比例不足1% ('+(priceChangeRatio*100).toFixed(2)+'%)';
            appendLog('SKU '+skuText+' 调价决策：跳过，'+skipReason);
          }
        }else{
          skipReason='建议价格与当前价格相同';
          appendLog('SKU '+skuText+' 调价决策：跳过，'+skipReason);
        }
        
        // ───────────────────────────────────────
        // 步骤8：执行 & 更新状态
        // ───────────────────────────────────────
        if(executePriceChange){
          // 应用新价格
          setInputValue(priceInput,suggestedNewPrice);
          appendLog('SKU '+skuText+' 已设置新价格到输入框：'+suggestedNewPrice.toFixed(2));
          
          if(originalMinText && Number(originalMinText) > 0){
            setInputValue(minPriceInput,suggestedNewPrice - 0.1);
            appendLog('SKU '+skuText+' 已设置最低限价：'+(suggestedNewPrice - 0.1).toFixed(2));
          }else{
            appendLog('SKU '+skuText+' 未设置最低限价（原最低限价为空或0）');
          }
          
          // 更新本地状态
          const updatedPriceChangeQueue=[...priceChangeQueue,priceChangeDirection];
          if(updatedPriceChangeQueue.length>3){
            updatedPriceChangeQueue.shift(); // 保持最多3条记录
          }
          
          recStore[skuText]={
            ...prev,
            status:productStatus,
            stock:stock,
            price:suggestedNewPrice,
            ts:Date.now(),
            consecutiveNoSalesHours:consecutiveNoSalesHours,
            lastPriceChangeTime:Date.now(),
            priceChangeQueue:updatedPriceChangeQueue
          };
          
          // 记录改价信息
          appendLog('SKU ['+skuText+'] 符合条件，准备改价');
          appendLog('  原价：'+currPriceNum.toFixed(2)+' -> 新价格：'+suggestedNewPrice.toFixed(2));
          appendLog('  销售状态：'+salesStatus+'，过去24小时销量：'+last24hSales+'，连续滞销小时：'+consecutiveNoSalesHours.toFixed(1));
          appendLog('  调价队列更新：'+JSON.stringify(updatedPriceChangeQueue));
          
          appendLog('SKU '+skuText+' 开始上传改价记录到服务器...');
          await addChangePriceRecord({
            sku:skuText,
            product_title:nameText||'',
            original_price:currPriceNum,
            new_price:suggestedNewPrice,
            total_cost:Number(totalFee||0),
            type:1,
            sales_status:salesStatus,
            stock:typeof stock==='number'?stock:0,
            store_name:storeName||'',
            operator_user_id:0,
            operator_username:'',
            asin:asin||'',
            region_name:regionName||'',
          });
          appendLog('SKU '+skuText+' 改价记录上传完成');
          
          editedCount++;
          appendLog('SKU '+skuText+' 改价完成，等待1秒后继续下一个SKU');
          await wait(1000);
        }else{
          // 更新滞销计时器（无论是否调价）
          recStore[skuText]={
            ...prev,
            status:productStatus,
            stock:stock,
            price:currPriceNum,
            ts:Date.now(),
            consecutiveNoSalesHours:consecutiveNoSalesHours
          };
          appendLog('SKU '+skuText+' 未执行改价，原因：'+skipReason);
          appendLog('SKU '+skuText+' 已更新本地状态（滞销计时器等）');
        }
        
        // 更新lastUpdateTime用于计算滞销小时数
        recStore[skuText].lastUpdateTime=Date.now();
        
        // 保存更新后的本地状态
        appendLog('SKU '+skuText+' 准备保存本地状态：');
        appendLog('  状态更新项：状态='+productStatus+', 库存='+stock+', 价格='+recStore[skuText].price.toFixed(2)+', 滞销小时='+consecutiveNoSalesHours.toFixed(1));
        appendLog('  时间戳：'+new Date(Date.now()).toLocaleString());
        localStorage.setItem(recordKey,JSON.stringify(recStore));
        appendLog('SKU '+skuText+' 本地状态已保存（包含lastUpdateTime）');
        
        appendLog('---------- 产品处理完成 ----------');
        
      }catch(e){
        appendLog('【错误】SKU '+skuText+' 改价过程中发生异常：');
        appendLog('  错误类型：'+e.name);
        appendLog('  错误信息：'+e.message);
        appendLog('  错误堆栈：'+e.stack);
        appendLog('  已跳过该SKU，继续处理下一个产品');
        continue;
      }
    }
    
    // ───────────────────────────────────────
    // 步骤9：异常 SKU 汇总上报（供前端展示）
    // ───────────────────────────────────────
    if(highRiskSKUs.length>0){
      localStorage.setItem('agp_high_risk_skus',JSON.stringify(highRiskSKUs));
      appendLog('发现 '+highRiskSKUs.length+' 个高风险SKU，请检查！');
      highRiskSKUs.forEach((sku,index)=>{
        appendLog('  高风险SKU '+(index+1)+'：'+sku.sku+' (风险：'+sku.riskType+')');
      });
    }else{
      localStorage.removeItem('agp_high_risk_skus');
      appendLog('未发现高风险SKU');
    }
    
    // ───────────────────────────────────────
    // 步骤10：保存改价结果
    // ───────────────────────────────────────
    appendLog('========== 改价任务汇总 ==========');
    appendLog('处理产品总数：'+products.length);
    appendLog('执行改价数量：'+editedCount);
    appendLog('跳过改价数量：'+(products.length-editedCount));
    appendLog('===================================');
    
    if(editedCount>0){
      appendLog('准备保存 '+editedCount+' 个SKU的改价结果');
      await wait(2000);
      const saved=await clickSaveAll();
      appendLog(saved?'已点击保存所有按钮，改价结果已提交':'未找到保存按钮，请手动保存');
    }else{
      appendLog('本次扫描无需改价，跳过保存操作');
    }
    
    return products.length;
  }

  async function addChangePriceRecord(payload){
    const userInfo=await new Promise(function(resolve){
      chrome.storage.sync.get('userInfo',function(result){
        resolve(result && result.userInfo);
      });
    });
    if(!userInfo||!userInfo.token){
      FXLog('[checkVersionIsAvalible] 没有token，未登录：');
      alert('请先登录！');
      appendLog('【错误】未登录，无法上传改价记录到服务器');
      return null;
    }
    payload.operator_user_id=userInfo.id;
    payload.operator_username=userInfo.nickname;
    if (payload.type == 1) {
      appendLog('保存改价记录到云端：SKU='+payload.sku+'，原价='+payload.original_price.toFixed(2)+'，新价='+payload.new_price.toFixed(2));
    } else {
      appendLog('更新产品库存等信息到云端：SKU='+payload.sku+'，库存='+payload.stock+'，价格='+payload.original_price.toFixed(2)+'，总费用='+payload.total_cost.toFixed(2)+'，状态='+payload.sales_status);
    }
    
    const response=await new Promise(function(resolve){
      chrome.runtime.sendMessage({
        action:'makePOSTRequest',
        url:'http://119.91.217.3:8087/index.php/admin/index/addPriceChangeRecord',
        token:userInfo.token,
        data:payload
      },function(resp){
        resolve(resp);
      });
    });
    try{console.log('[changePrice] response:',response);}catch(e){}
    appendLog('请求已发送，响应状态：'+(response?'成功':'失败'));
    return response;
  }

  async function goToNextPage(){
    const pagination=doc.querySelector('kat-pagination');
    if(!pagination){
      appendLog('未找到分页组件，无法翻页');
      return false;
    }
    const itemsPerPage=parseInt(pagination.getAttribute('items-per-page')||'0',10);
    const currentPage=parseInt(pagination.getAttribute('page')||'0',10);
    const totalItems=parseInt(pagination.getAttribute('total-items')||'0',10);
    if(!itemsPerPage||!totalItems){
      appendLog('分页数据不完整，itemsPerPage 或 totalItems 为空');
      return false;
    }
    const totalPages=Math.ceil(totalItems/itemsPerPage)||1;
    appendLog('尝试翻页 当前页 '+String(currentPage)+' / 总页数 '+String(totalPages));
    if(currentPage>=totalPages){
      appendLog('已是最后一页');
      return false;
    }
    const nextNavSpan=(pagination.shadowRoot && pagination.shadowRoot.querySelector('span[part="pagination-nav-right"]'))
      || pagination.querySelector('span[part="pagination-nav-right"]');
    if(nextNavSpan){
      const cls=nextNavSpan.getAttribute('class')||'';
      if(cls.split(/\s+/).includes('end')||/\bend\b/.test(cls)){
        appendLog('已是最后一页');
        return false;
      }
      nextNavSpan.click();
      appendLog('已触发翻页至 '+String(currentPage+1));
      return true;
    }
    appendLog('未找到下一页按钮');
    return false;
  }

  async function waitForMoreProducts(previousCount){
    appendLog('等待加载新产品，最多 10 秒');
    const start=Date.now();
    while(Date.now()-start<10000){
      await wait(500);
      const productsNow=Array.from(doc.querySelectorAll('div[data-sku]')).length;
      if(productsNow>previousCount){
        appendLog('已检测到新产品，数量 '+String(productsNow));
        return true;
      }
    }
    appendLog('等待超时，未检测到新产品');
    return false;
  }

  async function runOneCycle(){
    if(runtimeState.running == false){
      return;
    }
    const cfg=collectSettingsFromInputs(globalUi.settingsGrid);
    saveSettings(cfg);
    scrollPageToTop();
    appendLog('已滚动到页面顶部');
    await wait(1000);
    if(runtimeState.running == false){
      appendLog('已停止');
      return;
    }
    clickSearchButton();
    appendLog('点击搜索按钮刷新列表');
    await wait(8000);
    if(runtimeState.running == false){
      appendLog('已停止');
      return;
    }
    appendLog('开始改价');
    try{
      let keepGoing=true;
      while(keepGoing){
        if(runtimeState.running == false){
          appendLog('已停止');
          break;
        }
        appendLog('改价模式：'+(cfg.dynamicPricing ? '动态改价' : '推荐报价改价'));
        // 根据动态改价设置选择调用的方法
        const count=cfg.dynamicPricing ? await scanCurrentPageNew(cfg) : await scanCurrentPageOld(cfg);
        appendLog('滚动至页面底部，尝试加载更多产品');
        scrollPageToBottom();
        await wait(300);
        const loaded=await waitForMoreProducts(count);
        if(loaded){
          await wait(5000);
          continue;
        }
        const moved=await goToNextPage();
        if(!moved){
          break;
        }
        await wait(10000);
      }
    }finally{
      appendLog('本轮完成');
    }
  }

  function setupStartStop(){
    globalUi.actionBar.startButton.addEventListener('click',function(){
      chrome.storage.sync.get('userInfo', async function(result) {
        FXLog("[checkVersionIsAvalible] 获取用户信息：",result);
        const userInfo = result.userInfo;
        if (!userInfo || !userInfo.token) {
            FXLog("[checkVersionIsAvalible] 没有token，未登录：");
            alert("请先登录！");
            return;
        }
        await startStopClick();
      });
    });
  }

  function setInputsDisabled(disabled){
    const grid = globalUi.settingsGrid;
    if(!grid) return;
    if(grid.intervalInputField && grid.intervalInputField.input) grid.intervalInputField.input.disabled = disabled;
    if(grid.priceDeltaInputField && grid.priceDeltaInputField.input) grid.priceDeltaInputField.input.disabled = disabled;
    if(grid.floorRatioInputField && grid.floorRatioInputField.input) grid.floorRatioInputField.input.disabled = disabled;
    if(grid.autoDaysInputField && grid.autoDaysInputField.input) grid.autoDaysInputField.input.disabled = disabled;
    if(grid.skuWhitelistField && grid.skuWhitelistField.textarea) grid.skuWhitelistField.textarea.disabled = disabled;
  }

  async function startStopClick(){
    if(runtimeState.running){
      runtimeState.running=false;
      globalUi.actionBar.startButton.textContent='开始改价';
      localStorage.setItem("feixunAutoChangePriceIsRunning",0);
      setInputsDisabled(false);
      appendLog('已停止');
      return;
    } else {
      globalUi.actionBar.startButton.textContent='停止改价';
      localStorage.setItem("feixunAutoChangePriceIsRunning",1);
      runtimeState.running=true;
      setInputsDisabled(true);
    }
    await runOneCycle();
    const currentSettings=loadSettings();
    const delayMs=Math.max(1,Number(currentSettings.interval||30))*60000;
    appendLog(String(delayMs/1000)+'秒后开始下一轮');
    setTimeout(function(){
      if(runtimeState.running == false){
        appendLog('已停止');
        return;
      }
      location.reload(true)
    },delayMs);
    // runtimeState.timer=setTimeout(async function loop(){
    //   if(runtimeState.running == false){
    //     return;
    //   }
    //   await runOneCycle();
    //   const latest=loadSettings();
    //   const nextDelay=Math.max(1,Number(latest.interval||30))*60000;
    //   runtimeState.timer=setTimeout(loop,nextDelay);
    // },delayMs);
  }

  const globalUi={};
  if(isTargetPage()){
    const floatModal = createFloatButton();
    const isRunning = localStorage.getItem("feixunAutoChangePriceIsRunning");
    
    const modal=createModal();
    globalUi.modalOverlay=modal.modalOverlay;
    globalUi.settingsGrid=modal.settingsGrid;
    globalUi.logBox=modal.logBox;
    globalUi.actionBar=modal.actionBar;
    setupStartStop();

    if (isRunning == 1) {
      floatModal.toolButton.click();
      appendLog('自动改价开启中，5秒后开始下一轮');
      setTimeout(() => {
        globalUi.actionBar.startButton.click();
      }, 5000);
    }
  }
})();
