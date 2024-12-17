document.addEventListener('DOMContentLoaded', function() {  
    chrome.storage.sync.get('loginInfo', function(loginInfoResult) { 
        console.log('��ȡ��¼��Ϣ��',loginInfoResult.loginInfo); 
        const loginInfo = loginInfoResult.loginInfo;
    chrome.storage.sync.get('userInfo', function(result) { 
        console.log('��ȡ�û���Ϣ��',result.userInfo); 
        chrome.storage.sync.get('feixunUserConfig', function(userConfig) { 
        
            userConfig = userConfig.feixunUserConfig;

            console.log('��ȡ�û�������Ϣ��',userConfig); 
            const userInfo = result.userInfo;

            if (!userConfig) {
                console.log('��ʼ���û�����'); 
                userConfig = {
                    useWipoSwitch: "use",
                    shipsFromTypes: ['FBA','FBM','AMZ'],
                    soldByNumber: 8,
                    categoryRank: 50000,
                    amount: 10,
                    profitRate: 45,
                    reviewNumber: 3,
                };
            }

            let useWipoSwitch = (userConfig && userConfig.useWipoSwitch)?userConfig.useWipoSwitch:"use";
            let shipsFromTypes = (userConfig && userConfig.shipsFromTypes)?userConfig.shipsFromTypes:['FBA','FBM','AMZ'];
            let soldByNumber =  (userConfig && userConfig.soldByNumber)?userConfig.soldByNumber:8;
            let categoryRank = (userConfig && userConfig.categoryRank)?userConfig.categoryRank:50000;
            let amount = (userConfig && userConfig.amount)?userConfig.amount:10.0;
            let profitRate = (userConfig && userConfig.profitRate)?userConfig.profitRate:45;
            let reviewNumber = (userConfig && userConfig.reviewNumber)?userConfig.reviewNumber:3.0;
            
            if (userInfo && userInfo.token) {
                // �ѵ�¼���رյ�¼ҳ�棬��ʾ����ҳ��
                let loginSection = document.getElementById('login-container');  
                let userContainer = document.getElementById('user-container');  
                loginSection.hidden = true;
                userContainer.hidden = false;
                
                // ��ʾ�û���
                var usernameLabel = document.getElementById('username-label');  
                usernameLabel.innerHTML = userInfo.nickname;
            
                

                // ��ʼ���û����õ�ҳ��
                var switchEle = document.getElementById('switch');  
                switchEle.checked = useWipoSwitch == "use"?true:false;

                var fbaEle = document.getElementById('fba'); 
                fbaEle.checked = shipsFromTypes.includes('FBA')?true:false;

                var fbmEle = document.getElementById('fbm'); 
                fbmEle.checked = shipsFromTypes.includes('FBM')?true:false;

                var amzEle = document.getElementById('amz'); 
                amzEle.checked = shipsFromTypes.includes('AMZ')?true:false;

                var sellerCountEle = document.getElementById('sellerCount'); 
                sellerCountEle.value = soldByNumber;

                var categorySortEle = document.getElementById('categorySort'); 
                categorySortEle.value = categoryRank;

                var amountEle = document.getElementById('amount'); 
                amountEle.value = amount;

                var profitRateEle = document.getElementById('profitRate'); 
                profitRateEle.value = profitRate;

                var ReviewNumberEle = document.getElementById('ReviewNumber'); 
                ReviewNumberEle.value = reviewNumber;

                
                var logoutButton = document.getElementById('logoutButton');  
                logoutButton.addEventListener('click', function() {  
                    let userContainer = document.getElementById('user-container');  
                    userContainer.hidden = true;
                    logout();  
                }); 


                // �����ǳ���ť
                var saveButton = document.getElementById('saveButton');  
                saveButton.addEventListener('click', function() {  
                    userConfig = {
                        useWipoSwitch: switchEle.checked?'use':'notUse',
                        shipsFromTypes: [fbaEle.checked?'FBA':'',fbmEle.checked?'FBM':'',amzEle.checked?'AMZ':''],
                        soldByNumber: sellerCountEle.value,
                        categoryRank: categorySortEle.value,
                        amount: amountEle.value,
                        profitRate: profitRateEle.value,
                        reviewNumber: ReviewNumberEle.value,
                    };

                    console.log("�����û�����", userConfig);
                    chrome.storage.sync.set({'feixunUserConfig': userConfig}, function() {  
                        console.log('����ɹ�');  
                        feixunShowToast('����ɹ�!');
                        // location.reload();
                    });  
                }); 
        
                // var switchInput = document.getElementById('switch');  
                // console.log('��ȡ���ذ�ť��',switchInput);
                // switchInput.addEventListener('change', function() {  
                //     debugger;
                //     if (this.checked) {  
                //         console.log('�����Ѵ�');  
                //         chrome.storage.sync.set({'useWipoSwitch': {value: 1}}, function() {  
                //             console.log('����ɹ�');  
                //             location.reload();
                //         });  
                //     } else {  
                //         console.log('�����ѹر�');  
                //         chrome.storage.sync.set({'useWipoSwitch': {value: 0}}, function() {  
                //             console.log('����ɹ�');  
                //             location.reload();
                //         });  
                //     }  
                // });  
            } else {
                let loginSection = document.getElementById('login-container');  
                let userContainer = document.getElementById('user-container');  
                loginSection.hidden = false;
                userContainer.hidden = true;

                var captchaId = generateRandomId();
                const feixunplugCaptchaImg = document.getElementById("feixunplugCaptchaImg");
                feixunplugCaptchaImg.src = "http://119.91.217.3:8087/index.php/api/common/captcha?id="+captchaId;

                
                
                if (loginInfo && loginInfo.username &&  loginInfo.password) {
                    document.getElementById("username").value = loginInfo.username;
                    document.getElementById("password").value = loginInfo.password;
                }

                var loginButton = document.getElementById('loginButton');  
                loginButton.addEventListener('click', function() {  

                    // ��¼��ʱ����һ�¹��ڵĻ���
                    chrome.storage.sync.get('feixunPlugCacheRroductInfo', function(result) {
                        console.log('��ѯ����������',result);

                        let cacheProductInfo = result.feixunPlugCacheRroductInfo;
                        if (!cacheProductInfo){
                            cacheProductInfo = {};
                        }

                        const allAsins = Object.keys(cacheProductInfo);
                        let avalibleCache = {};
                        allAsins.forEach(asin => {
                            const cacheTime = cacheProductInfo[asin]['cacheTime'];
                            const nowTime = Date.now();
                            if ((nowTime - cacheTime) < 3 * 24 * 60 * 60 * 1000) {
                                avalibleCache[asin] = cacheProductInfo[asin];
                            } else {
                                console.log('������ڻ���',cacheProductInfo[asin]);
                            }
                        });

                        chrome.storage.sync.set({'feixunPlugCacheRroductInfo': avalibleCache},function (res) {
                            console.log('���µ�chrome�������');
                        });
                    });

                    let userContainer = document.getElementById('user-container');  
                    userContainer.hidden = false;
                    login(captchaId);  
                });  
            }
        });
    });
    });
});


function feixunShowToast(content) {
    const targetElement = document.getElementById('saveButton');
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

    fetch('http://119.91.217.3:8087/index.php/admin/index/login', {  
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
            chrome.storage.sync.set({'loginInfo': {"username":username,"password":password}}, function() {  
                console.log('����ɹ�');  
            });  
            // ���������ﴦ���¼�ɹ�����߼�����رյ���  
        } else {  
            alert('��¼ʧ��');  
        }  
        location.reload();
    })  
    .catch(error => console.error('Error:', error));  
}