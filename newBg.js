async function Ax(e, t, r = !1, n = !1) {
  function a(e, t) {
    // 将三元运算符改为if/else语句
    if (r && "A" !== e && "Y" !== e) {
      return {
        type: "Z",
        imageUrl: t?.imageUrl,
        salesRank: t?.salesRank ?? 0,
        requirements: t.requirements
      }
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
          }, 15000);
          
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
         approvalDataStr.includes("至少应提供从制造商或分销商处购买商品的1购买发票") || 
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
  const result = await checkFunc(asin, baseUrl, false, true);
  
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

    checkVersionIsAvalible((res)=>{
        if (res && res.data && res.data.code == 200) {
            chrome.storage.sync.set({'feixunplugchecktime': Date.now()},function (res) {
                console.log('校验时间保存成功',res);
            });
                    
            // 创建浮动按钮
            createFloatingButton(true,"");
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
            createFloatingButton(false,state);
        }
    });
    

}


function FXLog(...args) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 注意月份是从0开始的
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  
    const datatime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;

    console.log(`[${datatime}][feixunLog]`,...args);
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
  

// 创建浮动按钮函数
function createFloatingButton(canUse,reason){
  // 创建按钮元素
  const btn = document.createElement('div');
  btn.id = 'bg-batch-check-btn';
  
  // 设置按钮样式
  btn.style.position = 'fixed';
  btn.style.right = '10px';
  btn.style.top = '50%';
  btn.style.transform = 'translateY(-50%)';
  btn.style.width = '150px';
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
  btnText.textContent = canUse ? '批量BG查询' : reason;
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
    if (!canUse) {
      alert(`功能不可用：${reason}`);
      return;
    }
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
// 全局任务管理对象
let taskManager = {
  tasks: [],
  currentTaskIndex: -1,
  isProcessing: false,
  refreshTimer: null,
  
  // 初始化任务管理器
  init: function() {
    this.loadTasks();
    this.startStatusRefresh();
  },
  
  // 开始定时刷新任务状态
  startStatusRefresh: function() {
    // 清除可能存在的旧定时器
    this.stopStatusRefresh();
    
    // 设置每5秒刷新一次
    this.refreshTimer = setInterval(() => {
      // 只有当有任务正在进行中时才刷新
      if (this.hasRunningTask()) {
        // 重新加载任务数据
        this.loadTasks();
        // 如果有回调函数，则调用它来更新UI
        if (this.onTasksLoaded && typeof this.onTasksLoaded === 'function') {
          this.onTasksLoaded();
        }
      } else {
        // 如果没有进行中的任务，停止刷新
        this.stopStatusRefresh();
      }
    }, 5000);
  },
  
  // 停止定时刷新
  stopStatusRefresh: function() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  },
  
  // 从Chrome存储加载任务
  loadTasks: function() {
    try {
      if (chrome && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get('bgBatchCheckTasks', (result) => {
          if (result.bgBatchCheckTasks) {
            this.tasks = result.bgBatchCheckTasks;
            // 检查是否有正在执行的任务，如果有则继续处理
            if (this.hasRunningTask() && !this.isProcessing) {
              processTaskQueue();
            }
            // 如果当前有任务但没有选中的任务，选中第一个
            if (this.tasks.length > 0 && this.currentTaskIndex === -1) {
              this.currentTaskIndex = 0;
            }
          }
          // 数据加载完成后调用回调更新UI
          if (this.onTasksLoaded && typeof this.onTasksLoaded === 'function') {
            this.onTasksLoaded();
          }
        });
      } else {
        // 降级方案：使用localStorage
        const savedTasks = localStorage.getItem('bgBatchCheckTasks');
        if (savedTasks) {
          this.tasks = JSON.parse(savedTasks);
        }
        // 数据加载完成后调用回调更新UI
        if (this.onTasksLoaded && typeof this.onTasksLoaded === 'function') {
          this.onTasksLoaded();
        }
      }
    } catch (error) {
      console.error('加载任务失败:', error);
      this.tasks = [];
      // 即使出错也尝试更新UI
      if (this.onTasksLoaded && typeof this.onTasksLoaded === 'function') {
        this.onTasksLoaded();
      }
    }
  },
  
  // 保存任务到Chrome存储
  saveTasks: function() {
    try {
      if (chrome && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({ 'bgBatchCheckTasks': this.tasks }, () => {
          if (chrome.runtime.lastError) {
            console.error('Chrome存储保存失败:', chrome.runtime.lastError);
            // 降级到localStorage
            this.saveTasksToLocal();
          }
        });
      } else {
        // 降级方案：使用localStorage
        this.saveTasksToLocal();
      }
    } catch (error) {
      console.error('保存任务失败:', error);
    }
  },
  
  // 降级方案：保存到localStorage
  saveTasksToLocal: function() {
    try {
      localStorage.setItem('bgBatchCheckTasks', JSON.stringify(this.tasks));
    } catch (error) {
      console.error('localStorage保存失败:', error);
    }
  },
  
  // 创建新任务
  createTask: function(asins) {
    const task = {
      id: Date.now(),
      name: `任务${this.tasks.length + 1}`,
      asins: asins,
      asinCount: asins.length,
      startTime: new Date().toLocaleString(),
      status: '等待中', // 等待中、进行中、已完成
      progress: 0,
      results: {}
    };
    
    this.tasks.push(task);
    this.saveTasks();
    return this.tasks.length - 1; // 返回任务索引
  },
  
  // 更新任务状态
  updateTaskStatus: function(index, status, progress = null, results = null) {
    if (this.tasks[index]) {
      this.tasks[index].status = status;
      if (progress !== null) {
        this.tasks[index].progress = progress;
      }
      if (results) {
        this.tasks[index].results = { ...this.tasks[index].results, ...results };
      }
      this.saveTasks();
    }
  },
  
  // 设置当前选中的任务
  setCurrentTask: function(index) {
    this.currentTaskIndex = index;
  },
  
  // 获取当前任务
  getCurrentTask: function() {
    return this.tasks[this.currentTaskIndex];
  },
  
  // 获取下一个等待执行的任务
  getNextPendingTask: function() {
    return this.tasks.findIndex(task => task.status === '等待中');
  },
  
  // 检查是否有进行中的任务
  hasRunningTask: function() {
    return this.tasks.some(task => task.status === '进行中');
  }
};

