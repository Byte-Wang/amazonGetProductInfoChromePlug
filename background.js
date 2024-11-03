
function makeCorsRequest(url, token,callback) {
  console.log("[test] get请求，token:",token);
    fetch(url,{
      method: 'GET', 
      headers:{
        'Content-Type': 'application/json', 
        'Batoken': token,
      },  
    })  
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


chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      console.log("[test] 收到消息", request);
      if (request.action === "makeCorsRequest") {
        console.log("[test] 发出GET请求");
        makeCorsRequest(request.url,request.token, function(error, response) {
            console.log('response:', response);  
            if (error) {
                console.error(error.message);
                sendResponse({error:error.message});
            } else {
                sendResponse(response);
            }
        });
      } else if (request.action === "makePOSTRequest"){
        console.log("[test] 发出POST请求");
        fetch(request.url,{
          method: 'POST', 
          headers:{
            'Content-Type': 'application/json', 
            'Batoken': request.token,
          },  
          body: JSON.stringify(request.data) 
        })  
        .then(response => {
          // 检查响应状态
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        
          // 返回响应体文本
          return response.text();
        })
        .then(text => {  
          try {
            // 尝试将响应体解析为 JSON
            const data = JSON.parse(text);
            sendResponse(data);
          } catch (error) {
            sendResponse({"code": -1,"result": text,"desc":"result is not a json"});
          }
        })  
        .catch(error => {  
          console.error('Fetch error:', error);  
          sendResponse({error:error.message}); 
        });  
      }
      return true;
    }
);
