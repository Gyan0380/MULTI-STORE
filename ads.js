// ==========================================
// DEVELOPER GYAN - FIREBASE LIVE ADVERTISEMENT SYSTEM
// ==========================================

let adsCache = [];
let currentHomeAdIndex = 0;

// Listen to Firebase Live Data
db.ref('adsData').on('value', (snapshot) => {
    const data = snapshot.val() || {};
    // Object ko array mein convert kar rahe hain
    adsCache = Object.keys(data).map(key => data[key]);
    
    renderPublicAds();
    if (typeof renderAdsTable === 'function') renderAdsTable();
});

function getActiveAds() {
    const now = Date.now();
    const active = adsCache.filter(ad => now < ad.expiryTime);
    
    // Auto-Delete expired ads from Firebase database
    adsCache.forEach(ad => {
        if (now >= ad.expiryTime) {
            db.ref('adsData/' + ad.id).remove();
        }
    });
    return active;
}

function addNewAd() {
    const title = document.getElementById('ad-title').value.trim();
    const imgUrl = document.getElementById('ad-image').value.trim();
    const minutes = parseInt(document.getElementById('ad-minutes').value);
    const link = document.getElementById('ad-link').value.trim();
    const placement = document.getElementById('ad-placement').value; 

    if (!title || !minutes || !link) {
        alert("Please fill Title, Minutes, and Contact Link!");
        return;
    }

    const expiryTime = Date.now() + (minutes * 60 * 1000);
    const id = Date.now();
    const newAd = { id, title, imgUrl, link, expiryTime, placement };

    // Send direct to Firebase
    db.ref('adsData/' + id).set(newAd);

    alert("Advertisement Added Successfully & is LIVE!");
    
    document.getElementById('ad-title').value = '';
    document.getElementById('ad-image').value = '';
    document.getElementById('ad-minutes').value = '';
    document.getElementById('ad-link').value = '';
}

function deleteAd(id) {
    if(confirm("Are you sure you want to delete this ad?")) {
        db.ref('adsData/' + id).remove();
    }
}

window.changeAd = function(direction) {
    currentHomeAdIndex += direction;
    renderPublicAds();
};

function createAdHTML(ad) {
    const fallbackImg = 'https://via.placeholder.com/600x200/1e1e2d/38bdf8?text=Special+Offer';
    const imageSrc = ad.imgUrl ? ad.imgUrl : fallbackImg;
    
    return `
        <div style="background: rgba(20, 20, 30, 0.9); border: 2px solid #e879f9; border-radius: 16px; padding: 20px; text-align: center; box-shadow: 0 0 20px rgba(232, 121, 249, 0.2); width: 100%; display: flex; flex-direction: column; align-items: center;">
            <h3 style="color: #f8fafc; margin-bottom: 15px; font-size: 1.5rem; text-shadow: 0 0 10px rgba(255,255,255,0.3);">${ad.title}</h3>
            <img src="${imageSrc}" onerror="this.onerror=null; this.src='${fallbackImg}';" style="width: 100%; height: 180px; object-fit: cover; border-radius: 8px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.1);">
            <a href="${ad.link}" target="_blank" style="background: linear-gradient(135deg, #e879f9, #a855f7); color: white; padding: 12px 40px; font-size: 1.1rem; font-weight: bold; border-radius: 30px; text-decoration: none; box-shadow: 0 0 15px rgba(232, 121, 249, 0.5); transition: transform 0.2s;">Contact to Buy</a>
        </div>
    `;
}

function renderPublicAds() {
    const ads = getActiveAds();
    const welcomeContainer = document.getElementById('welcome-ad-container');
    const pageContainer = document.getElementById('ads-page-container');

    const homeAds = ads.filter(ad => ad.placement === 'home' || ad.placement === 'both');
    const offersAds = ads.filter(ad => ad.placement === 'offers' || ad.placement === 'both');

    if (welcomeContainer) {
        if (homeAds.length === 0) { 
            welcomeContainer.innerHTML = ''; 
        } 
        else if (homeAds.length === 1) {
            welcomeContainer.innerHTML = `<div style="margin-bottom: 20px; width: 100%; max-width: 600px;">${createAdHTML(homeAds[0])}</div>`;
        } else {
            if (currentHomeAdIndex >= homeAds.length) currentHomeAdIndex = 0;
            if (currentHomeAdIndex < 0) currentHomeAdIndex = homeAds.length - 1;
            
            welcomeContainer.innerHTML = `
                <div style="position: relative; width: 100%; max-width: 600px; margin-bottom: 20px;">
                    ${createAdHTML(homeAds[currentHomeAdIndex])}
                    
                    <div style="position: absolute; top: 50%; left: -10px; right: -10px; display: flex; justify-content: space-between; transform: translateY(-50%); pointer-events: none;">
                        <button onclick="changeAd(-1)" style="pointer-events: auto; background: rgba(0,0,0,0.8); color: #e879f9; border: 2px solid #e879f9; border-radius: 50%; width: 45px; height: 45px; cursor: pointer; font-weight: bold; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(232, 121, 249, 0.5);">&#10094;</button>
                        <button onclick="changeAd(1)" style="pointer-events: auto; background: rgba(0,0,0,0.8); color: #e879f9; border: 2px solid #e879f9; border-radius: 50%; width: 45px; height: 45px; cursor: pointer; font-weight: bold; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(232, 121, 249, 0.5);">&#10095;</button>
                    </div>
                    
                    <div style="text-align: center; margin-top: 10px; color: #94a3b8; font-size: 0.9rem; font-weight: bold;">Ad ${currentHomeAdIndex + 1} of ${homeAds.length}</div>
                </div>
            `;
        }
    }

    if (pageContainer) {
        let offersHtml = '';
        if (offersAds.length > 0) {
            offersAds.forEach(ad => {
                offersHtml += `<div style="margin-bottom: 20px; width: 100%; max-width: 600px;">${createAdHTML(ad)}</div>`;
            });
            pageContainer.innerHTML = offersHtml;
        } else {
            pageContainer.innerHTML = '<p style="color:#94a3b8; text-align:center;">No special offers available right now. Check back later!</p>';
        }
    }
}

// Auto refresh logic
setInterval(renderPublicAds, 60000);
