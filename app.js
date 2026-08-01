let appData = {};
let currentCategory = null;
let isSignUpMode = false;
let activeItemData = null;

const icons = ['🔥', '💎', '🎮', '👾', '🛒', '🚀', '⭐', '🎁'];
const colors = ['rgba(239, 68, 68, 0.5)', 'rgba(14, 165, 233, 0.5)', 'rgba(245, 158, 11, 0.5)', 'rgba(99, 102, 241, 0.5)', 'rgba(16, 185, 129, 0.5)'];

// Firebase Sync
db.ref('storeData').on('value', (snapshot) => {
    appData = snapshot.val() || {};
    renderDynamicWebsite(); 
    if (currentCategory && document.getElementById('category-view').classList.contains('active')) {
        loadCategoryData(currentCategory);
    }
});

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); }

function switchView(viewId) { 
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active')); 
    document.getElementById(viewId).classList.add('active'); 
    window.scrollTo(0, 0); 
    if(viewId === 'ads-view' || viewId === 'welcome-view') {
        if(typeof renderPublicAds === 'function') renderPublicAds();
    }
}

function renderDynamicWebsite() {
    const storeGrid = document.getElementById('dynamic-store-grid');
    const homeCards = document.getElementById('dynamic-home-cards');
    const sidebar = document.getElementById('dynamic-sidebar');
    const scrollingText = document.getElementById('dynamic-scrolling-text');
    
    storeGrid.innerHTML = ''; homeCards.innerHTML = ''; let tickerHtml = '';
    
    sidebar.innerHTML = `<li><a href="#" onclick="switchView('welcome-view'); toggleSidebar();">🏠 Home</a></li>
        <li><a href="#" onclick="switchView('ads-view'); toggleSidebar();" style="color: #e879f9;">📢 Special Offers</a></li>
        <li><a href="#" onclick="switchView('store-view'); toggleSidebar();">🏪 Main Store</a></li>`;

    let i = 0; let hasCat = false;

    for(let key in appData) {
        if(!appData[key].parentKey && appData[key].title) {
            hasCat = true; let icon = icons[i % icons.length]; let color = colors[i % colors.length];

            tickerHtml += `<span>${icon} Premium ${appData[key].title}</span><span style="color: rgba(255,255,255,0.2);">•</span>`;
            storeGrid.innerHTML += `<div class="card"><div><h3>${appData[key].title}</h3><p>${appData[key].desc || ''}</p></div><button class="card-btn" onclick="switchView('category-view'); loadCategoryData('${key}');">See Offers</button></div>`;
            homeCards.innerHTML += `<div class="tilt-card" style="border-color: ${color};" onclick="switchView('category-view'); loadCategoryData('${key}');"><span class="t-icon">${icon}</span><h4>${appData[key].title}</h4><p>${appData[key].desc || ''}</p></div>`;
            sidebar.innerHTML += `<li><a href="#" onclick="switchView('category-view'); loadCategoryData('${key}'); toggleSidebar();">▶ ${appData[key].title}</a></li>`;
            i++;
        }
    }

    if(scrollingText) { scrollingText.innerHTML = tickerHtml + tickerHtml + tickerHtml + tickerHtml + tickerHtml; }
    sidebar.innerHTML += `<li><a href="admin.html" style="color: #f87171;">🔒 Admin Login</a></li>`;

    if(!hasCat) storeGrid.innerHTML = '<p style="color:#94a3b8; text-align:center; grid-column: 1/-1;">Store is empty.</p>';
    initTiltEffect();
}

