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

function checkVersionIsAvalible(callback,retryTimes = 3){
    chrome.storage.sync.get('userInfo', function(result) {
        FXLog("[test] 获取用户信息：",result);
        const userInfo = result.userInfo;
        if (!userInfo || !userInfo.token) {
            FXLog("[test] 没有token，未登录：");
            callback({code: 401, desc: "请先登录！"});
            return;
        }
        
       
        let url = 'http://119.91.217.3/index.php/admin/index/checkChromePlugVersion?version=' + window.feixunPlugVersion;
        chrome.runtime.sendMessage({
            action: "makeCorsRequest",
            url: url,
            token: userInfo.token,
            data: {}
        },(response)=> {
            FXLog("[test] 插件可用状态：",response);
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
  

function checkBrandOld(brand,callback){
    chrome.storage.sync.get('userInfo', function(result) {
        FXLog("[test] 获取用户信息：",result);
        const userInfo = result.userInfo;
        if (!userInfo || !userInfo.token) {
            FXLog("[test] 没有token，未登录：");
            callback({desc: "请先登录！"});
            return;
        }
        let region = getRegion();
        FXLog("[test] 当前区域："+region);
        if (region == "au" || region == 'ca' || region == 'uk'|| region == 'jp' || region == 'us') {
            FXLog("[test] 查询品牌注册情况");
            let url = 'http://119.91.217.3/index.php/admin/index/checkBrandName?version=' + window.feixunPlugVersion + '&brand='+encodeURIComponent(brand)+'&region='+region;
            chrome.runtime.sendMessage({
                action: "makeCorsRequest",
                url: url,
                token: userInfo.token,
                data: {}
            },(response)=> {
                FXLog("[test] 品牌注册情况：",response);
                if (response.code == 1 && response.data.code == 200) {
                    callback({
                        count: response.data.count,
                        from: ""
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

function checkBrand(brand,callback){
    if (window.feixunUserConfig.useWipoSwitch == 'use') {
        checkBrandByWipo(brand,callback);
    } else {
        checkBrandOld(brand,callback);
    }
}

function checkBrandWithAll(brand, callback){
    let result = {
        trademarkOffice: null,
        wipo: null,
    };

    FXLog("查询品牌状态， 开始：",brand)
    let checkBoth = ()=>{
        if (result.wipo != null && result.trademarkOffice != null) {
            FXLog("查询品牌状态，两个渠道都查询完成， result：",result)
            callback(result);
        }
    };

    checkBrandByWipo(brand,(data)=>{
        FXLog("查询品牌状态，wipo查询完成， result：",data)
        result.wipo = data ? data : {};
        checkBoth();
    });

    checkBrandOld(brand,(data)=>{
        FXLog("查询品牌状态，商标局查询完成， result：",data)
        result.trademarkOffice = data ? data : {};
        checkBoth();
    });

    
}


function checkBrandByWipo(brand,callback){
    chrome.storage.sync.get('userInfo', function(result) {
        FXLog("[test] 获取用户信息：",result);
        const userInfo = result.userInfo;
        if (!userInfo || !userInfo.token) {
            FXLog("[test] 没有token，未登录：");
            callback({desc: "请先登录！"});
            return;
        }
        let region = getRegion();
        FXLog("[test] 当前区域："+region);
        if (region == "au" || region == 'ca' || region == 'uk'|| region == 'jp' || region == 'us') {
            FXLog("[test] 查询品牌注册情况");
            let url = 'http://119.91.217.3/index.php/admin/index/checkBrand?version=' + window.feixunPlugVersion + '&brand='+encodeURIComponent(brand)+'&region='+region;
            chrome.runtime.sendMessage({
                action: "makeCorsRequest",
                url: url,
                token: userInfo.token,
                data: {}
            },(response)=> {
                FXLog("[test] 品牌注册情况：",response);
                if (response.code == 1 && response.data.code == 200) {
                    let result = response.data.result;
                    let searchKey = result.hashsearch;
                    let searchResult = result.searchResult;

                    let searchKeyWords = CryptoJS.enc.Utf8.parse(searchKey);
                    let resultStr = CryptoJS.AES.decrypt(searchResult, searchKeyWords, {
                        mode: CryptoJS.mode.ECB
                    }).toString(CryptoJS.enc.Utf8);

                    if (!resultStr) {
                        callback(response);return;
                    }

                    let resultObj = JSON.parse(resultStr)
                    FXLog("[test] 查询品牌注册情况，解析后：",resultObj);
                    
                    if (resultObj && resultObj.response) {
                        callback({
                            count: resultObj.response.numFound,
                            from: "wipo:"
                        });
                    }

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
        FXLog("[test] 获取用户信息：",result);
        const userInfo = result.userInfo;
        if (!userInfo || !userInfo.token) {
            FXLog("[test] 没有token，未登录：");
            callback({desc: "请先登录！"});
            return;
        }
        let region = getRegion();
        FXLog("[test] 当前区域："+region);
        let stationId = '0';

        if (region == "au") {
            stationId = '11';
        } else if (region == "ca") {
            stationId = '7';
        } else if (region == "uk") {
            stationId = '8';
        } else if (region == "jp") {
            stationId = '9';
        } else if (region == "us") {
            stationId = '13';
        }

        if (stationId != '0') {
            FXLog("[test] 调用checkasin请求");
            let url = 'http://119.91.217.3/index.php/admin/product/checkAsin';
            chrome.runtime.sendMessage({
                action: "makePOSTRequest",
                url: url,
                token: userInfo.token,
                data: {
                    'asin': asin,
                    'station_id': stationId,
                    'version': window.feixunPlugVersion
                }
            },(response)=> {
                FXLog("[test]  checkasin:",response);
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
        FXLog("[test] 获取用户信息：",result);
        const userInfo = result.userInfo;
        if (!userInfo || !userInfo.token) {
            FXLog("[test] 没有token，未登录：");
            callback({desc: "请先登录！"});
            return;
        }
        let region = getRegion();
        FXLog("[test] 当前区域："+region);

        FXLog("[test] 调用getFba请求");
        let url = 'http://119.91.217.3/index.php/admin/index/getFBA?version=' + window.feixunPlugVersion + '&region='+region+'&asin='+asin;
        chrome.runtime.sendMessage({
            action: "makeCorsRequest",
            url: url,
            token: userInfo.token,
            data: {}
        },(response)=> {
            FXLog("[test] 调用getFba请求结果",response);
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

function addStyle(){
    var style = document.createElement('style');  
    style.appendChild(document.createTextNode("\
        .feixun_plug_container {  \
        width: 100%;  \
        max-width: 1200px;\
        margin: 0 auto;  \
        padding: 10px; \
        font-size: 12px;\
        border: 1px solid #d6d5d5;\
        position: relative;\
        background: #e2effd;\
        }\
        .feixun_plug_row_old {\
        display: flex;  \
        flex-wrap: wrap; \
        margin-left: -5px;  \
        margin-right: -5px;   \
        line-height: 30px;\
        }\
        .feixun_plug_col-1, .feixun_plug_col-2, .feixun_plug_col-3, .feixun_plug_col-4, .feixun_plug_col-5, .feixun_plug_col-6, .feixun_plug_col-7, .feixun_plug_col-8, .feixun_plug_col-9, .feixun_plug_col-10, .feixun_plug_col-11, .feixun_plug_col-12 {  \
    }\
    .aaa{\
        position: relative;  \
        width: 100%; \
        padding-right: 5px;  \
        padding-left: 5px;  \
        flex: 0 0 auto;\
        }  \
        .feixun_plug_toast {\
        z-index: 999;\
        position: fixed;\
        background-color: rgba(0, 0, 0, 0.7);\
        color: white;\
        padding: 10px;\
        border-radius: 5px;\
        display: none;\
        }\
        .feixun_plug_flag_green{\
        background: #06b476;\
        padding: 2px 10px 2px 10px;\
        border-radius: 3px;\
        color: white;\
        margin-right: 5px;\
        }\
        .feixun_plug_flag_yellow{\
        background: #fdb800;\
        padding: 2px 10px 2px 10px;\
        border-radius: 3px;\
        color: white;\
        margin-right: 5px;\
        }\
        .feixun_plug_flag_red{\
        background: #ec4444;\
        padding: 2px 10px 2px 10px;\
        border-radius: 3px;\
        color: white;\
        margin-right: 5px;\
        }\
        .feixun_plug_bottom_border{\
        border-bottom: 1px dashed #8d8d8d;\
        margin-bottom: 5px;\
        padding-bottom: 5px;\
        }\
        .feixun_plug_top_border{\
        border-top: 1px dashed #8d8d8d;\
        padding-top: 5px;\
        margin-top: 5px;\
        }\
        .feixun_plug_text{\
            word-break: keep-all;\
            overflow: hidden;\
            text-overflow: ellipsis;\
            width: 150px;\
            height: 30px;\
        }\
        .feixun_plug_row {\
        display: flex; \
        flex-wrap: wrap;\
        gap: 10px;\
        }\
        .feixun_plug_col-1, .feixun_plug_col-2, .feixun_plug_col-3, .feixun_plug_col-4, .feixun_plug_col-5, .feixun_plug_col-6, .feixun_plug_col-7, .feixun_plug_col-8, .feixun_plug_col-9, .feixun_plug_col-10, .feixun_plug_col-11, .feixun_plug_col-12 {\
        padding-right: 5px;  \
        padding-left: 5px;  \
        text-align: center;\
        box-sizing: border-box; \
        line-height: 30px;\
        }\
        .feixun_plug_mask{\
            position: absolute;\
            background: rgba(0, 0, 0, 0.7);\
            left: 0;\
            top: 0;\
            bottom: 0;\
            right: 0;\
            text-align: center;\
            padding: 20px;\
            color: #fff;\
        }\
        @media (min-width: 576px) {  \
        .feixun_plug_col-11 { flex: 0 0 8.333333%; max-width: 8.333333%; }  \
        .feixun_plug_col-21 { flex: 0 0 16.666667%; max-width: 16.666667%; }  \
        .feixun_plug_col-31 { flex: 0 0 25%; max-width: 25%; }  \
        .feixun_plug_col-41 { flex: 0 0 33.333333%; max-width: 33.333333%; }  \
        .feixun_plug_col-51 { flex: 0 0 41.666667%; max-width: 41.666667%; }  \
        .feixun_plug_col-61 { flex: 0 0 50%; max-width: 50%; }  \
        .feixun_plug_col-71 { flex: 0 0 58.333333%; max-width: 58.333333%; }  \
        .feixun_plug_col-81 { flex: 0 0 66.666667%; max-width: 66.666667%; }  \
        .feixun_plug_col-91 { flex: 0 0 75%; max-width: 75%; }  \
        .feixun_plug_col-101 { flex: 0 0 83.333333%; max-width: 83.333333%; }  \
        .feixun_plug_col-111 { flex: 0 0 91.666667%; max-width: 91.666667%; }  \
        .feixun_plug_col-121 { flex: 0 0 100%; max-width: 100%; }  \
        }  \
          @keyframes rotate {\
            from { transform: rotate(0deg); }\
            to { transform: rotate(360deg); }\
            }\
            .rotating {\
                animation: rotate 1s linear 1;\
              }\
        "));  
    document.head.appendChild(style);
}

function getMainContentView(asin = "") {
    const idSubfix = (asin && asin != "") ? ("_"+asin) : "";
    const contentView = "<div class=\"feixun_plug_row feixun_plug_bottom_border\">\
                                        <div class=\"feixun_plug_col-3\"><b>ASIN： </b><span id=\"feixun_plug_asin"+idSubfix+"\">查询中...</span>\
                                        <svg class=\"icon\" id=\"feixun_plug_copy_asin_img"+idSubfix+"\" style=\"cursor: pointer;width: 2em;height: 2em;vertical-align: middle;fill: currentColor;overflow: hidden;\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http:\/\/www.w3.org\/2000\/svg\" p-id=\"3522\"><path d=\"M657 223H287c-22.1 0-40 17.9-40 40v418c0 22.1 17.9 40 40 40h370c22.1 0 40-17.9 40-40V263c0-22.1-17.9-40-40-40z m10 448c0 11-9 20-20 20H297c-11 0-20-9-20-20V273c0-11 9-20 20-20h350c11 0 20 9 20 20v398z\" fill=\"#333333\" p-id=\"3523\"><\/path><path d=\"M747 353.8V751c0 11-9 20-20 20H387.8c-6.5 0-12.2 4.1-14.2 10.3-3.2 9.7 4 19.7 14.2 19.7H737c22.1 0 40-17.9 40-40V353.8c0-10.2-10-17.5-19.7-14.2-6.2 2-10.3 7.8-10.3 14.2zM582 384H362c-8.3 0-15-6.7-15-15s6.7-15 15-15h220c8.3 0 15 6.7 15 15s-6.7 15-15 15zM582 482H362c-8.3 0-15-6.7-15-15s6.7-15 15-15h220c8.3 0 15 6.7 15 15s-6.7 15-15 15zM527.7 580H362c-8.3 0-15-6.7-15-15s6.7-15 15-15h165.7c8.3 0 15 6.7 15 15s-6.8 15-15 15z\" fill=\"#333333\" p-id=\"3524\"><\/path><\/svg>\
                                        </div>\
                                        <div class=\"feixun_plug_col-3 feixun_plug_text\" style=\"display:flex;\"><b>卖家：</b><span id=\"feixun_plug_soldBy"+idSubfix+"\"><span/></div>\
                                        <div class=\"feixun_plug_col-3\" ><b>配送：</b><span id=\"feixun_plug_ShipsFrom"+idSubfix+"\"></span></div>\
                                        <div class=\"feixun_plug_col-3\" ><b>卖家数：</b><span id=\"feixun_plug_soldByNumber"+idSubfix+"\"></span>\
                                        </div>\
                                        <div class=\"feixun_plug_col-3\" style=\"padding:0px;\">\
                                        <img style=\"width: 27px;height: 27px;cursor: pointer;\" id=\"feixun_plug_refresh_img"+idSubfix+"\"\
                                        src=\""+"data:image/png;base64,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"+"\">\
                                        </div>\
                                    </div>\
                                    <div class=\"feixun_plug_row\">\
                                        <div class=\"feixun_plug_col-6\" ><b>排名：</b>\
                                        <span id=\"feixun_plug_rank"+idSubfix+"\">**</span> in <b><span id=\"feixun_plug_category"+idSubfix+"\"></span></b>\
                                        </div>\
                                        <div class=\"feixun_plug_col-6\"><b>评分：</b><span id=\"feixun_plug_ReviewNumber"+idSubfix+"\"></span></div>\
                                    </div>\
                                    <div class=\"feixun_plug_row feixun_plug_bottom_border\">\
                                        <div class=\"feixun_plug_col-6\"><b>品牌：</b><span id=\"feixun_plug_brand"+idSubfix+"\"></span>&nbsp;<span id=\"feixun_plug_brandState"+idSubfix+"\"></span>\
                                        <svg class=\"icon\" id=\"feixun_plug_copy_brand_img"+idSubfix+"\" style=\"cursor: pointer;width: 2em;height: 2em;vertical-align: middle;fill: currentColor;overflow: hidden;\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http:\/\/www.w3.org\/2000\/svg\" p-id=\"3522\"><path d=\"M657 223H287c-22.1 0-40 17.9-40 40v418c0 22.1 17.9 40 40 40h370c22.1 0 40-17.9 40-40V263c0-22.1-17.9-40-40-40z m10 448c0 11-9 20-20 20H297c-11 0-20-9-20-20V273c0-11 9-20 20-20h350c11 0 20 9 20 20v398z\" fill=\"#333333\" p-id=\"3523\"><\/path><path d=\"M747 353.8V751c0 11-9 20-20 20H387.8c-6.5 0-12.2 4.1-14.2 10.3-3.2 9.7 4 19.7 14.2 19.7H737c22.1 0 40-17.9 40-40V353.8c0-10.2-10-17.5-19.7-14.2-6.2 2-10.3 7.8-10.3 14.2zM582 384H362c-8.3 0-15-6.7-15-15s6.7-15 15-15h220c8.3 0 15 6.7 15 15s-6.7 15-15 15zM582 482H362c-8.3 0-15-6.7-15-15s6.7-15 15-15h220c8.3 0 15 6.7 15 15s-6.7 15-15 15zM527.7 580H362c-8.3 0-15-6.7-15-15s6.7-15 15-15h165.7c8.3 0 15 6.7 15 15s-6.8 15-15 15z\" fill=\"#333333\" p-id=\"3524\"><\/path><\/svg>\
                                        </div>\
                                        <div class=\"feixun_plug_col-6\"><b>是否在库：</b><span id=\"feixun_plug_checkasin"+idSubfix+"\"></span></div>\
                                    </div>\
                                    <div class=\"feixun_plug_row\">\
                                        <div class=\"feixun_plug_col-3\"><b>FBA费用：</b><span id=\"feixun_plug_totalFba"+idSubfix+"\"></span></div>\
                                        <div class=\"feixun_plug_col-3\"><b>重量：</b><span id=\"feixun_plug_weight"+idSubfix+"\"></span></div>\
                                        <div class=\"feixun_plug_col-3\"><b>利润率：</b><span id=\"feixun_plug_profitRate"+idSubfix+"\"></span></div>\
                                        <div class=\"feixun_plug_col-3\"><b>购物车：</b><span id=\"feixun_plug_amount"+idSubfix+"\"></span></div>\
                                    </div>\
                                    <div class=\"feixun_plug_row\">\
                                        <div class=\"feixun_plug_col-6\" ><b>上架时间：</b><span id=\"feixun_plug_AvailableDate"+idSubfix+"\"></span></div>\
                                        <div class=\"feixun_plug_col-6\" ><b>ASIN类型：</b><span id=\"feixun_plug_asinType"+idSubfix+"\"></span></div>\
                                        <div class=\"feixun_plug_col-6\" ><b>评论状态：</b><span id=\"feixun_plug_reviewType"+idSubfix+"\"></span></div>\
                                    </div>";
    return contentView;
}

function showInfo(info){
    addStyle();

    let newDiv = document.createElement("div");  
    
    newDiv.className="feixun_plug_container";
    
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
    if (hostname == 'www.amazon.com') {
        return 'us';
    }

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

function getSoldBy(callback,doc = document){
    const element = doc.getElementById('sellerProfileTriggerId');
    if (element) {
        callback(element.innerHTML);
    } else {
        callback('**');
    }
}

// 首先，找到id为'dynamic-aod-ingress-box'的div元素  

  
// 定义一个函数来查找和解析符合条件的span元素  
function getSoldByNumber(callback,doc = document) {  
    const container = doc.getElementById('dynamic-aod-ingress-box');  
    if (!container) {
        callback('1');
        return;
    }
    // 使用querySelectorAll查找所有span元素，然后遍历它们  
    const spans = container.querySelectorAll('span');  
    let findNumber = "1";
    spans.forEach(span => {  
        // 检查span的文本内容是否符合条件  
        const text = span.textContent.trim();  
        FXLog("[test] getSoldByNumber, 找到元素："+text)
        if (text.startsWith('New') && text.includes('(') && text.includes(')')) {  
            // 提取括号内的内容  
            const match = text.match(/\((\d+)\)/);  
            if (match) {  
                // 如果找到匹配项，match[1]就是括号内的数字  
                FXLog('找到的数字是:', match[1]);  
                findNumber = match[1];
            }
        }
    });
    
    callback(findNumber);
}  

function getShipsFrom(callback,doc = document) {  
    const container = doc.getElementById('fulfillerInfoFeature_feature_div');  
    let brand = getBrand() || getBrand2() || getBrand3();
    if (!container) {
        callback('**');
        return;
    }
    // 使用querySelectorAll查找所有span元素，然后遍历它们  
    const spans = container.querySelectorAll('span');  
    let ShipsFrom = "其他";
    spans.forEach(span => {  
        // 检查span的文本内容是否符合条件  
        const text = span.textContent.trim();  
        FXLog("[test] getShipsFrom, 找到元素："+text)
        if (text == "Amazon" || text == "Amazon " + brand ) {  
            ShipsFrom = `FBA(${text})`;
        } else if (text.indexOf('Amazon') != -1) {  
            ShipsFrom = `AMZ(${text})`;
        } else {
            ShipsFrom = `FBM(${text})`;
        }
    });
    
    callback(ShipsFrom);
}  

function getBestSellersRank(callback,doc = document){
    let finded = false;
    let result = {
        rank: "",
        category: ""
    };
    const container = doc.getElementById('detailBulletsWrapper_feature_div');  
    if (container) {
        // 使用querySelectorAll查找所有span元素，然后遍历它们  
        const spans = container.querySelectorAll('span');  
        spans.forEach(span => {  
            // 检查span的文本内容是否符合条件  
            const text = span.textContent.trim().replace(",","");
            // FXLog("尝试解析排名："+text);
            // 正则表达式提取排名  
            let rankRegex = /Rank:\s*(\d+)(?=\sin)/;  
            let rankMatch = text.match(rankRegex);  
            let rank = rankMatch ? rankMatch[1] : null; // 匹配到的第一个捕获组即为排名  
            // FXLog("rankMatch：",rankMatch);
            // 正则表达式提取分类名  
            let categoryRegex = /Best Sellers Rank:[^(]*\bin\s+([^()]+)/;  
            let categoryMatch = text.match(categoryRegex);  
            let category = categoryMatch ? categoryMatch[1] : null; // 匹配到的第一个捕获组即为分类名  
            // FXLog("categoryMatch:",categoryMatch);
            if (rank && category && !finded) {
                finded = true;
                result = {
                    rank: rank,
                    category: category
                };
                return;
            }
        });
    }
    
    if (finded) {
        callback(result);
    } else {
        getBestSellersRank2(callback,doc);
    }
    
}

function getBestSellersRank2(callback,doc = document){
    let result = {
        rank: "",
        category: ""
    };
    let finded = false;
    let BestSellersRank = getTableValueByTitle("productDetails_detailBullets_sections1","Best Sellers Rank",doc);
    FXLog("[test] getBestSellersRank2: "+BestSellersRank);
    if (BestSellersRank) {
        // 移除 (See Top ...) 部分  
        let cleanedStr = BestSellersRank.replace(/\(See Top \d+ in [^)]*\)/g, '');  
        cleanedStr = cleanedStr.replace(/(\d),(\d)/g, '$1$2');
        
        // 使用正则表达式匹配排名和类目  
        // \d+ 表示一个或多个数字  
        // (,\d+)* 表示零个或多个“逗号后跟一个或多个数字”的序列  
        // in\s+ 表示 "in" 后跟一个或多个空格  
        // (.*?) 表示非贪婪匹配任意字符，直到遇到正则表达式的结束部分  
        let regex = /(\d+)\s+in\s(.*?)(?=\s+\d+|$)/g;  
        let matches;  
        
        let allRanks = [];  
        while ((matches = regex.exec(cleanedStr)) !== null) {  
            // matches[1] 是排名（可能包含逗号），matches[2] 是类目  
            allRanks.push({  
                rank: matches[1].replace(/,/g, ''), // 如果需要，这里可以移除逗号  
                category: matches[2]  
            });  
        }  

        FXLog("[test] getBestSellersRank2",allRanks);

        if (allRanks.length >= 1 && allRanks[0].rank && allRanks[0].category) {
            result = allRanks[0];
            finded = true;
        }
    }

    if (finded) {
        callback(result);
    } else {
        getBestSellersRank3(callback,doc);
    }
}

function getBestSellersRank3(callback,doc = document){
    let result = {
        rank: "",
        category: ""
    };
    let finded = false;
    const productDetailLeft = doc.getElementById("productDetails_expanderTables_depthLeftSections");
    const productDetailRight = doc.getElementById("productDetails_expanderTables_depthRightSections");

    let findRankAction = (productDetail) => {
        if (productDetail) {
            const tables = productDetail.querySelectorAll('table');
            tables.forEach(table => {
                for (var i = 0; i < table.rows.length; i++) {  
                    var row = table.rows[i];  
                    // 获取当前行的标题单元格  
                    var th = row.cells[0];  
                    // 检查标题是否匹配  
                    if (th && th.textContent.indexOf("Best Sellers Rank") != -1) {  
                        // 如果匹配，返回对应的值单元格的内容  
                        const textContent = row.cells[1].textContent.trim().replace(/(\d),(\d)/g, '$1$2');  
                        let regex = /(\d+)\s+in\s(.*?)(?=\s+\d+|$)/g;  
    
                        let matches;  
                        
                        let allRanks = [];  
                        while ((matches = regex.exec(textContent)) !== null) {  
                            // matches[1] 是排名（可能包含逗号），matches[2] 是类目  
                            allRanks.push({  
                                rank: matches[1].replace(/,/g, ''), // 如果需要，这里可以移除逗号  
                                category: matches[2]  
                            });  
                        }  
    
                        FXLog("[test] getBestSellersRank2",allRanks);
    
                        if (allRanks.length >= 1 && allRanks[0].rank && allRanks[0].category) {
                            result = allRanks[0];
                            finded = true;
                        }
                    }  
                }  
            });
    
        }
    };

    findRankAction(productDetailLeft);
    if (!finded) {
        findRankAction(productDetailRight);
    }
    
    callback(result);
}



function getSizeInfo(callback,doc = document){

    let result = {
        size: "",
        weight: ""
    };

    const container = doc.getElementById('detailBullets_feature_div');  
    FXLog("获取到产品详情对象：",container);
    if (!container) {
        getSizeInfo2(callback);
        return;
    }
    // 使用querySelectorAll查找所有span元素，然后遍历它们  
    const spans = container.querySelectorAll('span');  
    let finded = false;
    spans.forEach(span => {  
        const trimmedStr = span.textContent.trim();
        FXLog("尝试解析尺寸重量：",trimmedStr);
        const regex = /(Package Dimensions|Product dimensions).*?:.*?(\d.*?);(.*)$/s;   
        const match = trimmedStr.match(regex);  
        FXLog("解析结果：",match);
        if (match) {
            const dimensions = match[2].trim();  
            const weight = match[3].trim();  
            if (dimensions && weight && !finded) {
                result = {
                    size: dimensions,
                    weight: weight
                };
                finded = true;
            }
        }
        
    });
    
    if (finded) {
        callback(result);
    } else {
        FXLog("每获取到尺寸信息，尝试方法2");
        getSizeInfo2(callback,doc);
    }
}

function getSizeInfo2(callback,doc = document){
    let result = {
        size: "",
        weight: ""
    };
    let sizeInfo = getTableValueByTitle("productDetails_techSpec_section_1","Package Dimensions",doc);
    FXLog("从表格获取尺寸信息：",sizeInfo);
    if (sizeInfo) {
        let sizeInfoArr = sizeInfo.split(";");
        if (sizeInfoArr && sizeInfoArr.length == 2) {
            result = {
                size: sizeInfoArr[0],
                weight: sizeInfoArr[1]
            };
            FXLog("获取成功：",result);
            callback(result);
            return;
        }
    }
    
    getSizeInfo3(callback, doc);
}

function getSizeInfo3(callback,doc = document){
    let result = {
        size: "",
        weight: ""
    };

    let weightInfo = getTableValueByTableParentId("productDetails_expanderTables_depthRightSections","Item Weight",doc);
    let sizeInfo = getTableValueByTableParentId("productDetails_expanderTables_depthRightSections","Item Dimensions",doc);

    FXLog("从表格获取重量信息2：",sizeInfo);
    if (weightInfo || sizeInfo) {
        result = {
            size: sizeInfo,
            weight: weightInfo
        };
        FXLog("尺寸获取成功：",result);
        callback(result);
        return;
    }

    getSizeInfo4(callback, doc);
}

function getSizeInfo4(callback,doc = document){
   

    let result = {
        size: "",
        weight: ""
    };
    var productDescription = doc.getElementById("productDescription"); 
    var ps = [];
    if (productDescription) {
        ps = productDescription.querySelectorAll('p');  
    }

    FXLog("从产品描述获取重量信息：",ps);

    var height = null;var width = null;var weight = null;
    ps.forEach(p => {  
        
        const trimmedStr = p.textContent.trim();

        FXLog("p：",trimmedStr);

        const heightReg = /Height:(.*)$/s;   
        const heightMatch = trimmedStr.match(heightReg);  
        if (heightMatch && height == null) {
            height = heightMatch[1].trim();
            height = height.replace('approx.', '');
            FXLog("hhh：",height);
        }

        const WidthReg = /Width:(.*)$/s;   
        const WidthMatch = trimmedStr.match(WidthReg);  
        if (WidthMatch && width == null) {
            width = WidthMatch[1].trim();
            width = width.replace('approx.', '');
            FXLog("wwww",width);
        }

        const WeightReg = /Weight:(.*)$/s;   
        const WeightMatch = trimmedStr.match(WeightReg);  
        if (WeightMatch && weight == null) {
            weight = WeightMatch[1].trim();
            weight = weight.replace('approx.', '');
            FXLog("wwweee",weight);
        }
    });

    FXLog("hww：",height,width,weight);

    if (height != null || width != null || weight != null) {
        result = {
            size: width + "x" + height,
            weight: weight
        }; 
        FXLog("尺寸获取成功：",result);
        callback(result);
        return;
    }

    FXLog("获取失败：",result);
    callback(result);
}

function getTableValueByTableParentId(tableParentId, title,doc = document) {  
    // 获取表格元素  
    var tableParent = doc.getElementById(tableParentId); 

    if (!tableParent) {
        return null;
    } 

    const tables = tableParent.querySelectorAll('table');  
    let result = null;
    tables.forEach(table => {  
        // 遍历表格的所有行  
        for (var i = 0; i < table.rows.length; i++) {  
            var row = table.rows[i];  
            // 获取当前行的标题单元格  
            var th = row.cells[0];  
            // 检查标题是否匹配  
            if (th && th.textContent.indexOf(title) != -1 && result == null) {  
                // 如果匹配，返回对应的值单元格的内容  
                result = row.cells[1].textContent.trim();  
            }  
        }  
    });
    
    // 如果没有找到匹配的标题，返回null  
    return result;  
}  
  
// 定义一个函数来查找并返回指定标题的值  
function getTableValueByTitle(tableId, title,doc = document) {  
    // 获取表格元素  
    var table = doc.getElementById(tableId); 
    if (!table) {
        return null;
    } 
    // 遍历表格的所有行  
    for (var i = 0; i < table.rows.length; i++) {  
        var row = table.rows[i];  
        // 获取当前行的标题单元格  
        var th = row.cells[0];  
        // 检查标题是否匹配  
        if (th && th.textContent.indexOf(title) != -1) {  
            // 如果匹配，返回对应的值单元格的内容  
            return row.cells[1].textContent.trim();  
        }  
    }  
    // 如果没有找到匹配的标题，返回null  
    return null;  
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

function getAvailableDate(callback,doc = document){
    let result = "";
    let finded = false;
    const container = doc.getElementById('detailBullets_feature_div');  
    FXLog("获取时间对象", container);
    if (container) {
        // 使用querySelectorAll查找所有span元素，然后遍历它们  
        const spans = container.querySelectorAll('span');  
        
        spans.forEach(span => {  
            const trimmedStr = span.textContent.trim();
            FXLog("尝试解析时间", trimmedStr);
            const regex = /Date First Available.*?:(.*)$/s;   
            const match = trimmedStr.match(regex);  
            FXLog("解析结果", match);
            if (match) {
                let date = match[1].trim();  
                date = date.replace(/\/n/g, "");
                if (date && !finded) {
                    finded = true;
                    result = date;

                    let dateObj = new Date(result);
                    if (!isNaN(dateObj.getTime())) {
                        dateObj.setDate(dateObj.getDate() + 1); 
                        let dateStr = dateObj.toISOString();
                        dateStr = dateStr.replace(/(.*)T.*/g,'$1');
                        result = dateStr
                    }
                }
            }
            
        });
    }
    
    if (finded) {
        callback(result);
    } else {
        getAvailableDate2(callback,doc);
    }

}

function getAvailableDate2(callback,doc = document){
    let availableDate = getTableValueByTitle("productDetails_detailBullets_sections1","Date First Available",doc);

    let result = "";
    if (availableDate) {
        result = availableDate;

        let dateObj = new Date(result);
        if (!isNaN(dateObj.getTime())) {
            dateObj.setDate(dateObj.getDate() + 1); 
            let dateStr = dateObj.toISOString();
            dateStr = dateStr.replace(/(.*)T.*/g,'$1');
            result = dateStr
        }
    }

    callback(result);
}

function getReviewNumber(callback,doc = document){
    const container = doc.getElementById('acrPopover');
    let ReviewNumber = "0";
    if (container) {
        ReviewNumber = container.title.substring(0,3);
    }
    callback(ReviewNumber)
}

function feixunShowToast(id,content) {
    const targetElement = document.getElementById(id);
    if (!targetElement) return;

    const toast = document.createElement('div');
    toast.classList.add('feixun_plug_toast');
    toast.textContent = content;
    document.body.appendChild(toast);

    const rect = targetElement.getBoundingClientRect();
    toast.style.top = rect.top - 50 + 'px';
    toast.style.left = rect.left + (rect.width / 2) - (toast.offsetWidth / 2) + 'px';

    toast.style.display = 'block';

    setTimeout(() => {
      toast.style.display = 'none';
      document.body.removeChild(toast);
    }, 3000);
}

function getAsinType(callback,doc = document){
    const container = doc.getElementById('provenanceCertifications_feature_div');
    let finded = false;
    if(container){
        const divs = container.querySelectorAll('div');  
        divs.forEach(div => {
            if (div.textContent.indexOf("Verified by Transparency") != -1){
                finded = true;
            }
        });
    }
    if (finded){ 
        callback("透明计划");
    } else {
        callback("");
    }
}

function getReviewType(callback,doc = document){
    const reviewHeader = doc.getElementById("cm-cr-dp-review-header");
    let reviewType = "";
    if (reviewHeader) {
        const spans = reviewHeader.querySelectorAll('span');
        spans.forEach(span => {
            if (span.textContent.indexOf("No customer reviews") != -1) {
                reviewType = "无评论"; // 无评论
            }
        });
    }

    if (reviewType == "") {
        const reviewMessage = doc.getElementById("cm-cr-dp-no-reviews-message");
        if (reviewMessage) {
            const divs = reviewMessage.querySelectorAll('div');
            divs.forEach(div => {
                if (div.textContent.indexOf("There are 0 reviews") != -1) {
                    reviewType = "无评论有评分"; // 无评论
                }
            });
        }
    }

    if (reviewType == "") {
        const reviewList = doc.getElementById("cm-cr-dp-review-list");
        if (reviewList) {
            reviewType = "有评论"; // 无评论
        }
    }

    callback(reviewType);
}

function getMerchantID(doc = document){
    const container = doc.getElementById('merchantID');
    if(container){ 
        return container.value;
    }
    return ""
}

function getProductTitle(callback, doc = document){
    const container = doc.getElementById('productTitle');
    if(container){ 
        callback(container.textContent);
    } else {
        callback("");
    }
}

function getProductImage(callback, doc = document){
    
    const container = doc.getElementById('imgTagWrapperId');
    FXLog('[getProductImage]container',container);
    // 找到img标签
    if (container) {
        const img = container.querySelector('img');
        FXLog('[getProductImage]img',img);
        if (img) {
            callback(img.src);
        } else {
            callback("");
        }
    } else {
        callback("");
    }
}

function copyById(id){
    const container = document.getElementById(id);
    if (container && container.textContent) {
        const tempTextarea = document.createElement('textarea');
        tempTextarea.value = container.textContent;
        document.body.appendChild(tempTextarea);tempTextarea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextarea);
    }

    feixunShowToast(id,'复制成功');
}

function parserToTitleFeatureDiv(retryTimes){
    let region = getRegion();
    let brand = getBrand() || getBrand2() || getBrand3();
    if (brand == null && retryTimes > 0) {
        FXLog("[test] 查不到品牌，3s后重试");
        setTimeout(() => {
            parserToTitleFeatureDiv(retryTimes - 1);
        },3);
        return;
    }
    FXLog("[test]当前品牌："+brand);

    showInfo(getMainContentView());

         //<div class=\"feixun_plug_item\" id=\"feixun_plug_size\">尺寸：查询中...</div>

    const svgElement = document.getElementById('feixun_plug_copy_asin_img');

    // 为 SVG 元素添加点击事件监听
    svgElement.addEventListener('click', function() {
        // 在这里添加点击后的处理逻辑
        FXLog('SVG 元素被点击了');
        copyById("feixun_plug_asin");
    });

    const copyBrandElement = document.getElementById('feixun_plug_copy_brand_img');

    // 为 SVG 元素添加点击事件监听
    copyBrandElement.addEventListener('click', function() {
        // 在这里添加点击后的处理逻辑
        FXLog('SVG 元素被点击了');
        copyById("feixun_plug_brand");
    });


    const refreshBtn = document.getElementById('feixun_plug_refresh_img');
    refreshBtn.addEventListener('click', function() {
        updateInfo("feixun_plug_brandState","查询中");
        updateInfo("feixun_plug_amount","查询中");
        updateInfo("feixun_plug_totalFba","查询中");
        updateInfo("feixun_plug_profitRate","查询中");
        updateInfo("feixun_plug_checkasin","查询中");

        refreshBtn.classList.add('rotating');
        refreshBtn.addEventListener('animationend', function() {
            refreshBtn.classList.remove('rotating');
        }, {once: true});

        chrome.storage.sync.get('feixunUserConfig', function(userConfig) { 
            window.feixunUserConfig = userConfig?userConfig.feixunUserConfig:{
                useWipoSwitch: "use",
                shipsFromTypes: ['FBA','FBM','AMZ'],
                soldByNumber: 8,
                categoryRank: 50000,
                amount: 10,
                profitRate: 45,
                reviewNumber: 3,
            };

            renderProductInfo(brand,region,null,false,null,true);
        });

    });

    renderProductInfo(brand,region,null,false,null,false);
}

function renderProductInfo(brand,region,listAsin,isList,detailDoc,isRefresh){

    const idSubfix = isList ? ("_"+listAsin) : "";
    if (!isList) {
        detailDoc = document;
    }
    
    chrome.storage.sync.get('feixunPlugCacheRroductInfo', function(result) {
        let cacheProductInfo = result.feixunPlugCacheRroductInfo;
        if (!cacheProductInfo){
            cacheProductInfo = {};
        }
        const asin = isList ? listAsin : getASIN();

        let currentAsinCache = cacheProductInfo[asin];
        if (currentAsinCache) {
            const nowTime = Date.now();
            const cacheTime = currentAsinCache['cacheTime'];
            // 缓存数据超过3天忽略
            if ((nowTime - cacheTime) > 3 * 24 * 60 * 60 * 1000) {
                currentAsinCache = null;
                FXLog('['+asin+']缓存过旧，忽略',currentAsinCache);
            }
        }
        // 主动刷新的时候，不使用缓存
        if (isRefresh) {
            currentAsinCache = null;
        }

        if (currentAsinCache) {
            FXLog('['+asin+']从chrome缓存查询到缓存的产品信息',currentAsinCache);
        }

        if (brand) {
            checkPduductInfoIsComplete(currentAsinCache,asin,'brand',brand);

            let brandListUrl = "https://" + window.location.host + "/s?k=" + encodeURI(brand) + "&ref=bl_dp_s_web_0";
            const bylineInfo = document.getElementById('bylineInfo');
            if (bylineInfo && bylineInfo.href) {
                brandListUrl = bylineInfo.href;
            }

            updateInfo("feixun_plug_brand"+idSubfix,"<a href='"+brandListUrl+"' target=\"_blank\">"+brand+"<a/>");
            const checkBrandCallback = (data)=>{
                FXLog("[test]查询品牌结果：",data);
                
                let state = "";
                let SY = "",SN = "",WY = "",WN = "";
                if (data.trademarkOffice.count != undefined) {
                    if (data.trademarkOffice.count > 0) {
                        checkPduductInfoIsComplete(currentAsinCache,asin,'brandTCount',data.trademarkOffice.count);
                        SY = "<span class=\"feixun_plug_flag_red\">已注册"+"（T:" + data.trademarkOffice.count+")</span>";
                    } else {
                        checkPduductInfoIsComplete(currentAsinCache,asin,'brandTCount',0);
                        SN = "<span class=\"feixun_plug_flag_green\">未注册（T:0）</span>";
                    }
                } else {
                    checkPduductInfoIsComplete(currentAsinCache,asin,'brandTCount',-1);
                }
                if (data.wipo.count != undefined) {
                    if (data.wipo.count > 0) {
                        checkPduductInfoIsComplete(currentAsinCache,asin,'brandGCount',data.wipo.count);
                        WY = "<span class=\"feixun_plug_flag_red\">已注册"+"（G:" + data.wipo.count+")</span>";
                    } else {
                        checkPduductInfoIsComplete(currentAsinCache,asin,'brandGCount',0);
                        WN = "<span class=\"feixun_plug_flag_green\">未注册（G:0）</span>";
                    }
                } else {
                    checkPduductInfoIsComplete(currentAsinCache,asin,'brandGCount',-1);
                }

                if (window.feixunUserConfig.useWipoSwitch == 'use') {
                    if (SY != "" || SN != "" || WY != "" || WN != "") {
                        state = SY + SN + WY + WN;
                    } else {
                        state = "查询失败";
                    }
                } else {
                    if (SY != "") {
                        state = SY;
                    } else if (WY != "") {
                        state = WY;
                    } else if (SN != "") {
                        state = SN
                    } else if (WN != "") {
                        state = WN
                    } else {
                        state = "查询失败";
                    }
                }

                updateInfo("feixun_plug_brandState"+idSubfix,state);
            };

            if (currentAsinCache && (currentAsinCache['brandTCount'] != -1 || currentAsinCache['brandGCount'] != -1)) {
                checkBrandCallback({
                    'trademarkOffice': {
                        'count': currentAsinCache['brandTCount']
                    },
                    'wipo': {
                        'count': currentAsinCache['brandGCount']
                    }
                });
            } else {
                checkBrandWithAll(brand,checkBrandCallback);
            }
        } else {
            checkPduductInfoIsComplete(currentAsinCache,asin,'brand','');
            checkPduductInfoIsComplete(currentAsinCache,asin,'brandGCount',-1);
            checkPduductInfoIsComplete(currentAsinCache,asin,'brandTCount',-1);
            updateInfo("feixun_plug_brand"+idSubfix,"获取失败");
            updateInfo("feixun_plug_brandState"+idSubfix,"获取失败");
        }

        if (asin) {
            updateInfo("feixun_plug_asin"+idSubfix,asin);
            const checkAsinCallback = (response)=>{
                if (response && response.code == 0) {
                    checkPduductInfoIsComplete(currentAsinCache,asin,'asinIsExist',0);
                    updateInfo("feixun_plug_checkasin"+idSubfix,"<span class=\"feixun_plug_flag_red\">已存在（"+region+")</span>");
                } else if (response && response.code == 1) {
                    checkPduductInfoIsComplete(currentAsinCache,asin,'asinIsExist',1);
                    updateInfo("feixun_plug_checkasin"+idSubfix,"<span class=\"feixun_plug_flag_green\">不存在（"+region+")</span>");
                }  else if (response.desc) {
                    checkPduductInfoIsComplete(currentAsinCache,asin,'asinIsExist',-1);
                    updateInfo("feixun_plug_checkasin"+idSubfix,response.desc);
                }
                
            };
            if (currentAsinCache && currentAsinCache['asinIsExist'] != -1) {
                checkAsinCallback({
                    'code': currentAsinCache['asinIsExist']
                });
            } else {
                checkAsin(asin,checkAsinCallback);
            }


           const getFBACallback = (response)=>{
                if (response.amount) {
                    var classType = "feixun_plug_flag_green";
                    if (parseFloat(response.amount) < window.feixunUserConfig.amount) {
                        classType = "feixun_plug_flag_red"
                    }

                    var profitRateClassType = "feixun_plug_flag_green";
                    if (parseFloat(response.profitRate) < window.feixunUserConfig.profitRate) {
                        profitRateClassType = "feixun_plug_flag_red"
                    }

                    updateInfo("feixun_plug_amount"+idSubfix,"<span class=\""+classType+"\">" + response.amount + "</span>");
                    updateInfo("feixun_plug_totalFba"+idSubfix,response.totalFBA);
                    updateInfo("feixun_plug_profitRate"+idSubfix,"<span class=\""+profitRateClassType+"\">" + response.profitRate + "</span>");

                    checkPduductInfoIsComplete(currentAsinCache,asin,'amount',response.amount);
                    checkPduductInfoIsComplete(currentAsinCache,asin,'totalFba',response.totalFBA);
                    checkPduductInfoIsComplete(currentAsinCache,asin,'profitRate',response.profitRate);
                } else if (response.desc) {
                    updateInfo("feixun_plug_amount"+idSubfix,data.desc);
                    updateInfo("feixun_plug_totalFba"+idSubfix,data.desc);
                    updateInfo("feixun_plug_profitRate"+idSubfix,data.desc);

                    checkPduductInfoIsComplete(currentAsinCache,asin,'amount',0);
                    checkPduductInfoIsComplete(currentAsinCache,asin,'totalFba',0);
                    checkPduductInfoIsComplete(currentAsinCache,asin,'profitRate',0);
                } else if (response.desc) {
                    updateInfo("feixun_plug_amount"+idSubfix,"查询失败");
                    updateInfo("feixun_plug_totalFba"+idSubfix,"查询失败");
                    updateInfo("feixun_plug_profitRate"+idSubfix,"查询失败");

                    checkPduductInfoIsComplete(currentAsinCache,asin,'amount',0);
                    checkPduductInfoIsComplete(currentAsinCache,asin,'totalFba',0);
                    checkPduductInfoIsComplete(currentAsinCache,asin,'profitRate',0);
                }
            };
            if (currentAsinCache) {
                getFBACallback({
                    'amount': currentAsinCache['amount'],
                    'profitRate': currentAsinCache['profitRate'],
                    'totalFBA': currentAsinCache['totalFba']
                });
            } else {
                getFBA(asin,getFBACallback);
            }
            
        }


        getSoldBy((response)=>{
            var SoldByMainUrl = "https://" + window.location.host + "/sp?seller=" + getMerchantID(detailDoc);
            updateInfo("feixun_plug_soldBy"+idSubfix,"<a href='"+SoldByMainUrl+"' target=\"_blank\">"+response+"<a/>");
            checkPduductInfoIsComplete(currentAsinCache,asin,'soldBy',response);
        },detailDoc);

        getSoldByNumber((response)=>{
            var classType = "feixun_plug_flag_green";
            if (parseInt(response) >= window.feixunUserConfig.soldByNumber) {
                classType = "feixun_plug_flag_red"
            }
            updateInfo("feixun_plug_soldByNumber"+idSubfix,"<span class=\""+classType+"\">" + response + "</span>");
            checkPduductInfoIsComplete(currentAsinCache,asin,'soldByNumber',response);
        },detailDoc);

        getShipsFrom((response)=>{
            var type = response.substring(0,3);
            var classType = "feixun_plug_flag_green";
            if (window.feixunUserConfig.shipsFromTypes.includes(type)) {
                classType = "feixun_plug_flag_red";
            }
            updateInfo("feixun_plug_ShipsFrom"+idSubfix,"<span class=\""+classType+"\">" + response + "</span>");
            checkPduductInfoIsComplete(currentAsinCache,asin,'ShipsFrom',response);
        },detailDoc);

        getBestSellersRank((response)=>{
            var classType = "feixun_plug_flag_green";
            if (parseInt(response.rank) >= window.feixunUserConfig.categoryRank) {
                classType = "feixun_plug_flag_red";
            }
            updateInfo("feixun_plug_rank"+idSubfix,"<span class=\""+classType+"\">" + response.rank + "</span>");
            updateInfo("feixun_plug_category"+idSubfix,response.category);
            checkPduductInfoIsComplete(currentAsinCache,asin,'rank',response.rank);
            checkPduductInfoIsComplete(currentAsinCache,asin,'category',response.category);
        },detailDoc);

        getSizeInfo((response)=>{
            // updateInfo("feixun_plug_size","<b>尺寸:</b>"+response.size);
            updateInfo("feixun_plug_weight"+idSubfix,response.weight);
            checkPduductInfoIsComplete(currentAsinCache,asin,'weight',response.weight);
            checkPduductInfoIsComplete(currentAsinCache,asin,'size',response.size);
        },detailDoc);

        getAvailableDate((response)=>{
            updateInfo("feixun_plug_AvailableDate"+idSubfix,response);
            checkPduductInfoIsComplete(currentAsinCache,asin,'AvailableDate',response);
        },detailDoc);

        getReviewNumber((response)=>{
            var classType = "feixun_plug_flag_green";
            if (parseFloat(response) < window.feixunUserConfig.reviewNumber) {
                classType = "feixun_plug_flag_red"
            }
            
            updateInfo("feixun_plug_ReviewNumber"+idSubfix,"<span class=\""+classType+"\">" + response + "</span>");
            checkPduductInfoIsComplete(currentAsinCache,asin,'ReviewNumber',response);
        },detailDoc);

        getAsinType((response)=>{
            if (response != "") {
                updateInfo("feixun_plug_asinType"+idSubfix,"<span class=\"feixun_plug_flag_red\">"+response+"</span>");
            } else{
                updateInfo("feixun_plug_asinType"+idSubfix,"<span class=\"feixun_plug_flag_green\">无</span>");
            }
            checkPduductInfoIsComplete(currentAsinCache,asin,'asinType',response);
        },detailDoc);

        getReviewType((response)=>{
            var color="green";
            if (response == "有评论") {
                color="green";
            } else if (response == "无评论") {
                color="red";
            } else if (response == "无评论有评分") {
                color="yellow";
            }
            updateInfo("feixun_plug_reviewType"+idSubfix,"<span class=\"feixun_plug_flag_"+color+"\">"+response+"</span>");
            checkPduductInfoIsComplete(currentAsinCache,asin,'reviewType',response);
        },detailDoc);

        getProductTitle((title)=>{
            checkPduductInfoIsComplete(currentAsinCache,asin,'productTitle',title);
        },detailDoc);

        getProductImage((image)=>{
            checkPduductInfoIsComplete(currentAsinCache,asin,'productImage',image);
        },detailDoc);
    });
}

function checkPduductInfoIsComplete(cahce, asin, type, value){
    if (cahce) {
        FXLog('['+asin+']'+type+"通过缓存加载的："+value);
        return;
    }

    FXLog('['+asin+']'+type+"查询完成："+value);

    if (!window.feixunPlugTempRroductInfo) {
        window.feixunPlugTempRroductInfo = {};
        FXLog('['+asin+']初始化临时缓存');
    }

    let asinInfo = {};
    if (window.feixunPlugTempRroductInfo && window.feixunPlugTempRroductInfo[asin]) {
        asinInfo = window.feixunPlugTempRroductInfo[asin];
        // FXLog('['+asin+']从临时缓存获取到当前产品信息');
    }
    
    // 更新数据
    asinInfo[type] = value;
    window.feixunPlugTempRroductInfo[asin] = asinInfo;
    // FXLog('['+asin+']更新临时缓存的产品信息');


    const allKeys = Object.keys(asinInfo);
    const allType = ['asinIsExist','brand','brandGCount','brandTCount','amount','totalFba','profitRate','soldBy','soldByNumber','ShipsFrom','rank','category','weight','size','AvailableDate','ReviewNumber','asinType','reviewType','productTitle','productImage'];
    let isComplete = true;

    allType.forEach(type => {
        if (!allKeys.includes(type)) {
            isComplete = false;
            FXLog('['+asin+']还有'+type+'未查询');
        }
    });

    if (isComplete) {
        let tempProductInfo = window.feixunPlugTempRroductInfo[asin];
        window.feixunPlugTempRroductInfo[asin] = null;

        FXLog('['+asin+']已查询完所有产品信息，更新到chrome缓存',tempProductInfo);
        tempProductInfo['cacheTime'] = Date.now();

        chrome.storage.sync.get('feixunPlugCacheRroductInfo', function(result) {
            let cacheProductInfo = result.feixunPlugCacheRroductInfo;
            if (!cacheProductInfo){
                cacheProductInfo = {};
            }
            FXLog('['+asin+']从chrome缓存查询已存产品信息',cacheProductInfo);
            cacheProductInfo[asin] = tempProductInfo;

            chrome.storage.sync.set({'feixunPlugCacheRroductInfo': cacheProductInfo},function (res) {
                FXLog('['+asin+']更新到chrome缓存完成');
            });
        });

        addPlugProductRecord(asin, tempProductInfo);
    }
}


function addPlugProductRecord(asin, productInfo){
    FXLog("[addPlugProductRecord] start");
    chrome.storage.sync.get('userInfo', function(result) {
        FXLog("[addPlugProductRecord] 获取用户信息：",result);
        const userInfo = result.userInfo;

        if (!userInfo) {
            FXLog("[addPlugProductRecord] 缺少用户信息");
            return;
        }

        let requestParams = {
            'asin': asin,
            'plugVersion': window.feixunPlugVersion,
            'userId': userInfo.id,
            'seller':productInfo['soldBy'],
            'sellerCount':productInfo['soldByNumber'],
            'shippingMethod':productInfo['ShipsFrom'],
            'rank':productInfo['rank'],
            'category':productInfo['category'],
            'rating':productInfo['ReviewNumber'],
            'brandName':productInfo['brand'],
            'fbaFee':productInfo['totalFba'],
            'weight':productInfo['weight'],
            'dimensions':productInfo['size'],
            'profitMargin':productInfo['profitRate'],
            'price':productInfo['amount'],
            'listingDate':productInfo['AvailableDate'],
            'asinType':productInfo['asinType'],
            'reviewStatus':productInfo['reviewType'],
            'wipoBrandRegistrationStatus':productInfo['brandGCount'],
            'trademarkOfficeBrandRegistrationStatus':productInfo['brandTCount'],
            'productTitle':productInfo['productTitle'],
            'pictureUrl':productInfo['productImage'],
        }

        let url = 'http://119.91.217.3/index.php/admin/index/addPlugProductRecord';
        chrome.runtime.sendMessage({
            action: "makePOSTRequest",
            url: url,
            token: userInfo.token,
            data: requestParams
        },(response)=> {
            FXLog("[addPlugProductRecord]  response:",response);
        });
    });
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
        callback(brand,doc);
    });
}

function parserToSerchListView(){
    let region = getRegion();
    const divs = document.querySelectorAll('.s-result-list div'); 

    addStyle();
    
    divs.forEach(div => {  
        // 检查div是否包含data-asin属性  
        if (div.hasAttribute('data-asin') && div.getAttribute('data-asin').trim() !== '') {  
            const asin = div.getAttribute('data-asin');
            FXLog("[test] 查询到asin："+asin);

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
                newDiv.style.display = "inline-block";
                newDiv.style.maxWidth = "700px";
                newDiv.style.minWidth = "250px";
                newDiv.style.textAlign = "left";
                newDiv.style.padding = "10px"; 
                newDiv.style.backgroundColor = "#e2effd"; 
                newDiv.style.zIndex = "1000"; 
                newDiv.className="feixun_plug_container";

                newDiv.innerHTML = getMainContentView(asin);

                declarativeSpan.appendChild(newDiv); 


                const svgElement = document.getElementById('feixun_plug_copy_asin_img_'+asin);

                // 为 SVG 元素添加点击事件监听
                svgElement.addEventListener('click', function() {
                    // 在这里添加点击后的处理逻辑
                    FXLog('SVG 元素被点击了');
                    copyById("feixun_plug_asin_"+asin);
                });

                const copyBrandElement = document.getElementById('feixun_plug_copy_brand_img_'+asin);

                // 为 SVG 元素添加点击事件监听
                copyBrandElement.addEventListener('click', function() {
                    // 在这里添加点击后的处理逻辑
                    FXLog('SVG 元素被点击了');
                    copyById("feixun_plug_brand_"+asin);
                });

                const refreshBtn = document.getElementById('feixun_plug_refresh_img_'+asin);
                refreshBtn.addEventListener('click', function() {
                    updateInfo("feixun_plug_brandState_"+asin,"查询中");
                    updateInfo("feixun_plug_amount_"+asin,"查询中");
                    updateInfo("feixun_plug_totalFba_"+asin,"查询中");
                    updateInfo("feixun_plug_profitRate_"+asin,"查询中");
                    updateInfo("feixun_plug_checkasin_"+asin,"查询中");

                    refreshBtn.classList.add('rotating');
                    refreshBtn.addEventListener('animationend', function() {
                        refreshBtn.classList.remove('rotating');
                    }, {once: true});

                    chrome.storage.sync.get('feixunUserConfig', function(userConfig) { 
                        window.feixunUserConfig = userConfig?userConfig.feixunUserConfig:{
                            useWipoSwitch: "use",
                            shipsFromTypes: ['FBA','FBM','AMZ'],
                            soldByNumber: 8,
                            categoryRank: 50000,
                            amount: 10,
                            profitRate: 45,
                            reviewNumber: 3,
                        };
                        getBrandFromDetail(asin, (brand,detailDoc)=>{
                            renderProductInfo(brand,region,asin,true,detailDoc,true);
                        });
                    });

                });

                FXLog("[test]["+asin+"] 页面初始化完成");

                getBrandFromDetail(asin, (brand,detailDoc)=>{
                    FXLog("[test]["+asin+"] 获取到产品详情页,开始查询产品信息",detailDoc);
                    
                    renderProductInfo(brand,region,asin,true,detailDoc,false);
                });


/*
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
                       FXLog("[test] 查询到"+asin+"品牌注册情况：",data);
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
                */
            }  
        }  
    }); 
}

function mainAction(){

    chrome.storage.sync.get('feixunUserConfig', function(userConfig) { 
        window.feixunUserConfig = userConfig?userConfig.feixunUserConfig:{
            useWipoSwitch: "use",
            shipsFromTypes: ['FBA','FBM','AMZ'],
            soldByNumber: 8,
            categoryRank: 50000,
            amount: 10,
            profitRate: 45,
            reviewNumber: 3,
        };

        window.feixunPlugVersion = "20241019050933";

        if (hasTitleFeatureDiv()) {
            parserToTitleFeatureDiv(3);
        } else if (hasSearchResultDiv()) {
            parserToSerchListView();
            let curHref = window.location.href;
            setInterval(() => {
                FXLog("[test] 检测是否翻页");
                if (curHref != window.location.href) {
                    FXLog("[test] 翻页了，重新获取数据");
                    setTimeout(() => {
                        parserToSerchListView();
                    }, 2000);
                    curHref = window.location.href;
                }
            }, 2000);
        } else {
            FXLog("[test] 未知页面");
        }

        chrome.storage.sync.get('feixunplugchecktime',function(feixunplugchecktime){
            if (feixunplugchecktime && feixunplugchecktime.feixunplugchecktime) { 
                const tenMinutesInMilliseconds = 60 * 60 * 1000;
                const currentTime = Date.now();
                const timeDifference = currentTime - feixunplugchecktime.feixunplugchecktime;
                if (timeDifference < tenMinutesInMilliseconds) {
                    return;
                }
            }
            checkVersionIsAvalible((res)=>{
                if (res && res.data && res.data.code == 200) {
                    chrome.storage.sync.set({'feixunplugchecktime': Date.now()},function (res) {
                        console.log('校验时间保存成功',res);
                    });
                } else {
                    chrome.storage.sync.set({'feixunplugchecktime': 0},function () {
    
                    });
                   const mainContentViews = document.getElementsByClassName("feixun_plug_container");
                   for (let i = 0; i < mainContentViews.length; i++) {
                        const element = mainContentViews[i];
                        let state = "接口请求异常";
                        if (res && res.data && res.data.desc) {
                            state = res.data.desc;
                        } else if (res && res.desc) {
                            state = res.desc;
                        } else if (res && res.msg) {
                            state = res.msg;
                        }
    
                        const maskView = document.createElement('div');
                        maskView.className="feixun_plug_mask";
                        maskView.innerHTML = "<h2 style=\"color:#fff;\">" + state + "</h2>";
    
                        element.appendChild(maskView);
                    }
                }
            });
        });
        
    });
    
}

mainAction(3);










!function(t, e) {
    "object" == typeof exports ? module.exports = exports = e() : "function" == typeof define && define.amd ? define([], e) : t.CryptoJS = e()
}(this, function() {
    var n, o, s, a, h, t, e, l, r, i, c, f, d, u, p, S, x, b, A, H, z, _, v, g, y, B, w, k, m, C, D, E, R, M, F, P, W, O, I, U = U || function(h) {
        var i;
        if ("undefined" != typeof window && window.crypto && (i = window.crypto),
        "undefined" != typeof self && self.crypto && (i = self.crypto),
        !(i = !(i = !(i = "undefined" != typeof globalThis && globalThis.crypto ? globalThis.crypto : i) && "undefined" != typeof window && window.msCrypto ? window.msCrypto : i) && "undefined" != typeof global && global.crypto ? global.crypto : i) && "function" == typeof require)
            try {
                i = require("crypto")
            } catch (t) {}
        var r = Object.create || function(t) {
            return e.prototype = t,
            t = new e,
            e.prototype = null,
            t
        }
        ;
        function e() {}
        var t = {}
          , n = t.lib = {}
          , o = n.Base = {
            extend: function(t) {
                var e = r(this);
                return t && e.mixIn(t),
                e.hasOwnProperty("init") && this.init !== e.init || (e.init = function() {
                    e.$super.init.apply(this, arguments)
                }
                ),
                (e.init.prototype = e).$super = this,
                e
            },
            create: function() {
                var t = this.extend();
                return t.init.apply(t, arguments),
                t
            },
            init: function() {},
            mixIn: function(t) {
                for (var e in t)
                    t.hasOwnProperty(e) && (this[e] = t[e]);
                t.hasOwnProperty("toString") && (this.toString = t.toString)
            },
            clone: function() {
                return this.init.prototype.extend(this)
            }
        }
          , l = n.WordArray = o.extend({
            init: function(t, e) {
                t = this.words = t || [],
                this.sigBytes = null != e ? e : 4 * t.length
            },
            toString: function(t) {
                return (t || c).stringify(this)
            },
            concat: function(t) {
                var e = this.words
                  , r = t.words
                  , i = this.sigBytes
                  , n = t.sigBytes;
                if (this.clamp(),
                i % 4)
                    for (var o = 0; o < n; o++) {
                        var s = r[o >>> 2] >>> 24 - o % 4 * 8 & 255;
                        e[i + o >>> 2] |= s << 24 - (i + o) % 4 * 8
                    }
                else
                    for (var c = 0; c < n; c += 4)
                        e[i + c >>> 2] = r[c >>> 2];
                return this.sigBytes += n,
                this
            },
            clamp: function() {
                var t = this.words
                  , e = this.sigBytes;
                t[e >>> 2] &= 4294967295 << 32 - e % 4 * 8,
                t.length = h.ceil(e / 4)
            },
            clone: function() {
                var t = o.clone.call(this);
                return t.words = this.words.slice(0),
                t
            },
            random: function(t) {
                for (var e = [], r = 0; r < t; r += 4)
                    e.push(function() {
                        if (i) {
                            if ("function" == typeof i.getRandomValues)
                                try {
                                    return i.getRandomValues(new Uint32Array(1))[0]
                                } catch (t) {}
                            if ("function" == typeof i.randomBytes)
                                try {
                                    return i.randomBytes(4).readInt32LE()
                                } catch (t) {}
                        }
                        throw new Error("Native crypto module could not be used to get secure random number.")
                    }());
                return new l.init(e,t)
            }
        })
          , s = t.enc = {}
          , c = s.Hex = {
            stringify: function(t) {
                for (var e = t.words, r = t.sigBytes, i = [], n = 0; n < r; n++) {
                    var o = e[n >>> 2] >>> 24 - n % 4 * 8 & 255;
                    i.push((o >>> 4).toString(16)),
                    i.push((15 & o).toString(16))
                }
                return i.join("")
            },
            parse: function(t) {
                for (var e = t.length, r = [], i = 0; i < e; i += 2)
                    r[i >>> 3] |= parseInt(t.substr(i, 2), 16) << 24 - i % 8 * 4;
                return new l.init(r,e / 2)
            }
        }
          , a = s.Latin1 = {
            stringify: function(t) {
                for (var e = t.words, r = t.sigBytes, i = [], n = 0; n < r; n++) {
                    var o = e[n >>> 2] >>> 24 - n % 4 * 8 & 255;
                    i.push(String.fromCharCode(o))
                }
                return i.join("")
            },
            parse: function(t) {
                for (var e = t.length, r = [], i = 0; i < e; i++)
                    r[i >>> 2] |= (255 & t.charCodeAt(i)) << 24 - i % 4 * 8;
                return new l.init(r,e)
            }
        }
          , f = s.Utf8 = {
            stringify: function(t) {
                try {
                    return decodeURIComponent(escape(a.stringify(t)))
                } catch (t) {
                    throw new Error("Malformed UTF-8 data")
                }
            },
            parse: function(t) {
                return a.parse(unescape(encodeURIComponent(t)))
            }
        }
          , d = n.BufferedBlockAlgorithm = o.extend({
            reset: function() {
                this._data = new l.init,
                this._nDataBytes = 0
            },
            _append: function(t) {
                "string" == typeof t && (t = f.parse(t)),
                this._data.concat(t),
                this._nDataBytes += t.sigBytes
            },
            _process: function(t) {
                var e, r = this._data, i = r.words, n = r.sigBytes, o = this.blockSize, s = n / (4 * o), c = (s = t ? h.ceil(s) : h.max((0 | s) - this._minBufferSize, 0)) * o, n = h.min(4 * c, n);
                if (c) {
                    for (var a = 0; a < c; a += o)
                        this._doProcessBlock(i, a);
                    e = i.splice(0, c),
                    r.sigBytes -= n
                }
                return new l.init(e,n)
            },
            clone: function() {
                var t = o.clone.call(this);
                return t._data = this._data.clone(),
                t
            },
            _minBufferSize: 0
        })
          , u = (n.Hasher = d.extend({
            cfg: o.extend(),
            init: function(t) {
                this.cfg = this.cfg.extend(t),
                this.reset()
            },
            reset: function() {
                d.reset.call(this),
                this._doReset()
            },
            update: function(t) {
                return this._append(t),
                this._process(),
                this
            },
            finalize: function(t) {
                return t && this._append(t),
                this._doFinalize()
            },
            blockSize: 16,
            _createHelper: function(r) {
                return function(t, e) {
                    return new r.init(e).finalize(t)
                }
            },
            _createHmacHelper: function(r) {
                return function(t, e) {
                    return new u.HMAC.init(r,e).finalize(t)
                }
            }
        }),
        t.algo = {});
        return t
    }(Math);
    function K(t, e, r) {
        return t & e | ~t & r
    }
    function X(t, e, r) {
        return t & r | e & ~r
    }
    function L(t, e) {
        return t << e | t >>> 32 - e
    }
    function j(t, e, r, i) {
        var n, o = this._iv;
        o ? (n = o.slice(0),
        this._iv = void 0) : n = this._prevBlock,
        i.encryptBlock(n, 0);
        for (var s = 0; s < r; s++)
            t[e + s] ^= n[s]
    }
    function T(t) {
        var e, r, i;
        return 255 == (t >> 24 & 255) ? (r = t >> 8 & 255,
        i = 255 & t,
        255 === (e = t >> 16 & 255) ? (e = 0,
        255 === r ? (r = 0,
        255 === i ? i = 0 : ++i) : ++r) : ++e,
        t = 0,
        t += e << 16,
        t += r << 8,
        t += i) : t += 1 << 24,
        t
    }
    function N() {
        for (var t = this._X, e = this._C, r = 0; r < 8; r++)
            E[r] = e[r];
        e[0] = e[0] + 1295307597 + this._b | 0,
        e[1] = e[1] + 3545052371 + (e[0] >>> 0 < E[0] >>> 0 ? 1 : 0) | 0,
        e[2] = e[2] + 886263092 + (e[1] >>> 0 < E[1] >>> 0 ? 1 : 0) | 0,
        e[3] = e[3] + 1295307597 + (e[2] >>> 0 < E[2] >>> 0 ? 1 : 0) | 0,
        e[4] = e[4] + 3545052371 + (e[3] >>> 0 < E[3] >>> 0 ? 1 : 0) | 0,
        e[5] = e[5] + 886263092 + (e[4] >>> 0 < E[4] >>> 0 ? 1 : 0) | 0,
        e[6] = e[6] + 1295307597 + (e[5] >>> 0 < E[5] >>> 0 ? 1 : 0) | 0,
        e[7] = e[7] + 3545052371 + (e[6] >>> 0 < E[6] >>> 0 ? 1 : 0) | 0,
        this._b = e[7] >>> 0 < E[7] >>> 0 ? 1 : 0;
        for (r = 0; r < 8; r++) {
            var i = t[r] + e[r]
              , n = 65535 & i
              , o = i >>> 16;
            R[r] = ((n * n >>> 17) + n * o >>> 15) + o * o ^ ((4294901760 & i) * i | 0) + ((65535 & i) * i | 0)
        }
        t[0] = R[0] + (R[7] << 16 | R[7] >>> 16) + (R[6] << 16 | R[6] >>> 16) | 0,
        t[1] = R[1] + (R[0] << 8 | R[0] >>> 24) + R[7] | 0,
        t[2] = R[2] + (R[1] << 16 | R[1] >>> 16) + (R[0] << 16 | R[0] >>> 16) | 0,
        t[3] = R[3] + (R[2] << 8 | R[2] >>> 24) + R[1] | 0,
        t[4] = R[4] + (R[3] << 16 | R[3] >>> 16) + (R[2] << 16 | R[2] >>> 16) | 0,
        t[5] = R[5] + (R[4] << 8 | R[4] >>> 24) + R[3] | 0,
        t[6] = R[6] + (R[5] << 16 | R[5] >>> 16) + (R[4] << 16 | R[4] >>> 16) | 0,
        t[7] = R[7] + (R[6] << 8 | R[6] >>> 24) + R[5] | 0
    }
    function q() {
        for (var t = this._X, e = this._C, r = 0; r < 8; r++)
            O[r] = e[r];
        e[0] = e[0] + 1295307597 + this._b | 0,
        e[1] = e[1] + 3545052371 + (e[0] >>> 0 < O[0] >>> 0 ? 1 : 0) | 0,
        e[2] = e[2] + 886263092 + (e[1] >>> 0 < O[1] >>> 0 ? 1 : 0) | 0,
        e[3] = e[3] + 1295307597 + (e[2] >>> 0 < O[2] >>> 0 ? 1 : 0) | 0,
        e[4] = e[4] + 3545052371 + (e[3] >>> 0 < O[3] >>> 0 ? 1 : 0) | 0,
        e[5] = e[5] + 886263092 + (e[4] >>> 0 < O[4] >>> 0 ? 1 : 0) | 0,
        e[6] = e[6] + 1295307597 + (e[5] >>> 0 < O[5] >>> 0 ? 1 : 0) | 0,
        e[7] = e[7] + 3545052371 + (e[6] >>> 0 < O[6] >>> 0 ? 1 : 0) | 0,
        this._b = e[7] >>> 0 < O[7] >>> 0 ? 1 : 0;
        for (r = 0; r < 8; r++) {
            var i = t[r] + e[r]
              , n = 65535 & i
              , o = i >>> 16;
            I[r] = ((n * n >>> 17) + n * o >>> 15) + o * o ^ ((4294901760 & i) * i | 0) + ((65535 & i) * i | 0)
        }
        t[0] = I[0] + (I[7] << 16 | I[7] >>> 16) + (I[6] << 16 | I[6] >>> 16) | 0,
        t[1] = I[1] + (I[0] << 8 | I[0] >>> 24) + I[7] | 0,
        t[2] = I[2] + (I[1] << 16 | I[1] >>> 16) + (I[0] << 16 | I[0] >>> 16) | 0,
        t[3] = I[3] + (I[2] << 8 | I[2] >>> 24) + I[1] | 0,
        t[4] = I[4] + (I[3] << 16 | I[3] >>> 16) + (I[2] << 16 | I[2] >>> 16) | 0,
        t[5] = I[5] + (I[4] << 8 | I[4] >>> 24) + I[3] | 0,
        t[6] = I[6] + (I[5] << 16 | I[5] >>> 16) + (I[4] << 16 | I[4] >>> 16) | 0,
        t[7] = I[7] + (I[6] << 8 | I[6] >>> 24) + I[5] | 0
    }
    return F = (M = U).lib,
    n = F.Base,
    o = F.WordArray,
    (M = M.x64 = {}).Word = n.extend({
        init: function(t, e) {
            this.high = t,
            this.low = e
        }
    }),
    M.WordArray = n.extend({
        init: function(t, e) {
            t = this.words = t || [],
            this.sigBytes = null != e ? e : 8 * t.length
        },
        toX32: function() {
            for (var t = this.words, e = t.length, r = [], i = 0; i < e; i++) {
                var n = t[i];
                r.push(n.high),
                r.push(n.low)
            }
            return o.create(r, this.sigBytes)
        },
        clone: function() {
            for (var t = n.clone.call(this), e = t.words = this.words.slice(0), r = e.length, i = 0; i < r; i++)
                e[i] = e[i].clone();
            return t
        }
    }),
    "function" == typeof ArrayBuffer && (P = U.lib.WordArray,
    s = P.init,
    (P.init = function(t) {
        if ((t = (t = t instanceof ArrayBuffer ? new Uint8Array(t) : t)instanceof Int8Array || "undefined" != typeof Uint8ClampedArray && t instanceof Uint8ClampedArray || t instanceof Int16Array || t instanceof Uint16Array || t instanceof Int32Array || t instanceof Uint32Array || t instanceof Float32Array || t instanceof Float64Array ? new Uint8Array(t.buffer,t.byteOffset,t.byteLength) : t)instanceof Uint8Array) {
            for (var e = t.byteLength, r = [], i = 0; i < e; i++)
                r[i >>> 2] |= t[i] << 24 - i % 4 * 8;
            s.call(this, r, e)
        } else
            s.apply(this, arguments)
    }
    ).prototype = P),
    function() {
        var t = U
          , n = t.lib.WordArray
          , t = t.enc;
        t.Utf16 = t.Utf16BE = {
            stringify: function(t) {
                for (var e = t.words, r = t.sigBytes, i = [], n = 0; n < r; n += 2) {
                    var o = e[n >>> 2] >>> 16 - n % 4 * 8 & 65535;
                    i.push(String.fromCharCode(o))
                }
                return i.join("")
            },
            parse: function(t) {
                for (var e = t.length, r = [], i = 0; i < e; i++)
                    r[i >>> 1] |= t.charCodeAt(i) << 16 - i % 2 * 16;
                return n.create(r, 2 * e)
            }
        };
        function s(t) {
            return t << 8 & 4278255360 | t >>> 8 & 16711935
        }
        t.Utf16LE = {
            stringify: function(t) {
                for (var e = t.words, r = t.sigBytes, i = [], n = 0; n < r; n += 2) {
                    var o = s(e[n >>> 2] >>> 16 - n % 4 * 8 & 65535);
                    i.push(String.fromCharCode(o))
                }
                return i.join("")
            },
            parse: function(t) {
                for (var e = t.length, r = [], i = 0; i < e; i++)
                    r[i >>> 1] |= s(t.charCodeAt(i) << 16 - i % 2 * 16);
                return n.create(r, 2 * e)
            }
        }
    }(),
    a = (w = U).lib.WordArray,
    w.enc.Base64 = {
        stringify: function(t) {
            var e = t.words
              , r = t.sigBytes
              , i = this._map;
            t.clamp();
            for (var n = [], o = 0; o < r; o += 3)
                for (var s = (e[o >>> 2] >>> 24 - o % 4 * 8 & 255) << 16 | (e[o + 1 >>> 2] >>> 24 - (o + 1) % 4 * 8 & 255) << 8 | e[o + 2 >>> 2] >>> 24 - (o + 2) % 4 * 8 & 255, c = 0; c < 4 && o + .75 * c < r; c++)
                    n.push(i.charAt(s >>> 6 * (3 - c) & 63));
            var a = i.charAt(64);
            if (a)
                for (; n.length % 4; )
                    n.push(a);
            return n.join("")
        },
        parse: function(t) {
            var e = t.length
              , r = this._map;
            if (!(i = this._reverseMap))
                for (var i = this._reverseMap = [], n = 0; n < r.length; n++)
                    i[r.charCodeAt(n)] = n;
            var o = r.charAt(64);
            return !o || -1 !== (o = t.indexOf(o)) && (e = o),
            function(t, e, r) {
                for (var i = [], n = 0, o = 0; o < e; o++) {
                    var s, c;
                    o % 4 && (s = r[t.charCodeAt(o - 1)] << o % 4 * 2,
                    c = r[t.charCodeAt(o)] >>> 6 - o % 4 * 2,
                    c = s | c,
                    i[n >>> 2] |= c << 24 - n % 4 * 8,
                    n++)
                }
                return a.create(i, n)
            }(t, e, i)
        },
        _map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
    },
    h = (F = U).lib.WordArray,
    F.enc.Base64url = {
        stringify: function(t, e=!0) {
            var r = t.words
              , i = t.sigBytes
              , n = e ? this._safe_map : this._map;
            t.clamp();
            for (var o = [], s = 0; s < i; s += 3)
                for (var c = (r[s >>> 2] >>> 24 - s % 4 * 8 & 255) << 16 | (r[s + 1 >>> 2] >>> 24 - (s + 1) % 4 * 8 & 255) << 8 | r[s + 2 >>> 2] >>> 24 - (s + 2) % 4 * 8 & 255, a = 0; a < 4 && s + .75 * a < i; a++)
                    o.push(n.charAt(c >>> 6 * (3 - a) & 63));
            var h = n.charAt(64);
            if (h)
                for (; o.length % 4; )
                    o.push(h);
            return o.join("")
        },
        parse: function(t, e=!0) {
            var r = t.length
              , i = e ? this._safe_map : this._map;
            if (!(n = this._reverseMap))
                for (var n = this._reverseMap = [], o = 0; o < i.length; o++)
                    n[i.charCodeAt(o)] = o;
            e = i.charAt(64);
            return !e || -1 !== (e = t.indexOf(e)) && (r = e),
            function(t, e, r) {
                for (var i = [], n = 0, o = 0; o < e; o++) {
                    var s, c;
                    o % 4 && (s = r[t.charCodeAt(o - 1)] << o % 4 * 2,
                    c = r[t.charCodeAt(o)] >>> 6 - o % 4 * 2,
                    c = s | c,
                    i[n >>> 2] |= c << 24 - n % 4 * 8,
                    n++)
                }
                return h.create(i, n)
            }(t, r, n)
        },
        _map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
        _safe_map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
    },
    function(a) {
        var t = U
          , e = t.lib
          , r = e.WordArray
          , i = e.Hasher
          , e = t.algo
          , A = [];
        !function() {
            for (var t = 0; t < 64; t++)
                A[t] = 4294967296 * a.abs(a.sin(t + 1)) | 0
        }();
        e = e.MD5 = i.extend({
            _doReset: function() {
                this._hash = new r.init([1732584193, 4023233417, 2562383102, 271733878])
            },
            _doProcessBlock: function(t, e) {
                for (var r = 0; r < 16; r++) {
                    var i = e + r
                      , n = t[i];
                    t[i] = 16711935 & (n << 8 | n >>> 24) | 4278255360 & (n << 24 | n >>> 8)
                }
                var o = this._hash.words
                  , s = t[e + 0]
                  , c = t[e + 1]
                  , a = t[e + 2]
                  , h = t[e + 3]
                  , l = t[e + 4]
                  , f = t[e + 5]
                  , d = t[e + 6]
                  , u = t[e + 7]
                  , p = t[e + 8]
                  , _ = t[e + 9]
                  , y = t[e + 10]
                  , v = t[e + 11]
                  , g = t[e + 12]
                  , B = t[e + 13]
                  , w = t[e + 14]
                  , k = t[e + 15]
                  , m = H(m = o[0], b = o[1], x = o[2], S = o[3], s, 7, A[0])
                  , S = H(S, m, b, x, c, 12, A[1])
                  , x = H(x, S, m, b, a, 17, A[2])
                  , b = H(b, x, S, m, h, 22, A[3]);
                m = H(m, b, x, S, l, 7, A[4]),
                S = H(S, m, b, x, f, 12, A[5]),
                x = H(x, S, m, b, d, 17, A[6]),
                b = H(b, x, S, m, u, 22, A[7]),
                m = H(m, b, x, S, p, 7, A[8]),
                S = H(S, m, b, x, _, 12, A[9]),
                x = H(x, S, m, b, y, 17, A[10]),
                b = H(b, x, S, m, v, 22, A[11]),
                m = H(m, b, x, S, g, 7, A[12]),
                S = H(S, m, b, x, B, 12, A[13]),
                x = H(x, S, m, b, w, 17, A[14]),
                m = z(m, b = H(b, x, S, m, k, 22, A[15]), x, S, c, 5, A[16]),
                S = z(S, m, b, x, d, 9, A[17]),
                x = z(x, S, m, b, v, 14, A[18]),
                b = z(b, x, S, m, s, 20, A[19]),
                m = z(m, b, x, S, f, 5, A[20]),
                S = z(S, m, b, x, y, 9, A[21]),
                x = z(x, S, m, b, k, 14, A[22]),
                b = z(b, x, S, m, l, 20, A[23]),
                m = z(m, b, x, S, _, 5, A[24]),
                S = z(S, m, b, x, w, 9, A[25]),
                x = z(x, S, m, b, h, 14, A[26]),
                b = z(b, x, S, m, p, 20, A[27]),
                m = z(m, b, x, S, B, 5, A[28]),
                S = z(S, m, b, x, a, 9, A[29]),
                x = z(x, S, m, b, u, 14, A[30]),
                m = C(m, b = z(b, x, S, m, g, 20, A[31]), x, S, f, 4, A[32]),
                S = C(S, m, b, x, p, 11, A[33]),
                x = C(x, S, m, b, v, 16, A[34]),
                b = C(b, x, S, m, w, 23, A[35]),
                m = C(m, b, x, S, c, 4, A[36]),
                S = C(S, m, b, x, l, 11, A[37]),
                x = C(x, S, m, b, u, 16, A[38]),
                b = C(b, x, S, m, y, 23, A[39]),
                m = C(m, b, x, S, B, 4, A[40]),
                S = C(S, m, b, x, s, 11, A[41]),
                x = C(x, S, m, b, h, 16, A[42]),
                b = C(b, x, S, m, d, 23, A[43]),
                m = C(m, b, x, S, _, 4, A[44]),
                S = C(S, m, b, x, g, 11, A[45]),
                x = C(x, S, m, b, k, 16, A[46]),
                m = D(m, b = C(b, x, S, m, a, 23, A[47]), x, S, s, 6, A[48]),
                S = D(S, m, b, x, u, 10, A[49]),
                x = D(x, S, m, b, w, 15, A[50]),
                b = D(b, x, S, m, f, 21, A[51]),
                m = D(m, b, x, S, g, 6, A[52]),
                S = D(S, m, b, x, h, 10, A[53]),
                x = D(x, S, m, b, y, 15, A[54]),
                b = D(b, x, S, m, c, 21, A[55]),
                m = D(m, b, x, S, p, 6, A[56]),
                S = D(S, m, b, x, k, 10, A[57]),
                x = D(x, S, m, b, d, 15, A[58]),
                b = D(b, x, S, m, B, 21, A[59]),
                m = D(m, b, x, S, l, 6, A[60]),
                S = D(S, m, b, x, v, 10, A[61]),
                x = D(x, S, m, b, a, 15, A[62]),
                b = D(b, x, S, m, _, 21, A[63]),
                o[0] = o[0] + m | 0,
                o[1] = o[1] + b | 0,
                o[2] = o[2] + x | 0,
                o[3] = o[3] + S | 0
            },
            _doFinalize: function() {
                var t = this._data
                  , e = t.words
                  , r = 8 * this._nDataBytes
                  , i = 8 * t.sigBytes;
                e[i >>> 5] |= 128 << 24 - i % 32;
                var n = a.floor(r / 4294967296)
                  , r = r;
                e[15 + (64 + i >>> 9 << 4)] = 16711935 & (n << 8 | n >>> 24) | 4278255360 & (n << 24 | n >>> 8),
                e[14 + (64 + i >>> 9 << 4)] = 16711935 & (r << 8 | r >>> 24) | 4278255360 & (r << 24 | r >>> 8),
                t.sigBytes = 4 * (e.length + 1),
                this._process();
                for (var e = this._hash, o = e.words, s = 0; s < 4; s++) {
                    var c = o[s];
                    o[s] = 16711935 & (c << 8 | c >>> 24) | 4278255360 & (c << 24 | c >>> 8)
                }
                return e
            },
            clone: function() {
                var t = i.clone.call(this);
                return t._hash = this._hash.clone(),
                t
            }
        });
        function H(t, e, r, i, n, o, s) {
            s = t + (e & r | ~e & i) + n + s;
            return (s << o | s >>> 32 - o) + e
        }
        function z(t, e, r, i, n, o, s) {
            s = t + (e & i | r & ~i) + n + s;
            return (s << o | s >>> 32 - o) + e
        }
        function C(t, e, r, i, n, o, s) {
            s = t + (e ^ r ^ i) + n + s;
            return (s << o | s >>> 32 - o) + e
        }
        function D(t, e, r, i, n, o, s) {
            s = t + (r ^ (e | ~i)) + n + s;
            return (s << o | s >>> 32 - o) + e
        }
        t.MD5 = i._createHelper(e),
        t.HmacMD5 = i._createHmacHelper(e)
    }(Math),
    P = (M = U).lib,
    t = P.WordArray,
    e = P.Hasher,
    P = M.algo,
    l = [],
    P = P.SHA1 = e.extend({
        _doReset: function() {
            this._hash = new t.init([1732584193, 4023233417, 2562383102, 271733878, 3285377520])
        },
        _doProcessBlock: function(t, e) {
            for (var r = this._hash.words, i = r[0], n = r[1], o = r[2], s = r[3], c = r[4], a = 0; a < 80; a++) {
                a < 16 ? l[a] = 0 | t[e + a] : (h = l[a - 3] ^ l[a - 8] ^ l[a - 14] ^ l[a - 16],
                l[a] = h << 1 | h >>> 31);
                var h = (i << 5 | i >>> 27) + c + l[a];
                h += a < 20 ? 1518500249 + (n & o | ~n & s) : a < 40 ? 1859775393 + (n ^ o ^ s) : a < 60 ? (n & o | n & s | o & s) - 1894007588 : (n ^ o ^ s) - 899497514,
                c = s,
                s = o,
                o = n << 30 | n >>> 2,
                n = i,
                i = h
            }
            r[0] = r[0] + i | 0,
            r[1] = r[1] + n | 0,
            r[2] = r[2] + o | 0,
            r[3] = r[3] + s | 0,
            r[4] = r[4] + c | 0
        },
        _doFinalize: function() {
            var t = this._data
              , e = t.words
              , r = 8 * this._nDataBytes
              , i = 8 * t.sigBytes;
            return e[i >>> 5] |= 128 << 24 - i % 32,
            e[14 + (64 + i >>> 9 << 4)] = Math.floor(r / 4294967296),
            e[15 + (64 + i >>> 9 << 4)] = r,
            t.sigBytes = 4 * e.length,
            this._process(),
            this._hash
        },
        clone: function() {
            var t = e.clone.call(this);
            return t._hash = this._hash.clone(),
            t
        }
    }),
    M.SHA1 = e._createHelper(P),
    M.HmacSHA1 = e._createHmacHelper(P),
    function(n) {
        var t = U
          , e = t.lib
          , r = e.WordArray
          , i = e.Hasher
          , e = t.algo
          , o = []
          , p = [];
        !function() {
            function t(t) {
                return 4294967296 * (t - (0 | t)) | 0
            }
            for (var e = 2, r = 0; r < 64; )
                !function(t) {
                    for (var e = n.sqrt(t), r = 2; r <= e; r++)
                        if (!(t % r))
                            return;
                    return 1
                }(e) || (r < 8 && (o[r] = t(n.pow(e, .5))),
                p[r] = t(n.pow(e, 1 / 3)),
                r++),
                e++
        }();
        var _ = []
          , e = e.SHA256 = i.extend({
            _doReset: function() {
                this._hash = new r.init(o.slice(0))
            },
            _doProcessBlock: function(t, e) {
                for (var r = this._hash.words, i = r[0], n = r[1], o = r[2], s = r[3], c = r[4], a = r[5], h = r[6], l = r[7], f = 0; f < 64; f++) {
                    f < 16 ? _[f] = 0 | t[e + f] : (d = _[f - 15],
                    u = _[f - 2],
                    _[f] = ((d << 25 | d >>> 7) ^ (d << 14 | d >>> 18) ^ d >>> 3) + _[f - 7] + ((u << 15 | u >>> 17) ^ (u << 13 | u >>> 19) ^ u >>> 10) + _[f - 16]);
                    var d = i & n ^ i & o ^ n & o
                      , u = l + ((c << 26 | c >>> 6) ^ (c << 21 | c >>> 11) ^ (c << 7 | c >>> 25)) + (c & a ^ ~c & h) + p[f] + _[f]
                      , l = h
                      , h = a
                      , a = c
                      , c = s + u | 0
                      , s = o
                      , o = n
                      , n = i
                      , i = u + (((i << 30 | i >>> 2) ^ (i << 19 | i >>> 13) ^ (i << 10 | i >>> 22)) + d) | 0
                }
                r[0] = r[0] + i | 0,
                r[1] = r[1] + n | 0,
                r[2] = r[2] + o | 0,
                r[3] = r[3] + s | 0,
                r[4] = r[4] + c | 0,
                r[5] = r[5] + a | 0,
                r[6] = r[6] + h | 0,
                r[7] = r[7] + l | 0
            },
            _doFinalize: function() {
                var t = this._data
                  , e = t.words
                  , r = 8 * this._nDataBytes
                  , i = 8 * t.sigBytes;
                return e[i >>> 5] |= 128 << 24 - i % 32,
                e[14 + (64 + i >>> 9 << 4)] = n.floor(r / 4294967296),
                e[15 + (64 + i >>> 9 << 4)] = r,
                t.sigBytes = 4 * e.length,
                this._process(),
                this._hash
            },
            clone: function() {
                var t = i.clone.call(this);
                return t._hash = this._hash.clone(),
                t
            }
        });
        t.SHA256 = i._createHelper(e),
        t.HmacSHA256 = i._createHmacHelper(e)
    }(Math),
    r = (w = U).lib.WordArray,
    F = w.algo,
    i = F.SHA256,
    F = F.SHA224 = i.extend({
        _doReset: function() {
            this._hash = new r.init([3238371032, 914150663, 812702999, 4144912697, 4290775857, 1750603025, 1694076839, 3204075428])
        },
        _doFinalize: function() {
            var t = i._doFinalize.call(this);
            return t.sigBytes -= 4,
            t
        }
    }),
    w.SHA224 = i._createHelper(F),
    w.HmacSHA224 = i._createHmacHelper(F),
    function() {
        var t = U
          , e = t.lib.Hasher
          , r = t.x64
          , i = r.Word
          , n = r.WordArray
          , r = t.algo;
        function o() {
            return i.create.apply(i, arguments)
        }
        var t1 = [o(1116352408, 3609767458), o(1899447441, 602891725), o(3049323471, 3964484399), o(3921009573, 2173295548), o(961987163, 4081628472), o(1508970993, 3053834265), o(2453635748, 2937671579), o(2870763221, 3664609560), o(3624381080, 2734883394), o(310598401, 1164996542), o(607225278, 1323610764), o(1426881987, 3590304994), o(1925078388, 4068182383), o(2162078206, 991336113), o(2614888103, 633803317), o(3248222580, 3479774868), o(3835390401, 2666613458), o(4022224774, 944711139), o(264347078, 2341262773), o(604807628, 2007800933), o(770255983, 1495990901), o(1249150122, 1856431235), o(1555081692, 3175218132), o(1996064986, 2198950837), o(2554220882, 3999719339), o(2821834349, 766784016), o(2952996808, 2566594879), o(3210313671, 3203337956), o(3336571891, 1034457026), o(3584528711, 2466948901), o(113926993, 3758326383), o(338241895, 168717936), o(666307205, 1188179964), o(773529912, 1546045734), o(1294757372, 1522805485), o(1396182291, 2643833823), o(1695183700, 2343527390), o(1986661051, 1014477480), o(2177026350, 1206759142), o(2456956037, 344077627), o(2730485921, 1290863460), o(2820302411, 3158454273), o(3259730800, 3505952657), o(3345764771, 106217008), o(3516065817, 3606008344), o(3600352804, 1432725776), o(4094571909, 1467031594), o(275423344, 851169720), o(430227734, 3100823752), o(506948616, 1363258195), o(659060556, 3750685593), o(883997877, 3785050280), o(958139571, 3318307427), o(1322822218, 3812723403), o(1537002063, 2003034995), o(1747873779, 3602036899), o(1955562222, 1575990012), o(2024104815, 1125592928), o(2227730452, 2716904306), o(2361852424, 442776044), o(2428436474, 593698344), o(2756734187, 3733110249), o(3204031479, 2999351573), o(3329325298, 3815920427), o(3391569614, 3928383900), o(3515267271, 566280711), o(3940187606, 3454069534), o(4118630271, 4000239992), o(116418474, 1914138554), o(174292421, 2731055270), o(289380356, 3203993006), o(460393269, 320620315), o(685471733, 587496836), o(852142971, 1086792851), o(1017036298, 365543100), o(1126000580, 2618297676), o(1288033470, 3409855158), o(1501505948, 4234509866), o(1607167915, 987167468), o(1816402316, 1246189591)]
          , e1 = [];
        !function() {
            for (var t = 0; t < 80; t++)
                e1[t] = o()
        }();
        r = r.SHA512 = e.extend({
            _doReset: function() {
                this._hash = new n.init([new i.init(1779033703,4089235720), new i.init(3144134277,2227873595), new i.init(1013904242,4271175723), new i.init(2773480762,1595750129), new i.init(1359893119,2917565137), new i.init(2600822924,725511199), new i.init(528734635,4215389547), new i.init(1541459225,327033209)])
            },
            _doProcessBlock: function(t, e) {
                for (var r = this._hash.words, i = r[0], n = r[1], o = r[2], s = r[3], c = r[4], a = r[5], h = r[6], l = r[7], f = i.high, d = i.low, u = n.high, p = n.low, _ = o.high, y = o.low, v = s.high, g = s.low, B = c.high, w = c.low, k = a.high, m = a.low, S = h.high, x = h.low, b = l.high, r = l.low, A = f, H = d, z = u, C = p, D = _, E = y, R = v, M = g, F = B, P = w, W = k, O = m, I = S, U = x, K = b, X = r, L = 0; L < 80; L++) {
                    var j, T, N = e1[L];
                    L < 16 ? (T = N.high = 0 | t[e + 2 * L],
                    j = N.low = 0 | t[e + 2 * L + 1]) : ($ = (q = e1[L - 15]).high,
                    J = q.low,
                    G = (Q = e1[L - 2]).high,
                    V = Q.low,
                    Z = (Y = e1[L - 7]).high,
                    q = Y.low,
                    Y = (Q = e1[L - 16]).high,
                    T = (T = (($ >>> 1 | J << 31) ^ ($ >>> 8 | J << 24) ^ $ >>> 7) + Z + ((j = (Z = (J >>> 1 | $ << 31) ^ (J >>> 8 | $ << 24) ^ (J >>> 7 | $ << 25)) + q) >>> 0 < Z >>> 0 ? 1 : 0)) + ((G >>> 19 | V << 13) ^ (G << 3 | V >>> 29) ^ G >>> 6) + ((j += J = (V >>> 19 | G << 13) ^ (V << 3 | G >>> 29) ^ (V >>> 6 | G << 26)) >>> 0 < J >>> 0 ? 1 : 0),
                    j += $ = Q.low,
                    N.high = T = T + Y + (j >>> 0 < $ >>> 0 ? 1 : 0),
                    N.low = j);
                    var q = F & W ^ ~F & I
                      , Z = P & O ^ ~P & U
                      , V = A & z ^ A & D ^ z & D
                      , G = (H >>> 28 | A << 4) ^ (H << 30 | A >>> 2) ^ (H << 25 | A >>> 7)
                      , J = t1[L]
                      , Q = J.high
                      , Y = J.low
                      , $ = X + ((P >>> 14 | F << 18) ^ (P >>> 18 | F << 14) ^ (P << 23 | F >>> 9))
                      , N = K + ((F >>> 14 | P << 18) ^ (F >>> 18 | P << 14) ^ (F << 23 | P >>> 9)) + ($ >>> 0 < X >>> 0 ? 1 : 0)
                      , J = G + (H & C ^ H & E ^ C & E)
                      , K = I
                      , X = U
                      , I = W
                      , U = O
                      , W = F
                      , O = P
                      , F = R + (N = (N = (N = N + q + (($ = $ + Z) >>> 0 < Z >>> 0 ? 1 : 0)) + Q + (($ = $ + Y) >>> 0 < Y >>> 0 ? 1 : 0)) + T + (($ = $ + j) >>> 0 < j >>> 0 ? 1 : 0)) + ((P = M + $ | 0) >>> 0 < M >>> 0 ? 1 : 0) | 0
                      , R = D
                      , M = E
                      , D = z
                      , E = C
                      , z = A
                      , C = H
                      , A = N + (((A >>> 28 | H << 4) ^ (A << 30 | H >>> 2) ^ (A << 25 | H >>> 7)) + V + (J >>> 0 < G >>> 0 ? 1 : 0)) + ((H = $ + J | 0) >>> 0 < $ >>> 0 ? 1 : 0) | 0
                }
                d = i.low = d + H,
                i.high = f + A + (d >>> 0 < H >>> 0 ? 1 : 0),
                p = n.low = p + C,
                n.high = u + z + (p >>> 0 < C >>> 0 ? 1 : 0),
                y = o.low = y + E,
                o.high = _ + D + (y >>> 0 < E >>> 0 ? 1 : 0),
                g = s.low = g + M,
                s.high = v + R + (g >>> 0 < M >>> 0 ? 1 : 0),
                w = c.low = w + P,
                c.high = B + F + (w >>> 0 < P >>> 0 ? 1 : 0),
                m = a.low = m + O,
                a.high = k + W + (m >>> 0 < O >>> 0 ? 1 : 0),
                x = h.low = x + U,
                h.high = S + I + (x >>> 0 < U >>> 0 ? 1 : 0),
                r = l.low = r + X,
                l.high = b + K + (r >>> 0 < X >>> 0 ? 1 : 0)
            },
            _doFinalize: function() {
                var t = this._data
                  , e = t.words
                  , r = 8 * this._nDataBytes
                  , i = 8 * t.sigBytes;
                return e[i >>> 5] |= 128 << 24 - i % 32,
                e[30 + (128 + i >>> 10 << 5)] = Math.floor(r / 4294967296),
                e[31 + (128 + i >>> 10 << 5)] = r,
                t.sigBytes = 4 * e.length,
                this._process(),
                this._hash.toX32()
            },
            clone: function() {
                var t = e.clone.call(this);
                return t._hash = this._hash.clone(),
                t
            },
            blockSize: 32
        });
        t.SHA512 = e._createHelper(r),
        t.HmacSHA512 = e._createHmacHelper(r)
    }(),
    P = (M = U).x64,
    c = P.Word,
    f = P.WordArray,
    P = M.algo,
    d = P.SHA512,
    P = P.SHA384 = d.extend({
        _doReset: function() {
            this._hash = new f.init([new c.init(3418070365,3238371032), new c.init(1654270250,914150663), new c.init(2438529370,812702999), new c.init(355462360,4144912697), new c.init(1731405415,4290775857), new c.init(2394180231,1750603025), new c.init(3675008525,1694076839), new c.init(1203062813,3204075428)])
        },
        _doFinalize: function() {
            var t = d._doFinalize.call(this);
            return t.sigBytes -= 16,
            t
        }
    }),
    M.SHA384 = d._createHelper(P),
    M.HmacSHA384 = d._createHmacHelper(P),
    function(l) {
        var t = U
          , e = t.lib
          , f = e.WordArray
          , i = e.Hasher
          , d = t.x64.Word
          , e = t.algo
          , A = []
          , H = []
          , z = [];
        !function() {
            for (var t = 1, e = 0, r = 0; r < 24; r++) {
                A[t + 5 * e] = (r + 1) * (r + 2) / 2 % 64;
                var i = (2 * t + 3 * e) % 5;
                t = e % 5,
                e = i
            }
            for (t = 0; t < 5; t++)
                for (e = 0; e < 5; e++)
                    H[t + 5 * e] = e + (2 * t + 3 * e) % 5 * 5;
            for (var n = 1, o = 0; o < 24; o++) {
                for (var s, c = 0, a = 0, h = 0; h < 7; h++)
                    1 & n && ((s = (1 << h) - 1) < 32 ? a ^= 1 << s : c ^= 1 << s - 32),
                    128 & n ? n = n << 1 ^ 113 : n <<= 1;
                z[o] = d.create(c, a)
            }
        }();
        var C = [];
        !function() {
            for (var t = 0; t < 25; t++)
                C[t] = d.create()
        }();
        e = e.SHA3 = i.extend({
            cfg: i.cfg.extend({
                outputLength: 512
            }),
            _doReset: function() {
                for (var t = this._state = [], e = 0; e < 25; e++)
                    t[e] = new d.init;
                this.blockSize = (1600 - 2 * this.cfg.outputLength) / 32
            },
            _doProcessBlock: function(t, e) {
                for (var r = this._state, i = this.blockSize / 2, n = 0; n < i; n++) {
                    var o = t[e + 2 * n]
                      , s = t[e + 2 * n + 1]
                      , o = 16711935 & (o << 8 | o >>> 24) | 4278255360 & (o << 24 | o >>> 8);
                    (m = r[n]).high ^= s = 16711935 & (s << 8 | s >>> 24) | 4278255360 & (s << 24 | s >>> 8),
                    m.low ^= o
                }
                for (var c = 0; c < 24; c++) {
                    for (var a = 0; a < 5; a++) {
                        for (var h = 0, l = 0, f = 0; f < 5; f++)
                            h ^= (m = r[a + 5 * f]).high,
                            l ^= m.low;
                        var d = C[a];
                        d.high = h,
                        d.low = l
                    }
                    for (a = 0; a < 5; a++)
                        for (var u = C[(a + 4) % 5], p = C[(a + 1) % 5], _ = p.high, p = p.low, h = u.high ^ (_ << 1 | p >>> 31), l = u.low ^ (p << 1 | _ >>> 31), f = 0; f < 5; f++)
                            (m = r[a + 5 * f]).high ^= h,
                            m.low ^= l;
                    for (var y = 1; y < 25; y++) {
                        var v = (m = r[y]).high
                          , g = m.low
                          , B = A[y];
                        l = B < 32 ? (h = v << B | g >>> 32 - B,
                        g << B | v >>> 32 - B) : (h = g << B - 32 | v >>> 64 - B,
                        v << B - 32 | g >>> 64 - B);
                        B = C[H[y]];
                        B.high = h,
                        B.low = l
                    }
                    var w = C[0]
                      , k = r[0];
                    w.high = k.high,
                    w.low = k.low;
                    for (a = 0; a < 5; a++)
                        for (f = 0; f < 5; f++) {
                            var m = r[y = a + 5 * f]
                              , S = C[y]
                              , x = C[(a + 1) % 5 + 5 * f]
                              , b = C[(a + 2) % 5 + 5 * f];
                            m.high = S.high ^ ~x.high & b.high,
                            m.low = S.low ^ ~x.low & b.low
                        }
                    m = r[0],
                    k = z[c];
                    m.high ^= k.high,
                    m.low ^= k.low
                }
            },
            _doFinalize: function() {
                var t = this._data
                  , e = t.words
                  , r = (this._nDataBytes,
                8 * t.sigBytes)
                  , i = 32 * this.blockSize;
                e[r >>> 5] |= 1 << 24 - r % 32,
                e[(l.ceil((1 + r) / i) * i >>> 5) - 1] |= 128,
                t.sigBytes = 4 * e.length,
                this._process();
                for (var n = this._state, e = this.cfg.outputLength / 8, o = e / 8, s = [], c = 0; c < o; c++) {
                    var a = n[c]
                      , h = a.high
                      , a = a.low
                      , h = 16711935 & (h << 8 | h >>> 24) | 4278255360 & (h << 24 | h >>> 8);
                    s.push(a = 16711935 & (a << 8 | a >>> 24) | 4278255360 & (a << 24 | a >>> 8)),
                    s.push(h)
                }
                return new f.init(s,e)
            },
            clone: function() {
                for (var t = i.clone.call(this), e = t._state = this._state.slice(0), r = 0; r < 25; r++)
                    e[r] = e[r].clone();
                return t
            }
        });
        t.SHA3 = i._createHelper(e),
        t.HmacSHA3 = i._createHmacHelper(e)
    }(Math),
    Math,
    F = (w = U).lib,
    u = F.WordArray,
    p = F.Hasher,
    F = w.algo,
    S = u.create([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8, 3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12, 1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2, 4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13]),
    x = u.create([5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12, 6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2, 15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13, 8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14, 12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11]),
    b = u.create([11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8, 7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12, 11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5, 11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12, 9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6]),
    A = u.create([8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6, 9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11, 9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5, 15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8, 8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11]),
    H = u.create([0, 1518500249, 1859775393, 2400959708, 2840853838]),
    z = u.create([1352829926, 1548603684, 1836072691, 2053994217, 0]),
    F = F.RIPEMD160 = p.extend({
        _doReset: function() {
            this._hash = u.create([1732584193, 4023233417, 2562383102, 271733878, 3285377520])
        },
        _doProcessBlock: function(t, e) {
            for (var r = 0; r < 16; r++) {
                var i = e + r
                  , n = t[i];
                t[i] = 16711935 & (n << 8 | n >>> 24) | 4278255360 & (n << 24 | n >>> 8)
            }
            for (var o, s, c, a, h, l, f = this._hash.words, d = H.words, u = z.words, p = S.words, _ = x.words, y = b.words, v = A.words, g = o = f[0], B = s = f[1], w = c = f[2], k = a = f[3], m = h = f[4], r = 0; r < 80; r += 1)
                l = o + t[e + p[r]] | 0,
                l += r < 16 ? (s ^ c ^ a) + d[0] : r < 32 ? K(s, c, a) + d[1] : r < 48 ? ((s | ~c) ^ a) + d[2] : r < 64 ? X(s, c, a) + d[3] : (s ^ (c | ~a)) + d[4],
                l = (l = L(l |= 0, y[r])) + h | 0,
                o = h,
                h = a,
                a = L(c, 10),
                c = s,
                s = l,
                l = g + t[e + _[r]] | 0,
                l += r < 16 ? (B ^ (w | ~k)) + u[0] : r < 32 ? X(B, w, k) + u[1] : r < 48 ? ((B | ~w) ^ k) + u[2] : r < 64 ? K(B, w, k) + u[3] : (B ^ w ^ k) + u[4],
                l = (l = L(l |= 0, v[r])) + m | 0,
                g = m,
                m = k,
                k = L(w, 10),
                w = B,
                B = l;
            l = f[1] + c + k | 0,
            f[1] = f[2] + a + m | 0,
            f[2] = f[3] + h + g | 0,
            f[3] = f[4] + o + B | 0,
            f[4] = f[0] + s + w | 0,
            f[0] = l
        },
        _doFinalize: function() {
            var t = this._data
              , e = t.words
              , r = 8 * this._nDataBytes
              , i = 8 * t.sigBytes;
            e[i >>> 5] |= 128 << 24 - i % 32,
            e[14 + (64 + i >>> 9 << 4)] = 16711935 & (r << 8 | r >>> 24) | 4278255360 & (r << 24 | r >>> 8),
            t.sigBytes = 4 * (e.length + 1),
            this._process();
            for (var e = this._hash, n = e.words, o = 0; o < 5; o++) {
                var s = n[o];
                n[o] = 16711935 & (s << 8 | s >>> 24) | 4278255360 & (s << 24 | s >>> 8)
            }
            return e
        },
        clone: function() {
            var t = p.clone.call(this);
            return t._hash = this._hash.clone(),
            t
        }
    }),
    w.RIPEMD160 = p._createHelper(F),
    w.HmacRIPEMD160 = p._createHmacHelper(F),
    P = (M = U).lib.Base,
    _ = M.enc.Utf8,
    M.algo.HMAC = P.extend({
        init: function(t, e) {
            t = this._hasher = new t.init,
            "string" == typeof e && (e = _.parse(e));
            var r = t.blockSize
              , i = 4 * r;
            (e = e.sigBytes > i ? t.finalize(e) : e).clamp();
            for (var t = this._oKey = e.clone(), e = this._iKey = e.clone(), n = t.words, o = e.words, s = 0; s < r; s++)
                n[s] ^= 1549556828,
                o[s] ^= 909522486;
            t.sigBytes = e.sigBytes = i,
            this.reset()
        },
        reset: function() {
            var t = this._hasher;
            t.reset(),
            t.update(this._iKey)
        },
        update: function(t) {
            return this._hasher.update(t),
            this
        },
        finalize: function(t) {
            var e = this._hasher
              , t = e.finalize(t);
            return e.reset(),
            e.finalize(this._oKey.clone().concat(t))
        }
    }),
    F = (w = U).lib,
    M = F.Base,
    v = F.WordArray,
    P = w.algo,
    F = P.SHA1,
    g = P.HMAC,
    y = P.PBKDF2 = M.extend({
        cfg: M.extend({
            keySize: 4,
            hasher: F,
            iterations: 1
        }),
        init: function(t) {
            this.cfg = this.cfg.extend(t)
        },
        compute: function(t, e) {
            for (var r = this.cfg, i = g.create(r.hasher, t), n = v.create(), o = v.create([1]), s = n.words, c = o.words, a = r.keySize, h = r.iterations; s.length < a; ) {
                var l = i.update(e).finalize(o);
                i.reset();
                for (var f = l.words, d = f.length, u = l, p = 1; p < h; p++) {
                    u = i.finalize(u),
                    i.reset();
                    for (var _ = u.words, y = 0; y < d; y++)
                        f[y] ^= _[y]
                }
                n.concat(l),
                c[0]++
            }
            return n.sigBytes = 4 * a,
            n
        }
    }),
    w.PBKDF2 = function(t, e, r) {
        return y.create(r).compute(t, e)
    }
    ,
    M = (P = U).lib,
    F = M.Base,
    B = M.WordArray,
    w = P.algo,
    M = w.MD5,
    k = w.EvpKDF = F.extend({
        cfg: F.extend({
            keySize: 4,
            hasher: M,
            iterations: 1
        }),
        init: function(t) {
            this.cfg = this.cfg.extend(t)
        },
        compute: function(t, e) {
            for (var r, i = this.cfg, n = i.hasher.create(), o = B.create(), s = o.words, c = i.keySize, a = i.iterations; s.length < c; ) {
                r && n.update(r),
                r = n.update(t).finalize(e),
                n.reset();
                for (var h = 1; h < a; h++)
                    r = n.finalize(r),
                    n.reset();
                o.concat(r)
            }
            return o.sigBytes = 4 * c,
            o
        }
    }),
    P.EvpKDF = function(t, e, r) {
        return k.create(r).compute(t, e)
    }
    ,
    U.lib.Cipher || function() {
        var t = U
          , e = t.lib
          , r = e.Base
          , s = e.WordArray
          , i = e.BufferedBlockAlgorithm
          , n = t.enc
          , o = (n.Utf8,
        n.Base64)
          , c = t.algo.EvpKDF
          , a = e.Cipher = i.extend({
            cfg: r.extend(),
            createEncryptor: function(t, e) {
                return this.create(this._ENC_XFORM_MODE, t, e)
            },
            createDecryptor: function(t, e) {
                return this.create(this._DEC_XFORM_MODE, t, e)
            },
            init: function(t, e, r) {
                this.cfg = this.cfg.extend(r),
                this._xformMode = t,
                this._key = e,
                this.reset()
            },
            reset: function() {
                i.reset.call(this),
                this._doReset()
            },
            process: function(t) {
                return this._append(t),
                this._process()
            },
            finalize: function(t) {
                return t && this._append(t),
                this._doFinalize()
            },
            keySize: 4,
            ivSize: 4,
            _ENC_XFORM_MODE: 1,
            _DEC_XFORM_MODE: 2,
            _createHelper: function(i) {
                return {
                    encrypt: function(t, e, r) {
                        return h(e).encrypt(i, t, e, r)
                    },
                    decrypt: function(t, e, r) {
                        return h(e).decrypt(i, t, e, r)
                    }
                }
            }
        });
        function h(t) {
            return "string" == typeof t ? p : u
        }
        e.StreamCipher = a.extend({
            _doFinalize: function() {
                return this._process(!0)
            },
            blockSize: 1
        });
        var l = t.mode = {}
          , n = e.BlockCipherMode = r.extend({
            createEncryptor: function(t, e) {
                return this.Encryptor.create(t, e)
            },
            createDecryptor: function(t, e) {
                return this.Decryptor.create(t, e)
            },
            init: function(t, e) {
                this._cipher = t,
                this._iv = e
            }
        })
          , n = l.CBC = ((l = n.extend()).Encryptor = l.extend({
            processBlock: function(t, e) {
                var r = this._cipher
                  , i = r.blockSize;
                f.call(this, t, e, i),
                r.encryptBlock(t, e),
                this._prevBlock = t.slice(e, e + i)
            }
        }),
        l.Decryptor = l.extend({
            processBlock: function(t, e) {
                var r = this._cipher
                  , i = r.blockSize
                  , n = t.slice(e, e + i);
                r.decryptBlock(t, e),
                f.call(this, t, e, i),
                this._prevBlock = n
            }
        }),
        l);
        function f(t, e, r) {
            var i, n = this._iv;
            n ? (i = n,
            this._iv = void 0) : i = this._prevBlock;
            for (var o = 0; o < r; o++)
                t[e + o] ^= i[o]
        }
        var l = (t.pad = {}).Pkcs7 = {
            pad: function(t, e) {
                for (var e = 4 * e, r = e - t.sigBytes % e, i = r << 24 | r << 16 | r << 8 | r, n = [], o = 0; o < r; o += 4)
                    n.push(i);
                e = s.create(n, r);
                t.concat(e)
            },
            unpad: function(t) {
                var e = 255 & t.words[t.sigBytes - 1 >>> 2];
                t.sigBytes -= e
            }
        }
          , d = (e.BlockCipher = a.extend({
            cfg: a.cfg.extend({
                mode: n,
                padding: l
            }),
            reset: function() {
                var t;
                a.reset.call(this);
                var e = this.cfg
                  , r = e.iv
                  , e = e.mode;
                this._xformMode == this._ENC_XFORM_MODE ? t = e.createEncryptor : (t = e.createDecryptor,
                this._minBufferSize = 1),
                this._mode && this._mode.__creator == t ? this._mode.init(this, r && r.words) : (this._mode = t.call(e, this, r && r.words),
                this._mode.__creator = t)
            },
            _doProcessBlock: function(t, e) {
                this._mode.processBlock(t, e)
            },
            _doFinalize: function() {
                var t, e = this.cfg.padding;
                return this._xformMode == this._ENC_XFORM_MODE ? (e.pad(this._data, this.blockSize),
                t = this._process(!0)) : (t = this._process(!0),
                e.unpad(t)),
                t
            },
            blockSize: 4
        }),
        e.CipherParams = r.extend({
            init: function(t) {
                this.mixIn(t)
            },
            toString: function(t) {
                return (t || this.formatter).stringify(this)
            }
        }))
          , l = (t.format = {}).OpenSSL = {
            stringify: function(t) {
                var e = t.ciphertext
                  , t = t.salt
                  , e = t ? s.create([1398893684, 1701076831]).concat(t).concat(e) : e;
                return e.toString(o)
            },
            parse: function(t) {
                var e, r = o.parse(t), t = r.words;
                return 1398893684 == t[0] && 1701076831 == t[1] && (e = s.create(t.slice(2, 4)),
                t.splice(0, 4),
                r.sigBytes -= 16),
                d.create({
                    ciphertext: r,
                    salt: e
                })
            }
        }
          , u = e.SerializableCipher = r.extend({
            cfg: r.extend({
                format: l
            }),
            encrypt: function(t, e, r, i) {
                i = this.cfg.extend(i);
                var n = t.createEncryptor(r, i)
                  , e = n.finalize(e)
                  , n = n.cfg;
                return d.create({
                    ciphertext: e,
                    key: r,
                    iv: n.iv,
                    algorithm: t,
                    mode: n.mode,
                    padding: n.padding,
                    blockSize: t.blockSize,
                    formatter: i.format
                })
            },
            decrypt: function(t, e, r, i) {
                return i = this.cfg.extend(i),
                e = this._parse(e, i.format),
                t.createDecryptor(r, i).finalize(e.ciphertext)
            },
            _parse: function(t, e) {
                return "string" == typeof t ? e.parse(t, this) : t
            }
        })
          , t = (t.kdf = {}).OpenSSL = {
            execute: function(t, e, r, i) {
                i = i || s.random(8);
                t = c.create({
                    keySize: e + r
                }).compute(t, i),
                r = s.create(t.words.slice(e), 4 * r);
                return t.sigBytes = 4 * e,
                d.create({
                    key: t,
                    iv: r,
                    salt: i
                })
            }
        }
          , p = e.PasswordBasedCipher = u.extend({
            cfg: u.cfg.extend({
                kdf: t
            }),
            encrypt: function(t, e, r, i) {
                r = (i = this.cfg.extend(i)).kdf.execute(r, t.keySize, t.ivSize);
                i.iv = r.iv;
                i = u.encrypt.call(this, t, e, r.key, i);
                return i.mixIn(r),
                i
            },
            decrypt: function(t, e, r, i) {
                i = this.cfg.extend(i),
                e = this._parse(e, i.format);
                r = i.kdf.execute(r, t.keySize, t.ivSize, e.salt);
                return i.iv = r.iv,
                u.decrypt.call(this, t, e, r.key, i)
            }
        })
    }(),
    U.mode.CFB = ((F = U.lib.BlockCipherMode.extend()).Encryptor = F.extend({
        processBlock: function(t, e) {
            var r = this._cipher
              , i = r.blockSize;
            j.call(this, t, e, i, r),
            this._prevBlock = t.slice(e, e + i)
        }
    }),
    F.Decryptor = F.extend({
        processBlock: function(t, e) {
            var r = this._cipher
              , i = r.blockSize
              , n = t.slice(e, e + i);
            j.call(this, t, e, i, r),
            this._prevBlock = n
        }
    }),
    F),
    U.mode.CTR = (M = U.lib.BlockCipherMode.extend(),
    P = M.Encryptor = M.extend({
        processBlock: function(t, e) {
            var r = this._cipher
              , i = r.blockSize
              , n = this._iv
              , o = this._counter;
            n && (o = this._counter = n.slice(0),
            this._iv = void 0);
            var s = o.slice(0);
            r.encryptBlock(s, 0),
            o[i - 1] = o[i - 1] + 1 | 0;
            for (var c = 0; c < i; c++)
                t[e + c] ^= s[c]
        }
    }),
    M.Decryptor = P,
    M),
    U.mode.CTRGladman = (F = U.lib.BlockCipherMode.extend(),
    P = F.Encryptor = F.extend({
        processBlock: function(t, e) {
            var r = this._cipher
              , i = r.blockSize
              , n = this._iv
              , o = this._counter;
            n && (o = this._counter = n.slice(0),
            this._iv = void 0),
            0 === ((n = o)[0] = T(n[0])) && (n[1] = T(n[1]));
            var s = o.slice(0);
            r.encryptBlock(s, 0);
            for (var c = 0; c < i; c++)
                t[e + c] ^= s[c]
        }
    }),
    F.Decryptor = P,
    F),
    U.mode.OFB = (M = U.lib.BlockCipherMode.extend(),
    P = M.Encryptor = M.extend({
        processBlock: function(t, e) {
            var r = this._cipher
              , i = r.blockSize
              , n = this._iv
              , o = this._keystream;
            n && (o = this._keystream = n.slice(0),
            this._iv = void 0),
            r.encryptBlock(o, 0);
            for (var s = 0; s < i; s++)
                t[e + s] ^= o[s]
        }
    }),
    M.Decryptor = P,
    M),
    U.mode.ECB = ((F = U.lib.BlockCipherMode.extend()).Encryptor = F.extend({
        processBlock: function(t, e) {
            this._cipher.encryptBlock(t, e)
        }
    }),
    F.Decryptor = F.extend({
        processBlock: function(t, e) {
            this._cipher.decryptBlock(t, e)
        }
    }),
    F),
    U.pad.AnsiX923 = {
        pad: function(t, e) {
            var r = t.sigBytes
              , e = 4 * e
              , e = e - r % e
              , r = r + e - 1;
            t.clamp(),
            t.words[r >>> 2] |= e << 24 - r % 4 * 8,
            t.sigBytes += e
        },
        unpad: function(t) {
            var e = 255 & t.words[t.sigBytes - 1 >>> 2];
            t.sigBytes -= e
        }
    },
    U.pad.Iso10126 = {
        pad: function(t, e) {
            e *= 4,
            e -= t.sigBytes % e;
            t.concat(U.lib.WordArray.random(e - 1)).concat(U.lib.WordArray.create([e << 24], 1))
        },
        unpad: function(t) {
            var e = 255 & t.words[t.sigBytes - 1 >>> 2];
            t.sigBytes -= e
        }
    },
    U.pad.Iso97971 = {
        pad: function(t, e) {
            t.concat(U.lib.WordArray.create([2147483648], 1)),
            U.pad.ZeroPadding.pad(t, e)
        },
        unpad: function(t) {
            U.pad.ZeroPadding.unpad(t),
            t.sigBytes--
        }
    },
    U.pad.ZeroPadding = {
        pad: function(t, e) {
            e *= 4;
            t.clamp(),
            t.sigBytes += e - (t.sigBytes % e || e)
        },
        unpad: function(t) {
            for (var e = t.words, r = t.sigBytes - 1, r = t.sigBytes - 1; 0 <= r; r--)
                if (e[r >>> 2] >>> 24 - r % 4 * 8 & 255) {
                    t.sigBytes = r + 1;
                    break
                }
        }
    },
    U.pad.NoPadding = {
        pad: function() {},
        unpad: function() {}
    },
    m = (P = U).lib.CipherParams,
    C = P.enc.Hex,
    P.format.Hex = {
        stringify: function(t) {
            return t.ciphertext.toString(C)
        },
        parse: function(t) {
            t = C.parse(t);
            return m.create({
                ciphertext: t
            })
        }
    },
    function() {
        var t = U
          , e = t.lib.BlockCipher
          , r = t.algo
          , h = []
          , l = []
          , f = []
          , d = []
          , u = []
          , p = []
          , _ = []
          , y = []
          , v = []
          , g = [];
        !function() {
            for (var t = [], e = 0; e < 256; e++)
                t[e] = e < 128 ? e << 1 : e << 1 ^ 283;
            for (var r = 0, i = 0, e = 0; e < 256; e++) {
                var n = i ^ i << 1 ^ i << 2 ^ i << 3 ^ i << 4;
                h[r] = n = n >>> 8 ^ 255 & n ^ 99;
                var o = t[l[n] = r]
                  , s = t[o]
                  , c = t[s]
                  , a = 257 * t[n] ^ 16843008 * n;
                f[r] = a << 24 | a >>> 8,
                d[r] = a << 16 | a >>> 16,
                u[r] = a << 8 | a >>> 24,
                p[r] = a,
                _[n] = (a = 16843009 * c ^ 65537 * s ^ 257 * o ^ 16843008 * r) << 24 | a >>> 8,
                y[n] = a << 16 | a >>> 16,
                v[n] = a << 8 | a >>> 24,
                g[n] = a,
                r ? (r = o ^ t[t[t[c ^ o]]],
                i ^= t[t[i]]) : r = i = 1
            }
        }();
        var B = [0, 1, 2, 4, 8, 16, 32, 64, 128, 27, 54]
          , r = r.AES = e.extend({
            _doReset: function() {
                if (!this._nRounds || this._keyPriorReset !== this._key) {
                    for (var t = this._keyPriorReset = this._key, e = t.words, r = t.sigBytes / 4, i = 4 * (1 + (this._nRounds = 6 + r)), n = this._keySchedule = [], o = 0; o < i; o++)
                        o < r ? n[o] = e[o] : (a = n[o - 1],
                        o % r ? 6 < r && o % r == 4 && (a = h[a >>> 24] << 24 | h[a >>> 16 & 255] << 16 | h[a >>> 8 & 255] << 8 | h[255 & a]) : (a = h[(a = a << 8 | a >>> 24) >>> 24] << 24 | h[a >>> 16 & 255] << 16 | h[a >>> 8 & 255] << 8 | h[255 & a],
                        a ^= B[o / r | 0] << 24),
                        n[o] = n[o - r] ^ a);
                    for (var s = this._invKeySchedule = [], c = 0; c < i; c++) {
                        var a, o = i - c;
                        a = c % 4 ? n[o] : n[o - 4],
                        s[c] = c < 4 || o <= 4 ? a : _[h[a >>> 24]] ^ y[h[a >>> 16 & 255]] ^ v[h[a >>> 8 & 255]] ^ g[h[255 & a]]
                    }
                }
            },
            encryptBlock: function(t, e) {
                this._doCryptBlock(t, e, this._keySchedule, f, d, u, p, h)
            },
            decryptBlock: function(t, e) {
                var r = t[e + 1];
                t[e + 1] = t[e + 3],
                t[e + 3] = r,
                this._doCryptBlock(t, e, this._invKeySchedule, _, y, v, g, l);
                r = t[e + 1];
                t[e + 1] = t[e + 3],
                t[e + 3] = r
            },
            _doCryptBlock: function(t, e, r, i, n, o, s, c) {
                for (var a = this._nRounds, h = t[e] ^ r[0], l = t[e + 1] ^ r[1], f = t[e + 2] ^ r[2], d = t[e + 3] ^ r[3], u = 4, p = 1; p < a; p++)
                    var _ = i[h >>> 24] ^ n[l >>> 16 & 255] ^ o[f >>> 8 & 255] ^ s[255 & d] ^ r[u++]
                      , y = i[l >>> 24] ^ n[f >>> 16 & 255] ^ o[d >>> 8 & 255] ^ s[255 & h] ^ r[u++]
                      , v = i[f >>> 24] ^ n[d >>> 16 & 255] ^ o[h >>> 8 & 255] ^ s[255 & l] ^ r[u++]
                      , g = i[d >>> 24] ^ n[h >>> 16 & 255] ^ o[l >>> 8 & 255] ^ s[255 & f] ^ r[u++]
                      , h = _
                      , l = y
                      , f = v
                      , d = g;
                _ = (c[h >>> 24] << 24 | c[l >>> 16 & 255] << 16 | c[f >>> 8 & 255] << 8 | c[255 & d]) ^ r[u++],
                y = (c[l >>> 24] << 24 | c[f >>> 16 & 255] << 16 | c[d >>> 8 & 255] << 8 | c[255 & h]) ^ r[u++],
                v = (c[f >>> 24] << 24 | c[d >>> 16 & 255] << 16 | c[h >>> 8 & 255] << 8 | c[255 & l]) ^ r[u++],
                g = (c[d >>> 24] << 24 | c[h >>> 16 & 255] << 16 | c[l >>> 8 & 255] << 8 | c[255 & f]) ^ r[u++];
                t[e] = _,
                t[e + 1] = y,
                t[e + 2] = v,
                t[e + 3] = g
            },
            keySize: 8
        });
        t.AES = e._createHelper(r)
    }(),
    function() {
        var t = U
          , e = t.lib
          , i = e.WordArray
          , r = e.BlockCipher
          , e = t.algo
          , h = [57, 49, 41, 33, 25, 17, 9, 1, 58, 50, 42, 34, 26, 18, 10, 2, 59, 51, 43, 35, 27, 19, 11, 3, 60, 52, 44, 36, 63, 55, 47, 39, 31, 23, 15, 7, 62, 54, 46, 38, 30, 22, 14, 6, 61, 53, 45, 37, 29, 21, 13, 5, 28, 20, 12, 4]
          , l = [14, 17, 11, 24, 1, 5, 3, 28, 15, 6, 21, 10, 23, 19, 12, 4, 26, 8, 16, 7, 27, 20, 13, 2, 41, 52, 31, 37, 47, 55, 30, 40, 51, 45, 33, 48, 44, 49, 39, 56, 34, 53, 46, 42, 50, 36, 29, 32]
          , f = [1, 2, 4, 6, 8, 10, 12, 14, 15, 17, 19, 21, 23, 25, 27, 28]
          , d = [{
            0: 8421888,
            268435456: 32768,
            536870912: 8421378,
            805306368: 2,
            1073741824: 512,
            1342177280: 8421890,
            1610612736: 8389122,
            1879048192: 8388608,
            2147483648: 514,
            2415919104: 8389120,
            2684354560: 33280,
            2952790016: 8421376,
            3221225472: 32770,
            3489660928: 8388610,
            3758096384: 0,
            4026531840: 33282,
            134217728: 0,
            402653184: 8421890,
            671088640: 33282,
            939524096: 32768,
            1207959552: 8421888,
            1476395008: 512,
            1744830464: 8421378,
            2013265920: 2,
            2281701376: 8389120,
            2550136832: 33280,
            2818572288: 8421376,
            3087007744: 8389122,
            3355443200: 8388610,
            3623878656: 32770,
            3892314112: 514,
            4160749568: 8388608,
            1: 32768,
            268435457: 2,
            536870913: 8421888,
            805306369: 8388608,
            1073741825: 8421378,
            1342177281: 33280,
            1610612737: 512,
            1879048193: 8389122,
            2147483649: 8421890,
            2415919105: 8421376,
            2684354561: 8388610,
            2952790017: 33282,
            3221225473: 514,
            3489660929: 8389120,
            3758096385: 32770,
            4026531841: 0,
            134217729: 8421890,
            402653185: 8421376,
            671088641: 8388608,
            939524097: 512,
            1207959553: 32768,
            1476395009: 8388610,
            1744830465: 2,
            2013265921: 33282,
            2281701377: 32770,
            2550136833: 8389122,
            2818572289: 514,
            3087007745: 8421888,
            3355443201: 8389120,
            3623878657: 0,
            3892314113: 33280,
            4160749569: 8421378
        }, {
            0: 1074282512,
            16777216: 16384,
            33554432: 524288,
            50331648: 1074266128,
            67108864: 1073741840,
            83886080: 1074282496,
            100663296: 1073758208,
            117440512: 16,
            134217728: 540672,
            150994944: 1073758224,
            167772160: 1073741824,
            184549376: 540688,
            201326592: 524304,
            218103808: 0,
            234881024: 16400,
            251658240: 1074266112,
            8388608: 1073758208,
            25165824: 540688,
            41943040: 16,
            58720256: 1073758224,
            75497472: 1074282512,
            92274688: 1073741824,
            109051904: 524288,
            125829120: 1074266128,
            142606336: 524304,
            159383552: 0,
            176160768: 16384,
            192937984: 1074266112,
            209715200: 1073741840,
            226492416: 540672,
            243269632: 1074282496,
            260046848: 16400,
            268435456: 0,
            285212672: 1074266128,
            301989888: 1073758224,
            318767104: 1074282496,
            335544320: 1074266112,
            352321536: 16,
            369098752: 540688,
            385875968: 16384,
            402653184: 16400,
            419430400: 524288,
            436207616: 524304,
            452984832: 1073741840,
            469762048: 540672,
            486539264: 1073758208,
            503316480: 1073741824,
            520093696: 1074282512,
            276824064: 540688,
            293601280: 524288,
            310378496: 1074266112,
            327155712: 16384,
            343932928: 1073758208,
            360710144: 1074282512,
            377487360: 16,
            394264576: 1073741824,
            411041792: 1074282496,
            427819008: 1073741840,
            444596224: 1073758224,
            461373440: 524304,
            478150656: 0,
            494927872: 16400,
            511705088: 1074266128,
            528482304: 540672
        }, {
            0: 260,
            1048576: 0,
            2097152: 67109120,
            3145728: 65796,
            4194304: 65540,
            5242880: 67108868,
            6291456: 67174660,
            7340032: 67174400,
            8388608: 67108864,
            9437184: 67174656,
            10485760: 65792,
            11534336: 67174404,
            12582912: 67109124,
            13631488: 65536,
            14680064: 4,
            15728640: 256,
            524288: 67174656,
            1572864: 67174404,
            2621440: 0,
            3670016: 67109120,
            4718592: 67108868,
            5767168: 65536,
            6815744: 65540,
            7864320: 260,
            8912896: 4,
            9961472: 256,
            11010048: 67174400,
            12058624: 65796,
            13107200: 65792,
            14155776: 67109124,
            15204352: 67174660,
            16252928: 67108864,
            16777216: 67174656,
            17825792: 65540,
            18874368: 65536,
            19922944: 67109120,
            20971520: 256,
            22020096: 67174660,
            23068672: 67108868,
            24117248: 0,
            25165824: 67109124,
            26214400: 67108864,
            27262976: 4,
            28311552: 65792,
            29360128: 67174400,
            30408704: 260,
            31457280: 65796,
            32505856: 67174404,
            17301504: 67108864,
            18350080: 260,
            19398656: 67174656,
            20447232: 0,
            21495808: 65540,
            22544384: 67109120,
            23592960: 256,
            24641536: 67174404,
            25690112: 65536,
            26738688: 67174660,
            27787264: 65796,
            28835840: 67108868,
            29884416: 67109124,
            30932992: 67174400,
            31981568: 4,
            33030144: 65792
        }, {
            0: 2151682048,
            65536: 2147487808,
            131072: 4198464,
            196608: 2151677952,
            262144: 0,
            327680: 4198400,
            393216: 2147483712,
            458752: 4194368,
            524288: 2147483648,
            589824: 4194304,
            655360: 64,
            720896: 2147487744,
            786432: 2151678016,
            851968: 4160,
            917504: 4096,
            983040: 2151682112,
            32768: 2147487808,
            98304: 64,
            163840: 2151678016,
            229376: 2147487744,
            294912: 4198400,
            360448: 2151682112,
            425984: 0,
            491520: 2151677952,
            557056: 4096,
            622592: 2151682048,
            688128: 4194304,
            753664: 4160,
            819200: 2147483648,
            884736: 4194368,
            950272: 4198464,
            1015808: 2147483712,
            1048576: 4194368,
            1114112: 4198400,
            1179648: 2147483712,
            1245184: 0,
            1310720: 4160,
            1376256: 2151678016,
            1441792: 2151682048,
            1507328: 2147487808,
            1572864: 2151682112,
            1638400: 2147483648,
            1703936: 2151677952,
            1769472: 4198464,
            1835008: 2147487744,
            1900544: 4194304,
            1966080: 64,
            2031616: 4096,
            1081344: 2151677952,
            1146880: 2151682112,
            1212416: 0,
            1277952: 4198400,
            1343488: 4194368,
            1409024: 2147483648,
            1474560: 2147487808,
            1540096: 64,
            1605632: 2147483712,
            1671168: 4096,
            1736704: 2147487744,
            1802240: 2151678016,
            1867776: 4160,
            1933312: 2151682048,
            1998848: 4194304,
            2064384: 4198464
        }, {
            0: 128,
            4096: 17039360,
            8192: 262144,
            12288: 536870912,
            16384: 537133184,
            20480: 16777344,
            24576: 553648256,
            28672: 262272,
            32768: 16777216,
            36864: 537133056,
            40960: 536871040,
            45056: 553910400,
            49152: 553910272,
            53248: 0,
            57344: 17039488,
            61440: 553648128,
            2048: 17039488,
            6144: 553648256,
            10240: 128,
            14336: 17039360,
            18432: 262144,
            22528: 537133184,
            26624: 553910272,
            30720: 536870912,
            34816: 537133056,
            38912: 0,
            43008: 553910400,
            47104: 16777344,
            51200: 536871040,
            55296: 553648128,
            59392: 16777216,
            63488: 262272,
            65536: 262144,
            69632: 128,
            73728: 536870912,
            77824: 553648256,
            81920: 16777344,
            86016: 553910272,
            90112: 537133184,
            94208: 16777216,
            98304: 553910400,
            102400: 553648128,
            106496: 17039360,
            110592: 537133056,
            114688: 262272,
            118784: 536871040,
            122880: 0,
            126976: 17039488,
            67584: 553648256,
            71680: 16777216,
            75776: 17039360,
            79872: 537133184,
            83968: 536870912,
            88064: 17039488,
            92160: 128,
            96256: 553910272,
            100352: 262272,
            104448: 553910400,
            108544: 0,
            112640: 553648128,
            116736: 16777344,
            120832: 262144,
            124928: 537133056,
            129024: 536871040
        }, {
            0: 268435464,
            256: 8192,
            512: 270532608,
            768: 270540808,
            1024: 268443648,
            1280: 2097152,
            1536: 2097160,
            1792: 268435456,
            2048: 0,
            2304: 268443656,
            2560: 2105344,
            2816: 8,
            3072: 270532616,
            3328: 2105352,
            3584: 8200,
            3840: 270540800,
            128: 270532608,
            384: 270540808,
            640: 8,
            896: 2097152,
            1152: 2105352,
            1408: 268435464,
            1664: 268443648,
            1920: 8200,
            2176: 2097160,
            2432: 8192,
            2688: 268443656,
            2944: 270532616,
            3200: 0,
            3456: 270540800,
            3712: 2105344,
            3968: 268435456,
            4096: 268443648,
            4352: 270532616,
            4608: 270540808,
            4864: 8200,
            5120: 2097152,
            5376: 268435456,
            5632: 268435464,
            5888: 2105344,
            6144: 2105352,
            6400: 0,
            6656: 8,
            6912: 270532608,
            7168: 8192,
            7424: 268443656,
            7680: 270540800,
            7936: 2097160,
            4224: 8,
            4480: 2105344,
            4736: 2097152,
            4992: 268435464,
            5248: 268443648,
            5504: 8200,
            5760: 270540808,
            6016: 270532608,
            6272: 270540800,
            6528: 270532616,
            6784: 8192,
            7040: 2105352,
            7296: 2097160,
            7552: 0,
            7808: 268435456,
            8064: 268443656
        }, {
            0: 1048576,
            16: 33555457,
            32: 1024,
            48: 1049601,
            64: 34604033,
            80: 0,
            96: 1,
            112: 34603009,
            128: 33555456,
            144: 1048577,
            160: 33554433,
            176: 34604032,
            192: 34603008,
            208: 1025,
            224: 1049600,
            240: 33554432,
            8: 34603009,
            24: 0,
            40: 33555457,
            56: 34604032,
            72: 1048576,
            88: 33554433,
            104: 33554432,
            120: 1025,
            136: 1049601,
            152: 33555456,
            168: 34603008,
            184: 1048577,
            200: 1024,
            216: 34604033,
            232: 1,
            248: 1049600,
            256: 33554432,
            272: 1048576,
            288: 33555457,
            304: 34603009,
            320: 1048577,
            336: 33555456,
            352: 34604032,
            368: 1049601,
            384: 1025,
            400: 34604033,
            416: 1049600,
            432: 1,
            448: 0,
            464: 34603008,
            480: 33554433,
            496: 1024,
            264: 1049600,
            280: 33555457,
            296: 34603009,
            312: 1,
            328: 33554432,
            344: 1048576,
            360: 1025,
            376: 34604032,
            392: 33554433,
            408: 34603008,
            424: 0,
            440: 34604033,
            456: 1049601,
            472: 1024,
            488: 33555456,
            504: 1048577
        }, {
            0: 134219808,
            1: 131072,
            2: 134217728,
            3: 32,
            4: 131104,
            5: 134350880,
            6: 134350848,
            7: 2048,
            8: 134348800,
            9: 134219776,
            10: 133120,
            11: 134348832,
            12: 2080,
            13: 0,
            14: 134217760,
            15: 133152,
            2147483648: 2048,
            2147483649: 134350880,
            2147483650: 134219808,
            2147483651: 134217728,
            2147483652: 134348800,
            2147483653: 133120,
            2147483654: 133152,
            2147483655: 32,
            2147483656: 134217760,
            2147483657: 2080,
            2147483658: 131104,
            2147483659: 134350848,
            2147483660: 0,
            2147483661: 134348832,
            2147483662: 134219776,
            2147483663: 131072,
            16: 133152,
            17: 134350848,
            18: 32,
            19: 2048,
            20: 134219776,
            21: 134217760,
            22: 134348832,
            23: 131072,
            24: 0,
            25: 131104,
            26: 134348800,
            27: 134219808,
            28: 134350880,
            29: 133120,
            30: 2080,
            31: 134217728,
            2147483664: 131072,
            2147483665: 2048,
            2147483666: 134348832,
            2147483667: 133152,
            2147483668: 32,
            2147483669: 134348800,
            2147483670: 134217728,
            2147483671: 134219808,
            2147483672: 134350880,
            2147483673: 134217760,
            2147483674: 134219776,
            2147483675: 0,
            2147483676: 133120,
            2147483677: 2080,
            2147483678: 131104,
            2147483679: 134350848
        }]
          , u = [4160749569, 528482304, 33030144, 2064384, 129024, 8064, 504, 2147483679]
          , n = e.DES = r.extend({
            _doReset: function() {
                for (var t = this._key.words, e = [], r = 0; r < 56; r++) {
                    var i = h[r] - 1;
                    e[r] = t[i >>> 5] >>> 31 - i % 32 & 1
                }
                for (var n = this._subKeys = [], o = 0; o < 16; o++) {
                    for (var s = n[o] = [], c = f[o], r = 0; r < 24; r++)
                        s[r / 6 | 0] |= e[(l[r] - 1 + c) % 28] << 31 - r % 6,
                        s[4 + (r / 6 | 0)] |= e[28 + (l[r + 24] - 1 + c) % 28] << 31 - r % 6;
                    s[0] = s[0] << 1 | s[0] >>> 31;
                    for (r = 1; r < 7; r++)
                        s[r] = s[r] >>> 4 * (r - 1) + 3;
                    s[7] = s[7] << 5 | s[7] >>> 27
                }
                for (var a = this._invSubKeys = [], r = 0; r < 16; r++)
                    a[r] = n[15 - r]
            },
            encryptBlock: function(t, e) {
                this._doCryptBlock(t, e, this._subKeys)
            },
            decryptBlock: function(t, e) {
                this._doCryptBlock(t, e, this._invSubKeys)
            },
            _doCryptBlock: function(t, e, r) {
                this._lBlock = t[e],
                this._rBlock = t[e + 1],
                p.call(this, 4, 252645135),
                p.call(this, 16, 65535),
                _.call(this, 2, 858993459),
                _.call(this, 8, 16711935),
                p.call(this, 1, 1431655765);
                for (var i = 0; i < 16; i++) {
                    for (var n = r[i], o = this._lBlock, s = this._rBlock, c = 0, a = 0; a < 8; a++)
                        c |= d[a][((s ^ n[a]) & u[a]) >>> 0];
                    this._lBlock = s,
                    this._rBlock = o ^ c
                }
                var h = this._lBlock;
                this._lBlock = this._rBlock,
                this._rBlock = h,
                p.call(this, 1, 1431655765),
                _.call(this, 8, 16711935),
                _.call(this, 2, 858993459),
                p.call(this, 16, 65535),
                p.call(this, 4, 252645135),
                t[e] = this._lBlock,
                t[e + 1] = this._rBlock
            },
            keySize: 2,
            ivSize: 2,
            blockSize: 2
        });
        function p(t, e) {
            e = (this._lBlock >>> t ^ this._rBlock) & e;
            this._rBlock ^= e,
            this._lBlock ^= e << t
        }
        function _(t, e) {
            e = (this._rBlock >>> t ^ this._lBlock) & e;
            this._lBlock ^= e,
            this._rBlock ^= e << t
        }
        t.DES = r._createHelper(n);
        e = e.TripleDES = r.extend({
            _doReset: function() {
                var t = this._key.words;
                if (2 !== t.length && 4 !== t.length && t.length < 6)
                    throw new Error("Invalid key length - 3DES requires the key length to be 64, 128, 192 or >192.");
                var e = t.slice(0, 2)
                  , r = t.length < 4 ? t.slice(0, 2) : t.slice(2, 4)
                  , t = t.length < 6 ? t.slice(0, 2) : t.slice(4, 6);
                this._des1 = n.createEncryptor(i.create(e)),
                this._des2 = n.createEncryptor(i.create(r)),
                this._des3 = n.createEncryptor(i.create(t))
            },
            encryptBlock: function(t, e) {
                this._des1.encryptBlock(t, e),
                this._des2.decryptBlock(t, e),
                this._des3.encryptBlock(t, e)
            },
            decryptBlock: function(t, e) {
                this._des3.decryptBlock(t, e),
                this._des2.encryptBlock(t, e),
                this._des1.decryptBlock(t, e)
            },
            keySize: 6,
            ivSize: 2,
            blockSize: 2
        });
        t.TripleDES = r._createHelper(e)
    }(),
    function() {
        var t = U
          , e = t.lib.StreamCipher
          , r = t.algo
          , i = r.RC4 = e.extend({
            _doReset: function() {
                for (var t = this._key, e = t.words, r = t.sigBytes, i = this._S = [], n = 0; n < 256; n++)
                    i[n] = n;
                for (var n = 0, o = 0; n < 256; n++) {
                    var s = n % r
                      , s = e[s >>> 2] >>> 24 - s % 4 * 8 & 255
                      , o = (o + i[n] + s) % 256
                      , s = i[n];
                    i[n] = i[o],
                    i[o] = s
                }
                this._i = this._j = 0
            },
            _doProcessBlock: function(t, e) {
                t[e] ^= n.call(this)
            },
            keySize: 8,
            ivSize: 0
        });
        function n() {
            for (var t = this._S, e = this._i, r = this._j, i = 0, n = 0; n < 4; n++) {
                var r = (r + t[e = (e + 1) % 256]) % 256
                  , o = t[e];
                t[e] = t[r],
                t[r] = o,
                i |= t[(t[e] + t[r]) % 256] << 24 - 8 * n
            }
            return this._i = e,
            this._j = r,
            i
        }
        t.RC4 = e._createHelper(i);
        r = r.RC4Drop = i.extend({
            cfg: i.cfg.extend({
                drop: 192
            }),
            _doReset: function() {
                i._doReset.call(this);
                for (var t = this.cfg.drop; 0 < t; t--)
                    n.call(this)
            }
        });
        t.RC4Drop = e._createHelper(r)
    }(),
    F = (M = U).lib.StreamCipher,
    P = M.algo,
    D = [],
    E = [],
    R = [],
    P = P.Rabbit = F.extend({
        _doReset: function() {
            for (var t = this._key.words, e = this.cfg.iv, r = 0; r < 4; r++)
                t[r] = 16711935 & (t[r] << 8 | t[r] >>> 24) | 4278255360 & (t[r] << 24 | t[r] >>> 8);
            for (var i = this._X = [t[0], t[3] << 16 | t[2] >>> 16, t[1], t[0] << 16 | t[3] >>> 16, t[2], t[1] << 16 | t[0] >>> 16, t[3], t[2] << 16 | t[1] >>> 16], n = this._C = [t[2] << 16 | t[2] >>> 16, 4294901760 & t[0] | 65535 & t[1], t[3] << 16 | t[3] >>> 16, 4294901760 & t[1] | 65535 & t[2], t[0] << 16 | t[0] >>> 16, 4294901760 & t[2] | 65535 & t[3], t[1] << 16 | t[1] >>> 16, 4294901760 & t[3] | 65535 & t[0]], r = this._b = 0; r < 4; r++)
                N.call(this);
            for (r = 0; r < 8; r++)
                n[r] ^= i[r + 4 & 7];
            if (e) {
                var o = e.words
                  , s = o[0]
                  , c = o[1]
                  , e = 16711935 & (s << 8 | s >>> 24) | 4278255360 & (s << 24 | s >>> 8)
                  , o = 16711935 & (c << 8 | c >>> 24) | 4278255360 & (c << 24 | c >>> 8)
                  , s = e >>> 16 | 4294901760 & o
                  , c = o << 16 | 65535 & e;
                n[0] ^= e,
                n[1] ^= s,
                n[2] ^= o,
                n[3] ^= c,
                n[4] ^= e,
                n[5] ^= s,
                n[6] ^= o,
                n[7] ^= c;
                for (r = 0; r < 4; r++)
                    N.call(this)
            }
        },
        _doProcessBlock: function(t, e) {
            var r = this._X;
            N.call(this),
            D[0] = r[0] ^ r[5] >>> 16 ^ r[3] << 16,
            D[1] = r[2] ^ r[7] >>> 16 ^ r[5] << 16,
            D[2] = r[4] ^ r[1] >>> 16 ^ r[7] << 16,
            D[3] = r[6] ^ r[3] >>> 16 ^ r[1] << 16;
            for (var i = 0; i < 4; i++)
                D[i] = 16711935 & (D[i] << 8 | D[i] >>> 24) | 4278255360 & (D[i] << 24 | D[i] >>> 8),
                t[e + i] ^= D[i]
        },
        blockSize: 4,
        ivSize: 2
    }),
    M.Rabbit = F._createHelper(P),
    F = (M = U).lib.StreamCipher,
    P = M.algo,
    W = [],
    O = [],
    I = [],
    P = P.RabbitLegacy = F.extend({
        _doReset: function() {
            for (var t = this._key.words, e = this.cfg.iv, r = this._X = [t[0], t[3] << 16 | t[2] >>> 16, t[1], t[0] << 16 | t[3] >>> 16, t[2], t[1] << 16 | t[0] >>> 16, t[3], t[2] << 16 | t[1] >>> 16], i = this._C = [t[2] << 16 | t[2] >>> 16, 4294901760 & t[0] | 65535 & t[1], t[3] << 16 | t[3] >>> 16, 4294901760 & t[1] | 65535 & t[2], t[0] << 16 | t[0] >>> 16, 4294901760 & t[2] | 65535 & t[3], t[1] << 16 | t[1] >>> 16, 4294901760 & t[3] | 65535 & t[0]], n = this._b = 0; n < 4; n++)
                q.call(this);
            for (n = 0; n < 8; n++)
                i[n] ^= r[n + 4 & 7];
            if (e) {
                var o = e.words
                  , s = o[0]
                  , t = o[1]
                  , e = 16711935 & (s << 8 | s >>> 24) | 4278255360 & (s << 24 | s >>> 8)
                  , o = 16711935 & (t << 8 | t >>> 24) | 4278255360 & (t << 24 | t >>> 8)
                  , s = e >>> 16 | 4294901760 & o
                  , t = o << 16 | 65535 & e;
                i[0] ^= e,
                i[1] ^= s,
                i[2] ^= o,
                i[3] ^= t,
                i[4] ^= e,
                i[5] ^= s,
                i[6] ^= o,
                i[7] ^= t;
                for (n = 0; n < 4; n++)
                    q.call(this)
            }
        },
        _doProcessBlock: function(t, e) {
            var r = this._X;
            q.call(this),
            W[0] = r[0] ^ r[5] >>> 16 ^ r[3] << 16,
            W[1] = r[2] ^ r[7] >>> 16 ^ r[5] << 16,
            W[2] = r[4] ^ r[1] >>> 16 ^ r[7] << 16,
            W[3] = r[6] ^ r[3] >>> 16 ^ r[1] << 16;
            for (var i = 0; i < 4; i++)
                W[i] = 16711935 & (W[i] << 8 | W[i] >>> 24) | 4278255360 & (W[i] << 24 | W[i] >>> 8),
                t[e + i] ^= W[i]
        },
        blockSize: 4,
        ivSize: 2
    }),
    M.RabbitLegacy = F._createHelper(P),
    U
});
