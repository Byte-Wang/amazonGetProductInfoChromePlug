async function Ax(e, t, r = !1, n = !1) {
  function a(e, t) {
    // 将三元运算符改为if/else语句
    if (r && "A" !== e && "Y" !== e) {
      return {
        type: "Z",
        imageUrl: t?.imageUrl,
        salesRank: t?.salesRank ?? 0,
        requirements: t.requirements
      };
    } else {
      return {
        type: e,
        imageUrl: t?.imageUrl,
        salesRank: t?.salesRank ?? 0,
        requirements: t.requirements
      };
    }
  }
  
  try {
    let o = null;
    try {
      // 单独声明变量r
      let searchResponse = await fetch(`${t}/productsearch/v2/search?q=${e}&page=1`, {
        body: null,
        method: "GET",
        mode: "cors",
        credentials: "include"
      });
      
      if (200 !== searchResponse.status) {
        throw Error("请求失败");
      }
      
      o = await searchResponse.json();
    } catch (fetchError) {
      return a("Y", { imageUrl: null, salesRank: null });
    }
    
    let i = o.products[0];
    
    // 拆分条件判断
    const newConditionStatus = i.conditionGatingStatuses.find(status => {
      return ["New", "全新"].includes(status.displayLabel);
    });
    
    if (!newConditionStatus?.hasPathForward) {
      return a("G", i);
    }
    
    if (i.parent) {
      return a("H", i);
    }
    
    if (!i.restrictedForAllConditions && !i.pathToSellUrl) {
      if (n) {
        let broadcastChannel = new BroadcastChannel("OfferValidation");
        
        // 拆分Promise创建过程
        let validationPromise = new Promise((resolve, reject) => {
          // 设置超时处理
          setTimeout(() => {
            broadcastChannel.close();
            Ap({ name: "gohref", body: { href: `${t}/abis/listing/syh/offer?asin=${e}`, status: 0 } });
            resolve("");
          }, 15e3);
          
          // 监听消息
          broadcastChannel.onmessage = function(message) {
            if (message.data.asin === e) {
              broadcastChannel.close();
              Ap({ name: "gohref", body: { href: `${t}/abis/listing/syh/offer?asin=${e}`, status: 0 } });
              resolve(message.data.text);
            }
          };
        });
        
        Ap({ name: "gohref", body: { href: `${t}/abis/listing/syh/offer?asin=${e}`, active: !1 } });
        
        try {
          let validationResult = await validationPromise;
          let errorCodeMatch = validationResult.match(/错误代码 (.*?)。/);
          
          // 单独检查另一个匹配模式
          if (!errorCodeMatch) {
            errorCodeMatch = validationResult.match(/error code (\d+)\./);
          }
          
          if (errorCodeMatch) {
            return a(`弹窗(${errorCodeMatch[1]})`, i);
          }
          
          let errorCodes = ["5886", "5885"];
          for (let index = 0; index < errorCodes.length; index++) {
            let code = errorCodes[index];
            if (validationResult.includes(code)) {
              return a(`弹窗(${code})`, i);
            }
          }
        } catch (validationError) {
          // 保留原有错误处理行为
        }
      }
      
      return a("A", i);
    }
    
    if (JSON.stringify(i.qualificationMessages).includes("Transparency")) {
      return a("C", i);
    }
    
    if (i.pathToSellUrl && !r) {
      return Aw(e, t, r, n);
    }
    
    return a("Z", i);
  } catch (generalError) {
    return a("Z", { imageUrl: null, salesRank: null });
  }
}

