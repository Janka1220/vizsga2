const firebaseConfig = {
  apiKey: "AIzaSyA6p7PMWu6Au85AQXZ0l5aleAWBR2uUBIg",
  authDomain: "vizsga-55ea5.firebaseapp.com",
  databaseURL: "https://vizsga-55ea5-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "vizsga-55ea5",
  storageBucket: "vizsga-55ea5.appspot.com",
  messagingSenderId: "457886173828",
  appId: "1:457886173828:web:145dbde8e65d08344a10d1"
};

firebase.initializeApp(firebaseConfig);

let auth = firebase.auth();
let database = firebase.database();

let canvas, ctx;
let cat, foods, score, lives, gameOver;
let foodImages = [];
let catImage;
let badImages = [];
let foodFallSpeed = 7;
let lastFoodTime = 0;
const foodInterval = 100;
const speedIncreaseInterval = 20000;
const speedIncrement = 2;
let isRegistering = false;

function startGame() {

  const commentSection = document.getElementById('comment-section');
    if (commentSection) commentSection.style.display = 'none';
  
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "flex";
    document.getElementById("game-container").style.background = "url('background.jpeg') no-repeat center center/cover";
    document.getElementById("game-over-screen").style.display = "none";
    document.getElementById("chat-toggle-button").style.display = "none";

    setInterval(increaseFoodSpeed, speedIncreaseInterval);

    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");

    catImage = new Image();
    catImage.src = "cat.png";

    foodImages = [new Image(), new Image(), new Image()];
    foodImages[0].src = "food1.png";
    foodImages[1].src = "food2.png";
    foodImages[2].src = "food3.png";

    badImages = [new Image(), new Image(), new Image()];
    badImages[0].src = "trash1.png";
    badImages[1].src = "trash2.png";
    badImages[2].src = "trash3.png";

    cat = {
        x: canvas.width / 2 - 50,
        y: canvas.height - 150,
        width: 150,
        height: 150,
        speed: 15,
        moveLeft: false,
        moveRight: false
    };

    foods = [];
    score = 0;
    lives = 3;
    gameOver = false;

    let imagesLoaded = 0;
    let totalImages = foodImages.length + badImages.length + 1;

    function imageLoaded() {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            gameLoop();
        }
    };

    catImage.onload = imageLoaded;
    foodImages.forEach(img => img.onload = imageLoaded);
    badImages.forEach(img => img.onload = imageLoaded);
};

function quitGame() {
    document.getElementById("game-screen").style.display = "none";
    document.getElementById("start-screen").style.display = "flex";
    document.getElementById("game-over-screen").style.display = "none";
    document.getElementById("game-container").style.background = "url('menu-background.jpeg') no-repeat center center/cover";
    document.getElementById("chat-toggle-button").style.display = "block";

    document.querySelector(".game-title").style.margin = "";
document.querySelector(".game-title").style.textAlign = "center";

const startScreen = document.getElementById("start-screen");
startScreen.style.display = "flex";
startScreen.style.flexDirection = "column";
startScreen.style.alignItems = "center";
startScreen.style.justifyContent = "center";

    foods = [];
    score = 0;
    lives = 3;
    gameOver = false;
};
  
  document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") cat.moveLeft = true;
  if (event.key === "ArrowRight") cat.moveRight = true;
});

document.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft") cat.moveLeft = false;
  if (event.key === "ArrowRight") cat.moveRight = false;
});

function increaseFoodSpeed() {
  foodFallSpeed += speedIncrement;
};

function createFood() {
  const currentTime = Date.now();


    if (currentTime - lastFoodTime > foodInterval) {
        const x = Math.random() * (canvas.width - 60) + 30;
        const isBad = Math.random() < 0.5;
        const imgArray = isBad ? badImages : foodImages;
        const imageIndex = Math.floor(Math.random() * imgArray.length);

        foods.push({ x: x, y: -60, img: imgArray[imageIndex], isBad: isBad });

        lastFoodTime = currentTime;
    }
};

function moveCat() {
  if (cat.moveLeft && cat.x > 0) cat.x -= cat.speed;
  if (cat.moveRight && cat.x + cat.width < canvas.width) cat.x += cat.speed;
};

