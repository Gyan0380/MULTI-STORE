let appData = {};
let storeSettings = {};
let currentCategory = null;
let isSignUpMode = false;
let activeItemData = null;

const icons = ['🔥', '💎', '🎮', '👾', '🛒', '🚀', '⭐', '🎁'];
const colors = ['rgba(239, 68, 68, 0.5)', 'rgba(14, 165, 233, 0.5)', 'rgba(245, 158, 11, 0.5)', 'rgba(99, 102, 241, 0.5)', 'rgba(16, 185, 129, 0.5)'];

db.ref('storeSettings').on('value', (snap) => {
    storeSettings = snap.val() || {};
    const fab = document.getElementById('floating-discord');
    if(storeSettings.discord) { 
        fab.style.display = 'flex'; 
        fab.href = /^\d+$/.test(storeSettings.discord) ? "https://discord.com/users/" + storeSettings.discord : storeSettings.discord;
    }
});

db.ref('storeData').on('value', (snapshot) => {
    appData = snapshot.val() || {}; renderDynamicWebsite(); 
    if (currentCategory && document.getElementById('category-view').classList.contains('active')) loadCategoryData(currentCategory);
});

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); }
function switchView(viewId) { 
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active')); 
    document.getElementById(viewId).classList.add('active'); 
    window.scrollTo(0, 0); 
    if(viewId === 'purchases-view') loadMyPurchases();
    if(viewId === 'ads-view' || viewId === 'welcome-view') {
        if(typeof renderPublicAds === 'function') renderPublicAds();
    }
}

function renderDynamicWebsite() {
    const storeGrid = document.getElementById('dynamic-store-grid'); const homeCards = document.getElementById('dynamic-home-cards'); const sidebar = document.getElementById('dynamic-sidebar'); const scrollingText = document.getElementById('dynamic-scrolling-text');
    storeGrid.innerHTML = ''; homeCards.innerHTML = ''; let tickerHtml = '';
    
    let sidebarLinks = `<li><a href="#" onclick="switchView('welcome-view'); toggleSidebar();">🏠 Home</a></li>
        <li><a href="#" onclick="switchView('ads-view'); toggleSidebar();" style="color: #e879f9;">📢 Special Offers</a></li>
        <li><a href="#" onclick="switchView('store-view'); toggleSidebar();">🏪 Main Store</a></li>`;
    
    if(auth.currentUser) sidebarLinks += `<li><a href="#" onclick="switchView('purchases-view'); toggleSidebar();" style="color: #34d399;">🛒 My Purchases</a></li>`;

    let i = 0; let hasCat = false;
    for(let key in appData) {
        if(!appData[key].parentKey && appData[key].title) {
            hasCat = true; let icon = icons[i % icons.length]; let color = colors[i % colors.length];
            tickerHtml += `<span>${icon} Premium ${appData[key].title}</span><span style="color: rgba(255,255,255,0.2);">•</span>`;
            storeGrid.innerHTML += `<div class="card"><div><h3>${appData[key].title}</h3><p>${appData[key].desc || ''}</p></div><button class="card-btn" onclick="switchView('category-view'); loadCategoryData('${key}');">See Offers</button></div>`;
            homeCards.innerHTML += `<div class="tilt-card" style="border-color: ${color};" onclick="switchView('category-view'); loadCategoryData('${key}');"><span class="t-icon">${icon}</span><h4>${appData[key].title}</h4><p>${appData[key].desc || ''}</p></div>`;
            sidebarLinks += `<li><a href="#" onclick="switchView('category-view'); loadCategoryData('${key}'); toggleSidebar();">▶ ${appData[key].title}</a></li>`; i++;
        }
    }
    if(scrollingText) scrollingText.innerHTML = tickerHtml + tickerHtml + tickerHtml + tickerHtml + tickerHtml;
    sidebarLinks += `<li><a href="admin.html" style="color: #f87171;">🔒 Admin Login</a></li>`; sidebar.innerHTML = sidebarLinks;
    if(!hasCat) storeGrid.innerHTML = '<p style="color:#94a3b8; text-align:center; grid-column: 1/-1;">Store is empty.</p>';
}

// 🔥 NAYA JADOO: Multiple Photos Slide Change Logic
window.currentSlides = window.currentSlides || {};
function changeSlide(uniqueId, dir, total) {
    if(window.currentSlides[uniqueId] === undefined) window.currentSlides[uniqueId] = 0;
    document.getElementById(`slide-${uniqueId}-${window.currentSlides[uniqueId]}`).style.display = 'none';
    window.currentSlides[uniqueId] = (window.currentSlides[uniqueId] + dir + total) % total;
    document.getElementById(`slide-${uniqueId}-${window.currentSlides[uniqueId]}`).style.display = 'block';
    
    const counter = document.getElementById(`counter-${uniqueId}`);
    if(counter) counter.innerText = `${window.currentSlides[uniqueId] + 1} / ${total}`;
}

