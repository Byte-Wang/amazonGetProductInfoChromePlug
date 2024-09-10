function getBrand(doc = document){
    var brandRow = doc.querySelector('tr.po-brand');  
    if (brandRow) {  
        var brandTd = brandRow.querySelector('td:nth-child(2)');  
        var brandSpan = brandTd.querySelector('.a-size-base.po-break-word');  
        if (brandSpan) {  
            var brandName = brandSpan.textContent.trim();  
            return brandName;
        }
    } 
    return null;
}

function getBrand2(doc = document){
    let bylineInfoElement = doc.getElementById('bylineInfo');  
  
    if (bylineInfoElement) {  
        let textContent = bylineInfoElement.textContent || bylineInfoElement.innerText; 
        textContent = textContent.replace("Brand: ", "");

        if (textContent.indexOf("Visit the") != -1) {
            textContent = textContent.replace("Visit the ", "");
            textContent = textContent.replace(" Store", "");
        }

        return textContent;
    } 
    return null;
}

function getBrand3(doc = document){
    let bylineInfoElement = doc.getElementById('brand');  
  
    if (bylineInfoElement) {  
        let textContent = bylineInfoElement.textContent || bylineInfoElement.innerText; 
        if (textContent.length > 0) {
            return textContent;
        }
    } 
    return null;
}

function getASIN() {  
    const url = window.location.href; 
    // 使用正则表达式匹配/dp/后面的任何字母数字组合（假设ASIN只包含字母和数字）  
    // 注意：这里假设ASIN是紧跟在/dp/之后，直到遇到路径分隔符（/）或查询字符串（?）为止  
    const asinPattern = /\/dp\/(\w+)/;  
    const match = asinPattern.exec(url);  
  
    if (match && match.length > 1) {  
        // 如果找到匹配项，并且匹配项数组长度大于1（即找到了ASIN），则返回它  
        return match[1];  
    }  
  
    // 如果没有找到ASIN，返回null或空字符串  
    return null;  
}  
  

function checkBrand(brand,callback){
    chrome.storage.sync.get('userInfo', function(result) {
        console.log("[test] 获取用户信息：",result);
        const userInfo = result.userInfo;
        if (!userInfo || !userInfo.token) {
            console.log("[test] 没有token，未登录：");
            callback({desc: "请先登录！"});
            return;
        }
        let region = getRegion();
        console.log("[test] 当前区域："+region);
        if (region == "au" || region == 'ca' || region == 'uk'|| region == 'jp') {
            console.log("[test] 查询品牌注册情况");
            let url = 'http://www.jyxwl.cn/index.php/admin/index/checkBrandName?version=20240727161055&brand='+encodeURIComponent(brand)+'&region='+region;
            chrome.runtime.sendMessage({
                action: "makeCorsRequest",
                url: url,
                token: userInfo.token,
                data: {}
            },(response)=> {
                console.log("[test] 品牌注册情况：",response);
                if (response.code == 1 && response.data.code == 200) {
                    callback({
                        count: response.data.count,
                    });
                } else {
                    callback(response);
                }
            });
        } else {
            callback({desc:"暂不支持该区域"});
        }
    });
}

function checkAsin(asin,callback){
    chrome.storage.sync.get('userInfo', function(result) {
        console.log("[test] 获取用户信息：",result);
        const userInfo = result.userInfo;
        if (!userInfo || !userInfo.token) {
            console.log("[test] 没有token，未登录：");
            callback({desc: "请先登录！"});
            return;
        }
        let region = getRegion();
        console.log("[test] 当前区域："+region);
        let stationId = '0';

        if (region == "au") {
            stationId = '11';
        } else if (region == "ca") {
            stationId = '7';
        } else if (region == "uk") {
            stationId = '8';
        } else if (region == "jp") {
            stationId = '9';
        }
        if (stationId != '0') {
            console.log("[test] 调用checkasin请求");
            let url = 'http://www.jyxwl.cn/index.php/admin/product/checkAsin';
            chrome.runtime.sendMessage({
                action: "makePOSTRequest",
                url: url,
                token: userInfo.token,
                data: {
                    'asin': asin,
                    'station_id': stationId
                }
            },(response)=> {
                console.log("[test]  checkasin:",response);
                response.asin = asin;
                callback(response);
            });
        } else {
            callback({desc:"暂不支持该区域"});
        }
    });
}

