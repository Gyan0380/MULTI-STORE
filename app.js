let appData = {};
let storeSettings = {};
let currentCategory = null;
let isSignUpMode = false;
let activeItemData = null;

const icons = ['🔥', '💎', '🎮', '👾', '🛒', '🚀', '⭐', '🎁'];
const solidColors = ['#ef4444', '#0ea5e9', '#f59e0b', '#8b5cf6', '#10b981']; 

db.ref('storeSettings').on('value', (snap) => {
    storeSettings = snap.val() || {};
    const fab = document.getElementById('floating-discord');
    if(storeSettings.discord) { fab.style.display = 'flex'; fab.href = /^\d+$/.test(storeSettings.discord) ? "https://discord.com/users/" + storeSettings.discord : storeSettings.discord; }
});

db.ref('storeData').on('value', (snapshot) => {
    appData = snapshot.val() || {}; renderDynamicWebsite(); 
    if (currentCategory && document.getElementById('category-view').classList.contains('active')) loadCategoryData(currentCategory);
});

// 🔥 FETCH REVIEWS IN FRONTEND
db.ref('reviews').on('value', (snap) => {
    const list = document.getElementById('reviews-list');
    list.innerHTML = '';
    if(snap.exists()) {
        const reviews = snap.val();
        const sortedKeys = Object.keys(reviews).sort((a,b) => b.localeCompare(a)); // Newest first
        sortedKeys.forEach(key => {
            const rev = reviews[key];
            const starString = '⭐'.repeat(rev.stars);
            list.innerHTML += `
                <div class="review-card">
                    <img src="${rev.photoURL || 'https://via.placeholder.com/100/38bdf8/000000?text=USER'}" class="review-pic">
                    <div class="review-content">
                        <div class="review-name">${rev.name}</div>
                        <div class="review-stars">${starString}</div>
                        <div class="review-text">"${rev.text}"</div>
                        <div class="review-date">${rev.timestamp}</div>
                    </div>
                </div>
            `;
        });
    } else { list.innerHTML = '<p style="color:#94a3b8; text-align:center;">No reviews yet. Be the first to review!</p>'; }
});

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); }
function switchView(viewId) { 
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active')); 
    document.getElementById(viewId).classList.add('active'); 
    window.scrollTo(0, 0); 
    if(viewId === 'purchases-view') loadMyPurchases();
    if(viewId === 'ads-view' || viewId === 'welcome-view') { if(typeof renderPublicAds === 'function') renderPublicAds(); }
}