function loadCategoryData(catKey) {
    currentCategory = catKey;
    const cat = appData[catKey];
    
    if(!cat) {
        document.getElementById('cat-title').innerText = "Empty Category";
        document.getElementById('dynamic-category-alert').innerHTML = '';
        document.getElementById('dynamic-item-list').innerHTML = '<p style="color:#f87171; text-align:center;">This category has been removed.</p>';
        switchView('category-view'); return;
    }

    document.getElementById('cat-title').innerText = cat.title;
    document.getElementById('cat-desc').innerText = cat.desc || "Browse items below.";

    const backBtn = document.getElementById('back-button');
    if(cat.parentKey && appData[cat.parentKey]) { 
        backBtn.setAttribute('onclick', `loadCategoryData('${cat.parentKey}')`); backBtn.innerText = "← Back to " + appData[cat.parentKey].title; 
    } else { 
        backBtn.setAttribute('onclick', "switchView('store-view')"); backBtn.innerText = "← Back to Store"; 
    }

    let catAlertHtml = '';
    if (cat.warning || cat.note || cat.terms) {
        catAlertHtml += `<div class="category-alert-box">`;
        if(cat.warning) catAlertHtml += `<div class="alert-item" style="color:#fca5a5;"><strong>⚠️ Warning:</strong> ${cat.warning}</div>`;
        if(cat.note) catAlertHtml += `<div class="alert-item" style="color:#fde047;"><strong>📌 Note:</strong> ${cat.note}</div>`;
        if(cat.terms) catAlertHtml += `<div class="alert-item" style="color:#bae6fd;"><strong>📜 T&C:</strong> ${cat.terms}</div>`;
        catAlertHtml += `</div>`;
    }
    document.getElementById('dynamic-category-alert').innerHTML = catAlertHtml;

    const subContainer = document.getElementById('sub-folder-container');
    subContainer.innerHTML = '';
    if(cat.subFolders && cat.subFolders.length > 0) {
        subContainer.style.display = 'grid';
        cat.subFolders.forEach(folder => {
            subContainer.innerHTML += `<div class="folder-card"><div><h3>📁 ${folder.name}</h3><p>${folder.desc}</p></div><button class="btn" style="width:100%; padding: 10px; font-size:1rem;" onclick="loadCategoryData('${folder.key}')">See Offers</button></div>`;
        });
    } else { subContainer.style.display = 'none'; }

    const listContainer = document.getElementById('dynamic-item-list');
    listContainer.innerHTML = '';
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

            listContainer.innerHTML += `
                <div class="item-card-wrapper">
                    <div class="item-top-row">
                        <div class="item-details">
                            <h4>${item.name}</h4>
                            <span>${item.desc}</span>
                            <div style="margin-top: 10px;"><span class="badge ${badgeClass}">${item.status}</span></div>
                        </div>
                        <div style="text-align:right;">
                            <div class="price-tag">${item.price}</div>
                            <button onclick="openBuyModal('${catKey}', ${index})" class="btn" style="padding:8px 20px; font-size:0.9rem; margin-top:15px; display:inline-block; border-radius:8px; width:auto;" ${isStockOut ? 'disabled style="background:#374151; cursor:not-allowed;"' : ''}>${isStockOut ? 'Sold Out' : 'Buy Now'}</button>
                        </div>
                    </div>
                    ${itemNoticeHtml}
                </div>`;
        });
    } else if (!cat.subFolders || cat.subFolders.length === 0) {
        listContainer.innerHTML = '<p style="color:#94a3b8; text-align:center;">No offers available right now.</p>';
    }
    switchView('category-view');
}

// Modals Setup
function openBuyModal(catKey, itemIdx) {
    activeItemData = { catKey, itemIdx, item: appData[catKey].items[itemIdx] };
    document.getElementById('modal-item-title').innerText = activeItemData.item.name;
    document.getElementById('modal-item-price').innerText = "Price: " + activeItemData.item.price;
    document.getElementById('opt-discord').href = "https://discord.gg/qHfvn2ntqx";
    document.getElementById('opt-whatsapp').href = "https://wa.me/919999999999?text=I%20want%20to%20buy%20" + encodeURIComponent(activeItemData.item.name);
    document.getElementById('opt-facebook').href = "https://facebook.com/messages/t/yourpage";
    document.getElementById('buy-modal').style.display = 'flex';
}
function closeModal() { document.getElementById('buy-modal').style.display = 'none'; }

function openOnlineCheckout() {
    closeModal();
    document.getElementById('buyer-utr').value = '';
    document.getElementById('online-modal').style.display = 'flex';
}