async function Aw(e,t,r=!1,n=!1){
  // 创建返回结果对象的内部函数
  function a(e,t){
    // 使用if语句替代三元运算符
    if(r && "A" !== e && "Y" !== e){
      return {type:"Z", imageUrl:t?.imageUrl, salesRank:t?.salesRank??0, requirements:t.requirements};
    } else {
      return {type:e, imageUrl:t?.imageUrl, salesRank:t?.salesRank??0, requirements:t.requirements};
    }
  }
  
  try{
    // 初始化路径对象
    let o = {pathToSellUrl: "/hz/approvalrequest/restrictions/approve?asin=" + e + "&itemcondition=new"};
    let i = null;
    
    try{
      // 发送请求获取数据
      let response = await fetch(
        o.pathToSellUrl.includes("https") ? o.pathToSellUrl : t + o.pathToSellUrl,
        {body:null, method:"GET", mode:"cors", credentials:"include"}
      );
      
      // 检查响应状态
      if(200 !== response.status){
        throw Error("请求失败");
      }
      
      // 解析响应文本
      i = await response.text();
    } catch(requestError){
      return a("Y", {imageUrl:null, salesRank:null});
    }
    
    // 解析HTML内容
    let l = new DOMParser().parseFromString(i, "text/html");
    
    // 查找包含"新品"或"New"的列表项索引
    let s = Array.from(l.querySelectorAll(".saw-ack-list")).findIndex(
      item => item.textContent.includes("新品") || item.textContent.includes("New")
    );
    
    // 获取对应的按钮元素
    let u = Array.from(l.querySelectorAll("#sc-content-container .a-button"))[s];
    
    // 按钮不存在的情况
    if(!u){
      console.log("未找到销售按钮");
      return a("G", o);
    }
    
    // 检查按钮文本，判断是否可以直接销售
    if(u?.textContent?.includes("销售您的商品") || u?.textContent?.includes("Sell yours")){
      // 如果需要验证
      if(n){
        // 创建广播通道
        let broadcastChannel = new BroadcastChannel("OfferValidation");
        
        // 创建验证Promise
        let validationPromise = new Promise((resolve, reject) => {
          // 设置超时处理
          setTimeout(() => {
            broadcastChannel.close();
            Ap({name:"gohref", body:{href:`${t}/abis/listing/syh/offer?asin=${e}`, status:0}});
            reject("");
          }, 15e3);
          
          // 监听消息
          broadcastChannel.onmessage = function(message) {
            if(message.data.asin === e){
              broadcastChannel.close();
              Ap({name:"gohref", body:{href:`${t}/abis/listing/syh/offer?asin=${e}`, status:0}});
              resolve(message.data.text);
            }
          };
        });
        
        // 打开新页面进行验证
        Ap({name:"gohref", body:{href:`${t}/abis/listing/syh/offer?asin=${e}`, active:!1}});
        
        try{
          // 等待验证结果
          let validationResult = await validationPromise;
          let errorCodeMatch = validationResult.match(/错误代码 (.*?)。/);
          
          // 单独检查另一个匹配模式
          if(!errorCodeMatch){
            errorCodeMatch = validationResult.match(/error code (\d+)\./);
          }
          
          // 处理错误代码
          if(errorCodeMatch){
            return a(`弹窗(${errorCodeMatch[1]})`, o);
          }
          
          // 检查特定错误代码
          let errorCodes = ["5886", "5885"];
          for(let index = 0; index < errorCodes.length; index++){
            let code = errorCodes[index];
            if(validationResult.includes(code)){
              return a(`弹窗(${code})`, o);
            }
          }
        } catch(validationError){
          // 保留原有错误处理行为
        }
      }
      
      // 返回可销售状态
      return a("A", o);
    }
    
    // 如果是限制模式，返回受限状态
    if(r){
      return a("Z", o);
    }
    
    // 获取CSRF令牌
    let c = l.querySelector('input[name="appFormPageCsrfToken"]').value;
    let d = "";
    let f = "";
    
    try{
      // 提交请求
      let submitResponse = await fetch(
        `${t}/hz/approvalrequest?asin=${e}&itemcondition=new`,
        {
          headers:{"content-type":"application/x-www-form-urlencoded"},
          redirect:"follow",
          body: new URLSearchParams({appFormPageCsrfToken:c}).toString(),
          method:"POST",
          mode:"cors"
        }
      );
      
      // 检查响应状态
      if(200 !== submitResponse.status){
        throw Error("请求失败");
      }
      
      // 保存响应URL和文本
      f = submitResponse.url;
      d = await submitResponse.text();
    } catch(submitError){
      return a("Y", {imageUrl:null, salesRank:null});
    }
    
    // 解析响应HTML
    let p = new DOMParser().parseFromString(d, "text/html");
    let h = p.querySelector("#sc-content-container");
    
    // 检查内容容器是否为空
    if(h && h.children.length <= 1){
      return a("K", o);
    }
    
    // 检查账户资格
    let m = p.querySelector("#myq-performance-check-box");
    if(m && (m.textContent.includes("您的账户不符合") || m.textContent.includes("Your account does not qualify"))){
      return a("B", o);
    }
    
    // 检查透明度计划要求
    let g = p.querySelector("#sq_ques_transparency_q1");
    let v = p.querySelector("#questionnaireMiniHeaderDiv");
    if(g && g.textContent.includes("Transparency") || v && v.textContent.includes("Transparency")){
      return a("C", o);
    }
    
    // 检查分类销售许可申请
    let b = p.querySelector("h1.saw-module-header");
    let y = p.querySelector('h3[data-cy="page_title"]');
    if(b && b.textContent.includes("针对 子类 的销售许可申请") || y && y.textContent.includes("针对 子类 的销售许可申请")){
      return a("D", o);
    }
    
    // 处理带有applicationId的URL
    if(f.includes("approvalrequest?applicationId")){
      // 获取必要的令牌和请求ID
      let token = p.querySelector('meta[name="anti-csrftoken-a2z"]')?.content;
      let requestId = p.querySelector("#cathode-loader")?.dataset?.http_request_id;
      let url = new URL(f);
      
      // 获取审批端点数据
      let approvalData = await fetch(
        `${url.origin}/hz/approvalEndpoint${url.search}`,
        {
          headers:{
            accept:"*/*",
            "accept-language":"zh-CN,zh;q=0.9",
            "anti-csrftoken-a2z":token,
            "content-type":"application/json",
            "x-saw-react-trace-id":`SAW-React::${requestId}`
          },
          body:null,
          method:"GET",
          mode:"cors",
          credentials:"include"
        }
      ).then(response => response.json());
      
      let approvalDataStr = JSON.stringify(approvalData);
      
      // 检查是否需要提供采购发票
      if(approvalDataStr && 
         (approvalDataStr.includes("至少应提供从制造商或分销商处购买商品的1张购买发票") || 
          approvalDataStr.includes("At least 1 purchase invoice for  products from a manufacturer or distributor"))
      ){
        try{
          // 尝试获取文档要求数量
          let documentRequirements = approvalData.body.moduleMap.DOCUMENT_REQUIREMENTS.docUploads[0].requirementsStringsMap;
          let requirementKey = Object.keys(documentRequirements)[0];
          let requirementCount = documentRequirements[requirementKey]?.length || 0;
          
          if(requirementCount){
            return a("E", {...o, requirements:requirementCount});
          }
        } catch(documentError){
          console.info(documentError);
        }
        
        return a("E", o);
      }
    }
    
    // 检查是否为全新正品且不允许销售二手、翻新产品
    if(d.includes("我要销售的所有商品均为正品。亚马逊禁止销售盗版、翻新产品或假冒伪劣商家商品。")){
      return a("F", o);
    }
    
    // 重置变量并抛出未知错误
    l = null;
    i = null;
    d = null;
    throw Error("未知错误");
  } catch(generalError){
    return a("Z", {imageUrl:null, salesRank:null});
  }
}

