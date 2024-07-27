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
    if (brand == null) {
        showInfo("<b>品牌:获取失败<br/>商标状态:查询失败</b>");
        return;
    }

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
        showInfo("<b>品牌:"+brand+"<br/>商标状态("+region+"):"+state+"</b>");
    });
}

mainAction(3);