function renderDynamicWebsite() {
    const storeGrid = document.getElementById('dynamic-store-grid'); 
    const homeCards = document.getElementById('dynamic-home-cards'); 
    const sidebar = document.getElementById('dynamic-sidebar'); 
    const scrollingText = document.getElementById('dynamic-scrolling-text');
    
    storeGrid.innerHTML = ''; homeCards.innerHTML = ''; let tickerHtml = '';
    
    let sidebarLinks = `<li><a href="#" onclick="switchView('welcome-view'); toggleSidebar();">🏠 Home</a></li>
        <li><a href="#" onclick="switchView('ads-view'); toggleSidebar();" style="color: #e879f9;">📢 Special Offers</a></li>
        <li><a href="#" onclick="switchView('store-view'); toggleSidebar();">🏪 Main Store</a></li>
        <li><a href="#" onclick="switchView('reviews-view'); toggleSidebar();" style="color: #fbbf24;">⭐ Store Reviews</a></li>`; // 🔥 REVIEWS LINK IN MENU
    
    if(auth.currentUser) sidebarLinks += `<li><a href="#" onclick="switchView('purchases-view'); toggleSidebar();" style="color: #34d399;">🛒 My Purchases</a></li>`;

    let i = 0; let hasCat = false;
    for(let key in appData) {
        if(!appData[key].parentKey && appData[key].title) {
            hasCat = true; 
            let icon = icons[i % icons.length]; 
            let solidColor = solidColors[i % solidColors.length];

            tickerHtml += `<span>${icon} Premium ${appData[key].title}</span><span style="color: rgba(255,255,255,0.2);">•</span>`;
            storeGrid.innerHTML += `<div class="card"><div><h3>${appData[key].title}</h3><p>${appData[key].desc || ''}</p></div><button class="card-btn" onclick="switchView('category-view'); loadCategoryData('${key}');">See Offers</button></div>`;
            
            homeCards.innerHTML += `
                <div class="neon-cat-card" style="--card-color: ${solidColor};" onclick="switchView('category-view'); loadCategoryData('${key}');">
                    <div class="neon-cat-icon" style="color: ${solidColor};">${icon}</div>
                    <div class="neon-cat-content">
                        <h4>${appData[key].title}</h4>
                        <p>${appData[key].desc || 'Click to view offers & items'}</p>
                    </div>
                    <div class="go-arrow" style="color: ${solidColor};">&#10095;</div>
                </div>
            `;
            sidebarLinks += `<li><a href="#" onclick="switchView('category-view'); loadCategoryData('${key}'); toggleSidebar();">▶ ${appData[key].title}</a></li>`; i++;
        }
    }
    if(scrollingText) scrollingText.innerHTML = tickerHtml + tickerHtml + tickerHtml + tickerHtml + tickerHtml;
    sidebarLinks += `<li><a href="admin.html" style="color: #f87171;">🔒 Admin Login</a></li>`; sidebar.innerHTML = sidebarLinks;
    if(!hasCat) storeGrid.innerHTML = '<p style="color:#94a3b8; text-align:center; grid-column: 1/-1;">Store is empty.</p>';
}

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
            
            let imageSliderHtml = '';
            if (item.images && item.images.length > 0) {
                let uniqueId = `${catKey}-${index}`;
                let imgsHtml = item.images.map((img, i) => `<img src="${img}" style="width:100%; height:220px; object-fit:cover; display:${i===0?'block':'none'}; border-radius:12px;" id="slide-${uniqueId}-${i}">`).join('');
                let btnsHtml = item.images.length > 1 ? `<button onclick="changeSlide('${uniqueId}', -1, ${item.images.length})" style="position:absolute; left:10px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.7); color:white; border:none; border-radius:50%; width:35px; height:35px; cursor:pointer; font-size:18px; display:flex; align-items:center; justify-content:center; z-index:10;">&#10094;</button><button onclick="changeSlide('${uniqueId}', 1, ${item.images.length})" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.7); color:white; border:none; border-radius:50%; width:35px; height:35px; cursor:pointer; font-size:18px; display:flex; align-items:center; justify-content:center; z-index:10;">&#10095;</button><div style="position:absolute; bottom:10px; right:10px; background:rgba(0,0,0,0.7); color:#fff; padding:3px 10px; border-radius:12px; font-size:0.8rem; z-index:10; font-weight:bold;" id="counter-${uniqueId}">1 / ${item.images.length}</div>` : '';
                imageSliderHtml = `<div style="position:relative; width:100%; margin-bottom:15px; border-radius:12px; overflow:hidden; border:1px solid rgba(168, 85, 247, 0.4); box-shadow: 0 5px 15px rgba(0,0,0,0.3);">${imgsHtml}${btnsHtml}</div>`;
            }

            listContainer.innerHTML += `<div class="item-card-wrapper">${imageSliderHtml}<div class="item-top-row"><div class="item-details"><h4>${item.name}</h4><span>${item.desc}</span><div style="margin-top: 10px;"><span class="badge ${badgeClass}">${item.status}</span></div></div><div style="text-align:right;"><div class="price-tag">${item.price}</div><button onclick="openBuyModal('${catKey}', ${index})" class="btn" style="padding:8px 20px; font-size:0.9rem; margin-top:15px; display:inline-block; border-radius:8px; width:auto;" ${isStockOut ? 'disabled style="background:#374151; cursor:not-allowed;"' : ''}>${isStockOut ? 'Sold Out' : 'Buy Now'}</button></div></div></div>`;
        });
    } else if (!cat.subFolders || cat.subFolders.length === 0) { listContainer.innerHTML = '<p style="color:#94a3b8; text-align:center;">No offers available right now.</p>'; }
    switchView('category-view');
}

