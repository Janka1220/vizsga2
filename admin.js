import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";
import { getDatabase, ref, get, remove, update } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js";

const firebaseUrl = "http://127.0.0.1:5001/vizsga-55ea5/us-central1/api";

const firebaseConfig = {
  apiKey: "AIzaSyA6p7PMWu6Au85AQXZ0l5aleAWBR2uUBIg",
  authDomain: "vizsga-55ea5.firebaseapp.com",
  databaseURL: "https://vizsga-55ea5-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "vizsga-55ea5",
  storageBucket: "vizsga-55ea5.appspot.com",
  messagingSenderId: "457886173828",
  appId: "1:457886173828:web:145dbde8e65d08344a10d1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

function showToast(message, color = "#333") {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '30px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.backgroundColor = color;
  toast.style.color = 'white';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '8px';
  toast.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
  toast.style.zIndex = '1000';
  toast.style.fontSize = '14px';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 8000);
}

onAuthStateChanged(auth, async (user) => {
  const adminLogoutButton = document.getElementById('admin-logout-button');

  if (user) {
    const token = await user.getIdToken(true);
    const res = await fetch(`${firebaseUrl}/getClaims/${user.uid}`, {
      headers: { "Authorization": token }
    });
    const claims = await res.json();
    console.log("Lekért claims:", claims);

    if (claims.admin) {
      document.getElementById('admin-panel-screen').style.display = 'block';
      adminLogoutButton.style.display = 'inline-block';
      showAdminAuthMessage("Üdv újra, admin!", "green");
      viewRegisteredUsers(token);
      loadReportedComments();
    } else {
      showAdminAuthMessage("Nincs admin jogosultságod!", "red");
    }
  } else {
    showAdminAuthMessage("Nem vagy bejelentkezve!", "red");
  }
});

document.getElementById('admin-logout-button').addEventListener('click', () => {
  signOut(auth).then(() => {
    showAdminAuthMessage("Kijelentkezve!", "green");
    document.getElementById('admin-panel-screen').style.display = 'none';
    document.getElementById('admin-logout-button').style.display = 'none';
  });
});

function showAdminAuthMessage(message, color = "red") {
  showToast(message, color);
};

function viewRegisteredUsers(token) {
  const usersList = document.getElementById('admin-users-list');
  usersList.innerHTML = "<h3>Regisztrált felhasználók</h3>";

  fetch(`${firebaseUrl}/users`, { headers: { "Authorization": token } })
    .then(res => res.json())
    .then(async users => {
      for (const user of users) {
        const role = user.claims.admin ? "admin" : user.claims.user ? "user" : "guest";

        let dbName = "N/A";
        try {
          const nameSnap = await get(ref(db, 'users/' + user.uid + '/name'));
          if (nameSnap.exists()) {
            dbName = nameSnap.val();
          }
        } catch (err) {
          console.error("Név lekérési hiba:", err);
        }

        const userElement = document.createElement('div');
        userElement.classList.add('user-card');
        userElement.innerHTML = `
          <div class="user-info">
            <p><strong>Név:</strong> ${user.displayName || dbName}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Jogosultság:</strong> ${role}</p>
          </div>
          <div class="user-actions">
            <button class="admin" onclick="updateUserRole('${user.uid}', 'admin')">Admin jog</button>
            <button class="user" onclick="updateUserRole('${user.uid}', 'user')">User jog</button>
            <button class="delete" onclick="deleteUserAccount('${user.uid}')">Fiók törlése</button>
          </div>
        `;
        usersList.appendChild(userElement);
      }
    })
    .catch(error => console.error("Felhasználók lekérési hiba:", error));
}