function moveFoods() {
  for (let i = foods.length - 1; i >= 0; i--) {
      foods[i].y += foodFallSpeed;

      if (
          foods[i].y + 40 > cat.y &&
          foods[i].x > cat.x &&
          foods[i].x < cat.x + cat.width
      ) {
          if (foods[i].isBad) {
              lives--;
              if (lives <= 0 && !gameOver) {
                  gameOver = true;
                  startGameOver();
              }
          } else {
              score++;
          }
          foods.splice(i, 1);
      } else if (foods[i].y > canvas.height) {
          foods.splice(i, 1);
      }
  };
};

function drawCat() {
  ctx.drawImage(catImage, cat.x, cat.y, cat.width, cat.height);
};

function drawFoods() {
  foods.forEach(food => {
      ctx.drawImage(food.img, food.x, food.y, 80, 80);
  });
};

function drawScoreAndLives() {
  ctx.fillStyle = "#072530";
  ctx.font = "20px 'Arial Rounded MT Bold', Arial, sans-serif";
  ctx.fillText("Score: " + score, 10, 30);

  const heartImage = new Image();
  heartImage.src = "heart.png";
  for (let i = 0; i < lives; i++) {
      ctx.drawImage(heartImage, canvas.width - 30 - (i * 30), 10, 25, 25);
  };
};

function startGameOver() {
  document.getElementById("final-score").textContent = "Your Score: " + score;
  document.getElementById("game-over-screen").style.display = "flex";
  saveGameRecord(score);
};


function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!gameOver) {
      moveCat();
      moveFoods();
      drawCat();
      drawFoods();
      drawScoreAndLives();
  } 
  else {
      startGameOver();
  };
  if (Math.random() < 0.02) createFood();
  if (!gameOver) requestAnimationFrame(gameLoop);
};

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
  setTimeout(() => toast.remove(), 5000);
}

function openModal(formType) {
  const modal = document.getElementById('authModal');
  modal.style.display = 'block';

  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      const userRef = firebase.database().ref('users/' + user.uid);
      userRef.once('value').then(snapshot => {
        const data = snapshot.val();
        document.getElementById('profileUsername').textContent = data.name;
        document.getElementById('profileEmail').textContent = data.email;

        if (data.role === 'admin') {
          document.getElementById('admin-panel-btn').style.display = 'block';
        } else {
          document.getElementById('admin-panel-btn').style.display = 'none';
        }

        const recordsRef = firebase.database().ref('records/' + user.uid);
        recordsRef.once('value').then(snap => {
          const records = snap.val();
          let html = "";
          if (records) {
            html = Object.values(records).map(r => 
              `<li>Pontszám: ${r.score ?? "?"}, ${new Date(r.timestamp).toLocaleString()}</li>`
            ).join('');
          } else {
            html = "<li>Nincsenek rekordok.</li>";
          }
          document.getElementById('record-list').innerHTML = html;
        });

        switchToProfile();
      });
    } else {
      switchForm(formType);
    }
  });
  
}

function closeModal() {
  document.getElementById('authModal').style.display = 'none';
}

function switchForm(type) {
  document.getElementById('signupForm').style.display = type === 'signup' ? 'block' : 'none';
  document.getElementById('loginForm').style.display = type === 'login' ? 'block' : 'none';
  document.getElementById('profileView').style.display = 'none';
}

function switchToProfile() {
  document.getElementById('signupForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('profileView').style.display = 'block';

  const nameSpan = document.getElementById('profileUsername');
  const editBtn = document.getElementById('editNameBtn');

  if (!nameSpan || !editBtn) return;

  editBtn.addEventListener('click', () => {
    const isEditing = nameSpan.getAttribute('contenteditable') === 'true';
    if (!isEditing) {
      nameSpan.setAttribute('contenteditable', 'true');
      nameSpan.focus();
    } else {
      finishNameEdit(nameSpan);
    }
  });

  nameSpan.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      finishNameEdit(nameSpan);
    }
  });
}



document.getElementById('signupForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const name = this.name.value;
  const email = this.email.value;
  const password = this.psw.value;
  const repeat = this['psw-repeat'].value;

  if (password !== repeat) return showToast("A jelszavak nem egyeznek!", "#e74c3c" );

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      return firebase.database().ref('users/' + userCredential.user.uid).set({
        name,
        email,
        role: "user"
      });
    })
    .then(() => {
      openModal();
    })
    .catch(err => showToast("Hiba: " + err.message, "#e74c3c"));
});

