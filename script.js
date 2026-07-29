const defaultStoreData = {
    steam: {
        title: "Steam Accounts",
        desc: "Find best accounts pre-loaded with top games at cheap prices.",
        items: [
            { id: 1, name: "Random Steam Level 20+ Account", desc: "Contains random premium games + full access.", price: "₹149", status: "Out of Stock" },
            { id: 2, name: "GTA V Premium Steam Account", desc: "Email change available with instant delivery.", price: "₹299", status: "Out of Stock" }
        ]
    },
    gaming_acc: {
        title: "Gaming Accounts",
        desc: "Pro accounts for BGMI, Free Fire, Valorant, etc.",
        items: [
            { id: 3, name: "BGMI Conqueror Tier Account", desc: "Max RP, rare outfits, safe login.", price: "₹799", status: "Out of Stock" },
            { id: 4, name: "Free Fire Max Old Elite Pass ID", desc: "Level 70+, rare bundles.", price: "₹499", status: "Out of Stock" }
        ]
    },
    discord_offer: {
        title: "Discord Offers & Services",
        desc: "Prebuilt servers, custom server setups, and bot builder hiring.",
        items: [
            { id: 5, name: "Prebuild Community DC Server", desc: "Ready-made channels, roles, verification system & security bots.", price: "₹50", status: "Out of Stock" },
            { id: 6, name: "Custom AI Bot Builder Hire", desc: "Hire expert developer to code custom commands and features.", price: "₹99+", status: "Out of Stock" }
        ]
    },
    vouchers: {
        title: "Food & Shopping Vouchers",
        desc: "Get discount vouchers for Zomato, Dominos, EGC, and clothing apps.",
        items: [
            { id: 7, name: "Zomato / Dominos Food Voucher", desc: "Flat discount voucher code for food delivery apps.", price: "₹49", status: "Out of Stock" },
            { id: 8, name: "Clothing Brand Gift Card (EGC)", desc: "Redeemable voucher for fashion apps.", price: "₹199", status: "Out of Stock" }
        ]
    },
    gaming_vouchers: {
        title: "Gaming Vouchers & Top-Ups",
        desc: "Get top-up deals at cheapest prices with maximum value.",
        items: [
            { id: 9, name: "300₹ get 300uc", desc: "BGMI UC cheapest top-up with bonus.", price: "₹300", status: "Out of Stock" },
            { id: 10, name: "400₹ get 400uc", desc: "BGMI UC special mega top-up pack.", price: "₹400", status: "Out of Stock" },
            { id: 11, name: "Free Fire Extra Diamonds Pack", desc: "Special top-up with double diamond event bonus.", price: "₹90", status: "Out of Stock" }
        ]
    },
    bgmi_uc: {
        title: "BGMI UC Vouchers & Top-Up",
        desc: "Best selling BGMI UC packs at cheapest prices with instant secure delivery.",
        items: [
            { id: 12, name: "360 UC", desc: "Best Sell Price (Reference: ₹380)", price: "₹419", status: "Active" },
            { id: 13, name: "720 UC", desc: "Best Sell Price (Reference: ₹750)", price: "₹819", status: "Active" },
            { id: 14, name: "1950 UC", desc: "Best Sell Price (Reference: ₹1,900)", price: "₹2,099", status: "Active" },
            { id: 15, name: "4050 UC", desc: "Best Sell Price (Reference: ₹3,800)", price: "₹4,199", status: "Active" },
            { id: 16, name: "8400 UC", desc: "Best Sell Price (Reference: ₹7,500)", price: "₹8,299", status: "Active" }
        ]
    }
};

let storeData = JSON.parse(localStorage.getItem('developerGyanStore')) || defaultStoreData;

function saveStoreData() {
    localStorage.setItem('developerGyanStore', JSON.stringify(storeData));
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

function switchView(viewId) {
    const views = document.querySelectorAll('.view');
    views.forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none';
    });
    
    const targetView = document.getElementById(viewId);
    if(targetView) {
        targetView.classList.add('active');
        targetView.style.display = 'block';
    }
    window.scrollTo(0, 0);
}

let currentCategoryKey = 'steam';

