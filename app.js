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
    if(storeSettings.discord) { fab.style.display = 'flex'; fab.href = storeSettings.discord; }
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
            listContainer.innerHTML += `<div class="item-card-wrapper"><div class="item-top-row"><div class="item-details"><h4>${item.name}</h4><span>${item.desc}</span><div style="margin-top: 10px;"><span class="badge ${badgeClass}">${item.status}</span></div></div><div style="text-align:right;"><div class="price-tag">${item.price}</div><button onclick="openBuyModal('${catKey}', ${index})" class="btn" style="padding:8px 20px; font-size:0.9rem; margin-top:15px; display:inline-block; border-radius:8px; width:auto;" ${isStockOut ? 'disabled style="background:#374151; cursor:not-allowed;"' : ''}>${isStockOut ? 'Sold Out' : 'Buy Now'}</button></div></div>${itemNoticeHtml}</div>`;
        });
    } else if (!cat.subFolders || cat.subFolders.length === 0) { listContainer.innerHTML = '<p style="color:#94a3b8; text-align:center;">No offers available right now.</p>'; }
    switchView('category-view');
}

function openBuyModal(catKey, itemIdx) {
    activeItemData = { catKey, itemIdx, item: appData[catKey].items[itemIdx] };
    const item = activeItemData.item;
    const opts = item.buyOptions || {online:true, discord:true, wa:true, tg:true, fb:false};

    document.getElementById('modal-item-title').innerText = item.name;
    document.getElementById('modal-item-price').innerText = "Price: " + item.price;

    document.getElementById('opt-online').style.display = opts.online ? 'block' : 'none';
    const btnDisc = document.getElementById('opt-discord'); btnDisc.style.display = opts.discord ? 'block' : 'none';
    const btnWa = document.getElementById('opt-whatsapp'); btnWa.style.display = opts.wa ? 'block' : 'none';
    const btnTg = document.getElementById('opt-telegram'); btnTg.style.display = opts.tg ? 'block' : 'none';
    const btnFb = document.getElementById('opt-facebook'); btnFb.style.display = opts.fb ? 'block' : 'none';

    btnDisc.href = storeSettings.discord || "#";
    btnWa.href = `https://wa.me/${storeSettings.wa}?text=I want to buy ${encodeURIComponent(item.name)}`;
    btnTg.href = storeSettings.tg || "#";
    btnFb.href = storeSettings.fb || "#";

    document.getElementById('buy-modal').style.display = 'flex';
}
function closeModal() { document.getElementById('buy-modal').style.display = 'none'; }

function openOnlineCheckout() {
    if(!auth.currentUser) { alert("Please Login to your account first!"); closeModal(); switchView('auth-view'); return; }
    closeModal();
    
    const imgQR = document.getElementById('dynamic-qr-img');
    const txtQR = document.getElementById('qr-fallback-msg');
    if(storeSettings.qr) { imgQR.src = storeSettings.qr; imgQR.style.display = 'block'; txtQR.style.display = 'none'; } 
    else { imgQR.style.display = 'none'; txtQR.style.display = 'block'; }
    document.getElementById('dynamic-upi-text').innerText = storeSettings.upi ? `UPI ID: ${storeSettings.upi}` : 'UPI ID Not Set';

    document.getElementById('buyer-utr').value = '';
    document.getElementById('online-modal').style.display = 'flex';
}