// 封装检查函数为独立方法
async function checkProductEligibility(baseUrl, asin) {
  // 初始化检查函数为Ax
  let checkFunc = Ax;
  
  try {
    // 尝试发送测试请求以确定使用哪个函数
    await fetch(`${baseUrl}/productsearch/v2/search?q=111&page=1`, {
      body: null,
      method: "GET",
      mode: "cors",
      credentials: "include"
    }).then(response => response.json());
  } catch (error) {
    console.log("使用Aw函数", error);
    // 请求失败时切换到Aw函数
    checkFunc = Aw;
  }
  console.log(`url：${baseUrl} asin：${asin}`);
  // 执行检查并返回结果
  const result = await checkFunc(asin, baseUrl, false, false);
  
  return result;
}

// 判断是否是亚马逊卖家中心的产品搜索页面
function isProductSearchPage() {
    const url = new URL(window.location.href);
    const hostname = url.hostname;
    const pathname = url.pathname;

    // 检查域名是否包含"sellercentral.amazon"并且路径是否包含"product-search"
    if (hostname.includes('sellercentral.amazon') && pathname.includes('product-search')) {
        return true;
    }
    return true;
}

function BgCheckMain(){
  // 检查当前页面是否是产品搜索页面
  if(!isProductSearchPage()){
    return;
  }
  
  // 检查按钮是否已存在，避免重复创建
  if(document.getElementById('bg-batch-check-btn')){
    return;
  }
  
  // 创建浮动按钮
  createFloatingButton();
}

