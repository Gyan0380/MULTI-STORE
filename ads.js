// ==========================================
// DEVELOPER GYAN - ADVANCED ADVERTISEMENT SYSTEM
// ==========================================

const ADS_STORAGE_KEY = 'devGyanAdsData_v2'; // Naya key taaki purana error wala data hat jaye

function getActiveAds() {
    let ads = JSON.parse(localStorage.getItem(ADS_STORAGE_KEY)) || [];
    const now = Date.now();
    const activeAds = ads.filter(ad => now < ad.expiryTime);
    
    if (ads.length !== activeAds.length) {
        localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify(activeAds));
    }
    return activeAds;
}

function addNewAd() {
    const title = document.getElementById('ad-title').value.trim();
    const imgUrl = document.getElementById('ad-image').value.trim();
    const minutes = parseInt(document.getElementById('ad-minutes').value);
    const link = document.getElementById('ad-link').value.trim();
    const placement = document.getElementById('ad-placement').value; // Naya Feature

    if (!title || !minutes || !link) {
        alert("Please fill Title, Minutes, and Contact Link!");
        return;
    }

    const expiryTime = Date.now() + (minutes * 60 * 1000);
    const newAd = { id: Date.now(), title, imgUrl, link, expiryTime, placement };

    let ads = getActiveAds();
    ads.push(newAd);
    localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify(ads));

    alert("Advertisement Added Successfully!");
    
    document.getElementById('ad-title').value = '';
    document.getElementById('ad-image').value = '';
    document.getElementById('ad-minutes').value = '';
    document.getElementById('ad-link').value = '';

    if(typeof renderAdminAdsTable === 'function') renderAdminAdsTable();
    renderPublicAds();
}

function deleteAd(id) {
    if(confirm("Are you sure you want to delete this ad?")) {
        let ads = getActiveAds();
        ads = ads.filter(ad => ad.id !== id);
        localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify(ads));
        if(typeof renderAdminAdsTable === 'function') renderAdminAdsTable();
        renderPublicAds();
    }
}

// Function to generate HTML for a single Ad card
function createAdHTML(ad) {
    const fallbackImg = 'https://via.placeholder.com/600x200/1e1e2d/38bdf8?text=Special+Offer';
    const imageSrc = ad.imgUrl ? ad.imgUrl : fallbackImg;
    
    // onerror attribute is added so if Google Photos link breaks, it shows fallback
    return `
        <div style="background: rgba(20, 20, 30, 0.9); border: 2px solid #e879f9; border-radius: 16px; padding: 20px; text-align: center; box-shadow: 0 0 20px rgba(232, 121, 249, 0.2); margin-bottom: 20px; width: 100%; max-width: 600px; display: flex; flex-direction: column; align-items: center;">
            <h3 style="color: #f8fafc; margin-bottom: 15px; font-size: 1.5rem; text-shadow: 0 0 10px rgba(255,255,255,0.3);">${ad.title}</h3>
            <img src="${imageSrc}" onerror="this.onerror=null; this.src='${fallbackImg}';" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.1);">
            <a href="${ad.link}" target="_blank" style="background: linear-gradient(135deg, #e879f9, #a855f7); color: white; padding: 12px 40px; font-size: 1.1rem; font-weight: bold; border-radius: 30px; text-decoration: none; box-shadow: 0 0 15px rgba(232, 121, 249, 0.5); transition: transform 0.2s;">Contact to Buy</a>
        </div>
    `;
}

function renderPublicAds() {
    const ads = getActiveAds();
    const welcomeContainer = document.getElementById('welcome-ad-container');
    const pageContainer = document.getElementById('ads-page-container');

    let homeHtml = '';
    let offersHtml = '';

    // Filter ads based on admin selection
    const homeAds = ads.filter(ad => ad.placement === 'home' || ad.placement === 'both');
    const offersAds = ads.filter(ad => ad.placement === 'offers' || ad.placement === 'both');

    // Home Page par sirf 1 (Latest) ad dikhana hai
    if (homeAds.length > 0) {
        const latestHomeAd = homeAds[homeAds.length - 1];
        homeHtml = createAdHTML(latestHomeAd);
    }

    // Offers page par saare dikhane hain
    if (offersAds.length > 0) {
        offersAds.forEach(ad => {
            offersHtml += createAdHTML(ad);
        });
    } else {
        offersHtml = '<p style="color:#94a3b8; text-align:center;">No special offers available right now. Check back later!</p>';
    }

    if(welcomeContainer) welcomeContainer.innerHTML = homeHtml;
    if(pageContainer) pageContainer.innerHTML = offersHtml;
}

setInterval(renderPublicAds, 60000);
