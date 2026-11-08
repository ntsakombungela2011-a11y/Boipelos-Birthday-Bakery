const $ = (s) => document.querySelector(s);
let stage = 0, score = 0, eggCount = 0, mixActions = 0, filled = 0, decorations = 0, baked = false, ovenTimer;
const collected = new Set();
const stages = [
  {label:"STAGE 1 OF 5 · PREPARE", number:"01 / PREP", kicker:"FIRST, GATHER YOUR INGREDIENTS", title:"A baker needs supplies.", text:"Collect everything on the recipe card. Tap each ingredient to put it on your counter.", count:"ingredients ready"},
  {label:"STAGE 2 OF 5 · CRACK & MIX", number:"02 / MIX", kicker:"TIME TO GET YOUR HANDS MESSY", title:"Crack those eggs!", text:"Pick up an egg, then tap the bowl to crack it. Do that twice, add cocoa and chocolate, then whisk the batter.", count:"kitchen actions done"},
  {label:"STAGE 3 OF 5 · FILL", number:"03 / FILL", kicker:"SIX LITTLE MUFFINS", title:"Fill every muffin cup.", text:"Scoop the chocolate batter into all six cups. Tap each empty cup to fill it. Try not to eat the batter.", count:"muffin cups filled"},
  {label:"STAGE 4 OF 5 · BAKE", number:"04 / BAKE", kicker:"THE OVEN IS READY", title:"Bake your chocolate muffins.", text:"Slide the tray into the oven and wait for the timer. The kitchen is about to smell incredible.", count:"oven status"},
  {label:"STAGE 5 OF 5 · DECORATE", number:"05 / DECORATE", kicker:"THE BEST PART", title:"Give them a finishing touch.", text:"Choose toppings for your muffins. Add sprinkles, strawberries or extra chocolate. Make them yours!", count:"decorations added"}
];
function toast(message) {
  const el = $("#toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(window.bakeryToastTimer);
  window.bakeryToastTimer = setTimeout(() => el.classList.remove("show"), 2100);
}
function progress() {
  const fraction = stage === 0 ? collected.size / 6 : stage === 1 ? (eggCount + mixActions) / 5 : stage === 2 ? filled / 6 : stage === 3 ? (baked ? 1 : 0) : decorations / 2;
  const pct = Math.round(((stage + fraction) / 5) * 100);
  $("#progressBar").style.width = pct + "%"; $("#progressText").textContent = pct + "%";
  $("#stageLabel").textContent = stages[stage].label; $("#stageNumber").textContent = stages[stage].number; $("#score").textContent = score;
}
function taskCount(n, total) { $("#taskCounter").textContent = n + " / " + total + " " + stages[stage].count; }
function setScene(icon, caption, hint, extra = "") {
  const el = $("#sceneObject"); el.className = "scene-object " + extra; el.innerHTML = icon;
  $("#sceneCaption").textContent = caption; $("#sceneHint").textContent = hint;
}
function actionButton(label, callback) {
  const b = document.createElement("button"); b.className = "game-action"; b.textContent = label;
  b.addEventListener("click", callback); $("#challengeActions").append(b); return b;
}
function unlock(message) {
  $("#gameFeedback").textContent = message; $("#gameFeedback").classList.add("game-feedback-good");
  $("#nextStage").disabled = false; score += 10; progress();
}
function setupMixActions() {
  $("#challengeActions").innerHTML = "";
  actionButton("🍫 Add cocoa powder", () => {
    if (mixActions >= 1) return;
    mixActions++; score += 3; taskCount(eggCount + mixActions, 5); toast("Cocoa clouds everywhere!"); progress(); checkMix();
  });
  actionButton("🍫 Add chocolate chips", () => {
    if (mixActions >= 2) return;
    mixActions++; score += 3; taskCount(eggCount + mixActions, 5); toast("Extra chocolate. Correct decision."); progress(); checkMix();
  });
  actionButton("🥄 Whisk the batter", () => {
    if (mixActions < 2) { toast("Add cocoa and chocolate first!"); return; }
    mixActions = 3; score += 8; setScene("🥣", "Whisk, whisk, whisk!", "The batter is thick, glossy and chocolatey.");
    taskCount(5, 5); unlock("That batter looks delicious. Beautiful whisking!");
  });
}
function render() {
  const s = stages[stage];
  $("#challengeKicker").textContent = s.kicker; $("#challengeTitle").textContent = s.title;
  $("#challengeText").textContent = s.text; $("#challengeActions").innerHTML = "";
  $("#nextStage").disabled = true; $("#gameFeedback").classList.remove("game-feedback-good");
  setScene(["🥣","🥚","🧁","🔥","🧁"][stage],
    ["Your mixing bowl is waiting.","Two eggs. Nice and gently!","A tray of future happiness.","Preheat. Tray in. Door closed.","Your muffins, your rules."][stage],
    ["Tap the ingredients to get started.","Tap an egg, then tap the bowl to crack it.","Tap each of the six empty muffin cups.","Press the button to bake for 8 seconds.","Choose two decorations for your muffins."][stage]);
  if (stage === 0) {
    taskCount(collected.size, 6);
    const items = ["🌾 Flour","🍬 Sugar","🥚 Two eggs","🧈 Butter","🍫 Cocoa powder","🍫 Chocolate chips"];
    items.forEach((item, i) => {
      const b = actionButton(item, () => {
        if (collected.has(i)) return;
        collected.add(i); b.classList.add("done"); b.textContent = "✓ " + item; score += 2;
        taskCount(collected.size, 6); progress();
        if (collected.size === 6) unlock("Pantry stocked! You are ready to bake.");
      });
      if (collected.has(i)) { b.classList.add("done"); b.textContent = "✓ " + item; }
    });
  }
  if (stage === 1) {
    taskCount(eggCount + mixActions, 5);
    if (eggCount < 2) {
      for (let i = eggCount; i < 2; i++) {
        actionButton("🥚 Pick up egg " + (i + 1), () => {
          setScene("🥚", "Egg in hand!", "Now tap the mixing bowl to crack it.", "egg-scene");
          const bowl = $("#sceneObject");
          bowl.onclick = () => {
            if (eggCount >= 2) return;
            eggCount++; score += 5; bowl.onclick = null; bowl.classList.add("cracked"); bowl.innerHTML = "🥣";
            taskCount(eggCount + mixActions, 5); $("#gameFeedback").textContent = "Crack! Egg " + eggCount + " is in the bowl.";
            progress();
            if (eggCount === 2) {
              $("#challengeText").textContent = "Both eggs are in! Add cocoa and chocolate, then whisk everything together.";
              setupMixActions();
            } else {
              renderEggButtons();
            }
          };
        });
      }
    } else { setupMixActions(); }
  }
  if (stage === 2) {
    taskCount(filled, 6);
    const tray = document.createElement("div"); tray.className = "muffin-tray";
    for (let i = 0; i < 6; i++) {
      const cup = document.createElement("button"); cup.className = "muffin-cup" + (i < filled ? " filled" : "");
      cup.textContent = i < filled ? "🧁" : "＋"; cup.setAttribute("aria-label", "Muffin cup " + (i + 1));
      cup.addEventListener("click", () => {
        if (cup.classList.contains("filled")) return;
        cup.classList.add("filled"); cup.textContent = "🧁"; filled++; score += 3; taskCount(filled, 6);
        if (filled === 6) unlock("Six cups filled. Not a single muffin left behind."); progress();
      });
      tray.append(cup);
    }
    $("#challengeActions").append(tray); setScene("🥣", "Chocolate batter is ready.", "Tap each muffin cup to fill it.");
  }
  if (stage === 3) {
    taskCount(baked ? 1 : 0, 1);
    actionButton(baked ? "✓ Muffins baked" : "🔥 Put tray in oven", () => {
      if (baked) return;
      const b = $("#challengeActions button"); b.disabled = true; let seconds = 8;
      b.textContent = "Baking… " + seconds + "s"; $("#gameFeedback").textContent = "The oven is doing its thing…";
      setScene("🔥", "Baking…", "A little patience, head baker.");
      ovenTimer = setInterval(() => {
        seconds--; b.textContent = "Baking… " + seconds + "s";
        if (seconds <= 0) {
          clearInterval(ovenTimer); baked = true; b.textContent = "✓ Fresh from the oven"; b.classList.add("done");
          setScene("🧁", "DING! They are ready!", "Golden tops and melted chocolate.");
          taskCount(1, 1); unlock("DING! Six chocolate muffins, baked by you.");
        }
      }, 1000);
    });
  }
  if (stage === 4) {
    taskCount(decorations, 2);
    ["🍫 Add chocolate drizzle","🍓 Add strawberries","✨ Add sprinkles","💗 Add hearts"].forEach((item, i) => {
      actionButton(item, () => {
        if (decorations >= 2) { toast("Your muffins are already gorgeous!"); return; }
        decorations++; score += 5;
        setScene(["🧁🍫","🧁🍓","🧁✨","🧁💗"][i], "A little decoration magic.", "Choose one more finishing touch!");
        taskCount(decorations, 2);
        if (decorations >= 2) unlock("Your chocolate muffins are officially bakery-worthy!");
        progress();
      });
    });
  }
  progress();
}
function renderEggButtons() {
  $("#challengeActions").innerHTML = "";
  actionButton("🥚 Pick up egg 2", () => {
    setScene("🥚", "Egg in hand!", "Now tap the mixing bowl to crack it.", "egg-scene");
    $("#sceneObject").onclick = () => {
      if (eggCount >= 2) return;
      eggCount++; score += 5; $("#sceneObject").onclick = null;
      setScene("🥣", "Both eggs are in!", "Now add cocoa and chocolate, then whisk.");
      taskCount(eggCount + mixActions, 5); $("#gameFeedback").textContent = "Crack! Egg 2 is in the bowl.";
      $("#challengeText").textContent = "Both eggs are in! Add cocoa and chocolate, then whisk everything together.";
      setupMixActions(); progress();
    };
  });
}
$("#nextStage").addEventListener("click", () => {
  if (stage < 4) { stage++; render(); $("#game").scrollIntoView({behavior:"smooth", block:"start"}); }
  else if (decorations >= 2) finish();
});
function confetti() {
  const layer = $("#confettiLayer"); layer.innerHTML = "";
  const colors = ["#d77d91","#f1c47e","#fff4e7","#9eae91","#b9a5d4"];
  for (let i = 0; i < 75; i++) {
    const bit = document.createElement("i"); bit.className = "confetti"; bit.style.left = Math.random()*100+"%";
    bit.style.animationDelay = Math.random()*1.5+"s"; bit.style.setProperty("--c", colors[i%colors.length]);
    bit.style.setProperty("--r", Math.random()*180+"deg"); layer.append(bit);
  }
}
function finish() {
  if (stage !== 4 || decorations < 2) return;
  $("#birthdayReveal").hidden = false; confetti(); $("#birthdayReveal").scrollIntoView({behavior:"smooth"});
  toast("You baked your own birthday muffins! 🧁");
}
$("#openNote").addEventListener("click", () => { $("#littleNote").classList.add("open"); $("#littleNote").scrollIntoView({behavior:"smooth"}); });
$("#closeNote").addEventListener("click", () => { $("#littleNote").classList.remove("open"); $("#birthdayReveal").scrollIntoView({behavior:"smooth"}); });
render();