function initBatchCheckModal() {
  // 初始化任务管理器
  taskManager.init();
  
  // 直接初始化渲染任务列表，对于已加载的任务立即显示
  renderTaskList();
  
  // 监听任务数据变化，用于同步加载完成后的UI更新
  taskManager.onTasksLoaded = function() {
    renderTaskList();
  };
  
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
  
  // 创建导入Excel按钮
  const importBtn = document.createElement('button');
  importBtn.id = 'bg-batch-check-import-btn';
  importBtn.textContent = '导入Excel';
  importBtn.style.marginTop = '15px';
  importBtn.style.marginRight = '10px';
  importBtn.style.padding = '10px 20px';
  importBtn.style.backgroundColor = '#4caf50';
  importBtn.style.color = '#fff';
  importBtn.style.border = 'none';
  importBtn.style.borderRadius = '4px';
  importBtn.style.fontSize = '14px';
  importBtn.style.cursor = 'pointer';
  importBtn.style.fontWeight = 'bold';
  importBtn.style.transition = 'background-color 0.3s';
  
  // 添加导入按钮悬停效果
  importBtn.addEventListener('mouseover', function() {
    importBtn.style.backgroundColor = '#45a049';
  });
  
  importBtn.addEventListener('mouseout', function() {
    importBtn.style.backgroundColor = '#4caf50';
  });
  
  // 创建文件输入元素（隐藏）
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.xlsx,.xls';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);
  
  // 导入按钮点击事件
  importBtn.addEventListener('click', function() {
    fileInput.click();
  });
  
  // 文件选择事件处理
  fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        // 读取Excel文件
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // 获取第一个工作表
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // 转换为JSON格式
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          alert('Excel文件内容太少');
          return;
        }
        
        // 查找ASIN列
        const headers = jsonData[0];
        let asinColumnIndex = -1;
        
        for (let i = 0; i < headers.length; i++) {
          if (typeof headers[i] === 'string' && headers[i].toLowerCase().includes('asin')) {
            asinColumnIndex = i;
            break;
          }
        }
        
        if (asinColumnIndex === -1) {
          alert('未找到包含"asin"的列');
          return;
        }
        
        // 提取ASIN值
        const asins = [];
        for (let i = 1; i < jsonData.length; i++) {
          const asin = jsonData[i][asinColumnIndex];
          if (asin && typeof asin === 'string') {
            asins.push(asin.trim());
          }
        }
        
        if (asins.length === 0) {
          alert('未找到有效ASIN值');
          return;
        }
        
        // 将ASIN添加到textarea，按逗号分隔
        if (textarea.value.trim()) {
          // 如果已有内容，添加逗号分隔
          textarea.value += ',' + asins.join(',');
        } else {
          textarea.value = asins.join(',');
        }
        
        // 显示提示
        alert(`成功导入${asins.length}条ASIN数据`);
        
      } catch (error) {
        console.error('解析Excel文件失败:', error);
        alert('解析Excel文件失败，请检查文件格式');
      }
    };
    
    reader.readAsArrayBuffer(file);
    // 重置文件输入，允许重复选择同一个文件
    fileInput.value = '';
  });
  
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
  
  // 创建任务列表容器
  const taskListContainer = document.createElement('div');
  taskListContainer.id = 'bg-batch-check-task-list';
  taskListContainer.style.marginTop = '20px';
  taskListContainer.style.marginBottom = '15px';
  
  // 创建任务列表标题
  const taskListTitle = document.createElement('div');
  taskListTitle.textContent = '任务列表';
  taskListTitle.style.fontSize = '14px';
  taskListTitle.style.fontWeight = 'bold';
  taskListTitle.style.color = '#333';
  taskListTitle.style.marginBottom = '10px';
  taskListContainer.appendChild(taskListTitle);
  
  // 创建横向滚动的任务列表
  const taskList = document.createElement('div');
  taskList.id = 'bg-batch-check-task-items';
  taskList.style.display = 'flex';
  taskList.style.gap = '10px';
  taskList.style.overflowX = 'auto';
  taskList.style.paddingBottom = '10px';
  taskList.style.scrollbarWidth = 'thin';
  taskList.style.scrollbarColor = '#888 #f1f1f1';
  taskListContainer.appendChild(taskList);
  
  // 渲染任务列表函数
  // function renderTaskList() {
  
  // 添加查询结果容器
  const resultContainer = document.createElement('div');
  resultContainer.id = 'bg-batch-check-result-container';
  resultContainer.style.marginTop = '10px';
  
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
  exportBtn.addEventListener('click', function() {
    const currentTask = taskManager.getCurrentTask();
    if (currentTask) {
      exportTaskToCSV(currentTask);
    }
  });
  
  // 添加开始查询按钮的点击事件
  startBtn.addEventListener('click', function() {
    const asinText = textarea.value.trim();
    if (!asinText) {
      alert('请输入ASIN');
      return;
    }
    
    // 解析ASIN列表
    const asins = [...new Set(asinText.split(/[\n\s,]+/).filter(asin => asin.trim() !== ''))];
    
    if (asins.length === 0) {
      alert('请输入有效的ASIN');
      return;
    }
    
    // 创建新任务
    const taskIndex = taskManager.createTask(asins);
    
    // 清空输入框
    textarea.value = '';
    
    // 重新渲染任务列表
    renderTaskList();
    
    // 切换到新创建的任务
    switchTask(taskIndex);
    
    // 重新启动刷新状态定时器
    taskManager.startStatusRefresh();
    
    // 如果当前没有正在执行的任务，开始处理任务队列
    if (!taskManager.isProcessing) {
      processTaskQueue();
    }
  });
  
  // 添加元素到内容区域
  content.appendChild(textarea);
  
  // 创建一个容器来放置两个按钮
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '10px';
  buttonContainer.style.marginBottom = '15px';
  buttonContainer.appendChild(importBtn);
  buttonContainer.appendChild(startBtn);
  content.appendChild(buttonContainer);
  
  // 添加任务列表
  content.appendChild(taskListContainer);
  
  // 添加导出按钮
  content.appendChild(exportBtn);
  
  content.appendChild(resultContainer);
  content.appendChild(progressContainer);
  
  // 添加标题栏和内容到弹窗
  modal.appendChild(header);
  modal.appendChild(content);
  
  // 添加弹窗到遮罩层
  overlay.appendChild(modal);
  
  // 添加遮罩层到页面
  document.body.appendChild(overlay);
  
  // 检查是否有正在执行的任务，如果有则继续处理
  if (taskManager.hasRunningTask() && !taskManager.isProcessing) {
    processTaskQueue();
  }
  
  // 渲染任务列表函数
  function renderTaskList() {
    const taskList = document.getElementById('bg-batch-check-task-items');
    if (!taskList) return;
    
    taskList.innerHTML = '';
    
    taskManager.tasks.forEach((task, index) => {
      const taskCard = document.createElement('div');
      taskCard.className = 'bg-task-card';
      taskCard.style.minWidth = '200px';
      taskCard.style.padding = '12px';
      taskCard.style.backgroundColor = '#f9f9f9';
      taskCard.style.border = `2px solid ${index === taskManager.currentTaskIndex ? '#1976d2' : '#e0e0e0'}`;
      taskCard.style.borderRadius = '8px';
      taskCard.style.cursor = 'pointer';
      taskCard.style.transition = 'all 0.2s';
      taskCard.style.fontSize = '13px';
      taskCard.style.lineHeight = '1.4';
      taskCard.style.position = 'relative'; // 为绝对定位的删除按钮提供参考点
      
      // 添加点击事件
      taskCard.addEventListener('click', function() {
        switchTask(index);
      });
      
      // 添加悬停效果
      taskCard.addEventListener('mouseover', function() {
        if (index !== taskManager.currentTaskIndex) {
          taskCard.style.borderColor = '#1976d2';
          taskCard.style.backgroundColor = '#f0f7ff';
        }
      });
      
      taskCard.addEventListener('mouseout', function() {
        if (index !== taskManager.currentTaskIndex) {
          taskCard.style.borderColor = '#e0e0e0';
          taskCard.style.backgroundColor = '#f9f9f9';
        }
      });
      
      // 任务名称
      const taskName = document.createElement('div');
      taskName.textContent = task.name;
      taskName.style.fontWeight = 'bold';
      taskName.style.color = '#333';
      taskName.style.marginBottom = '5px';
      taskCard.appendChild(taskName);
      
      // ASIN数量
      const asinCount = document.createElement('div');
      asinCount.textContent = `ASIN数量: ${task.asinCount}`;
      asinCount.style.color = '#666';
      asinCount.style.marginBottom = '3px';
      taskCard.appendChild(asinCount);
      
      // 开始时间
      const startTime = document.createElement('div');
      startTime.textContent = `开始时间: ${task.startTime}`;
      startTime.style.color = '#666';
      startTime.style.marginBottom = '3px';
      taskCard.appendChild(startTime);
      
      // 状态
      const status = document.createElement('div');
      status.textContent = `状态: ${task.status}`;
      
      // 根据状态设置颜色
      let statusColor = '#666';
      if (task.status === '等待中') statusColor = '#ff9800';
      else if (task.status === '进行中') statusColor = '#2196f3';
      else if (task.status === '已完成') statusColor = '#4caf50';
      
      status.style.color = statusColor;
      status.style.fontWeight = 'bold';
      status.style.marginBottom = '3px';
      taskCard.appendChild(status);
      
      // 进度
      if (task.status !== '等待中') {
        const progress = document.createElement('div');
        progress.textContent = `进度: ${task.progress}/${task.asinCount}`;
        progress.style.color = '#666';
        taskCard.appendChild(progress);
      }
      
      // 添加删除按钮
      const deleteButton = document.createElement('button');
      deleteButton.textContent = '删除';
      deleteButton.style.position = 'absolute';
      deleteButton.style.bottom = '5px';
      deleteButton.style.right = '5px';
      deleteButton.style.padding = '3px 8px';
      deleteButton.style.fontSize = '11px';
      deleteButton.style.backgroundColor = '#ff5252';
      deleteButton.style.color = 'white';
      deleteButton.style.border = 'none';
      deleteButton.style.borderRadius = '4px';
      deleteButton.style.cursor = 'pointer';
      deleteButton.style.zIndex = '10';
      
      // 为删除按钮添加点击事件，阻止事件冒泡到任务卡片
      deleteButton.addEventListener('click', function(event) {
        event.stopPropagation(); // 阻止事件冒泡，避免触发任务卡片的点击事件
        
        // 二次确认对话框
        if (confirm('确定要删除这个任务吗？删除后将无法恢复。')) {
          // 从任务管理器中删除任务
          taskManager.tasks.splice(index, 1);
          // 如果删除的是当前任务，重置currentTaskIndex
          if (index === taskManager.currentTaskIndex) {
            taskManager.currentTaskIndex = -1;
          } else if (index < taskManager.currentTaskIndex) {
            // 如果删除的任务在当前任务之前，调整currentTaskIndex
            taskManager.currentTaskIndex--;
          }
          // 保存任务列表并重新渲染
          taskManager.saveTasksToLocal();
          renderTaskList();
        }
      });
      
      taskCard.appendChild(deleteButton);
      taskList.appendChild(taskCard);
    });
  }
  
  // 切换任务函数
  function switchTask(index) {
    taskManager.setCurrentTask(index);
    renderTaskList();
    
    const task = taskManager.tasks[index];
    const resultContainer = document.getElementById('bg-batch-check-result-container');
    const exportBtn = document.getElementById('bg-batch-check-export-btn');
    const progressContainer = document.getElementById('bg-batch-check-progress');
    
    // 清空结果容器
    resultContainer.innerHTML = '';
    
    // 显示进度（如果任务正在进行中）
    if (task.status === '进行中') {
      progressContainer.style.display = 'block';
      progressContainer.textContent = `已查询：${task.progress}/${task.asinCount}`;
    } else {
      progressContainer.style.display = 'none';
    }
    
    // 更新导出按钮状态
    if (task.status === '已完成') {
      exportBtn.disabled = false;
      exportBtn.style.backgroundColor = '#4caf50';
      exportBtn.style.color = '#fff';
      exportBtn.style.cursor = 'pointer';
    } else {
      exportBtn.disabled = true;
      exportBtn.style.backgroundColor = '#ccc';
      exportBtn.style.color = '#666';
      exportBtn.style.cursor = 'not-allowed';
    }
    
    // 如果任务已完成或正在进行中，显示结果表格
    if (task.status === '已完成' || task.status === '进行中') {
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
      task.asins.forEach((asin, index) => {
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
        resultCell.id = `bg-result-${task.id}-${asin}`;
        
        // 显示保存的结果或查询状态
        const result = task.results[asin];
        if (result) {
          // 根据resultMap转换为中文
          const resultText = resultMap[result.type] || result.type;
          resultCell.textContent = resultText;
          if (result.type == "E" && result.requirements) {
            resultCell.textContent += ` ${result.requirements}`;
          }
          
          // 根据不同结果设置不同颜色
          setResultCellColor(resultCell, result.type);
        } else if (task.status === '进行中') {
          resultCell.textContent = '查询中...';
        } else {
          resultCell.textContent = '未查询';
        }
        
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
          const resultCell = document.getElementById(`bg-result-${task.id}-${asin}`);
          resultCell.textContent = '重新查询中...';
          resultCell.style.color = '#666';
          resultCell.style.fontWeight = 'normal';
          
          // 获取当前页面的域名作为baseUrl
          const currentUrl = new URL(window.location.href);
          const baseUrl = `${currentUrl.protocol}//${currentUrl.hostname}`;
          
          // 单独重新查询这个ASIN
          checkProductEligibility(baseUrl, asin)
            .then(result => {
              // 更新任务结果
              const updatedResults = { ...task.results };
              updatedResults[asin] = result;
              task.results = updatedResults;
              taskManager.saveTasks();
              
              // 根据resultMap转换为中文
              const resultText = resultMap[result.type] || result.type;
              resultCell.textContent = resultText;
              if (result.type == "E" && result.requirements) {
                resultCell.textContent += ` ${result.requirements}`;
              }
              
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
    }
  }
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
          const resultText = resultMap[result.type] || result.type;
          resultCell.textContent = resultText;
          if (result.type == "E" && result.requirements) {
            resultCell.textContent += ` ${result.requirements}`;
          }
          
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
      const resultText = resultMap[result.type] || result.type;
      resultCell.textContent = resultText;
      if (result.type == "E" && result.requirements) {
        resultCell.textContent += ` ${result.requirements}`;
      }
      
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


// 统一的消息派发方法：用于打开/关闭验证页面等
// 处理任务队列
function processTaskQueue() {
  // 如果已经在处理中，直接返回
  if (taskManager.isProcessing) {
    return;
  }
  
  taskManager.isProcessing = true;
  
  // 获取下一个等待执行的任务
  const nextTaskIndex = taskManager.getNextPendingTask();
  
  if (nextTaskIndex === -1) {
    // 没有等待的任务，结束处理
    taskManager.isProcessing = false;
    return;
  }
  
  const task = taskManager.tasks[nextTaskIndex];
  
  // 更新任务状态为进行中
  taskManager.updateTaskStatus(nextTaskIndex, '进行中', 0);
  
  // 获取当前页面的域名作为baseUrl
  const currentUrl = new URL(window.location.href);
  const baseUrl = `${currentUrl.protocol}//${currentUrl.hostname}`;
  
  // 递归处理每个ASIN
  processTaskASIN(nextTaskIndex, 0, baseUrl).then(() => {
    // 所有ASIN处理完成，更新任务状态为已完成
    taskManager.updateTaskStatus(nextTaskIndex, '已完成', task.asinCount);
    
    // 重置处理状态
    taskManager.isProcessing = false;
    
    // 处理下一个任务
    processTaskQueue();
    
    // 如果当前选中的是这个任务，更新UI
    if (taskManager.currentTaskIndex === nextTaskIndex) {
      const taskList = document.getElementById('bg-batch-check-task-items');
      if (taskList) {
        const exportBtn = document.getElementById('bg-batch-check-export-btn');
        if (exportBtn) {
          exportBtn.disabled = false;
          exportBtn.style.backgroundColor = '#4caf50';
          exportBtn.style.color = '#fff';
          exportBtn.style.cursor = 'pointer';
        }
        
        const progressContainer = document.getElementById('bg-batch-check-progress');
        if (progressContainer) {
          progressContainer.style.display = 'none';
        }
      }
    }
  }).catch(error => {
    console.error('任务处理失败:', error);
    taskManager.isProcessing = false;
    // 继续处理下一个任务
    processTaskQueue();
  });
}

// 递归处理任务中的每个ASIN
function processTaskASIN(taskIndex, asinIndex, baseUrl) {
  const task = taskManager.tasks[taskIndex];
  
  if (asinIndex >= task.asins.length) {
    return Promise.resolve();
  }
  
  const asin = task.asins[asinIndex];
  
  // 如果已经有结果，跳过这个ASIN
  if (task.results[asin]) {
    return processTaskASIN(taskIndex, asinIndex + 1, baseUrl);
  }
  
  // 执行查询
  return checkProductEligibility(baseUrl, asin).then(result => {
    // 保存结果
    const updatedResults = { ...task.results };
    updatedResults[asin] = result;
    
    // 更新任务状态
    taskManager.updateTaskStatus(taskIndex, '进行中', asinIndex + 1, updatedResults);
    
    // 更新UI（如果当前选中的是这个任务）
    if (taskManager.currentTaskIndex === taskIndex) {
      // 更新进度显示
      const progressContainer = document.getElementById('bg-batch-check-progress');
      if (progressContainer) {
        progressContainer.textContent = `已查询：${asinIndex + 1}/${task.asinCount}`;
      }
      
      // 更新结果单元格
      const resultCell = document.getElementById(`bg-result-${task.id}-${asin}`);
      if (resultCell) {
        // 根据resultMap转换为中文
        const resultText = resultMap[result.type] || result.type;
        resultCell.textContent = resultText;
        if (result.type == "E" && result.requirements) {
          resultCell.textContent += ` ${result.requirements}`;
        }
        
        // 根据不同结果设置不同颜色
        setResultCellColor(resultCell, result.type);
      }
    }
    
    // 延迟后处理下一个ASIN，避免请求过快
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(processTaskASIN(taskIndex, asinIndex + 1, baseUrl));
      }, 1000); // 1秒延迟
    });
  }).catch(error => {
    console.error(`查询ASIN ${asin} 失败:`, error);
    
    // 记录错误结果
    const updatedResults = { ...task.results };
    updatedResults[asin] = { type: 'error', message: '查询失败' };
    
    // 更新任务状态
    taskManager.updateTaskStatus(taskIndex, '进行中', asinIndex + 1, updatedResults);
    
    // 更新UI
    if (taskManager.currentTaskIndex === taskIndex) {
      const progressContainer = document.getElementById('bg-batch-check-progress');
      if (progressContainer) {
        progressContainer.textContent = `已查询：${asinIndex + 1}/${task.asinCount}`;
      }
      
      const resultCell = document.getElementById(`bg-result-${task.id}-${asin}`);
      if (resultCell) {
        resultCell.textContent = '查询失败';
        resultCell.style.color = '#d32f2f';
      }
    }
    
    // 继续处理下一个ASIN
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(processTaskASIN(taskIndex, asinIndex + 1, baseUrl));
      }, 1000);
    });
  });
}