// 创建浮动按钮函数
function createFloatingButton(){
  // 创建按钮元素
  const btn = document.createElement('div');
  btn.id = 'bg-batch-check-btn';
  
  // 设置按钮样式
  btn.style.position = 'fixed';
  btn.style.right = '10px';
  btn.style.top = '50%';
  btn.style.transform = 'translateY(-50%)';
  btn.style.width = '120px';
  btn.style.height = '50px';
  btn.style.backgroundColor = '#e3f2fd'; // 浅蓝色背景
  btn.style.color = '#1976d2';
  btn.style.borderRadius = '25px'; // 圆角
  btn.style.display = 'flex';
  btn.style.alignItems = 'center';
  btn.style.cursor = 'pointer';
  btn.style.zIndex = '10000';
  btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  btn.style.fontSize = '14px';
  btn.style.fontWeight = 'bold';
  btn.style.userSelect = 'none';
  btn.style.transition = 'all 0.3s ease';
  
  // 创建按钮文本容器
  const btnText = document.createElement('span');
  btnText.textContent = '批量BG查询';
  btnText.style.flex = '1';
  btnText.style.textAlign = 'center';
  btnText.style.marginRight = '15px';
  
  // 创建拖动把手
  const dragHandle = document.createElement('div');
  dragHandle.id = 'bg-batch-check-drag-handle';
  dragHandle.style.width = '20px';
  dragHandle.style.height = '100%';
  dragHandle.style.display = 'flex';
  dragHandle.style.alignItems = 'center';
  dragHandle.style.justifyContent = 'center';
  dragHandle.style.cursor = 'move';
  dragHandle.style.borderTopRightRadius = '25px';
  dragHandle.style.borderBottomRightRadius = '25px';
  
  // 添加拖动指示图标 (使用三个竖线表示)
  const dragIcon = document.createElement('div');
  dragIcon.style.width = '4px';
  dragIcon.style.height = '16px';
  dragIcon.style.display = 'flex';
  dragIcon.style.flexDirection = 'column';
  dragIcon.style.justifyContent = 'space-between';
  
  // 创建三个竖线
  for (let i = 0; i < 3; i++) {
    const line = document.createElement('div');
    line.style.width = '2px';
    line.style.height = '2px';
    line.style.backgroundColor = 'rgba(25, 118, 210, 0.7)';
    line.style.borderRadius = '50%';
    dragIcon.appendChild(line);
  }
  
  // 添加拖动图标到拖动把手
  dragHandle.appendChild(dragIcon);
  
  // 添加文本和拖动把手到按钮
  btn.appendChild(btnText);
  btn.appendChild(dragHandle);
  
  // 添加点击事件
  btn.addEventListener('click', function(e) {
    // 如果点击的是拖动把手，则不触发点击事件
    if (e.target === dragHandle || dragHandle.contains(e.target)) {
      return;
    }
    
    // 检查弹窗是否已经存在
    const existingModal = document.getElementById('bg-batch-check-overlay');
    if (existingModal) {
      // 如果弹窗存在，检查是否隐藏
      if (existingModal.style.display === 'none') {
        existingModal.style.display = 'flex';
      }
    } else {
      // 初始化弹窗
      initBatchCheckModal();
    }
  });
  
  // 添加到页面
  document.body.appendChild(btn);
  
  // 实现拖动功能，传入按钮和拖动把手
  makeElementDraggable(btn, dragHandle);
}