function openBuyModal(catKey, itemIdx) {
    activeItemData = { catKey, itemIdx, item: appData[catKey].items[itemIdx] };
    const item = activeItemData.item;
    const opts = item.buyOptions || {online:true, free:false, discord:true, wa:true, tg:true, fb:false};
    document.getElementById('modal-item-title').innerText = item.name; document.getElementById('modal-item-price').innerText = "Price: " + item.price;
    document.getElementById('opt-free').style.display = opts.free ? 'block' : 'none'; document.getElementById('opt-online').style.display = opts.online ? 'block' : 'none';
    const btnDisc = document.getElementById('opt-discord'); btnDisc.style.display = opts.discord ? 'block' : 'none';
    let discVal = storeSettings.discord || "";
    if (/^\d+$/.test(discVal)) { btnDisc.href = "https://discord.com/users/" + discVal; btnDisc.innerHTML = "👤 DM on Discord"; } else { btnDisc.href = discVal || "#"; btnDisc.innerHTML = "🎮 Join Discord Server"; }
    document.getElementById('opt-whatsapp').style.display = opts.wa ? 'block' : 'none'; document.getElementById('opt-telegram').style.display = opts.tg ? 'block' : 'none'; document.getElementById('opt-facebook').style.display = opts.fb ? 'block' : 'none';
    document.getElementById('opt-whatsapp').href = `https://wa.me/${storeSettings.wa}?text=I want to buy ${encodeURIComponent(item.name)}`; document.getElementById('opt-telegram').href = storeSettings.tg || "#"; document.getElementById('opt-facebook').href = storeSettings.fb || "#";
    document.getElementById('buy-modal').style.display = 'flex';
}
function closeModal() { document.getElementById('buy-modal').style.display = 'none'; }

// FAST CHECKOUTS & FREE CLAIMS LOGIC SAME AS BEFORE
async function processFreeClaim() {
    if(!auth.currentUser) { alert("Please Login to claim free items!"); closeModal(); switchView('auth-view'); return; }
    const user = auth.currentUser; const catKey = activeItemData.catKey; const itemIdx = activeItemData.itemIdx; let itemRef = appData[catKey].items[itemIdx];
    let codesArray = itemRef.codes ? (Array.isArray(itemRef.codes) ? itemRef.codes : Object.values(itemRef.codes)) : [];
    if(codesArray.length === 0) { alert("Out of Stock."); return; }
    try {
        const userRef = await db.ref('registeredUsers/' + user.uid).once('value'); const userData = userRef.val() || {};
        const lastClaim = userData.lastFreeClaim || 0; const now = Date.now(); const cooldown = 24 * 60 * 60 * 1000; 
        if (now - lastClaim < cooldown) {
            const remainingTime = cooldown - (now - lastClaim);
            alert(`⏳ Come back after ${Math.floor(remainingTime / (1000 * 60 * 60))} hours!`); return;
        }
        closeModal(); document.getElementById('opt-free').innerText = "Processing...";
        let codeToSend = codesArray.shift(); let newStatus = codesArray.length === 0 ? "Out of Stock" : itemRef.status; 
        await db.ref(`storeData/${catKey}/items/${itemIdx}`).update({ codes: codesArray, status: newStatus });
        const orderId = 'FREE_' + Date.now();
        await db.ref('orders/' + orderId).set({ orderId: orderId, uid: user.uid, email: user.email, itemName: itemRef.name, price: "FREE", gameUid: "N/A", screenshotUrl: "", status: "Approved", code: codeToSend, catKey: catKey, itemIdx: itemIdx, timestamp: new Date().toLocaleString() });
        await db.ref('registeredUsers/' + user.uid).update({ lastFreeClaim: now });
        document.getElementById('opt-free').innerText = "🎁 Claim for FREE"; document.getElementById('free-delivery-modal').style.display = 'flex';
    } catch(e) { alert("Error: " + e.message); document.getElementById('opt-free').innerText = "🎁 Claim for FREE"; }
}