// 导出任务结果到CSV
function exportTaskToCSV(task) {
  // 构建CSV内容
  let csvContent = '序号,ASIN,查询结果\n';
  
  // 添加每个ASIN的结果
  task.asins.forEach((asin, index) => {
    const result = task.results[asin];
    let resultText = '';
    
    if (result) {
      // 根据resultMap转换为中文
      resultText = resultMap[result.type] || result.type;
      if (result.type == "E" && result.requirements) {
        resultText += ` ${result.requirements}`;
      }
    } else {
      resultText = '未查询';
    }
    
    // 处理特殊字符（逗号、引号、换行符）
    asin = asin.includes(',') || asin.includes('"') || asin.includes('\n') ? `"${asin.replace(/"/g, '""')}"` : asin;
    resultText = resultText.includes(',') || resultText.includes('"') || resultText.includes('\n') ? `"${resultText.replace(/"/g, '""')}"` : resultText;
    
    csvContent += `${index + 1},${asin},${resultText}\n`;
  });
  
  // 创建Blob对象
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // 创建下载链接
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  // 设置链接属性
  link.setAttribute('href', url);
  link.setAttribute('download', `${task.name}_结果_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
  link.style.visibility = 'hidden';
  
  // 添加到DOM并触发点击
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 修改handleBatchCheck函数，使其调用新的任务管理系统
function handleBatchCheck() {
  console.warn('handleBatchCheck函数已被新的任务管理系统替代');
}

function Ap(payload) {
  if (!payload || typeof payload !== 'object') return;
  const { name, body = {} } = payload;
  if (name === 'gohref') {
    const msg = {
      action: 'gohref',
      href: body.href,
      active: body.active,
      status: body.status
    };
    try {
      chrome.runtime && chrome.runtime.sendMessage(msg, () => {});
    } catch (e) {
      // 兜底：在无法调用扩展 API 时，尝试用 window.open 打开
      if (body && body.href && body.status !== 0) {
        window.open(body.href, '_blank');
      }
    }
  }
}
  