// 使元素可拖动的函数
function makeElementDraggable(element, dragHandle){
  let isDragging = false;
  let offsetX, offsetY;
  const edgeMargin = 10; // 边缘边距
  const snapDistance = 50; // 吸附到边缘的距离
  
  // 鼠标按下事件 - 只在拖动把手上触发
  dragHandle.addEventListener('mousedown', (e) => {
    e.stopPropagation(); // 阻止事件冒泡到按钮
    isDragging = true;
    offsetX = e.clientX - element.getBoundingClientRect().left;
    offsetY = e.clientY - element.getBoundingClientRect().top;
    element.style.transition = 'none'; // 拖动时关闭过渡动画
    element.style.zIndex = '10001'; // 拖动时提高层级
    element.style.backgroundColor = '#bbdefb'; // 拖动时背景色变深
  });
  
  // 鼠标移动事件
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    // 计算新位置
    let newX = e.clientX - offsetX;
    let newY = e.clientY - offsetY;
    
    // 限制在可视区域内
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const elementWidth = element.offsetWidth;
    const elementHeight = element.offsetHeight;
    
    newX = Math.max(edgeMargin, Math.min(newX, viewportWidth - elementWidth - edgeMargin));
    newY = Math.max(edgeMargin, Math.min(newY, viewportHeight - elementHeight - edgeMargin));
    
    // 设置位置
    element.style.left = newX + 'px';
    element.style.top = newY + 'px';
    element.style.right = 'auto'; // 清除right属性
  });
  
  // 鼠标释放事件
  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    
    isDragging = false;
    element.style.transition = 'all 0.3s ease'; // 恢复过渡动画
    element.style.zIndex = '10000'; // 恢复层级
    element.style.backgroundColor = '#e3f2fd'; // 恢复背景色
    
    // 实现自动吸附边缘
    snapToEdge(element);
  });
}

// 自动吸附边缘函数
function snapToEdge(element){
  const viewportWidth = window.innerWidth;
  const elementRect = element.getBoundingClientRect();
  const elementWidth = elementRect.width;
  const elementHeight = elementRect.height;
  const snapDistance = 50; // 吸附距离
  
  let finalX = elementRect.left;
  let finalY = elementRect.top;
  
  // 检查是否靠近左右边缘
  if (elementRect.left < snapDistance) {
    finalX = 10; // 吸附到左边缘
  } else if (viewportWidth - elementRect.right < snapDistance) {
    finalX = viewportWidth - elementWidth - 10; // 吸附到右边缘
  }
  
  // 检查是否靠近上下边缘
  if (elementRect.top < snapDistance) {
    finalY = 10; // 吸附到上边缘
  } else if (window.innerHeight - elementRect.bottom < snapDistance) {
    finalY = window.innerHeight - elementHeight - 10; // 吸附到下边缘
  }
  
  // 设置最终位置
  element.style.left = finalX + 'px';
  element.style.top = finalY + 'px';
  element.style.right = 'auto';
}


// 调用封装后的方法
// const result = await checkProductEligibility("https://sellercentral.amazon.co.uk/","B0D6RBKZJ7");
let resultMap={
  A:"直接跟",B:"账户不符合",C:"透明计划",D:"子类许可申请",E:"提交发票",F:"风险提示",G:"不可用",H:"不支持父asin查询",Y:"无法访问",K:"未知-空白",Z:"未知"
};
// console.log(result, resultMap[result.type]);