document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const email = this['login-email'].value;
  const password = this['login-psw'].value;

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
      openModal();
    })
    .catch(err => showToast("Hiba: " + err.message, "#e74c3c"));
});

function logout() {
  firebase.auth().signOut().then(() => {
    closeModal();
  });
};

function finishNameEdit(nameSpan) {
  nameSpan.setAttribute('contenteditable', 'false');
  const newName = nameSpan.textContent.trim();
  const user = firebase.auth().currentUser;
  if (user && newName) {
    firebase.database().ref('users/' + user.uid + '/name').set(newName)
      .then(() => {
        console.log("✅ Név frissítve: " + newName);
      })
      .catch(err => showToast("Hiba a név frissítésekor: " + err.message, "#e74c3c"));
  }
}

function saveGameRecord(score) {
  const user = firebase.auth().currentUser;
  if (user) {
    const userRef = firebase.database().ref('users/' + user.uid);
    userRef.once('value').then(snapshot => {
      const userData = snapshot.val();
      const recordData = {
        score: score,
        timestamp: Date.now(),
        email: userData.email || "N/A",
        name: userData.name || "N/A"
      };
      firebase.database().ref('records/' + user.uid).push(recordData)
        .then(() => console.log("✅ Rekord elmentve"))
        .catch(error => console.error("⚠️ Hibás mentés", error));
    });
  }
}

function postComment() {
  const user = firebase.auth().currentUser;
  const commentText = document.getElementById('comment-input').value.trim();

  if (commentText === '') {
    showToast('Kérlek, írj be egy hozzászólást!', "#e74c3c");
    return;
  }

  firebase.database().ref('users/' + user.uid).once('value')
    .then(snapshot => {
      const userData = snapshot.val();
      const commentName = userData?.name?.trim() || "Névtelen";

      const newComment = {
        text: commentText,
        name: commentName,
        timestamp: Date.now(),
        uid: user.uid
      };

      return firebase.database().ref('comments').push(newComment);
    })
    .then(() => {
      document.getElementById('comment-input').value = '';
      loadComments();
    })
    .catch(error => {
      console.error('Hiba a komment beküldésekor:', error);
      showToast('Hiba történt a komment mentésekor.', "#e74c3c");
    });
}


function loadComments() {
  const commentsRef = firebase.database().ref('comments').orderByChild('timestamp');
  commentsRef.off();
  commentsRef.on('value', (snapshot) => {
    const commentsList = document.getElementById('comments-list');
    if (!commentsList) return;
    commentsList.innerHTML = '';

    const user = firebase.auth().currentUser;

    snapshot.forEach((childSnapshot) => {
      const comment = childSnapshot.val();
      const commentId = childSnapshot.key;
      const isOwner = user && user.uid === comment.uid;

      const commentElement = document.createElement('div');
      commentElement.classList.add('comment');
      commentElement.innerHTML = `
            <div class="comment-header">
      <strong>${comment.name || 'Névtelen'}</strong>
      <span class="comment-menu-toggle">⋮</span>
    </div>

    <p class="comment-text" data-id="${commentId}" contenteditable="false">${comment.text}</p>

    <div class="comment-menu hidden" id="menu-${commentId}">
      <p class="comment-date">(${new Date(comment.timestamp).toLocaleString()})</p>
      ${isOwner ? `<button class="edit-comment" data-id="${commentId}">✏️ Szerkesztés</button>` : ''}
      <button onclick="reportComment('${commentId}')">🚩 Jelentés</button>
    </div>

    <hr>
  `;

  commentsList.appendChild(commentElement);

  // Toggle menu when clicking the ⋮
  const toggleBtn = commentElement.querySelector('.comment-menu-toggle');
  toggleBtn.addEventListener('click', () => {
    const menu = document.getElementById(`menu-${commentId}`);
    menu.classList.toggle('hidden');
  });
});

    setTimeout(() => {
      commentsList.scrollTop = commentsList.scrollHeight;

      document.querySelectorAll('.edit-comment').forEach(button => {
        button.addEventListener('click', () => {
          const commentId = button.getAttribute('data-id');
          const textElement = document.querySelector(`.comment-text[data-id="${commentId}"]`);
          const isEditing = textElement.getAttribute('contenteditable') === 'true';

          if (!isEditing) {
            textElement.setAttribute('contenteditable', 'true');
            textElement.focus();
            button.textContent = '💾';
          } else {
            saveCommentEdit(commentId, textElement, button);
          }
        });
      });
    
      document.querySelectorAll('.comment-text').forEach(textElement => {
        textElement.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const commentId = textElement.getAttribute('data-id');
            const button = document.querySelector(`.edit-comment[data-id="${commentId}"]`);
            saveCommentEdit(commentId, textElement, button);
          }
        });
      });
    }, 400);
  });
}

    function saveCommentEdit(commentId, textElement, button) {
      textElement.setAttribute('contenteditable', 'false');
      const newText = textElement.textContent.trim();
    
      firebase.database().ref('comments/' + commentId + '/text').set(newText)
        .then(() => {
          console.log("✅ Komment frissítve");
          if (button) button.textContent = '✏️';
        })
        .catch(err => {
          showToast("Hiba a komment mentésekor: " + err.message, "#e74c3c");
        });
    }
    


