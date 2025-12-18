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
      const raw=localStorage.getItem(logStorageKey)||'[]';
      let entries=[];
      try{entries=JSON.parse(raw)||[];}catch(e){entries=[];}
      entries.push({ts:nowTs,text});

      if(entries.length>=2000){
        const content=entries.map(function(x){var d=new Date(x.ts||Date.now());return d.toLocaleString()+' '+(x.text||'');}).join('\r\n');
        const blob=new Blob([content],{type:'text/plain'});
        const url=URL.createObjectURL(blob);
        const a=doc.createElement('a');
        a.href=url;
        a.download='agp_logs_auto_'+new Date(Date.now()+28800000).toISOString().slice(0,19).replace('T','_').replace(/:/g,'-')+'.txt';
        doc.body.appendChild(a);
        a.click();
        setTimeout(function(){doc.body.removeChild(a);URL.revokeObjectURL(url);},0);

        // 导出后清空日志
        entries=[];
        logBox.innerHTML='';
        const clearedLine=doc.createElement('div');
        clearedLine.textContent=new Date().toLocaleString()+' [系统] 日志已达10000行，已自动导出并清空。';
        logBox.appendChild(clearedLine);
      } else {
        // 保留原有的按时间清理逻辑，避免无限增长但未到10000条的情况（可选，或者直接不按时间只按条数）
        // 这里根据用户要求“滚动存储10000行”，我们仅保留最近10000行（如果没触发导出的话），
        // 但既然是“到达10000行自动导出并清空”，那么意味着通常不会超过10000行。
        // 为了安全起见，我们还是只保留这10000条以内的。
      }

      localStorage.setItem(logStorageKey,JSON.stringify(entries));
    }catch(e){}
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
    const autoDaysInputField=createInputField('x天库存无变化自动改价','number','1','3','agp_auto_days');
    const skuWhitelistField=createTextarea('SKU白名单(逗号分隔)','sku1,sku2...','agp_sku_whitelist');

    container.appendChild(intervalInputField.wrap);
    container.appendChild(priceDeltaInputField.wrap);
    container.appendChild(floorRatioInputField.wrap);
    container.appendChild(autoDaysInputField.wrap);
    container.appendChild(skuWhitelistField.wrap);

    return {container,intervalInputField,priceDeltaInputField,floorRatioInputField,autoDaysInputField,skuWhitelistField};
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
    const intervalNumber=Math.max(1,Number(intervalValue));
    const deltaNumber=Number(deltaValue);
    const floorRatioNumber=Number(floorRatioValue);
    const autoDaysNumber=Math.max(0,Number(autoDaysValue));
    const cfg={
      interval:intervalNumber,
      delta:deltaNumber,
      floorRatio:floorRatioNumber,
      autoDays:autoDaysNumber,
      skuWhitelist:skuWhitelistValue
    };
    return cfg;
  }

  function setupSettingsAutoSave(settingsGrid){
    function onChange(){
      const cfg=collectSettingsFromInputs(settingsGrid);
      saveSettings(cfg);
    }
    settingsGrid.intervalInputField.input.addEventListener('change',onChange);
    settingsGrid.priceDeltaInputField.input.addEventListener('change',onChange);
    settingsGrid.floorRatioInputField.input.addEventListener('change',onChange);
    settingsGrid.autoDaysInputField.input.addEventListener('change',onChange);
    settingsGrid.skuWhitelistField.textarea.addEventListener('change',onChange);
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



  async function scanCurrentPage(cfg){
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
      
      const skuText=product.getAttribute('data-sku')||'';

      if(whitelist.has(skuText)){
        appendLog('SKU '+skuText+' 在白名单中，跳过改价');
        continue;
      }

      
      const nameText=findProductName(product);
      const stock=parseInventoryCount(product);
      if(productStatus && productStatus!=='在售'){
        appendLog('状态 '+productStatus+' 非在售，跳过 SKU '+skuText);
        continue;
      }

      const inputs=findPriceInputs(product);
      if(inputs.length<2){
        appendLog('未找到价格输入框，跳过 SKU '+skuText);
        continue;
      }
      const priceInput=inputs[0];
      const minPriceInput=inputs[1];
      const originalPriceText = priceInput.value;
      const originalMinText = minPriceInput.value;

      const asin = parseAsin(product);

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
        let changed=true;
        if(prev&&typeof prev==='object'){
          const sameStatus=(prev.status||'')===currStatus;
          const sameStock=(prev.stock==null?currStock==null:prev.stock===currStock);
          const samePrice=Number(prev.price||NaN)===currPriceNum;
          changed=!(sameStatus&&sameStock&&samePrice);
        }
        if(changed){
          recStore[skuText]={status:currStatus,stock:(currStock==null?null:Number(currStock)),price:currPriceNum,ts:nowTs};
          localStorage.setItem(recordKey,JSON.stringify(recStore));
          await addChangePriceRecord({
            sku:skuText,
            product_title:nameText||'',
            original_price:Number(originalPriceText),
            new_price:Number(originalPriceText),
            total_cost:Number(0),
            type:2,
            sales_status:productStatus||'',
            stock:(typeof stock==='number'?stock:0),
            store_name:storeName||'',
            operator_user_id:0,
            operator_username:'',
            asin:asin||'',
          });
        }
        const autoDaysMs=Math.max(0,Number(cfg.autoDays||0))*24*60*60*1000;
        if(autoDaysMs>0 && prev && typeof prev.ts==='number'){
          const elapsed=nowTs-prev.ts;
          const sameStatus=(prev.status||'')===currStatus;
          const sameStock=(prev.stock==null?currStock==null:prev.stock===currStock);
          const samePrice=Number(prev.price||NaN)===currPriceNum;
          if(elapsed>=autoDaysMs && sameStatus && sameStock && samePrice && !changed){
            const autoNewPrice=currPriceNum+Number(cfg.delta||0);
            const totalFeeAuto=await parseTotalFee(product);
            if(totalFeeAuto!=null){
              const thresholdAuto=totalFeeAuto*cfg.floorRatio;
              if(autoNewPrice<=thresholdAuto){
                appendLog('超过'+String(cfg.autoDays)+'天无变化，但新价不满足总费用*'+String(cfg.floorRatio)+' 下限，跳过 SKU '+skuText);
              }else{
                appendLog('超过'+String(cfg.autoDays)+'天无变化，按当前价改价 '+String(currPriceNum.toFixed(2))+' -> '+String(autoNewPrice.toFixed(2))+' SKU '+skuText);
                appendLog('SKU:['+skuText + ']符合条件，准备改价， 原价：'+String(currPriceNum.toFixed(2))+' -> 新价格 '+String(autoNewPrice.toFixed(2)));
                setInputValue(priceInput,autoNewPrice);
                setInputValue(minPriceInput,NaN);
                editedCount++;
                await addChangePriceRecord({
                  sku:skuText,
                  product_title:nameText||'',
                  original_price:Number(currPriceNum),
                  new_price:Number(autoNewPrice),
                  total_cost:Number(totalFeeAuto||0),
                  type:1,
                  sales_status:productStatus||'',
                  stock:(typeof currStock==='number'?currStock:0),
                  store_name:storeName||'',
                  operator_user_id:0,
                  operator_username:'',
                  asin:asin||''
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
    

      const totalFee=await parseTotalFee(product);
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
      setInputValue(minPriceInput,NaN);
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
        asin:asin||''
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

  async function addChangePriceRecord(payload){
    const userInfo=await new Promise(function(resolve){
      chrome.storage.sync.get('userInfo',function(result){
        resolve(result && result.userInfo);
      });
    });
    if(!userInfo||!userInfo.token){
      FXLog('[checkVersionIsAvalible] 没有token，未登录：');
      alert('请先登录！');
      return null;
    }
    payload.operator_user_id=userInfo.id;
    payload.operator_username=userInfo.nickname;
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
        const count=await scanCurrentPage(cfg);
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

  async function startStopClick(){
    if(runtimeState.running){
      runtimeState.running=false;
      globalUi.actionBar.startButton.textContent='开始改价';
      appendLog('已停止');
      return;
    } else {
      globalUi.actionBar.startButton.textContent='停止改价';
      runtimeState.running=true;
    }
    await runOneCycle();
    const currentSettings=loadSettings();
    const delayMs=Math.max(1,Number(currentSettings.interval||30))*60000;
    runtimeState.timer=setTimeout(async function loop(){
      if(runtimeState.running == false){
        return;
      }
      await runOneCycle();
      const latest=loadSettings();
      const nextDelay=Math.max(1,Number(latest.interval||30))*60000;
      runtimeState.timer=setTimeout(loop,nextDelay);
    },delayMs);
  }

  const globalUi={};
  if(isTargetPage()){
    createFloatButton();
    const modal=createModal();
    globalUi.modalOverlay=modal.modalOverlay;
    globalUi.settingsGrid=modal.settingsGrid;
    globalUi.logBox=modal.logBox;
    globalUi.actionBar=modal.actionBar;
    setupStartStop();
  }
})();