function loadCategoryData(catKey) {
    currentCategory = catKey; const cat = appData[catKey];
    if(!cat) return switchView('category-view');

    document.getElementById('cat-title').innerText = cat.title; document.getElementById('cat-desc').innerText = cat.desc || "";
    const backBtn = document.getElementById('back-button');
    if(cat.parentKey && appData[cat.parentKey]) { backBtn.setAttribute('onclick', `loadCategoryData('${cat.parentKey}')`); backBtn.innerText = "← Back to " + appData[cat.parentKey].title; } 
    else { backBtn.setAttribute('onclick', "switchView('store-view')"); backBtn.innerText = "← Back to Store"; }

    let catAlertHtml = '';
    if (cat.warning || cat.note || cat.terms) {
        catAlertHtml += `<div class="category-alert-box">`;
        if(cat.warning) catAlertHtml += `<div class="alert-item" style="color:#fca5a5;"><strong>⚠️ Warning:</strong> ${cat.warning}</div>`;
        if(cat.note) catAlertHtml += `<div class="alert-item" style="color:#fde047;"><strong>📌 Note:</strong> ${cat.note}</div>`;
        if(cat.terms) catAlertHtml += `<div class="alert-item" style="color:#bae6fd;"><strong>📜 T&C:</strong> ${cat.terms}</div>`;
        catAlertHtml += `</div>`;
    }
    document.getElementById('dynamic-category-alert').innerHTML = catAlertHtml;

    const subContainer = document.getElementById('sub-folder-container'); subContainer.innerHTML = '';
    if(cat.subFolders && cat.subFolders.length > 0) {
        subContainer.style.display = 'grid';
        cat.subFolders.forEach(folder => { subContainer.innerHTML += `<div class="folder-card"><div><h3>📁 ${folder.name}</h3><p>${folder.desc}</p></div><button class="btn" style="width:100%; padding: 10px; font-size:1rem;" onclick="loadCategoryData('${folder.key}')">See Offers</button></div>`; });
    } else { subContainer.style.display = 'none'; }

    const listContainer = document.getElementById('dynamic-item-list'); listContainer.innerHTML = '';
    if(cat.items && cat.items.length > 0) {
        cat.items.forEach((item, index) => {
            let isStockOut = item.status === 'Out of Stock';
            let badgeClass = isStockOut ? 'nostock' : (item.status === 'Coming Soon' ? 'soon' : 'active');
            let itemNoticeHtml = '';
            if (item.warning || item.note || item.terms) {
                itemNoticeHtml += `<div class="item-alert-box ${item.warning ? 'c-warn' : item.note ? 'c-note' : 'c-tc'}">`;
                if(item.warning) itemNoticeHtml += `<div style="margin-bottom:5px;"><strong>⚠️ Warning:</strong> ${item.warning}</div>`;
                if(item.note) itemNoticeHtml += `<div style="margin-bottom:5px;"><strong>📌 Note:</strong> ${item.note}</div>`;
                if(item.terms) itemNoticeHtml += `<div><strong>📜 T&C:</strong> ${item.terms}</div>`;
                itemNoticeHtml += `</div>`;
            }

            // 🔥 IMAGE SLIDER UI GENERATOR
            let imageSliderHtml = '';
            if (item.images && item.images.length > 0) {
                let uniqueId = `${catKey}-${index}`;
                let imgsHtml = item.images.map((img, i) => `<img src="${img}" style="width:100%; height:220px; object-fit:cover; display:${i===0?'block':'none'}; border-radius:12px;" id="slide-${uniqueId}-${i}">`).join('');
                
                let btnsHtml = item.images.length > 1 ? `
                    <button onclick="changeSlide('${uniqueId}', -1, ${item.images.length})" style="position:absolute; left:10px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.7); color:white; border:none; border-radius:50%; width:35px; height:35px; cursor:pointer; font-size:18px; display:flex; align-items:center; justify-content:center; z-index:10; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">&#10094;</button>
                    <button onclick="changeSlide('${uniqueId}', 1, ${item.images.length})" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.7); color:white; border:none; border-radius:50%; width:35px; height:35px; cursor:pointer; font-size:18px; display:flex; align-items:center; justify-content:center; z-index:10; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">&#10095;</button>
                    <div style="position:absolute; bottom:10px; right:10px; background:rgba(0,0,0,0.7); color:#fff; padding:3px 10px; border-radius:12px; font-size:0.8rem; z-index:10; font-weight:bold; letter-spacing:1px;" id="counter-${uniqueId}">1 / ${item.images.length}</div>
                ` : '';
                
                imageSliderHtml = `<div style="position:relative; width:100%; margin-bottom:15px; border-radius:12px; overflow:hidden; border:1px solid rgba(168, 85, 247, 0.4); box-shadow: 0 5px 15px rgba(0,0,0,0.3);">${imgsHtml}${btnsHtml}</div>`;
            }

            listContainer.innerHTML += `<div class="item-card-wrapper">
                ${imageSliderHtml}
                <div class="item-top-row">
                    <div class="item-details"><h4>${item.name}</h4><span>${item.desc}</span><div style="margin-top: 10px;"><span class="badge ${badgeClass}">${item.status}</span></div></div>
                    <div style="text-align:right;"><div class="price-tag">${item.price}</div><button onclick="openBuyModal('${catKey}', ${index})" class="btn" style="padding:8px 20px; font-size:0.9rem; margin-top:15px; display:inline-block; border-radius:8px; width:auto;" ${isStockOut ? 'disabled style="background:#374151; cursor:not-allowed;"' : ''}>${isStockOut ? 'Sold Out' : 'Buy Now'}</button></div>
                </div>${itemNoticeHtml}
            </div>`;
        });
    } else if (!cat.subFolders || cat.subFolders.length === 0) { listContainer.innerHTML = '<p style="color:#94a3b8; text-align:center;">No offers available right now.</p>'; }
    switchView('category-view');
}

