// ==========================================
// DEVELOPER GYAN - ADVERTISEMENT SYSTEM
// Yeh file puri tarah se alag aur safe hai.
// ==========================================

const ADS_STORAGE_KEY = 'devGyanAdsData_v1';

// 1. Get Ads (Auto-Delete Expired Ads)
function getActiveAds() {
    let ads = JSON.parse(localStorage.getItem(ADS_STORAGE_KEY)) || [];
    const now = Date.now();
    
    // Sirf wahi ads rakho jinka time abhi bacha hai
    const activeAds = ads.filter(ad => now < ad.expiryTime);
    
    // Agar koi ad expire ho gaya hai, toh storage update kar do (Auto-close)
    if (ads.length !== activeAds.length) {
        localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify(activeAds));
    }
    return activeAds;
}

// 2. Save New Ad (Admin Panel)
function addNewAd() {
    const title = document.getElementById('ad-title').value.trim();
    const imgUrl = document.getElementById('ad-image').value.trim();
    const minutes = parseInt(document.getElementById('ad-minutes').value);
    const link = document.getElementById('ad-link').value.trim();

    if (!title || !minutes || !link) {
        alert("Please fill Title, Minutes, and Contact Link!");
        return;
    }

    const expiryTime = Date.now() + (minutes * 60 * 1000); // Convert minutes to milliseconds
    const newAd = { id: Date.now(), title, imgUrl, link, expiryTime };

    let ads = getActiveAds();
    ads.push(newAd);
    localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify(ads));

    alert("Advertisement Added Successfully! It will auto-close after " + minutes + " minutes.");
    
    // Clear inputs
    document.getElementById('ad-title').value = '';
    document.getElementById('ad-image').value = '';
    document.getElementById('ad-minutes').value = '';
    document.getElementById('ad-link').value = '';

    renderAdminAdsTable();
    renderPublicAds();
}

// 3. Delete Ad Manually (Admin Panel)
function deleteAd(id) {
    if(confirm("Are you sure you want to delete this ad?")) {
        let ads = getActiveAds();
        ads = ads.filter(ad => ad.id !== id);
        localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify(ads));
        renderAdminAdsTable();
        renderPublicAds();
    }
}

// 4. Render Admin Table
function renderAdminAdsTable() {
    const ads = getActiveAds();
    const tbody = document.getElementById('admin-ads-table-body');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    ads.forEach(ad => {
        const remainingMinutes = Math.ceil((ad.expiryTime - Date.now()) / 60000);
        tbody.innerHTML += `
            <tr>
                <td><strong>${ad.title}</strong></td>
                <td><span style="color:#34d399;">Active (${remainingMinutes} mins left)</span></td>
                <td><a href="${ad.link}" target="_blank" style="color:#38bdf8;">Test Link</a></td>
                <td><button onclick="deleteAd(${ad.id})" style="background:#dc2626; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Delete</button></td>
            </tr>
        `;
    });
}

// 5. Render Ads on Public Pages (Welcome Page & Ads Page)
function renderPublicAds() {
    const ads = getActiveAds();
    const welcomeContainer = document.getElementById('welcome-ad-container');
    const pageContainer = document.getElementById('ads-page-container');

    let htmlContent = '';

    if (ads.length === 0) {
        if(welcomeContainer) welcomeContainer.innerHTML = '';
        if(pageContainer) pageContainer.innerHTML = '<p style="color:#94a3b8; text-align:center;">No special offers available right now. Check back later!</p>';
        return;
    }

    ads.forEach(ad => {
        // Default image agar photo link na dala ho
        const imageSrc = ad.imgUrl ? ad.imgUrl : 'https://via.placeholder.com/600x200/1e1e2d/38bdf8?text=Special+Offer';
        
        htmlContent += `
            <div style="background: rgba(20, 20, 30, 0.9); border: 2px solid #e879f9; border-radius: 16px; padding: 20px; text-align: center; box-shadow: 0 0 20px rgba(232, 121, 249, 0.2); margin-bottom: 20px; width: 100%; max-width: 600px;">
                <h3 style="color: #f8fafc; margin-bottom: 15px; font-size: 1.5rem; text-shadow: 0 0 10px rgba(255,255,255,0.3);">${ad.title}</h3>
                <img src="${imageSrc}" alt="Ad Image" style="width: 100%; max-height: 250px; object-fit: cover; border-radius: 8px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.1);">
                <a href="${ad.link}" target="_blank" style="background: linear-gradient(135deg, #e879f9, #a855f7); color: white; padding: 12px 30px; font-size: 1.1rem; font-weight: bold; border-radius: 30px; text-decoration: none; display: inline-block; box-shadow: 0 0 15px rgba(232, 121, 249, 0.5); transition: transform 0.2s;">Contact to Buy</a>
            </div>
        `;
    });

    if(welcomeContainer) welcomeContainer.innerHTML = htmlContent;
    if(pageContainer) pageContainer.innerHTML = htmlContent;
}

// Auto-refresh ads every 1 minute to check for expired ones
setInterval(renderPublicAds, 60000);

