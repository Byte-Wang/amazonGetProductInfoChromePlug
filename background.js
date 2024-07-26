
function makeCorsRequest(url, token,callback) {
  console.log("[test] get请求，token:",token);
    fetch(url,{
      method: 'GET', 
      headers:{
        'Content-Type': 'application/json', 
        'Batoken': token
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
          },  
          body: JSON.stringify(request.data) 
        })  
        .then(response => response.json())  
        .then(data => {  
          console.log('Data fetched:', data);  
          sendResponse(data); 
        })  
        .catch(error => {  
          console.error('Fetch error:', error);  
          sendResponse({error:error.message}); 
        });  
      }
      return true;
    }
);