function openBuyModal(catKey, itemIdx) {
    activeItemData = { catKey, itemIdx, item: appData[catKey].items[itemIdx] };
    const item = activeItemData.item;
    const opts = item.buyOptions || {online:true, free:false, discord:true, wa:true, tg:true, fb:false};

    document.getElementById('modal-item-title').innerText = item.name;
    document.getElementById('modal-item-price').innerText = "Price: " + item.price;

    document.getElementById('opt-free').style.display = opts.free ? 'block' : 'none';
    document.getElementById('opt-online').style.display = opts.online ? 'block' : 'none';
    
    const btnDisc = document.getElementById('opt-discord'); 
    btnDisc.style.display = opts.discord ? 'block' : 'none';
    let discVal = storeSettings.discord || "";
    if (/^\d+$/.test(discVal)) {
        btnDisc.href = "https://discord.com/users/" + discVal;
        btnDisc.innerHTML = "👤 DM on Discord";
    } else {
        btnDisc.href = discVal || "#";
        btnDisc.innerHTML = "🎮 Join Discord Server";
    }

    const btnWa = document.getElementById('opt-whatsapp'); btnWa.style.display = opts.wa ? 'block' : 'none';
    const btnTg = document.getElementById('opt-telegram'); btnTg.style.display = opts.tg ? 'block' : 'none';
    const btnFb = document.getElementById('opt-facebook'); btnFb.style.display = opts.fb ? 'block' : 'none';

    btnWa.href = `https://wa.me/${storeSettings.wa}?text=I want to buy ${encodeURIComponent(item.name)}`;
    btnTg.href = storeSettings.tg || "#";
    btnFb.href = storeSettings.fb || "#";

    document.getElementById('buy-modal').style.display = 'flex';
}
function closeModal() { document.getElementById('buy-modal').style.display = 'none'; }