function reportComment(commentId) {
  const reportReason = prompt("Miért szeretnéd jelenteni ezt a kommentet?");
  if (!reportReason) {
    showToast("A jelentéshez meg kell adnod egy okot." ,"#e74c3c");
    return;
  }

  const report = {
    reportReason: reportReason,
    timestamp: Date.now()
  };

  firebase.database().ref(`comments/${commentId}/reports`).push(report)
    .then(() => {
      showToast("Köszönjük, a jelentésedet rögzítettük!", "#e74c3c");
    })
    .catch(error => {
      console.error("Hiba a jelentés mentésekor:", error);
      showToast("Hiba történt. Kérlek, próbáld újra.", "#e74c3c");
    });
};

window.reportComment = (commentId) => {
  const modal = document.getElementById('report-modal');
  const textarea = document.getElementById('report-reason-input');
  const submitBtn = document.getElementById('report-submit');
  const cancelBtn = document.getElementById('report-cancel');

  modal.style.display = 'flex';
  textarea.value = "";

  const closeModal = () => {
    modal.style.display = 'none';
    submitBtn.removeEventListener('click', onSubmit);
    cancelBtn.removeEventListener('click', closeModal);
  };

  const onSubmit = () => {
    const reason = textarea.value.trim();
    if (!reason) {
      showToast("A jelentéshez meg kell adnod egy okot.", "#e74c3c");
      return;
    }

    const report = {
      reportReason: reason,
      timestamp: Date.now()
    };

    firebase.database().ref(`comments/${commentId}/reports`).push(report)
      .then(() => {
        showToast("Köszönjük, a jelentésedet rögzítettük!", "#2ecc71");
        closeModal();
      })
      .catch(error => {
        console.error("Hiba a jelentés mentésekor:", error);
        showToast("Hiba történt. Kérlek, próbáld újra.", "#e74c3c");
        closeModal();
      });
  };

  submitBtn.addEventListener('click', onSubmit);
  cancelBtn.addEventListener('click', closeModal);
};



function toggleChat() {
  const commentSection = document.getElementById('comment-section');
  if (!commentSection) return;

  const isVisible = commentSection.style.display === 'block';
  commentSection.style.display = isVisible ? 'none' : 'block';

  if (!isVisible) {
    const commentsList = document.getElementById('comments-list');
    if (commentsList) {
      setTimeout(() => {
        commentsList.scrollTop = commentsList.scrollHeight;
      }, 100);
    }

    const commentInput = document.getElementById('comment-input');
    if (commentInput) commentInput.focus();
  }
}

function showAuthMessage(message, color = "red") {
  const msgElem = document.getElementById('auth-message');
  if (msgElem) {
    msgElem.textContent = message;
    msgElem.style.color = color;
    msgElem.style.display = 'block';

    setTimeout(() => {
      msgElem.textContent = "";
    }, 5000);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const commentInput = document.getElementById('comment-input');
  if (commentInput) {
    commentInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        postComment();
      }
    });
  }

  loadComments();
});

firebase.auth().onAuthStateChanged((user) => {
  const chatBtn = document.getElementById('chat-toggle-button');
  if (!chatBtn) return;

  if (user) {
    chatBtn.style.display = "block";
  } else {
    chatBtn.style.display = "none";
  }
});