function verifyAndDeliverCode() {
    const utr = document.getElementById('buyer-utr').value.trim();
    if(!utr || utr.length < 6) return alert("Please enter a valid 12-digit UTR / Transaction ID!");
    
    let itemRef = appData[activeItemData.catKey].items[activeItemData.itemIdx];
    if(!itemRef.codes || itemRef.codes.length === 0) {
        alert("Sorry! This item just went out of stock. Contact admin.");
        return;
    }

    let assignedCode = itemRef.codes.shift(); 
    db.ref('storeData/' + activeItemData.catKey + '/items/' + activeItemData.itemIdx).set(itemRef).then(() => {
        document.getElementById('online-modal').style.display = 'none';
        document.getElementById('delivered-code-box').innerText = assignedCode;
        document.getElementById('delivery-modal').style.display = 'flex';
    }).catch((err) => alert("Error processing order: " + err.message));
}

// ===============================================
// AUTHENTICATION LOGIC (FIXED FOR MOBILE CHROME)
// ===============================================
function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    document.getElementById('auth-title').innerText = isSignUpMode ? "Create an Account" : "Login to Account";
    document.getElementById('auth-submit-btn').innerText = isSignUpMode ? "Sign Up" : "Login";
    document.getElementById('auth-toggle-text').innerText = isSignUpMode ? "Already have an account? Login here" : "Don't have an account? Sign Up";
}

function handleEmailAuth() {
    const email = document.getElementById('auth-email').value.trim();
    const pass = document.getElementById('auth-pass').value.trim();
    if(!email || !pass) return alert("Please enter Email and Password!");

    if(isSignUpMode) {
        auth.createUserWithEmailAndPassword(email, pass).then(() => alert("Account Created Successfully!")).catch(e => alert(e.message));
    } else {
        auth.signInWithEmailAndPassword(email, pass).then(() => alert("Logged in successfully!")).catch(e => alert("Login Failed: Wrong Email or Password"));
    }
}

// 1. CHROME MOBILE FIX: User clicks "Continue with Google"
function signInWithGoogle() {
    // Popup block hone par hum Redirect method use karte hain taaki direct login ho
    auth.signInWithRedirect(googleProvider);
}

// 2. CHROME MOBILE FIX: Jab redirect wapas website par aayega, tab yeh run hoga
auth.getRedirectResult().then((result) => {
    if (result && result.user) {
        // Redirect successfully login ho gaya
        switchView('welcome-view');
    }
}).catch((error) => {
    if(error.code === 'auth/unauthorized-domain') {
        alert("⚠️ GOOGLE LOGIN BLOCKED!\nPlease add your Vercel Domain to Firebase Authorized Domains.");
    } else {
        console.error("Google Login Error: ", error);
    }
});

function logout() {
    auth.signOut().then(() => alert("Logged out successfully."));
}

auth.onAuthStateChanged((user) => {
    const headerBtn = document.getElementById('header-auth-btn');
    const loggedOutUI = document.getElementById('logged-out-section');
    const loggedInUI = document.getElementById('logged-in-section');

    if (user) {
        headerBtn.innerHTML = `👤 Profile`;
        headerBtn.style.color = "#34d399";
        headerBtn.style.borderColor = "#34d399";
        loggedOutUI.style.display = 'none';
        loggedInUI.style.display = 'block';
        document.getElementById('profile-name').innerText = user.displayName || "Store Member";
        document.getElementById('profile-email').innerText = user.email;
        document.getElementById('profile-pic').src = user.photoURL || "https://via.placeholder.com/100/38bdf8/000000?text=USER";

        db.ref('registeredUsers/' + user.uid).set({
            name: user.displayName || "Store Member",
            email: user.email,
            lastLogin: new Date().toLocaleString()
        });
    } else {
        headerBtn.innerHTML = `👤 Login`;
        headerBtn.style.color = "#38bdf8";
        headerBtn.style.borderColor = "#38bdf8";
        loggedOutUI.style.display = 'block';
        loggedInUI.style.display = 'none';
    }
});

function initTiltEffect() {
    document.querySelectorAll('.tilt-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const rotateX = (((e.clientY - rect.top) - (rect.height / 2)) / (rect.height / 2)) * -10; 
            const rotateY = (((e.clientX - rect.left) - (rect.width / 2)) / (rect.width / 2)) * 10;
            card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        card.addEventListener('mouseleave', () => card.style.transform = `rotateX(0) rotateY(0) scale3d(1, 1, 1)`);
    });
}

window.onload = function() { switchView('welcome-view'); }