window.updateUserRole = async (uid, role) => {
  try {
    const currentUser = auth.currentUser;
    const token = await currentUser.getIdToken(true);

    await fetch(`${firebaseUrl}/setCustomClaims`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token
      },
      body: JSON.stringify({ uid, claims: role === "admin" ? { admin: true } : role === "user" ? { user: true } : {} })
    });

    const userDbRef = ref(db, 'users/' + uid);
    await update(userDbRef, { role });

    showToast(`🎉 Sikeresen beállítva: ${role}`, "green");

    if (uid === currentUser.uid && role !== "admin") {
      showToast("Jogosultság módosítva. Kijelentkeztetés...", "orange");
      setTimeout(() => {
        signOut(auth).then(() => {
          window.location.reload();
        });
      }, 3000); // kis késleltetés, hogy látszódjon az üzenet
    } else {
      viewRegisteredUsers(token);
    }

  } catch (error) {
    console.error("❌ updateUserRole hiba:", error);
    showToast("Hiba történt a szerepkör beállításakor.", "red");
  }
};


window.deleteUserAccount = async (uid) => {
  const confirmed = await confirmDialog("Biztosan törölni szeretnéd ezt a felhasználót? Ez nem visszavonható!");
  if (!confirmed) return;
  auth.currentUser.getIdToken(true).then(token => {
    fetch(`${firebaseUrl}/deleteUser`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": token },
      body: JSON.stringify({ uid })
    })
    .then(res => res.json())
    .then(data => {
      console.log("API válasz:", data);
      showToast("Felhasználó törölve!", "green");
      viewRegisteredUsers(token);
    })
    .catch(err => {
      console.error("Hiba a törléskor:", err);
      showToast("Hiba történt a fiók törlése közben!", "red");
    });
  });
};

function loadReportedComments() {
  const commentsList = document.getElementById('admin-comments-list');
  commentsList.innerHTML = "<h3>Reportált kommentek</h3>";
  get(ref(db, 'comments')).then(snapshot => {
    if (snapshot.exists()) {
      let found = false;
      snapshot.forEach(snap => {
        const comment = snap.val();
        const commentId = snap.key;
        if (comment.reports) {
          found = true;
          Object.values(comment.reports).forEach(report => {
            const div = document.createElement('div');
            div.classList.add('comment-item');
            div.innerHTML = `
              <p><strong>Felhasználó:</strong> ${comment.name}</p>
              <p><strong>Komment:</strong> ${comment.text}</p>
              <p><strong>Jelentés oka:</strong> ${report.reportReason}</p>
              <p><strong>Jelentés ideje:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
              <button class="comment-btn delete" onclick="deleteComment('${commentId}')">Komment törlése</button>
              <button class="comment-btn keep" onclick="keepComment('${commentId}')">Meghagyás</button>
            `;
            commentsList.appendChild(div);
          });
        }
      });
      if (!found) commentsList.innerHTML += "<p>Nincsenek jelentett kommentek.</p>";
    } else {
      commentsList.innerHTML += "<p>Nincsenek kommentek.</p>";
    }
  });
}

function confirmDialog(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirm-modal");
    const msg = document.getElementById("confirm-message");
    const yesBtn = document.getElementById("confirm-yes");
    const noBtn = document.getElementById("confirm-no");

    msg.textContent = message;
    modal.style.display = "flex";

    const cleanup = () => {
      modal.style.display = "none";
      yesBtn.removeEventListener("click", onYes);
      noBtn.removeEventListener("click", onNo);
    };

    const onYes = () => {
      cleanup();
      resolve(true);
    };

    const onNo = () => {
      cleanup();
      resolve(false);
    };

    yesBtn.addEventListener("click", onYes);
    noBtn.addEventListener("click", onNo);
  });
}


window.deleteComment = async (commentId) => {
  const confirmed = await confirmDialog("Biztosan törölni szeretnéd ezt a kommentet?")
  if (!confirmed) return;
  remove(ref(db, `comments/${commentId}`)).then(() => {
    showToast("Komment törölve!", "green");
    loadReportedComments();
  });
};

window.keepComment = (commentId) => {
  const reportRef = ref(db, `comments/${commentId}/reports`);
  remove(reportRef).then(() => {
    showToast("Komment meghagyva, jelentés törölve!", "green");
    loadReportedComments();
  }).catch((err) => {
    console.error("Hiba a jelentés eltávolításakor:", err);
    showToast("Nem sikerült eltávolítani a jelentést.", "red");
  });
};
