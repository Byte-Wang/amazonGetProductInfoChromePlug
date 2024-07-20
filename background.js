// 当插件安装时触发
// chrome.runtime.onInstalled.addListener(function() {
//     console.log("Extension installed");
// });

  // 处理跨域请求的函数
function makeCorsRequest(url, callback) {
    fetch(url)  
    .then(response => response.json())  
    .then(data => {  
      console.log('Data fetched:', data);  
      callback(null,data); 
    })  
    .catch(error => {  
      console.error('Fetch error:', error);  
      callback(error,null); 
    });  
}

  // 示例：监听来自内容脚本的消息
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.action === "makeCorsRequest") {
        // 调用跨域请求函数
        makeCorsRequest(request.url, function(error, response) {
            console.log('response:', response);  
            if (error) {
                // 处理错误
                console.error(error.message);
            } else {
                // 将响应发送回内容脚本
                sendResponse(response);
            }
        });
      }
      return true;
    }
);
