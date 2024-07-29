document.addEventListener('DOMContentLoaded', function() {  
    chrome.storage.sync.get('userInfo', function(result) { 
        console.log('��ȡ��¼��Ϣ��',result.userInfo); 
        const userInfo = result.userInfo;
        if (userInfo && userInfo.token) {
            var loginSection = document.getElementById('login-container');  
            loginSection.innerHTML = '<h2>' + userInfo.nickname +  '</h2> <input class="logout-button" type="button" id="logoutButton" value="�˳�">  '; 
            
            

            var logoutButton = document.getElementById('logoutButton');  
            logoutButton.addEventListener('click', function() {  
                logout();  
            }); 
        } else {
            // ���δ��¼����ʾ��¼��  
            var loginSection = document.getElementById('login-container');  
            var captchaId = generateRandomId();
            loginSection.innerHTML = `  
                <h2>��Ʒ��Ϣ�ɼ�����</h2>  
                <div class="login-form"  id="loginForm">  
                    <input type="text" placeholder="�������û���" id="username" required>  
                    <input type="password" placeholder="����������" id="password" required>  
                    <div>
                    <input type="test" class="captcha-input" placeholder="��֤��"  id="captcha" required>  <img class="captcha-image" src="`+"http://www.jyxwl.cn/index.php/api/common/captcha?id="+captchaId+`">
                    </div>
                    <input type="button" id="loginButton" value="��¼">  
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
    // ����һ������Ϊ8��ʮ�������ַ���  
    function generateRandomHex(length) {  
        let result = '';  
        const characters = '0123456789abcdef';  
        const charactersLength = characters.length;  
        for (let i = 0; i < length; i++) {  
            result += characters.charAt(Math.floor(Math.random() * charactersLength));  
        }  
        return result;  
    }  
  
    // ����UUID�ĸ�������  
    const timeLow = generateRandomHex(8);  
    const timeMid = generateRandomHex(4);  
    const timeHighAndVersion = generateRandomHex(4); // ע�⣺���ﲻ�����汾λ����Ϊ�汾λͨ���ǹ̶���  
    const clockSeqHiAndReserved = '4' + generateRandomHex(1); // ��һ���ַ�ͨ����4���Ա�ʾUUID�İ汾  
    const clockSeqLow = generateRandomHex(3);  
    const node = generateRandomHex(12);  
  
    // ƴ�ӳ����յ�UUID��ʽ  
    return `${timeLow}-${timeMid}-${timeHighAndVersion}-${clockSeqHiAndReserved}-${node}`;  
}  

function logout(){
    chrome.storage.sync.set({'userInfo': {}}, function() {  
        console.log('����ɹ�');  
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
        console.log('��¼���',data);  
        if (data.code == 1) {  
            console.log('����token',data.data);  
            // ����token  
            chrome.storage.sync.set({'userInfo': data.data.userinfo}, function() {  
                console.log('����ɹ�');  
                location.reload();
            });  
            // ���������ﴦ���¼�ɹ�����߼�����رյ���  
        } else {  
            alert('��¼ʧ��');  
        }  
        location.reload();
    })  
    .catch(error => console.error('Error:', error));  
}