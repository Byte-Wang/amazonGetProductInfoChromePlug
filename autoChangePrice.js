(()=>{
  const targetPath='/myinventory/inventory';
  const doc=document;
  const storageKey='agp_settings';
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
    const line=doc.createElement('div');
    const now=new Date().toLocaleString();
    line.textContent=now+' '+text;
    logBox.appendChild(line);
    logBox.scrollTop=logBox.scrollHeight;
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

    const intervalInputField=createInputField('检测间隔(分钟)','number','1','30','agp_interval');
    const priceDeltaInputField=createInputField('改价幅度','number','0.01','-0.1','agp_delta');
    const minPriceDeltaInputField=createInputField('最低价幅度','number','0.01','-0.5','agp_min_delta');

    container.appendChild(intervalInputField.wrap);
    container.appendChild(priceDeltaInputField.wrap);
    container.appendChild(minPriceDeltaInputField.wrap);

    return {container,intervalInputField,priceDeltaInputField,minPriceDeltaInputField};
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

    container.appendChild(startButton);
    return {container,startButton};
  }

  function applySettingsToInputs(settingsGrid){
    const cfg=loadSettings();
    const interval=typeof cfg.interval==='number'?String(cfg.interval):'30';
    const delta=typeof cfg.delta==='number'?String(cfg.delta):'-0.1';
    const minDelta=typeof cfg.minDelta==='number'?String(cfg.minDelta):'-0.5';
    settingsGrid.intervalInputField.input.value=interval;
    settingsGrid.priceDeltaInputField.input.value=delta;
    settingsGrid.minPriceDeltaInputField.input.value=minDelta;
  }

  function collectSettingsFromInputs(settingsGrid){
    const intervalValue=settingsGrid.intervalInputField.input.value||'30';
    const deltaValue=settingsGrid.priceDeltaInputField.input.value||'-0.1';
    const minDeltaValue=settingsGrid.minPriceDeltaInputField.input.value||'-0.5';
    const intervalNumber=Math.max(1,Number(intervalValue));
    const deltaNumber=Number(deltaValue);
    const minDeltaNumber=Number(minDeltaValue);
    const cfg={interval:intervalNumber,delta:deltaNumber,minDelta:minDeltaNumber};
    return cfg;
  }

  function setupSettingsAutoSave(settingsGrid){
    function onChange(){
      const cfg=collectSettingsFromInputs(settingsGrid);
      saveSettings(cfg);
    }
    settingsGrid.intervalInputField.input.addEventListener('change',onChange);
    settingsGrid.priceDeltaInputField.input.addEventListener('change',onChange);
    settingsGrid.minPriceDeltaInputField.input.addEventListener('change',onChange);
  }

  function setupToolButton(toolButton){
    toolButton.addEventListener('click',function(){
      const modalOverlay=doc.getElementById('agp_modal');
      if(modalOverlay){
        modalOverlay.style.display='flex';
        applySettingsToInputs(globalUi.settingsGrid);
      }
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
    const match=normalized.match(/([A-Za-z]{1,3}\$)?([\d.,]+)\+([A-Za-z]{1,3}\$)?([\d.,]+)/);
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
    appendLog('解析推荐总价 '+String(totalFixed));
    return totalFixed;
  }

  function findProductName(productElement){
    const selectors=[
      '[data-test-id="ProductTitle"]',
      'div[class*="ProductTitle"]',
      'div[class^="VolusProductCard-module__title"]',
      'kat-rich-text',
      'a[href]:not([href="#"])'
    ];
    for(const sel of selectors){
      const el=productElement.querySelector(sel);
      if(el){
        const txt=(el.textContent||'').trim();
        if(txt){
          return txt;
        }
      }
    }
    return '';
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

  function parseTotalFee(productElement){
    const feesCell=productElement.querySelector('div.estimated-fees-cell');
    if(!feesCell){
      return null;
    }
    const firstRow=feesCell.querySelector('div[class^="JanusSplitBox-module__row--"]');
    if(!firstRow){
      return null;
    }
    const labels=firstRow.querySelectorAll('kat-label[emphasis]');
    for(const label of labels){
      const emp=(label.getAttribute('emphasis')||'').trim();
      if(/^[A-Za-z]{1,3}\$[\d.,]+$/.test(emp)){
        return parseFloat(emp.replace(/^[A-Za-z]{1,3}\$/,'').replace(/,/g,''));
      }
    }
    return null;
  }

  async function scanCurrentPage(cfg){
    const products=Array.from(doc.querySelectorAll('div[data-sku]'));
    appendLog('本页发现产品数 '+String(products.length));
    let editedCount=0;
    for(const product of products){
      if(runtimeState.running == false){
        appendLog('已停止');
        continue;
      }
      const skuText=product.getAttribute('data-sku')||'';
      const nameText=findProductName(product);
      appendLog('开始检查 产品 SKU '+skuText+(nameText?(' 名称 '+nameText):''));
      const featuredOffer=product.querySelector('div[data-test-id="FeaturedOfferPrice"]');
      if(!featuredOffer){
        appendLog('未找到推荐报价区域，跳过 SKU '+skuText);
        continue;
      }
      const needAdjust=isOverpriced(featuredOffer);
      appendLog('是否需要改价 '+(needAdjust?'是':'否')+' SKU '+skuText);
      if(!needAdjust){
        continue;
      }
      const recommendedTotal=parseRecommendedTotal(featuredOffer);
      if(recommendedTotal==null){
        appendLog('推荐总价解析失败，跳过 SKU '+skuText);
        continue;
      }
      appendLog('计算出推荐报价： '+skuText+' '+String(recommendedTotal));
      const newPrice=recommendedTotal+cfg.delta;
      const inputs=findPriceInputs(product);
      if(inputs.length<2){
        appendLog('未找到价格输入框，跳过 SKU '+skuText);
        continue;
      }

      const totalFee=parseTotalFee(product);
      if(totalFee!=null){
        const threshold=totalFee*0.3;
        if(newPrice<threshold){
          appendLog('新价格 '+Number(newPrice).toFixed(2)+' 低于总费用30% '+Number(threshold).toFixed(2)+'，跳过 SKU '+skuText);
          continue;
        }
      }

      const priceInput=inputs[0];
      const minPriceInput=inputs[1];
      const minPriceValue=newPrice+cfg.minDelta;
      appendLog('计划设置 价格 '+Number(newPrice).toFixed(2)+' 最低价 '+Number(minPriceValue).toFixed(2)+' SKU '+skuText);
      setInputValue(priceInput,newPrice);
      setInputValue(minPriceInput,minPriceValue);
      editedCount++;
      appendLog('已设置 SKU '+skuText);
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
          continue;
        }
        const moved=await goToNextPage();
        if(!moved){
          break;
        }
        await wait(1000);
      }
    }finally{
      appendLog('本轮完成');
    }
  }

  function setupStartStop(){
    globalUi.actionBar.startButton.addEventListener('click',async function(){
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
    });
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
