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
        let match = textContent.match(/Brand: ([^,\s]+)/); 
        if (match) {  
            let brandName = match[1];  
            console.log(brandName)
            return brandName;
        } 
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
    let url = 'https://search.ipaustralia.gov.au/trademarks/search/count/quick?q='+brand;
    chrome.runtime.sendMessage({
        action: "makeCorsRequest",
        url: url,
        data: {}
    },(response)=> {
        callback(response);
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

function mainAction(retryTimes){
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
        }
        showInfo("<b>品牌:"+brand+"<br/>商标状态:"+state+"</b>");
    });
}

mainAction(3);