document.addEventListener('DOMContentLoaded', function() {  
    chrome.storage.sync.get('userInfo', function(result) { 
        console.log('获取登录信息：',result.userInfo); 
        const userInfo = result.userInfo;
        if (userInfo && userInfo.token) {
            var loginSection = document.getElementById('login-container');  
            loginSection.innerHTML = '<h2>' + userInfo.nickname +  '</h2> <input class="logout-button" type="button" id="logoutButton" value="退出">  '; 
            
            

            var logoutButton = document.getElementById('logoutButton');  
            logoutButton.addEventListener('click', function() {  
                logout();  
            }); 
        } else {
            // 如果未登录，显示登录框  
            var loginSection = document.getElementById('login-container');  
            var captchaId = generateRandomId();
            loginSection.innerHTML = `  
                <h2>产品信息采集工具</h2>  
                <div class="login-form"  id="loginForm">  
                    <input type="text" placeholder="请输入用户名" id="username" required>  
                    <input type="password" placeholder="请输入密码" id="password" required>  
                    <div>
                    <input type="test" class="captcha-input" placeholder="验证码"  id="captcha" required>  <img class="captcha-image" src="`+"http://www.jyxwl.cn/index.php/api/common/captcha?id="+captchaId+`">
                    </div>
                    <input type="button" id="loginButton" value="登录">  
                </div> 
            `;  

            

            var loginButton = document.getElementById('loginButton');  
            loginButton.addEventListener('click', function() {  
                login(captchaId);  
            });  
        }
    });

});

function generateRandomId() {  
    // 生成一个长度为8的十六进制字符串  
    function generateRandomHex(length) {  
        let result = '';  
        const characters = '0123456789abcdef';  
        const charactersLength = characters.length;  
        for (let i = 0; i < length; i++) {  
            result += characters.charAt(Math.floor(Math.random() * charactersLength));  
        }  
        return result;  
    }  
  
    // 生成UUID的各个部分  
    const timeLow = generateRandomHex(8);  
    const timeMid = generateRandomHex(4);  
    const timeHighAndVersion = generateRandomHex(4); // 注意：这里不包含版本位，因为版本位通常是固定的  
    const clockSeqHiAndReserved = '4' + generateRandomHex(1); // 第一个字符通常是4，以表示UUID的版本  
    const clockSeqLow = generateRandomHex(3);  
    const node = generateRandomHex(12);  
  
    // 拼接成最终的UUID格式  
    return `${timeLow}-${timeMid}-${timeHighAndVersion}-${clockSeqHiAndReserved}-${node}`;  
}  

function logout(){
    chrome.storage.sync.set({'userInfo': {}}, function() {  
        console.log('保存成功');  
        location.reload();
    });  
}

function login(captchaId) {  
    var username = document.getElementById('username').value;  
    var password = document.getElementById('password').value;  
    var captcha = document.getElementById('captcha').value;  

    console.log(username,password);

    fetch('http://www.jyxwl.cn/index.php/admin/index/login', {  
        method: 'POST',  
        headers: {  
            'Content-Type': 'application/json',  
        },  
        body: JSON.stringify({
            captcha: captcha,
            captcha_id: captchaId,
            keep: true,
            loading: true,
            password: password,
            username: username,
        })  
    })  
    .then(response => response.json())  
    .then(data => {  
        console.log('登录结果',data);  
        if (data.code == 1) {  
            console.log('保存token',data.data);  
            // 保存token  
            chrome.storage.sync.set({'userInfo': data.data.userinfo}, function() {  
                console.log('保存成功');  
                location.reload();
            });  
            // 可以在这里处理登录成功后的逻辑，如关闭弹窗  
        } else {  
            alert('登录失败');  
        }  
        location.reload();
    })  
    .catch(error => console.error('Error:', error));  
}