async function processFreeClaim() {
    if(!auth.currentUser) { alert("Please Login to your account first to claim free items!"); closeModal(); switchView('auth-view'); return; }
    
    const user = auth.currentUser;
    const catKey = activeItemData.catKey;
    const itemIdx = activeItemData.itemIdx;
    let itemRef = appData[catKey].items[itemIdx];
    let codesArray = itemRef.codes ? (Array.isArray(itemRef.codes) ? itemRef.codes : Object.values(itemRef.codes)) : [];

    if(codesArray.length === 0) {
        alert("Sorry! This free item is Out of Stock right now. Please wait for refill.");
        return;
    }

    try {
        const userRef = await db.ref('registeredUsers/' + user.uid).once('value');
        const userData = userRef.val() || {};
        const lastClaim = userData.lastFreeClaim || 0;
        const now = Date.now();
        const cooldown = 24 * 60 * 60 * 1000; 
        
        if (now - lastClaim < cooldown) {
            const remainingTime = cooldown - (now - lastClaim);
            const remainingHours = Math.floor(remainingTime / (1000 * 60 * 60));
            const remainingMins = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
            alert(`⏳ Cooldown Active!\nYou can claim your next free item after ${remainingHours} hours and ${remainingMins} minutes.`);
            return;
        }

        closeModal();
        document.getElementById('opt-free').innerText = "Processing...";

        let codeToSend = codesArray.shift(); 
        let newStatus = codesArray.length === 0 ? "Out of Stock" : itemRef.status; 
        
        await db.ref(`storeData/${catKey}/items/${itemIdx}`).update({ codes: codesArray, status: newStatus });

        const orderId = 'FREE_' + Date.now();
        await db.ref('orders/' + orderId).set({
            orderId: orderId, uid: user.uid, email: user.email, itemName: itemRef.name, price: "FREE", gameUid: "N/A", screenshotUrl: "", status: "Approved", code: codeToSend, catKey: catKey, itemIdx: itemIdx, timestamp: new Date().toLocaleString()
        });
        await db.ref('registeredUsers/' + user.uid).update({ lastFreeClaim: now });

        document.getElementById('opt-free').innerText = "🎁 Claim for FREE (Auto-Delivery)";
        document.getElementById('free-delivery-modal').style.display = 'flex';
    } catch(e) {
        alert("Error claiming item: " + e.message);
        document.getElementById('opt-free').innerText = "🎁 Claim for FREE (Auto-Delivery)";
    }
}

function openOnlineCheckout() {
    if(!auth.currentUser) { alert("Please Login to your account first!"); closeModal(); switchView('auth-view'); return; }
    closeModal();
    const imgQR = document.getElementById('dynamic-qr-img');
    const txtQR = document.getElementById('qr-fallback-msg');
    if(storeSettings.qr) { imgQR.src = storeSettings.qr; imgQR.style.display = 'block'; txtQR.style.display = 'none'; } 
    else { imgQR.style.display = 'none'; txtQR.style.display = 'block'; }
    document.getElementById('dynamic-upi-text').innerText = storeSettings.upi ? `UPI ID: ${storeSettings.upi}` : 'UPI ID Not Set';
    document.getElementById('payment-screenshot').value = '';
    document.getElementById('game-uid').value = '';
    document.getElementById('online-modal').style.display = 'flex';
}

