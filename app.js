// VidyaKosh Core Logic Engine - app.js

const GITHUB_BACKEND_URL = "https://vikas.github.io/studylocker/database"; 
let db;

// 1. Initialize the Local Encrypted Storage (IndexedDB)
function initDatabase() {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open("VidyaKoshDB", 1);

        request.onupgradeneeded = function(e) {
            db = e.target.result;
            // Create a secure vault for storing chapter data offline
            if (!db.objectStoreNames.contains("chapters")) {
                db.createObjectStore("chapters", { keyPath: "id" });
            }
        };

        request.onsuccess = function(e) {
            db = e.target.result;
            console.log("🟢 VidyaKosh Local Vault successfully activated.");
            resolve();
        };

        request.onerror = function(e) {
            console.error("🔴 Vault initialization failed:", e.target.error);
            reject(e.target.error);
        };
    });
}

// 2. Hybrid Mode Connection Handler
async function getChapterData(chapterId) {
    // 🟢 LIVE ONLINE MODE
    if (navigator.onLine) {
        try {
            console.log("🟢 Online Mode: Fetching live data from secure server...");
            let response = await fetch(`${GITHUB_BACKEND_URL}/${chapterId}.json`);
            let freshData = await response.json();
            
            // Background sync: Update the local storage with fresh data
            saveToLocalVault(chapterId, freshData);
            return freshData;
        } catch (error) {
            console.log("⚠️ Server unreachable. Switching to local offline vault...");
            return await readFromLocalVault(chapterId);
        }
    } 
    // 📴 SMART OFFLINE MODE
    else {
        console.log("📴 Offline Mode: Retrieving encrypted data from local vault...");
        return await readFromLocalVault(chapterId);
    }
}

// 3. Save Data to Local Storage
function saveToLocalVault(id, data) {
    let transaction = db.transaction(["chapters"], "readwrite");
    let store = transaction.objectStore("chapters");
    store.put({ id: id, content: data, updatedAt: new Date().getTime() });
}

// 4. Read Data from Local Storage
function readFromLocalVault(id) {
    return new Promise((resolve) => {
        let transaction = db.transaction(["chapters"], "readonly");
        let store = transaction.objectStore("chapters");
        let request = store.get(id);

        request.onsuccess = function() {
            if (request.result) {
                resolve(request.result.content);
            } else {
                resolve({ 
                    error: "Offline Data Missing", 
                    message: "This chapter is not synced yet. Please connect to the internet and sync once." 
                });
            }
        };
    });
}

// 5. Register Service Worker for Offline Functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('🚀 VidyaKosh Service Worker registered successfully!'))
            .catch(err => console.error('🔴 Service Worker registration failed:', err));
    });
}

// Start the engine
initDatabase();