function getFBA(asin, callback) {
    chrome.storage.sync.get('userInfo', function(result) {
        console.log("[test] 获取用户信息：",result);
        const userInfo = result.userInfo;
        if (!userInfo || !userInfo.token) {
            console.log("[test] 没有token，未登录：");
            callback({desc: "请先登录！"});
            return;
        }
        let region = getRegion();
        console.log("[test] 当前区域："+region);

        console.log("[test] 调用getFba请求");
        let url = 'http://www.jyxwl.cn/index.php/admin/index/getFBA?region='+region+'&asin='+asin;
        chrome.runtime.sendMessage({
            action: "makeCorsRequest",
            url: url,
            token: userInfo.token,
            data: {}
        },(response)=> {
            console.log("[test] 调用getFba请求结果",response);
            if (response.code == 1 && response.data.code == 200 && response.data.result.status == 1) {
                let content = response.data.result.content;
                let cost = (content.fbaFee+content.storageFee+content.referralFee).toFixed(2); // 成本：亚马逊运费+亚马逊仓储费+亚马逊佣金
                let profit = content.amount - cost; // 利润
                let profitRate = (profit/content.amount*100).toFixed(2); // 利润率
                callback({
                    amount: content.amount+"("+content.currencyCode+")",
                    totalFBA: cost + "("+content.currencyCode+")",
                    profitRate: profitRate + "%"
                });
            } else {
                callback(response);
            }
        });


    });
}

function hasTitleFeatureDiv(){
    let titleFeatureDiv = document.getElementById("title_feature_div");
    if (titleFeatureDiv) {
        return true;
    } else {
        return false;
    }
}

function hasSearchResultDiv(){
    let titleFeatureDiv = document.getElementById("s-skipLinkTargetForMainSearchResults");
    if (titleFeatureDiv) {
        return true;
    } else {
        return false;
    }
}

function showInfo(info){
    let newDiv = document.createElement("div");  
    
    newDiv.style.padding = "10px"; 
    newDiv.style.backgroundColor = "#f7ddf5";  
    newDiv.style.zIndex = "1000"; 
    
    newDiv.innerHTML = info;  
    
    let titleFeatureDiv = document.getElementById("title_feature_div");  
    if (titleFeatureDiv) {  
        let referenceNode = titleFeatureDiv.previousSibling ? titleFeatureDiv.previousSibling : titleFeatureDiv.parentNode.firstChild;  
        if (referenceNode) {  
            titleFeatureDiv.parentNode.insertBefore(newDiv, referenceNode); 
        } else {
            titleFeatureDiv.parentNode.insertBefore(newDiv, titleFeatureDiv);  
        }
    } else {  
        console.error("无法找到title_feature_div的父元素");  
    }  
}

function getRegion(){
    const parser = new URL(window.location.href);  
    const hostname = parser.hostname;  
    const cleanedHostname = hostname.replace(/^www\./, '');  
    const matches = cleanedHostname.match(/(?:com\.au|ca|co\.uk)$/);  
    if (matches) {  
        switch (matches[0]) {  
            case 'com.au':  
                return 'au';  
            case 'ca':  
                return 'ca';  
            case 'co.uk':  
                return 'uk';  
            default:  
                return null;  
        }  
    }  
    return null;
}

function updateInfo(id,value){
    const element = document.getElementById(id);
    element.innerHTML = value;
}

