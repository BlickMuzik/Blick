// Firebase config (replace with your own)
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_FIREBASE_PROJECT.firebaseapp.com",
    projectId: "YOUR_FIREBASE_PROJECT",
    storageBucket: "YOUR_FIREBASE_PROJECT.appspot.com",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID"
};
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const storage = firebase.storage();
const db = firebase.firestore();

// Authentication
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

loginBtn.addEventListener('click', () => {
    const email = prompt("Email:");
    const password = prompt("Password:");
    auth.signInWithEmailAndPassword(email, password)
        .then(() => alert("Logged in successfully"))
        .catch(err => alert(err.message));
});

logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => alert("Logged out"));
});

// Upload song
document.getElementById('uploadForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const artist = e.target[0].value;
    const songTitle = e.target[1].value;
    const album = e.target[2].value;
    const genre = e.target[3].value;
    const songFile = e.target[4].files[0];
    const coverFile = e.target[5].files[0];

    if(!auth.currentUser) { alert("Please login first"); return; }

    const songRef = storage.ref(`songs/${auth.currentUser.uid}/${songFile.name}`);
    const coverRef = storage.ref(`covers/${auth.currentUser.uid}/${coverFile.name}`);

    await songRef.put(songFile);
    await coverRef.put(coverFile);

    const songURL = await songRef.getDownloadURL();
    const coverURL = await coverRef.getDownloadURL();

    await db.collection('songs').add({
        userId: auth.currentUser.uid,
        artist,
        songTitle,
        album,
        genre,
        songURL,
        coverURL,
        uploadedAt: new Date()
    });

    document.getElementById('message').innerHTML = `<p>Song "${songTitle}" uploaded successfully!</p>`;
    e.target.reset();
    loadSongs();
});

// Load user's songs
function loadSongs(){
    auth.onAuthStateChanged(user => {
        const songList = document.getElementById('songList');
        songList.innerHTML = "";
        if(user){
            db.collection('songs').where('userId','==',user.uid).get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    const data = doc.data();
                    songList.innerHTML += `<div class="song-card">
                        <img src="${data.coverURL}" alt="${data.songTitle}">
                        <h3>${data.songTitle}</h3>
                        <p>${data.artist} | ${data.album} | ${data.genre}</p>
                        <audio controls src="${data.songURL}"></audio>
                    </div>`;
                });
            });
        }
    });
}

// Initial load
loadSongs();