function verifyAndDeliverCode() {
    const utr = document.getElementById('buyer-utr').value.trim(); if(!utr || utr.length < 6) return alert("Enter valid UTR!");
    let itemRef = appData[activeItemData.catKey].items[activeItemData.itemIdx];
    if(!itemRef.codes || itemRef.codes.length === 0) return alert("Sorry! Out of stock.");
    const orderId = 'ORD_' + Date.now(); const user = auth.currentUser;
    db.ref('orders/' + orderId).set({ orderId: orderId, uid: user.uid, email: user.email, itemName: itemRef.name, price: itemRef.price, utr: utr, status: "Pending Verification", code: "", catKey: activeItemData.catKey, itemIdx: activeItemData.itemIdx, timestamp: new Date().toLocaleString() }).then(() => {
        document.getElementById('online-modal').style.display = 'none'; document.getElementById('delivery-modal').style.display = 'flex';
    }).catch(e => alert("Error: " + e.message));
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
                let codeHtml = ord.status === 'Approved' ? `<div style="margin-top:15px; padding:10px; background:#05050a; border:1px dashed #34d399; border-radius:6px; color:#34d399; font-weight:bold; letter-spacing:1px; text-align:center;">VOUCHER CODE:<br><span style="font-size:1.3rem;">${ord.code}</span></div>` : (ord.status === 'Rejected' ? `<div style="margin-top:10px; color:#ef4444; font-size:0.9rem;">Admin Rejected UTR.</div>` : `<div style="margin-top:10px; color:#eab308; font-size:0.9rem;">Verifying UTR...</div>`);
                list.innerHTML += `<div class="item-card-wrapper" style="border-left: 4px solid ${statusColor};"><div style="display:flex; justify-content:space-between; margin-bottom:5px;"><strong style="color:#fff;">${ord.itemName}</strong><span style="color:#38bdf8; font-weight:bold;">${ord.price}</span></div><div style="font-size:0.8rem; color:#94a3b8; margin-bottom:10px;">Order ID: ${ord.orderId}<br>UTR: ${ord.utr}</div><div class="badge" style="background:transparent; border:1px solid ${statusColor}; color:${statusColor};">${ord.status}</div>${codeHtml}</div>`;
            });
        } else { list.innerHTML = '<p style="text-align:center; color:#94a3b8;">You have not bought anything yet.</p>'; }
    });
}

function toggleAuthMode() {
    isSignUpMode = !isSignUpMode; document.getElementById('auth-title').innerText = isSignUpMode ? "Create Account" : "Login"; document.getElementById('auth-submit-btn').innerText = isSignUpMode ? "Sign Up" : "Login"; document.getElementById('auth-toggle-text').innerText = isSignUpMode ? "Already have account? Login" : "Don't have account? Sign Up";
}
function handleEmailAuth() {
    const email = document.getElementById('auth-email').value.trim(); const pass = document.getElementById('auth-pass').value.trim();
    if(!email || !pass) return alert("Enter Email and Password!");
    if(isSignUpMode) auth.createUserWithEmailAndPassword(email, pass).then(() => alert("Account Created!")).catch(e => alert(e.message));
    else auth.signInWithEmailAndPassword(email, pass).then(() => alert("Logged in!")).catch(e => alert("Login Failed"));
}
function signInWithGoogle() { auth.signInWithRedirect(googleProvider); }
auth.getRedirectResult().then((r) => { if(r && r.user) switchView('welcome-view'); }).catch((e) => {});
function logout() { auth.signOut().then(() => alert("Logged out.")); }

auth.onAuthStateChanged((user) => {
    const headerBtn = document.getElementById('header-auth-btn'); const loggedOutUI = document.getElementById('logged-out-section'); const loggedInUI = document.getElementById('logged-in-section');
    if (user) {
        headerBtn.innerHTML = `👤 Profile`; headerBtn.style.color = "#34d399"; headerBtn.style.borderColor = "#34d399";
        loggedOutUI.style.display = 'none'; loggedInUI.style.display = 'block';
        document.getElementById('profile-name').innerText = user.displayName || "Store Member"; document.getElementById('profile-email').innerText = user.email; document.getElementById('profile-pic').src = user.photoURL || "https://via.placeholder.com/100/38bdf8/000000?text=USER";
        db.ref('registeredUsers/' + user.uid).set({ name: user.displayName || "Store Member", email: user.email, lastLogin: new Date().toLocaleString() });
        renderDynamicWebsite(); 
    } else {
        headerBtn.innerHTML = `👤 Login`; headerBtn.style.color = "#38bdf8"; headerBtn.style.borderColor = "#38bdf8";
        loggedOutUI.style.display = 'block'; loggedInUI.style.display = 'none';
        renderDynamicWebsite(); 
    }
});
window.onload = function() { switchView('welcome-view'); }