function openOnlineCheckout() {
    if(!auth.currentUser) { alert("Please Login!"); closeModal(); switchView('auth-view'); return; }
    closeModal();
    if(storeSettings.qr) { document.getElementById('dynamic-qr-img').src = storeSettings.qr; document.getElementById('dynamic-qr-img').style.display = 'block'; document.getElementById('qr-fallback-msg').style.display = 'none'; } else { document.getElementById('dynamic-qr-img').style.display = 'none'; document.getElementById('qr-fallback-msg').style.display = 'block'; }
    document.getElementById('dynamic-upi-text').innerText = storeSettings.upi ? `UPI ID: ${storeSettings.upi}` : 'UPI ID Not Set';
    document.getElementById('payment-screenshot').value = ''; document.getElementById('game-uid').value = ''; document.getElementById('online-modal').style.display = 'flex';
}

async function verifyAndDeliverCode() {
    const fileInput = document.getElementById('payment-screenshot'); const userGameUid = document.getElementById('game-uid').value.trim();
    if (fileInput.files.length === 0) return alert("Upload screenshot!");
    let itemRef = appData[activeItemData.catKey].items[activeItemData.itemIdx];
    let codesArray = itemRef.codes ? (Array.isArray(itemRef.codes) ? itemRef.codes : Object.values(itemRef.codes)) : [];
    if(codesArray.length === 0) return alert("Out of stock.");
    
    const file = fileInput.files[0]; const btnSubmit = document.getElementById('submit-order-btn');
    document.getElementById('upload-status').style.display = 'block'; btnSubmit.disabled = true; btnSubmit.innerText = "Processing Image...";
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image(); img.onload = async function() {
            const canvas = document.createElement('canvas'); const MAX_WIDTH = 500; let width = img.width; let height = img.height;
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
            const base64String = canvas.toDataURL('image/jpeg', 0.6); 
            try {
                const orderId = 'ORD_' + Date.now(); const user = auth.currentUser;
                await db.ref('orders/' + orderId).set({ orderId: orderId, uid: user.uid, email: user.email, itemName: itemRef.name, price: itemRef.price, gameUid: userGameUid ? userGameUid : 'N/A', screenshotUrl: base64String, storagePath: 'RTDB_BASE64', status: "Pending Verification", code: "", catKey: activeItemData.catKey, itemIdx: activeItemData.itemIdx, timestamp: new Date().toLocaleString() });
                document.getElementById('upload-status').style.display = 'none'; btnSubmit.disabled = false; btnSubmit.innerText = "Submit Order"; document.getElementById('online-modal').style.display = 'none'; document.getElementById('delivery-modal').style.display = 'flex';
            } catch (error) { alert("Upload failed: " + error.message); document.getElementById('upload-status').style.display = 'none'; btnSubmit.disabled = false; btnSubmit.innerText = "Submit Order"; }
        }; img.src = event.target.result;
    }; reader.readAsDataURL(file);
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

// 🔥 AUTHENTICATION LOGIC WITH NAME & PHOTO
function toggleAuthMode() { 
    isSignUpMode = !isSignUpMode; 
    document.getElementById('auth-title').innerText = isSignUpMode ? "Create Account" : "Login"; 
    document.getElementById('auth-submit-btn').innerText = isSignUpMode ? "Sign Up" : "Login"; 
    document.getElementById('auth-toggle-text').innerText = isSignUpMode ? "Already have account? Login" : "Don't have account? Sign Up"; 
    document.getElementById('auth-name').style.display = isSignUpMode ? 'block' : 'none'; // 🔥 Show Name Box on Signup
}

function handleEmailAuth() { 
    const email = document.getElementById('auth-email').value.trim(); 
    const pass = document.getElementById('auth-pass').value.trim(); 
    const name = document.getElementById('auth-name').value.trim();
    if(!email || !pass) return alert("Enter Email and Password!"); 
    
    if(isSignUpMode) {
        if(!name) return alert("Please enter your name!");
        auth.createUserWithEmailAndPassword(email, pass).then((userCredential) => {
            // Setup User Name during Signup
            userCredential.user.updateProfile({ displayName: name }).then(() => {
                db.ref('registeredUsers/' + userCredential.user.uid).set({
                    name: name, email: email, lastLogin: new Date().toLocaleString(), photo: ""
                });
                alert("Account Created!");
            });
        }).catch(e => alert(e.message));
    } else {
        auth.signInWithEmailAndPassword(email, pass).then(() => alert("Logged in!")).catch(e => alert("Login Failed: " + e.message)); 
    }
}

