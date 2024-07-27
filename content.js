function getBrand(){
    var brandRow = document.querySelector('tr.po-brand');  
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

function getBrand2(){
    let bylineInfoElement = document.getElementById('bylineInfo');  
  
    if (bylineInfoElement) {  
        let textContent = bylineInfoElement.textContent || bylineInfoElement.innerText; 
        textContent = textContent.replace("Brand: ", "");
        return textContent;
    } 
    return null;
}

function getBrand3(){
    let bylineInfoElement = document.getElementById('brand');  
  
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
        if (region == "au" || region == 'ca') {
            console.log("[test] 调用au请求");
            let url = 'http://www.jyxwl.cn/index.php/admin/index/checkBrandName?version=20240727161055&brand='+brand+'&region='+region;
            chrome.runtime.sendMessage({
                action: "makeCorsRequest",
                url: url,
                token: userInfo.token,
                data: {}
            },(response)=> {
                if (response.code == 1 && response.data.code == 200) {
                    callback({
                        count: response.data.count
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
                callback(response);
            });
        } else {
            callback({desc:"暂不支持该区域"});
        }
    });
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

function mainAction(retryTimes){
    let region = getRegion();
    let brand = getBrand() || getBrand2() || getBrand3();
    if (brand == null && retryTimes > 0) {
        console.log("[test] 查不到品牌，3s后重试");
        setTimeout(() => {
            mainAction(retryTimes - 1);
        },3);
        return;
    }
    console.log("[test]当前品牌："+brand);

    showInfo("<span id=\"feixun_plug_asin\"><b>ASIN：<b/></span>\
        <br/><span id=\"feixun_plug_region\"><b>区域："+region+"<b/></span>\
        <br/><span id=\"feixun_plug_brand\"><b>品牌：<b/></span>\
        <br/><span id=\"feixun_plug_brandState\"><b>商标状态：<b/></span>\
        <br/><span id=\"feixun_plug_checkasin\"><b>是否在采集系统已存在：<b/></span>\
         ");
    
    if (brand) {
        updateInfo("feixun_plug_brand","<b>品牌:</b>"+brand);
        checkBrand(brand,(data)=>{
            console.log("[test]查询结果：",data);
            let state = "查询失败";
            if (data.count != undefined) {
                if (data.count > 0) {
                    state = "<span style=\"color:#06b006\">有"+"("+data.count+")</span>";
                } else {
                    state = "<span style=\"color:#ff0000\">没有</span>";
                }
            } else if (data.desc) {
                state = data.desc;
            } else if (data.data.desc) {
                state = data.data.desc;
            }
            updateInfo("feixun_plug_brandState","<b>商标状态:</b>"+state);
        });
    } else {
        updateInfo("feixun_plug_brand","<b>品牌:</b>获取失败");
        updateInfo("feixun_plug_brandState","<b>商标状态:</b>获取失败");
    }

    const asin = getASIN()
    if (asin) {
        updateInfo("feixun_plug_asin","<b>ASIN:</b>"+asin);
        checkAsin(asin,(response)=>{
            if (response && response.code == 0) {
                updateInfo("feixun_plug_checkasin","<b>是否在采集系统已存在：<b/><span style=\"color:#ff0000\">已存在</span>");
            } else if (response && response.code == 1) {
                updateInfo("feixun_plug_checkasin","<b>是否在采集系统已存在：<b/><span style=\"color:#06b006\">不存在</span>");
            }  else if (data.desc) {
                updateInfo("feixun_plug_checkasin","<b>是否在采集系统已存在：<b/>"+data.desc);
            }
        })
    }


}

mainAction(3);