function parserToTitleFeatureDiv(retryTimes){
    let region = getRegion();
    let brand = getBrand() || getBrand2() || getBrand3();
    if (brand == null && retryTimes > 0) {
        console.log("[test] 查不到品牌，3s后重试");
        setTimeout(() => {
            parserToTitleFeatureDiv(retryTimes - 1);
        },3);
        return;
    }
    console.log("[test]当前品牌："+brand);

    showInfo("<span id=\"feixun_plug_asin\"><b>ASIN：查询中...</b></span>\
        <br/><span id=\"feixun_plug_region\"><b>站点："+region+"</b></span>\
        <br/><span id=\"feixun_plug_brand\"><b>品牌：查询中...</b></span>\
        <br/><span id=\"feixun_plug_brandState\"><b>商标状态：查询中...</b></span>\
        <br/><span id=\"feixun_plug_checkasin\"><b>是否在库：查询中...</b></span>\
        <br/><span id=\"feixun_plug_amount\"><b>购物车：查询中...</b></span>\
        <br/><span id=\"feixun_plug_totalFba\"><b>FBA费用：查询中...</b></span>\
        <br/><span id=\"feixun_plug_profitRate\"><b>利润率：查询中...</b></span>\
         ");
    
    if (brand) {
        updateInfo("feixun_plug_brand","<b>品牌:</b>"+brand);
        checkBrand(brand,(data)=>{
            console.log("[test]查询品牌结果：",data);
            let state = "查询失败";
            if (data.count != undefined) {
                if (data.count > 0) {
                    state = "<span style=\"color:#ff0000\">已注册"+"("+data.count+")</span>";
                } else {
                    state = "<span style=\"color:#06b006\">未注册</span>";
                }
            } else if (data.desc) {
                state = data.desc;
            } else if (data.data.desc) {
                state = data.data.desc;
            } else if (data.msg) {
                state = data.msg;
            }
            updateInfo("feixun_plug_brandState","<b>商标状态:</b>"+state);
        });
    } else {
        updateInfo("feixun_plug_brand","<b>品牌:</b>获取失败");
        updateInfo("feixun_plug_brandState","<b>商标状态:</b>获取失败");
    }


    const asin = getASIN()
    if (asin) {
        console.log("[test]222");
        updateInfo("feixun_plug_asin","<b>ASIN:</b>"+asin);
        checkAsin(asin,(response)=>{
            if (response && response.code == 0) {
                updateInfo("feixun_plug_checkasin","<b>是否在库：<b/><span style=\"color:#ff0000\">已存在</span>");
            } else if (response && response.code == 1) {
                updateInfo("feixun_plug_checkasin","<b>是否在库：<b/><span style=\"color:#06b006\">不存在</span>");
            }  else if (data.desc) {
                updateInfo("feixun_plug_checkasin","<b>是否在库：<b/>"+data.desc);
            }
        })
    }

    if (asin) {
        getFBA(asin,(response)=>{
            if (response.amount) {
                updateInfo("feixun_plug_amount","<b>购物车：<b/>"+response.amount);
                updateInfo("feixun_plug_totalFba","<b>FBA费用：<b/>"+response.totalFBA);
                updateInfo("feixun_plug_profitRate","<b>利润率：<b/>"+response.profitRate);
            } else if (response.desc) {
                updateInfo("feixun_plug_amount","<b>购物车：<b/>"+data.desc);
                updateInfo("feixun_plug_totalFba","<b>FBA费用：<b/>"+data.desc);
                updateInfo("feixun_plug_profitRate","<b>利润率：<b/>"+data.desc);
            } else if (response.desc) {
                updateInfo("feixun_plug_amount","<b>购物车：<b/>查询失败");
                updateInfo("feixun_plug_totalFba","<b>FBA费用：<b/>查询失败");
                updateInfo("feixun_plug_profitRate","<b>利润率：<b/>查询失败");
            }
        });
    }
}

function getBrandFromDetail(asin,callback){
    fetch(window.location.origin + "/dp/" + asin,{
        method: 'GET', 
    })  
    .then(response => {  
        if (!response.ok) {  
            throw new Error('Network response was not ok');  
        }  
        return response.text(); // 获取响应体的文本  
    })  
    .then(html => {  
        const parser = new DOMParser();  
        const doc = parser.parseFromString(html, 'text/html');  
        let brand = getBrand(doc) || getBrand2(doc) || getBrand3(doc);
        callback(brand);
    });
}