// 初始化批量查询弹窗
function initBatchCheckModal() {
  // 创建遮罩层
  const overlay = document.createElement('div');
  overlay.id = 'bg-batch-check-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '10002';
  
  // 创建弹窗容器
  const modal = document.createElement('div');
  modal.id = 'bg-batch-check-modal';
  modal.style.position = 'relative';
  modal.style.width = '90%';
  modal.style.maxWidth = '800px';
  modal.style.maxHeight = '80vh';
  modal.style.backgroundColor = '#fff';
  modal.style.borderRadius = '8px';
  modal.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
  modal.style.display = 'flex';
  modal.style.flexDirection = 'column';
  
  // 创建标题栏
  const header = document.createElement('div');
  header.style.padding = '15px 20px';
  header.style.backgroundColor = '#f5f5f5';
  header.style.borderTopLeftRadius = '8px';
  header.style.borderTopRightRadius = '8px';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.borderBottom = '1px solid #e0e0e0';
  
  // 标题文本
  const title = document.createElement('h3');
  title.textContent = '批量BG查询';
  title.style.margin = '0';
  title.style.fontSize = '18px';
  title.style.color = '#333';
  
  // 关闭按钮
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.background = 'none';
  closeBtn.style.border = 'none';
  closeBtn.style.fontSize = '24px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.color = '#666';
  closeBtn.style.padding = '0';
  closeBtn.style.width = '30px';
  closeBtn.style.height = '30px';
  closeBtn.style.display = 'flex';
  closeBtn.style.alignItems = 'center';
  closeBtn.style.justifyContent = 'center';
  closeBtn.addEventListener('click', function() {
    overlay.style.display = 'none';
  });
  
  // 添加标题和关闭按钮到标题栏
  header.appendChild(title);
  header.appendChild(closeBtn);
  
  // 创建内容区域
  const content = document.createElement('div');
  content.style.padding = '20px';
  content.style.overflowY = 'auto';
  content.style.flex = '1';
  
  // 创建输入框
  const textarea = document.createElement('textarea');
  textarea.id = 'bg-batch-check-textarea';
  textarea.placeholder = '请输入ASIN，支持换行、空格或逗号分隔...';
  textarea.style.width = '100%';
  textarea.style.height = '120px';
  textarea.style.padding = '10px';
  textarea.style.border = '1px solid #ddd';
  textarea.style.borderRadius = '4px';
  textarea.style.fontSize = '14px';
  textarea.style.resize = 'vertical';
  
  // 创建开始查询按钮
  const startBtn = document.createElement('button');
  startBtn.id = 'bg-batch-check-start-btn';
  startBtn.textContent = '开始查询';
  startBtn.style.marginTop = '15px';
  startBtn.style.padding = '10px 20px';
  startBtn.style.backgroundColor = '#1976d2';
  startBtn.style.color = '#fff';
  startBtn.style.border = 'none';
  startBtn.style.borderRadius = '4px';
  startBtn.style.fontSize = '14px';
  startBtn.style.cursor = 'pointer';
  startBtn.style.fontWeight = 'bold';
  startBtn.style.transition = 'background-color 0.3s';
  
  // 添加按钮悬停效果
  startBtn.addEventListener('mouseover', function() {
    startBtn.style.backgroundColor = '#1565c0';
  });
  
  startBtn.addEventListener('mouseout', function() {
    startBtn.style.backgroundColor = '#1976d2';
  });
  
  // 添加查询结果容器
  const resultContainer = document.createElement('div');
  resultContainer.id = 'bg-batch-check-result-container';
  resultContainer.style.marginTop = '20px';
  
  // 添加进度显示
  const progressContainer = document.createElement('div');
  progressContainer.id = 'bg-batch-check-progress';
  progressContainer.style.marginTop = '15px';
  progressContainer.style.padding = '10px';
  progressContainer.style.backgroundColor = '#f5f5f5';
  progressContainer.style.borderRadius = '4px';
  progressContainer.style.fontSize = '14px';
  progressContainer.style.display = 'none';
  
  // 创建导出按钮
  const exportBtn = document.createElement('button');
  exportBtn.id = 'bg-batch-check-export-btn';
  exportBtn.style.marginTop = '15px';
  exportBtn.textContent = '导出CSV';
  exportBtn.style.padding = '8px 16px';
  exportBtn.style.backgroundColor = '#ccc'; // 初始为灰色
  exportBtn.style.color = '#666';
  exportBtn.style.border = 'none';
  exportBtn.style.borderRadius = '4px';
  exportBtn.style.fontSize = '14px';
  exportBtn.style.cursor = 'not-allowed'; // 不可点击样式
  exportBtn.style.transition = 'all 0.3s';
  exportBtn.disabled = true; // 初始禁用
  
  // 添加导出按钮点击事件
  exportBtn.addEventListener('click', exportToCSV);
  
  // 添加开始查询按钮的点击事件
  startBtn.addEventListener('click', handleBatchCheck);
  
  // 添加元素到内容区域
  content.appendChild(textarea);
  // 创建一个容器来放置两个按钮
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '10px';
  buttonContainer.style.marginBottom = '15px';
  buttonContainer.appendChild(startBtn);
  buttonContainer.appendChild(exportBtn);
  content.appendChild(buttonContainer);
  content.appendChild(resultContainer);
  content.appendChild(progressContainer);
  
  // 添加标题栏和内容到弹窗
  modal.appendChild(header);
  modal.appendChild(content);
  
  // 添加弹窗到遮罩层
  overlay.appendChild(modal);
  
  // 添加遮罩层到页面
  document.body.appendChild(overlay);
}