function signInWithGoogle() { auth.signInWithRedirect(googleProvider); }
auth.getRedirectResult().then((r) => { if(r && r.user) switchView('welcome-view'); }).catch((e) => {});
function logout() { auth.signOut().then(() => alert("Logged out.")); }

auth.onAuthStateChanged((user) => {
    const headerBtn = document.getElementById('header-auth-btn'); const loggedOutUI = document.getElementById('logged-out-section'); const loggedInUI = document.getElementById('logged-in-section');
    if (user) {
        headerBtn.innerHTML = `👤 Profile`; headerBtn.style.color = "#34d399"; headerBtn.style.borderColor = "#34d399"; 
        loggedOutUI.style.display = 'none'; loggedInUI.style.display = 'block'; 
        
        // Fetch Realtime DB for Custom Photo and Name
        db.ref('registeredUsers/' + user.uid).once('value').then(snap => { 
            const currentData = snap.val() || {}; 
            const displayPhoto = currentData.photo || user.photoURL || "https://via.placeholder.com/100/38bdf8/000000?text=USER";
            const displayName = currentData.name || user.displayName || "Store Member";
            
            document.getElementById('profile-name').innerText = displayName; 
            document.getElementById('profile-email').innerText = user.email; 
            document.getElementById('profile-pic').src = displayPhoto;
            
            db.ref('registeredUsers/' + user.uid).update({ 
                name: displayName, email: user.email, lastLogin: new Date().toLocaleString(), photo: displayPhoto
            }); 
        });
        
        document.getElementById('review-login-msg').style.display = 'none';
        renderDynamicWebsite(); 
    } else { 
        headerBtn.innerHTML = `👤 Login`; headerBtn.style.color = "#38bdf8"; headerBtn.style.borderColor = "#38bdf8"; 
        loggedOutUI.style.display = 'block'; loggedInUI.style.display = 'none'; 
        document.getElementById('review-login-msg').style.display = 'block';
        renderDynamicWebsite(); 
    }
});

// 🔥 UPLOAD PROFILE PIC FUNCTION (BASE64)
function uploadProfilePic(event) {
    const file = event.target.files[0];
    if(!file || !auth.currentUser) return;
    
    document.getElementById('profile-upload-status').style.display = 'block';
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 150; // Chota size profile ke liye
            let width = img.width; let height = img.height;
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
            
            const base64Photo = canvas.toDataURL('image/jpeg', 0.6);
            
            // Save to Database
            db.ref('registeredUsers/' + auth.currentUser.uid).update({
                photo: base64Photo
            }).then(() => {
                document.getElementById('profile-pic').src = base64Photo;
                document.getElementById('profile-upload-status').style.display = 'none';
                alert("Profile Photo Updated!");
            });
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 🔥 SUBMIT REVIEW FUNCTION
async function submitReview() {
    if(!auth.currentUser) { alert("Please login first to submit a review!"); return; }
    const text = document.getElementById('review-text').value.trim();
    const stars = parseInt(document.getElementById('review-stars').value);
    
    if(!text) { alert("Please write something in the review box."); return; }
    
    const user = auth.currentUser;
    const reviewId = 'REV_' + Date.now();
    
    // Get latest profile details
    db.ref('registeredUsers/' + user.uid).once('value').then(snap => {
        const userData = snap.val() || {};
        const userName = userData.name || user.displayName || "Store Customer";
        const userPhoto = userData.photo || user.photoURL || "https://via.placeholder.com/100/38bdf8/000000?text=USER";
        
        db.ref('reviews/' + reviewId).set({
            reviewId: reviewId,
            uid: user.uid,
            name: userName,
            photoURL: userPhoto,
            stars: stars,
            text: text,
            timestamp: new Date().toLocaleDateString()
        }).then(() => {
            document.getElementById('review-text').value = '';
            alert("Thanks for your review! It's posted successfully.");
        });
    });
}

window.onload = function() { switchView('welcome-view'); }