function loadCategoryData(catKey) {
    currentCategoryKey = catKey;
    const cat = storeData[catKey];
    document.getElementById('cat-title').innerText = cat.title;
    document.getElementById('cat-desc').innerText = cat.desc;

    const listContainer = document.getElementById('dynamic-item-list');
    listContainer.innerHTML = '';

    if(cat.items.length === 0) {
        listContainer.innerHTML = '<p style="color:#94a3b8; text-align:center;">No offers available right now.</p>';
        return;
    }

    cat.items.forEach(item => {
        let badgeClass = 'nostock';
        if(item.status === 'Active') badgeClass = 'active';
        else if(item.status === 'New Stock Available') badgeClass = 'stock';
        else if(item.status === 'Coming Soon') badgeClass = 'soon';
        else if(item.status === 'Expired') badgeClass = 'expired';

        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
            <div class="item-details">
                <h4>${item.name}</h4>
                <span>${item.desc}</span>
                <br><span class="badge ${badgeClass}" style="margin-top: 8px; display: inline-block;">${item.status}</span>
            </div>
            <div>
                <div class="price-tag">${item.price}</div>
                <a href="https://discord.gg/qHfvn2ntqx" target="_blank" class="btn" style="padding: 6px 15px; font-size: 0.85rem; margin-top: 8px;">Join Store DC Server to Buy</a>
            </div>
        `;
        listContainer.appendChild(row);
    });
}

function checkAdminLogin() {
    const pass = document.getElementById('admin-pass').value;
    if(pass === 'admin123') {
        document.getElementById('admin-login-box').style.display = 'none';
        document.getElementById('admin-dashboard-box').style.display = 'block';
        renderAdminTable();
    } else {
        alert('Wrong Password! Use default: admin123');
    }
}

function logoutAdmin() {
    document.getElementById('admin-pass').value = '';
    document.getElementById('admin-dashboard-box').style.display = 'none';
    document.getElementById('admin-login-box').style.display = 'block';
}

function renderAdminTable() {
    const tbody = document.getElementById('admin-items-table-body');
    tbody.innerHTML = '';

    for (const catKey in storeData) {
        const cat = storeData[catKey];
        cat.items.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cat.title}</td>
                <td><strong>${item.name}</strong><br><small style="color:#94a3b8">${item.desc}</small></td>
                <td>${item.price}</td>
                <td>
                    <select onchange="updateItemStatus('${catKey}', ${index}, this.value)" style="background:#05050a; color:#fff; border:1px solid #38bdf8; padding:4px; border-radius:4px; outline:none;">
                        <option ${item.status === 'Active' ? 'selected' : ''}>Active</option>
                        <option ${item.status === 'New Stock Available' ? 'selected' : ''}>New Stock Available</option>
                        <option ${item.status === 'Out of Stock' ? 'selected' : ''}>Out of Stock</option>
                        <option ${item.status === 'Coming Soon' ? 'selected' : ''}>Coming Soon</option>
                        <option ${item.status === 'Expired' ? 'selected' : ''}>Expired</option>
                    </select>
                </td>
                <td>
                    <button onclick="deleteItem('${catKey}', ${index})" style="background:#dc2626; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

function updateItemStatus(catKey, itemIndex, newStatus) {
    storeData[catKey].items[itemIndex].status = newStatus;
    saveStoreData();
}

function deleteItem(catKey, itemIndex) {
    if(confirm('Are you sure you want to delete this item?')) {
        storeData[catKey].items.splice(itemIndex, 1);
        saveStoreData();
        renderAdminTable();
    }
}

function addNewItem() {
    const catKey = document.getElementById('new-item-cat').value;
    const name = document.getElementById('new-item-name').value.trim();
    const desc = document.getElementById('new-item-desc').value.trim();
    const price = document.getElementById('new-item-price').value.trim();
    const status = document.getElementById('new-item-status').value;

    if(!name || !price) {
        alert('Please fill item name and price!');
        return;
    }

    const newItem = {
        id: Date.now(),
        name: name,
        desc: desc || 'Special store offer',
        price: price,
        status: status
    };

    storeData[catKey].items.push(newItem);
    saveStoreData();
    renderAdminTable();

    document.getElementById('new-item-name').value = '';
    document.getElementById('new-item-desc').value = '';
    document.getElementById('new-item-price').value = '';
    alert('New item added successfully!');
}