function parserToSerchListView(){
    let region = getRegion();
    const divs = document.querySelectorAll('.s-result-list div'); 


    
    divs.forEach(div => {  
        // 检查div是否包含data-asin属性  
        if (div.hasAttribute('data-asin') && div.getAttribute('data-asin').trim() !== '') {  
            const asin = div.getAttribute('data-asin');
            console.log("[test] 查询到asin："+asin);

            const declarativeSpan = div.querySelector('.a-section');  
            const puisgRow = div.querySelector('.puisg-row');  
            if (puisgRow) {
                puisgRow.style.display = "inline-block";
            }
            // 如果找到了这样的span  
            if (declarativeSpan) {  
                // 创建一个新的div元素  
                const newDiv = document.createElement('div');  
        
                // 设置新div的样式  
                newDiv.style.padding = "10px"; 
                newDiv.style.backgroundColor = "#f7ddf5";  
                newDiv.style.zIndex = "1000"; 
                newDiv.style.display = "inline-block";
                newDiv.style.float = "right";
                newDiv.style.minWidth = "250px";
                newDiv.style.textAlign = "left";

                newDiv.innerHTML = "<span id=\"feixun_plug_asin_"+asin+"\"><b>ASIN："+asin+"</b></span>\
                                    <br/><span id=\"feixun_plug_region_"+asin+"\"><b>站点："+region+"</b></span>\
                                    <br/><span id=\"feixun_plug_brand_"+asin+"\"><b>品牌：查询中...</b></span>\
                                    <br/><span id=\"feixun_plug_brandState_"+asin+"\"><b>商标状态：查询中...</b></span>\
                                    <br/><span id=\"feixun_plug_checkasin_"+asin+"\"><b>是否在库：查询中...</b></span>\
                                    <br/><span id=\"feixun_plug_amount_"+asin+"\"><b>购物车：查询中...</b></span>\
                                    <br/><span id=\"feixun_plug_totalFba_"+asin+"\"><b>FBA费用：查询中...</b></span>\
                                    <br/><span id=\"feixun_plug_profitRate_"+asin+"\"><b>利润率：查询中...</b></span>";
                declarativeSpan.appendChild(newDiv); 

                checkAsin(asin,(response)=>{
                    if (response && response.code == 0) {
                        updateInfo("feixun_plug_checkasin_"+response.asin,"<b>是否在库：<b/><span style=\"color:#ff0000\">已存在</span>");
                    } else if (response && response.code == 1) {
                        updateInfo("feixun_plug_checkasin_"+response.asin,"<b>是否在库：<b/><span style=\"color:#06b006\">不存在</span>");
                    }  else if (data.desc) {
                        updateInfo("feixun_plug_checkasin_"+response.asin,"<b>是否在库：<b/>"+data.desc);
                    }
                })

                getFBA(asin,(response)=>{
                    if (response.amount) {
                        updateInfo("feixun_plug_amount_"+asin,"<b>购物车：<b/>"+response.amount);
                        updateInfo("feixun_plug_totalFba_"+asin,"<b>FBA费用：<b/>"+response.totalFBA);
                        updateInfo("feixun_plug_profitRate_"+asin,"<b>利润率：<b/>"+response.profitRate);
                    } else if (response.desc) {
                        updateInfo("feixun_plug_amount_"+asin,"<b>购物车：<b/>"+data.desc);
                        updateInfo("feixun_plug_totalFba_"+asin,"<b>FBA费用：<b/>"+data.desc);
                        updateInfo("feixun_plug_profitRate_"+asin,"<b>利润率：<b/>"+data.desc);
                    } else if (response.desc) {
                        updateInfo("feixun_plug_amount_"+asin,"<b>购物车：<b/>查询失败");
                        updateInfo("feixun_plug_totalFba_"+asin,"<b>FBA费用：<b/>查询失败");
                        updateInfo("feixun_plug_profitRate_"+asin,"<b>利润率：<b/>查询失败");
                    }
                });


                getBrandFromDetail(asin, (brand)=>{
                   if (!brand) {
                    updateInfo("feixun_plug_brand_"+asin, "<b>品牌: 获取失败</b>");
                    return;
                   } 
                   updateInfo("feixun_plug_brand_"+asin, "<b>品牌:</b>"+brand);

                   checkBrand(brand,(data)=>{
                       console.log("[test] 查询到"+asin+"品牌注册情况：",data);
                       let state = "查询失败";
                       if (data.count != undefined) {
                           if (data.count > 0) {
                               state = "<span style=\"color:#ff0000\">已注册"+"("+data.count+")</span>";
                           } else {
                               state = "<span style=\"color:#06b006\">未注册</span>";
                           }
                       } else if (data.desc) {
                           state = data.desc;
                       } else if (data.data.desc) {
                           state = data.data.desc;
                       } else if (data.msg) {
                           state = data.msg;
                       }
                       updateInfo("feixun_plug_brandState_"+asin,"<b>商标状态:</b>"+state);
                   });
                });
                
            }  
        }  
    }); 
}

function mainAction(){

    if (hasTitleFeatureDiv()) {
        parserToTitleFeatureDiv(3);
    } else if (hasSearchResultDiv()) {
        parserToSerchListView();
        let curHref = window.location.href;
        setInterval(() => {
            console.log("[test] 检测是否翻页");
            if (curHref != window.location.href) {
                console.log("[test] 翻页了，重新获取数据");
                setTimeout(() => {
                    parserToSerchListView();
                }, 2000);
                curHref = window.location.href;
            }
        }, 2000);
    } else {
        console.log("[test] 未知页面");
    }
    
}

mainAction(3);