// 处理批量查询
async function handleBatchCheck() {
  const textarea = document.getElementById('bg-batch-check-textarea');
  const resultContainer = document.getElementById('bg-batch-check-result-container');
  const progressContainer = document.getElementById('bg-batch-check-progress');
  const startBtn = document.getElementById('bg-batch-check-start-btn');
  
  // 清空之前的结果
  resultContainer.innerHTML = '';
  
  // 获取输入的ASIN文本
  const asinText = textarea.value.trim();
  if (!asinText) {
    alert('请输入ASIN');
    return;
  }
  
  // 解析ASIN列表（支持换行、空格或逗号分隔）
  const asins = [...new Set(asinText.split(/[\n\s,]+/).filter(asin => asin.trim() !== ''))];
  
  if (asins.length === 0) {
    alert('请输入有效的ASIN');
    return;
  }
  
  // 禁用开始按钮，防止重复点击
  startBtn.disabled = true;
  startBtn.textContent = '查询中...';
  
  // 创建表格
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.marginTop = '10px';
  
  // 创建表头
  const thead = document.createElement('thead');
  thead.style.backgroundColor = '#f5f5f5';
  
  const headerRow = document.createElement('tr');
  
  // 创建表头单元格
  const headers = ['序号', 'ASIN', '查询结果', '操作'];
  headers.forEach(headerText => {
    const th = document.createElement('th');
    th.textContent = headerText;
    th.style.padding = '10px';
    th.style.border = '1px solid #ddd';
    th.style.textAlign = 'left';
    headerRow.appendChild(th);
  });
  
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // 创建表格主体
  const tbody = document.createElement('tbody');
  
  // 为每个ASIN创建一行
  asins.forEach((asin, index) => {
    const row = document.createElement('tr');
    row.dataset.asin = asin;
    
    // 序号单元格
    const indexCell = document.createElement('td');
    indexCell.textContent = index + 1;
    indexCell.style.padding = '10px';
    indexCell.style.border = '1px solid #ddd';
    
    // ASIN单元格
    const asinCell = document.createElement('td');
    asinCell.textContent = asin;
    asinCell.style.padding = '10px';
    asinCell.style.border = '1px solid #ddd';
    
    // 结果单元格
    const resultCell = document.createElement('td');
    resultCell.id = `bg-result-${asin}`;
    resultCell.textContent = '查询中...';
    resultCell.style.padding = '10px';
    resultCell.style.border = '1px solid #ddd';
    
    // 操作单元格
    const actionCell = document.createElement('td');
    actionCell.style.padding = '10px';
    actionCell.style.border = '1px solid #ddd';
    
    // 添加重新查询按钮
    const retryBtn = document.createElement('button');
    retryBtn.textContent = '重新查询';
    retryBtn.style.padding = '5px 10px';
    retryBtn.style.fontSize = '12px';
    retryBtn.style.backgroundColor = '#ffeb3b';
    retryBtn.style.color = '#212121';
    retryBtn.style.border = 'none';
    retryBtn.style.borderRadius = '3px';
    retryBtn.style.cursor = 'pointer';
    retryBtn.addEventListener('click', function() {
      // 显示查询中状态
      const resultCell = document.getElementById(`bg-result-${asin}`);
      resultCell.textContent = '重新查询中...';
      resultCell.style.color = '#666';
      resultCell.style.fontWeight = 'normal';
      
      // 获取当前页面的域名作为baseUrl
      const currentUrl = new URL(window.location.href);
      const baseUrl = `${currentUrl.protocol}//${currentUrl.hostname}`;
      
      // 单独重新查询这个ASIN
      checkProductEligibility(baseUrl, asin)
        .then(result => {
          // 根据resultMap转换为中文
          const resultText = resultMap[result.type] || '未知';
          resultCell.textContent = resultText;
          
          // 根据不同结果设置不同颜色
          setResultCellColor(resultCell, result.type);
        })
        .catch(error => {
          console.error(`重新查询ASIN ${asin} 失败:`, error);
          resultCell.textContent = '查询失败';
          resultCell.style.color = '#d32f2f';
        });
    });
    
    actionCell.appendChild(retryBtn);
    
    // 添加所有单元格到行
    row.appendChild(indexCell);
    row.appendChild(asinCell);
    row.appendChild(resultCell);
    row.appendChild(actionCell);
    
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  resultContainer.appendChild(table);
  
  // 显示进度
  progressContainer.style.display = 'block';
  let completedCount = 0;
  progressContainer.textContent = `已查询：${completedCount}/${asins.length}`;
  
  // 获取当前页面的域名作为baseUrl
  const currentUrl = new URL(window.location.href);
  const baseUrl = `${currentUrl.protocol}//${currentUrl.hostname}`;
  
  // 逐个查询ASIN
  for (const asin of asins) {
    try {
      // 调用checkProductEligibility方法
      const result = await checkProductEligibility(baseUrl, asin);
      
      // 获取结果单元格
      const resultCell = document.getElementById(`bg-result-${asin}`);
      
      // 根据resultMap转换为中文
      const resultText = resultMap[result.type] || '未知';
      resultCell.textContent = resultText;
      
      // 根据不同结果设置不同颜色
      setResultCellColor(resultCell, result.type);
      
    } catch (error) {
      console.error(`查询ASIN ${asin} 失败:`, error);
      const resultCell = document.getElementById(`bg-result-${asin}`);
      resultCell.textContent = '查询失败';
      resultCell.style.color = '#d32f2f';
    }
    
    // 更新进度
    completedCount++;
    progressContainer.textContent = `已查询：${completedCount}/${asins.length}`;
    
    // 短暂延迟，避免请求过于频繁
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // 恢复开始按钮
  startBtn.disabled = false;
  startBtn.textContent = '开始查询';
  
  // 启用导出按钮
  const exportBtn = document.getElementById('bg-batch-check-export-btn');
  exportBtn.disabled = false;
  exportBtn.style.backgroundColor = '#4caf50';
  exportBtn.style.color = '#fff';
  exportBtn.style.cursor = 'pointer';
  
  // 添加按钮悬停效果
  exportBtn.addEventListener('mouseover', function() {
    if (!exportBtn.disabled) {
      exportBtn.style.backgroundColor = '#388e3c';
    }
  });
  
  exportBtn.addEventListener('mouseout', function() {
    if (!exportBtn.disabled) {
      exportBtn.style.backgroundColor = '#4caf50';
    }
  });
}

// 导出表格数据为CSV文件
function exportToCSV() {
  const table = document.querySelector('#bg-batch-check-result-container table');
  if (!table) {
    alert('没有可导出的数据');
    return;
  }
  
  // 创建CSV内容
  let csvContent = 'ASIN,查询结果\n'; // CSV标题行
  
  // 获取表格中的所有行（跳过表头）
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(row => {
    const asin = row.dataset.asin; // 获取ASIN
    const resultCell = row.querySelector('td:nth-child(3)'); // 获取结果单元格
    const result = resultCell.textContent.trim(); // 获取结果文本
    
    // 处理CSV中的特殊字符（如逗号、引号等）
    const escapedAsin = asin.replace(/"/g, '""');
    const escapedResult = result.replace(/"/g, '""');
    
    // 添加到CSV内容
    csvContent += `"${escapedAsin}","${escapedResult}"\n`;
  });
  
  // 创建Blob对象
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // 创建下载链接
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  // 设置文件名（使用当前日期）
  const date = new Date();
  const timestamp = `${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}${date.getSeconds().toString().padStart(2, '0')}`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', `amazon_bg_check_${timestamp}.csv`);
  link.style.visibility = 'hidden';
  
  // 添加链接到页面并触发下载
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // 释放URL对象
  URL.revokeObjectURL(url);
}

// 根据结果类型设置单元格颜色
function setResultCellColor(cell, resultType) {
  // 定义不同结果类型的颜色
  const colorMap = {
    'A': '#4caf50',  // 直接跟 - 绿色
    'B': '#ff9800',  // 账户不符合 - 橙色
    'C': '#ff5722',  // 透明计划 - 深橙色
    'D': '#2196f3',  // 子类许可申请 - 蓝色
    'E': '#9c27b0',  // 提交发票 - 紫色
    'F': '#f44336',  // 风险提示 - 红色
    'G': '#795548',  // 不可用 - 棕色
    'H': '#607d8b',  // 不支持父asin查询 - 蓝灰色
    'Y': '#607d8b',  // 无法访问 - 蓝灰色
    'K': '#607d8b',  // 未知-空白 - 蓝灰色
    'Z': '#607d8b'   // 未知 - 蓝灰色
  };
  
  // 设置颜色
  cell.style.color = colorMap[resultType] || '#333';
  cell.style.fontWeight = 'bold';
}

// 在DOM加载完成后执行BgCheckMain函数
if(document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', BgCheckMain);
} else {
  BgCheckMain();
}