async function verifyAndDeliverCode() {
    const fileInput = document.getElementById('payment-screenshot');
    const userGameUid = document.getElementById('game-uid').value.trim();
    if (fileInput.files.length === 0) return alert("Please upload a payment screenshot first!");
    
    let itemRef = appData[activeItemData.catKey].items[activeItemData.itemIdx];
    let codesArray = itemRef.codes ? (Array.isArray(itemRef.codes) ? itemRef.codes : Object.values(itemRef.codes)) : [];
    if(codesArray.length === 0) return alert("Sorry! Out of stock.");
    
    const file = fileInput.files[0];
    const btnSubmit = document.getElementById('submit-order-btn');
    document.getElementById('upload-status').style.display = 'block'; 
    btnSubmit.disabled = true;
    btnSubmit.innerText = "Processing Image...";
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = async function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 500;
            let width = img.width;
            let height = img.height;
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            const base64String = canvas.toDataURL('image/jpeg', 0.6); 
            try {
                const orderId = 'ORD_' + Date.now(); 
                const user = auth.currentUser;
                await db.ref('orders/' + orderId).set({ 
                    orderId: orderId, uid: user.uid, email: user.email, itemName: itemRef.name, price: itemRef.price, gameUid: userGameUid ? userGameUid : 'N/A', screenshotUrl: base64String, storagePath: 'RTDB_BASE64', status: "Pending Verification", code: "", catKey: activeItemData.catKey, itemIdx: activeItemData.itemIdx, timestamp: new Date().toLocaleString() 
                });
                document.getElementById('upload-status').style.display = 'none'; btnSubmit.disabled = false; btnSubmit.innerText = "Submit Order"; document.getElementById('online-modal').style.display = 'none'; document.getElementById('delivery-modal').style.display = 'flex';
            } catch (error) {
                alert("Upload failed: " + error.message); document.getElementById('upload-status').style.display = 'none'; btnSubmit.disabled = false; btnSubmit.innerText = "Submit Order";
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function loadMyPurchases() {
    const list = document.getElementById('my-orders-list'); list.innerHTML = '<p style="text-align:center; color:#38bdf8;">Loading...</p>';
    if(!auth.currentUser) return;
    db.ref('orders').orderByChild('uid').equalTo(auth.currentUser.uid).once('value', (snapshot) => {
        list.innerHTML = '';
        if(snapshot.exists()) {
            const orders = snapshot.val(); const sortedKeys = Object.keys(orders).sort((a,b) => orders[b].timestamp.localeCompare(orders[a].timestamp));
            sortedKeys.forEach(key => {
                const ord = orders[key]; let statusColor = ord.status === 'Approved' ? '#34d399' : (ord.status === 'Rejected' ? '#ef4444' : '#eab308');
                let codeHtml = ord.status === 'Approved' ? `<div style="margin-top:15px; padding:10px; background:#05050a; border:1px dashed #34d399; border-radius:6px; color:#34d399; font-weight:bold; letter-spacing:1px; text-align:center;">VOUCHER CODE:<br><span style="font-size:1.3rem;">${ord.code}</span></div>` : (ord.status === 'Rejected' ? `<div style="margin-top:10px; color:#ef4444; font-size:0.9rem;">Admin Rejected.</div>` : `<div style="margin-top:10px; color:#eab308; font-size:0.9rem;">Verifying Order...</div>`);
                let uidHtml = (ord.gameUid && ord.gameUid !== 'N/A') ? `<br><span style="color:#e879f9;">🎮 UID: ${ord.gameUid}</span>` : '';
                let ssHtml = ord.screenshotUrl ? `<br><a href="${ord.screenshotUrl}" target="_blank" style="color:#38bdf8; text-decoration:underline; font-size:0.8rem;">View SS</a>` : '';
                list.innerHTML += `<div class="item-card-wrapper" style="border-left: 4px solid ${statusColor};"><div style="display:flex; justify-content:space-between; margin-bottom:5px;"><strong style="color:#fff;">${ord.itemName}</strong><span style="color:#38bdf8; font-weight:bold;">${ord.price}</span></div><div style="font-size:0.8rem; color:#94a3b8; margin-bottom:10px;">Order ID: ${ord.orderId}${uidHtml}${ssHtml}</div><div class="badge" style="background:transparent; border:1px solid ${statusColor}; color:${statusColor};">${ord.status}</div>${codeHtml}</div>`;
            });
        } else { list.innerHTML = '<p style="text-align:center; color:#94a3b8;">You have not bought anything yet.</p>'; }
    });
}

function toggleAuthMode() { isSignUpMode = !isSignUpMode; document.getElementById('auth-title').innerText = isSignUpMode ? "Create Account" : "Login"; document.getElementById('auth-submit-btn').innerText = isSignUpMode ? "Sign Up" : "Login"; document.getElementById('auth-toggle-text').innerText = isSignUpMode ? "Already have account? Login" : "Don't have account? Sign Up"; }
function handleEmailAuth() { const email = document.getElementById('auth-email').value.trim(); const pass = document.getElementById('auth-pass').value.trim(); if(!email || !pass) return alert("Enter Email and Password!"); if(isSignUpMode) auth.createUserWithEmailAndPassword(email, pass).then(() => alert("Account Created!")).catch(e => alert(e.message)); else auth.signInWithEmailAndPassword(email, pass).then(() => alert("Logged in!")).catch(e => alert("Login Failed")); }
function signInWithGoogle() { auth.signInWithRedirect(googleProvider); }
auth.getRedirectResult().then((r) => { if(r && r.user) switchView('welcome-view'); }).catch((e) => {});
function logout() { auth.signOut().then(() => alert("Logged out.")); }

auth.onAuthStateChanged((user) => {
    const headerBtn = document.getElementById('header-auth-btn'); const loggedOutUI = document.getElementById('logged-out-section'); const loggedInUI = document.getElementById('logged-in-section');
    if (user) {
        headerBtn.innerHTML = `👤 Profile`; headerBtn.style.color = "#34d399"; headerBtn.style.borderColor = "#34d399"; loggedOutUI.style.display = 'none'; loggedInUI.style.display = 'block'; document.getElementById('profile-name').innerText = user.displayName || "Store Member"; document.getElementById('profile-email').innerText = user.email; document.getElementById('profile-pic').src = user.photoURL || "https://via.placeholder.com/100/38bdf8/000000?text=USER";
        db.ref('registeredUsers/' + user.uid).once('value').then(snap => { const currentData = snap.val() || {}; db.ref('registeredUsers/' + user.uid).update({ name: user.displayName || "Store Member", email: user.email, lastLogin: new Date().toLocaleString(), lastFreeClaim: currentData.lastFreeClaim || 0 }); });
        renderDynamicWebsite(); 
    } else { headerBtn.innerHTML = `👤 Login`; headerBtn.style.color = "#38bdf8"; headerBtn.style.borderColor = "#38bdf8"; loggedOutUI.style.display = 'block'; loggedInUI.style.display = 'none'; renderDynamicWebsite(); }
});
window.onload = function() { switchView('welcome-view'); }
